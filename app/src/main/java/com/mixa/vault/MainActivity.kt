package com.mixa.vault

import android.content.ClipData
import android.content.ClipDescription
import android.content.ClipboardManager
import android.content.ContentValues
import android.content.Intent
import android.content.res.Configuration
import android.graphics.Color
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.Environment
import android.os.PersistableBundle
import android.provider.MediaStore
import android.view.HapticFeedbackConstants
import android.webkit.JavascriptInterface
import android.webkit.ValueCallback
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebSettings
import android.webkit.WebView
import androidx.activity.OnBackPressedCallback
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.ViewCompat
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat
import androidx.webkit.WebViewAssetLoader
import androidx.webkit.WebViewClientCompat
import com.chaquo.python.Python
import org.json.JSONObject
import kotlin.math.max

class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView
    private lateinit var assetLoader: WebViewAssetLoader
    private var pageReady = false
    private var overlayOpen = false

    private var insetTop = 0f
    private var insetBottom = 0f
    private var insetIme = 0f

    private var fileChooserCallback: ValueCallback<Array<Uri>>? = null
    private var pendingExportContent: String? = null
    private var pendingLogContent: String? = null

    private val filePicker = registerForActivityResult(
        ActivityResultContracts.StartActivityForResult()
    ) { result ->
        val callback = fileChooserCallback
        fileChooserCallback = null
        if (callback != null) {
            val uris = WebChromeClient.FileChooserParams.parseResult(
                result.resultCode,
                result.data
            )
            callback.onReceiveValue(uris)
        }
    }

    private val exportDocument = registerForActivityResult(
        ActivityResultContracts.CreateDocument("application/json")
    ) { uri ->
        val content = pendingExportContent
        pendingExportContent = null

        if (uri == null || content == null) {
            notifyExport(null)
        } else {
            val success = runCatching {
                contentResolver.openOutputStream(uri, "wt")?.use { stream ->
                    stream.write(content.toByteArray(Charsets.UTF_8))
                } ?: error("Unable to open export stream")
            }.isSuccess
            notifyExport(success)
        }
    }

    private val logDocument = registerForActivityResult(
        ActivityResultContracts.CreateDocument("text/plain")
    ) { uri ->
        val content = pendingLogContent
        pendingLogContent = null

        if (uri == null || content == null) {
            notifyLogExport(null)
        } else {
            val success = runCatching {
                contentResolver.openOutputStream(uri, "wt")?.use { stream ->
                    stream.write(content.toByteArray(Charsets.UTF_8))
                } ?: error("Unable to open diagnostics stream")
            }.isSuccess
            notifyLogExport(success)
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        WindowCompat.setDecorFitsSystemWindows(window, false)
        window.statusBarColor = Color.TRANSPARENT
        window.navigationBarColor = Color.TRANSPARENT
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            window.isNavigationBarContrastEnforced = false
        }
        updateSystemBars()

        assetLoader = WebViewAssetLoader.Builder()
            .addPathHandler("/assets/", WebViewAssetLoader.AssetsPathHandler(this))
            .build()

        webView = WebView(this).apply {
            setBackgroundColor(systemBackgroundColor())
            settings.javaScriptEnabled = true
            settings.domStorageEnabled = true
            settings.allowFileAccess = false
            settings.allowContentAccess = true
            settings.javaScriptCanOpenWindowsAutomatically = false
            settings.setSupportMultipleWindows(false)
            settings.setSupportZoom(false)
            settings.builtInZoomControls = false
            settings.displayZoomControls = false
            settings.mediaPlaybackRequiresUserGesture = true
            settings.mixedContentMode = WebSettings.MIXED_CONTENT_NEVER_ALLOW
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                setForceDarkAllowed(false)
            }
            addJavascriptInterface(Bridge(), "AndroidVault")
            webChromeClient = object : WebChromeClient() {
                override fun onShowFileChooser(
                    view: WebView,
                    callback: ValueCallback<Array<Uri>>,
                    params: WebChromeClient.FileChooserParams
                ): Boolean {
                    fileChooserCallback?.onReceiveValue(null)
                    fileChooserCallback = callback
                    return try {
                        filePicker.launch(params.createIntent())
                        true
                    } catch (_: Exception) {
                        fileChooserCallback = null
                        callback.onReceiveValue(null)
                        false
                    }
                }
            }
            webViewClient = object : WebViewClientCompat() {
                override fun shouldInterceptRequest(
                    view: WebView,
                    request: WebResourceRequest
                ): WebResourceResponse? = assetLoader.shouldInterceptRequest(request.url)

                override fun shouldOverrideUrlLoading(
                    view: WebView,
                    request: WebResourceRequest
                ): Boolean = request.url.host != "appassets.androidplatform.net"

                override fun onPageFinished(view: WebView, url: String) {
                    pageReady = true
                    applyWebInsets()
                }
            }
        }

        setContentView(webView)
        WebView.setWebContentsDebuggingEnabled(BuildConfig.DEBUG)

        ViewCompat.setOnApplyWindowInsetsListener(webView) { _, insets ->
            val bars = insets.getInsets(
                WindowInsetsCompat.Type.systemBars() or WindowInsetsCompat.Type.displayCutout()
            )
            val ime = insets.getInsets(WindowInsetsCompat.Type.ime()).bottom
            val density = resources.displayMetrics.density
            insetTop = bars.top / density
            insetBottom = bars.bottom / density
            insetIme = max(0, ime - bars.bottom) / density
            applyWebInsets()
            insets
        }

        webView.loadUrl("https://appassets.androidplatform.net/assets/index.html")

        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                if (!pageReady) {
                    finish()
                    return
                }
                if (overlayOpen) {
                    webView.evaluateJavascript(
                        "window.closeTopOverlay && window.closeTopOverlay()",
                        null
                    )
                } else {
                    finish()
                }
            }
        })
    }

    override fun onConfigurationChanged(newConfig: Configuration) {
        super.onConfigurationChanged(newConfig)
        updateSystemBars()
        if (::webView.isInitialized) {
            webView.evaluateJavascript(
                "window.__applyTheme && window.__applyTheme()",
                null
            )
        }
    }

    private fun updateSystemBars() {
        val nightMode = isNightMode()
        window.decorView.setBackgroundColor(systemBackgroundColor())
        if (::webView.isInitialized) {
            webView.setBackgroundColor(systemBackgroundColor())
        }
        WindowInsetsControllerCompat(window, window.decorView).apply {
            isAppearanceLightStatusBars = !nightMode
            isAppearanceLightNavigationBars = !nightMode
        }
    }

    private fun isNightMode(): Boolean {
        return (resources.configuration.uiMode and
            Configuration.UI_MODE_NIGHT_MASK) == Configuration.UI_MODE_NIGHT_YES
    }

    private fun systemBackgroundColor(): Int {
        return if (isNightMode()) Color.BLACK else Color.rgb(242, 242, 247)
    }

    private fun writeTextToDownloads(
        fileName: String,
        content: String,
        mimeType: String,
        relativePath: String = Environment.DIRECTORY_DOWNLOADS + "/"
    ): Boolean {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) return false

        val values = ContentValues().apply {
            put(MediaStore.MediaColumns.DISPLAY_NAME, fileName)
            put(MediaStore.MediaColumns.MIME_TYPE, mimeType)
            put(MediaStore.MediaColumns.RELATIVE_PATH, relativePath)
            put(MediaStore.MediaColumns.IS_PENDING, 1)
        }
        val uri = contentResolver.insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, values)
            ?: return false

        val success = runCatching {
            contentResolver.openOutputStream(uri, "wt")?.use { stream ->
                stream.write(content.toByteArray(Charsets.UTF_8))
            } ?: error("Unable to open export stream")
        }.isSuccess

        values.clear()
        values.put(MediaStore.MediaColumns.IS_PENDING, 0)
        contentResolver.update(uri, values, null, null)
        if (!success) contentResolver.delete(uri, null, null)
        return success
    }

    private fun notifyExport(result: Boolean?) {
        val argument = when (result) {
            true -> "true"
            false -> "false"
            null -> "null"
        }
        webView.evaluateJavascript(
            "window.__onExportResult && window.__onExportResult($argument)",
            null
        )
    }

    private fun notifyLogExport(result: Boolean?) {
        val argument = when (result) {
            true -> "true"
            false -> "false"
            null -> "null"
        }
        webView.evaluateJavascript(
            "window.__onLogExportResult && window.__onLogExportResult($argument)",
            null
        )
    }

    private fun notifyBackupExport(result: Boolean?) {
        val argument = when (result) {
            true -> "true"
            false -> "false"
            null -> "null"
        }
        webView.evaluateJavascript(
            "window.__onBackupExportResult && window.__onBackupExportResult($argument)",
            null
        )
    }

    private fun notifyPlainExport(result: Boolean?) {
        val argument = when (result) {
            true -> "true"
            false -> "false"
            null -> "null"
        }
        webView.evaluateJavascript(
            "window.__onPlainExportResult && window.__onPlainExportResult($argument)",
            null
        )
    }

    private fun applyWebInsets() {
        if (!pageReady) return
        val js = """
            (() => {
              const s = document.documentElement.style;
              s.setProperty('--safe-top', '${insetTop}px');
              s.setProperty('--safe-bottom', '${insetBottom}px');
              s.setProperty('--ime', '${insetIme}px');
            })();
        """.trimIndent()
        webView.evaluateJavascript(js, null)
    }

    private fun callPython(action: String, payload: String): String {
        return try {
            Python.getInstance()
                .getModule("vault")
                .callAttr("handle", action, payload)
                .toString()
        } catch (t: Throwable) {
            JSONObject()
                .put("ok", false)
                .put("error", t.message ?: "Python 调用失败")
                .toString()
        }
    }

    inner class Bridge {
        @JavascriptInterface
        fun call(action: String, payload: String): String = callPython(action, payload)

        @JavascriptInterface
        fun getLanguage(): String {
            return resources.configuration.locales[0].language
        }

        @JavascriptInterface
        fun getVersion(): String = BuildConfig.VERSION_NAME

        @JavascriptInterface
        fun openUrl(url: String) {
            if (url != "https://github.com/d1irgger") return
            runOnUiThread {
                runCatching {
                    startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(url)))
                }
            }
        }

        @JavascriptInterface
        fun exportJson(fileName: String, content: String) {
            runOnUiThread {
                pendingExportContent = content
                try {
                    exportDocument.launch(fileName)
                } catch (_: Exception) {
                    pendingExportContent = null
                    notifyExport(false)
                }
            }
        }

        @JavascriptInterface
        fun exportBackup(fileName: String, content: String) {
            if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) {
                notifyBackupExport(false)
                return
            }
            Thread {
                val success = writeTextToDownloads(
                    fileName,
                    content,
                    "application/x-mixa",
                    "${Environment.DIRECTORY_DOWNLOADS}/MixaVault/backups/"
                )
                runOnUiThread { notifyBackupExport(success) }
            }.start()
        }

        @JavascriptInterface
        fun exportPlainJson(fileName: String, content: String) {
            if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) {
                notifyPlainExport(false)
                return
            }
            Thread {
                val success = writeTextToDownloads(
                    fileName,
                    content,
                    "application/json",
                    "${Environment.DIRECTORY_DOWNLOADS}/MixaVault/"
                )
                runOnUiThread { notifyPlainExport(success) }
            }.start()
        }

        @JavascriptInterface
        fun exportLog(fileName: String, content: String) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                Thread {
                    val success = writeTextToDownloads(fileName, content, "text/plain")
                    runOnUiThread { notifyLogExport(success) }
                }.start()
            } else {
                runOnUiThread {
                    pendingLogContent = content
                    try {
                        logDocument.launch(fileName)
                    } catch (_: Exception) {
                        pendingLogContent = null
                        notifyLogExport(false)
                    }
                }
            }
        }

        @JavascriptInterface
        fun aiAvailable(): Boolean = NeedleBridge.isAvailable()

        @JavascriptInterface
        fun analyzeText(text: String): String = NeedleBridge.analyze(this@MainActivity, text)

        @JavascriptInterface
        fun copyText(text: String) {
            runOnUiThread {
                val manager = getSystemService(ClipboardManager::class.java)
                val clip = ClipData.newPlainText("密码", text)
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                    clip.description.extras = PersistableBundle().apply {
                        putBoolean(ClipDescription.EXTRA_IS_SENSITIVE, true)
                    }
                }
                manager.setPrimaryClip(clip)
            }
        }

        @JavascriptInterface
        fun haptic() {
            runOnUiThread {
                webView.performHapticFeedback(HapticFeedbackConstants.KEYBOARD_TAP)
            }
        }

        @JavascriptInterface
        fun setOverlayOpen(open: Boolean) {
            runOnUiThread {
                overlayOpen = open
                if (open) {
                    webView.performHapticFeedback(HapticFeedbackConstants.KEYBOARD_TAP)
                }
            }
        }
    }
}
