package com.mixa.vault

import android.content.Context
import android.util.Log
import org.json.JSONArray
import org.json.JSONObject
import java.io.IOException

object NeedleBridge {
    private const val TAG = "NeedleBridge"
    private const val MODEL_ASSET = "needle/needle2.cact"
    private const val MAX_INPUT_CHARS = 450
    private const val MAX_NEW_TOKENS = 512

    private val SYSTEM_PROMPT = """
        You extract account credentials from notes.
        Call save_accounts with every complete account you find.
        Never invent a password. Use empty strings for missing fields.
        If no account with a password exists, return an empty accounts array.
    """.trimIndent()

    private val TOOLS_JSON = """
        [
          {
            "type": "function",
            "function": {
              "name": "save_accounts",
              "description": "Save account credentials extracted from a note",
              "parameters": {
                "type": "object",
                "properties": {
                  "accounts": {
                    "type": "array",
                    "items": {
                      "type": "object",
                      "properties": {
                        "title": { "type": "string", "description": "Service or account name" },
                        "username": { "type": "string", "description": "Login name or email" },
                        "password": { "type": "string", "description": "Password or passphrase" },
                        "url": { "type": "string", "description": "Website URL" },
                        "note": { "type": "string", "description": "Extra note" }
                      },
                      "required": ["title", "password"]
                    }
                  }
                },
                "required": ["accounts"]
              }
            }
          }
        ]
    """.trimIndent()

    private var libraryLoaded = false
    private var modelLoaded = false

    private external fun nativeAvailable(): Boolean
    private external fun nativeLoad(
        model: ByteArray,
        systemPrompt: String,
        toolsJson: String
    ): Int
    private external fun nativeComplete(input: String, maxNewTokens: Int): String
    private external fun nativeReset()

    init {
        libraryLoaded = try {
            System.loadLibrary("needlejni")
            true
        } catch (error: Throwable) {
            Log.e(TAG, "Unable to load needlejni", error)
            false
        }
    }

    fun isAvailable(): Boolean {
        if (!libraryLoaded) return false
        return try {
            nativeAvailable()
        } catch (error: Throwable) {
            Log.e(TAG, "nativeAvailable failed", error)
            false
        }
    }

    @Synchronized
    private fun ensureLoaded(context: Context): Boolean {
        if (modelLoaded) return true
        if (!isAvailable()) return false

        return try {
            val model = context.assets.open(MODEL_ASSET).use { it.readBytes() }
            val result = nativeLoad(model, SYSTEM_PROMPT, TOOLS_JSON)
            if (result < 0) {
                Log.e(TAG, "nativeLoad returned $result")
                false
            } else {
                modelLoaded = true
                true
            }
        } catch (error: IOException) {
            Log.e(TAG, "Unable to read $MODEL_ASSET", error)
            false
        } catch (error: Throwable) {
            Log.e(TAG, "Unable to initialize Needle", error)
            false
        }
    }

    fun analyze(context: Context, text: String): String {
        if (!ensureLoaded(context)) {
            return JSONObject()
                .put("ok", false)
                .put("error", "AI engine unavailable")
                .toString()
        }

        val chunks = splitIntoChunks(normalizeLabels(text))
        if (chunks.isEmpty()) {
            return JSONObject()
                .put("ok", false)
                .put("error", "Nothing to analyze")
                .toString()
        }

        val responses = JSONArray()
        try {
            for (chunk in chunks) {
                responses.put(nativeComplete(chunk, MAX_NEW_TOKENS))
                nativeReset()
            }
            return JSONObject()
                .put("ok", true)
                .put("responses", responses)
                .toString()
        } catch (error: Throwable) {
            Log.e(TAG, "Inference failed", error)
            return JSONObject()
                .put("ok", false)
                .put("error", "Inference failed")
                .toString()
        }
    }

