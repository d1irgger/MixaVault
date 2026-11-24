#include <jni.h>
#include <android/log.h>

#include <cstring>
#include <mutex>
#include <string>
#include <vector>

#if NEEDLE_AVAILABLE
#include "needle.h"
#endif

#define LOG_TAG "NeedleJNI"
#define LOGE(...) __android_log_print(ANDROID_LOG_ERROR, LOG_TAG, __VA_ARGS__)

namespace {

std::mutex g_mutex;
bool g_loaded = false;
std::vector<unsigned char> g_model;
std::string g_system_prompt;
std::string g_tools_json;

std::string to_string(JNIEnv* env, jstring value) {
    if (value == nullptr) return {};
    const char* chars = env->GetStringUTFChars(value, nullptr);
    if (chars == nullptr) return {};
    std::string result(chars);
    env->ReleaseStringUTFChars(value, chars);
    return result;
}

jstring error_json(JNIEnv* env, const char* message) {
    std::string json = "{\"ok\":false,\"error\":\"";
    json += message;
    json += "\"}";
    return env->NewStringUTF(json.c_str());
}

}  // namespace

extern "C" JNIEXPORT jboolean JNICALL
Java_com_mixa_vault_NeedleBridge_nativeAvailable(JNIEnv*, jobject) {
#if NEEDLE_AVAILABLE
    return JNI_TRUE;
#else
    return JNI_FALSE;
#endif
}

extern "C" JNIEXPORT jint JNICALL
Java_com_mixa_vault_NeedleBridge_nativeLoad(
    JNIEnv* env,
    jobject,
    jbyteArray model,
    jstring system_prompt,
    jstring tools_json
) {
#if !NEEDLE_AVAILABLE
    (void) env;
    (void) model;
    (void) system_prompt;
    (void) tools_json;
    return -2;
#else
    std::lock_guard<std::mutex> lock(g_mutex);
    if (g_loaded) return 0;
    if (model == nullptr) return -3;

    const jsize length = env->GetArrayLength(model);
    if (length <= 0) return -4;

    g_model.resize(static_cast<size_t>(length));
    env->GetByteArrayRegion(
        model,
        0,
        length,
        reinterpret_cast<jbyte*>(g_model.data())
    );

    int rc = needle_load(g_model.data(), static_cast<unsigned long long>(g_model.size()));
    if (rc < 0) {
        LOGE("needle_load failed: %d", rc);
        g_model.clear();
        return rc;
    }

    g_system_prompt = to_string(env, system_prompt);
    g_tools_json = to_string(env, tools_json);
    rc = needle_init(g_system_prompt.c_str(), g_tools_json.c_str(), nullptr);
    if (rc < 0) {
        LOGE("needle_init failed: %d", rc);
        g_model.clear();
        return rc;
    }

    g_loaded = true;
    return 0;
#endif
}

extern "C" JNIEXPORT jstring JNICALL
Java_com_mixa_vault_NeedleBridge_nativeComplete(
    JNIEnv* env,
    jobject,
    jstring input,
    jint max_new_tokens
) {
#if !NEEDLE_AVAILABLE
    (void) input;
    (void) max_new_tokens;
    return error_json(env, "AI engine is only available on arm64 devices");
#else
    std::lock_guard<std::mutex> lock(g_mutex);
    if (!g_loaded) return error_json(env, "Model is not loaded");

    const std::string text = to_string(env, input);
    std::vector<char> output(32768, 0);
    const int rc = needle_complete(
        text.c_str(),
        max_new_tokens,
        output.data(),
        static_cast<int>(output.size())
    );
    if (rc < 0) {
        LOGE("needle_complete failed: %d", rc);
        return error_json(env, "Inference failed");
    }

    output.back() = '\0';
    return env->NewStringUTF(output.data());
#endif
}

extern "C" JNIEXPORT void JNICALL
Java_com_mixa_vault_NeedleBridge_nativeReset(JNIEnv*, jobject) {
#if NEEDLE_AVAILABLE
    std::lock_guard<std::mutex> lock(g_mutex);
    if (g_loaded) needle_reset();
#endif
}