    private fun normalizeLabels(text: String): String {
        val normalized = text
            .replace(Regex("""(?im)^\s*(标题|名称|平台|应用|服务)\s*[:：]\s*"""), "title: ")
            .replace(Regex("""(?im)^\s*(账号|帐号|用户名|用户|登录名|邮箱)\s*[:：]\s*"""), "username: ")
            .replace(Regex("""(?im)^\s*(密码|口令)\s*[:：]\s*"""), "password: ")
            .replace(Regex("""(?im)^\s*(网址|链接|地址)\s*[:：]\s*"""), "url: ")
            .replace(Regex("""(?im)^\s*(备注|说明)\s*[:：]\s*"""), "note: ")
            .replace(Regex("""(标题|名称|平台|应用|服务)\s*[:：]\s*"""), "title: ")
            .replace(Regex("""(账号|帐号|用户名|用户|登录名|邮箱)\s*[:：]\s*"""), "username: ")
            .replace(Regex("""(密码|口令)\s*[:：]\s*"""), "password: ")
            .replace(Regex("""(网址|链接|地址)\s*[:：]\s*"""), "url: ")
            .replace(Regex("""(备注|说明)\s*[:：]\s*"""), "note: ")

        val lineHasLabel = Regex(
            """^(title|username|password|url|note)\s*:""",
            RegexOption.IGNORE_CASE
        )
        val blocks = normalized.split(Regex("""\n\s*\n""")).filter { it.isNotBlank() }
        val structured = StringBuilder()

        for (block in blocks) {
            val lines = block.split('\n').map { it.trim() }.filter { it.isNotEmpty() }.toMutableList()
            if (lines.isEmpty()) continue

            val hasLabels = lines.any { lineHasLabel.containsMatchIn(it) }
            if (!hasLabels && lines.size == 3 && !lines[1].contains('：') && !lines[2].contains('：')) {
                structured.append("title: ").append(lines[0]).append('\n')
                structured.append("username: ").append(lines[1]).append('\n')
                structured.append("password: ").append(lines[2]).append('\n')
                structured.append('\n')
                continue
            }

            if (!hasLabels && lines.size == 1) {
                val parts = lines[0].split(Regex("""\s+""")).filter { it.isNotEmpty() }
                if (parts.size == 3 && parts[1].contains('@')) {
                    structured.append("title: ").append(parts[0]).append('\n')
                    structured.append("username: ").append(parts[1]).append('\n')
                    structured.append("password: ").append(parts[2]).append('\n')
                    structured.append('\n')
                    continue
                }
            }

            val first = lines[0]
            if (
                !lineHasLabel.containsMatchIn(first) &&
                !first.contains(':') &&
                !first.contains('：') &&
                !first.startsWith("http://", ignoreCase = true) &&
                !first.startsWith("https://", ignoreCase = true)
            ) {
                lines[0] = "title: $first"
            }
            structured.append(lines.joinToString("\n")).append("\n\n")
        }

        return structured.toString().trim()
    }

    private fun splitIntoChunks(text: String): List<String> {
        val source = text.trim()
        if (source.isEmpty()) return emptyList()

        val chunks = mutableListOf<String>()
        val current = StringBuilder()

        fun flush() {
            val value = current.toString().trim()
            if (value.isNotEmpty()) chunks.add(value)
            current.setLength(0)
        }

        for (line in source.split('\n')) {
            val trimmed = line.trim()
            if (trimmed.isEmpty()) {
                flush()
                continue
            }

            if (trimmed.length > MAX_INPUT_CHARS) {
                flush()
                var start = 0
                while (start < trimmed.length && chunks.size < 40) {
                    val end = minOf(start + MAX_INPUT_CHARS, trimmed.length)
                    chunks.add(trimmed.substring(start, end))
                    start = end
                }
                continue
            }

            if (current.length > 0 && current.length + trimmed.length + 1 > MAX_INPUT_CHARS) {
                flush()
            }
            if (current.length > 0) current.append('\n')
            current.append(trimmed)

            if (chunks.size >= 40) break
        }

        flush()
        return chunks.take(40)
    }
}
