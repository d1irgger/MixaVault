# 兼容性与版本清单

项目：**密匣 / Mixa Vault**
版本：**0.9.2**（versionCode `19`）
性质：首个发行版，个人自用，debug 签名

本文档记录当前已验证的工具链、SDK、运行时和兼容性边界。不要单独升级其中一项。

## 1. 已验证工具链

```text
Android Gradle Plugin : 8.9.2
Gradle                : 8.11.1
Kotlin                : 2.1.20
Gradle JDK            : 21.0.11 (JBR 21)
Java / Kotlin target  : 17
compileSdk            : 35
targetSdk             : 35
minSdk                : 24
Build Tools           : 35.0.0
NDK                   : 30.0.16248370
CMake                 : 4.1.2
Python (Chaquopy)     : 3.14
Chaquopy plugin       : 17.2.0
ABI                   : arm64-v8a, x86_64
```

实测构建：

```text
BUILD SUCCESSFUL
```

实测运行：

```text
Android 17 / API 37 模拟器（x86_64，无 AI）
Xiaomi 15 / Android 17 / arm64（AI 可用）
WebView 145.0.7632.218
```

## 2. SDK 与本机路径

| 项目 | 值 |
|---|---|
| Android SDK | `C:\Users\s2086\AppData\Local\Android\Sdk` |
| compileSdk | `35` |
| Build Tools | `35.0.0` |
| NDK | `30.0.16248370` |
| CMake | `4.1.2` |
| Gradle JDK | `C:\Users\s2086\.jdks\jbr-21.0.11` |
| 构建 Python | `C:\Users\s2086\AppData\Local\Programs\Python\Python314\python.exe` |

`targetSdk 35` 在 Android 15+ 上强制 edge-to-edge。项目使用：

```kotlin
WindowCompat.setDecorFitsSystemWindows(window, false)
```

通过 `WindowInsetsCompat` 下发：

```text
--safe-top
--safe-bottom
--ime
```

不要改回 `setDecorFitsSystemWindows(true)`。

## 3. 依赖

```kotlin
implementation("androidx.appcompat:appcompat:1.7.0")
implementation("androidx.core:core-ktx:1.15.0")
implementation("androidx.activity:activity-ktx:1.9.3")
implementation("androidx.webkit:webkit:1.12.1")
```

无 Compose、无 RecyclerView、无第三方 UI 库、无网络库。

Python 仅使用标准库：

```text
json os threading time uuid traceback
```

## 4. Needle 2 本地推理

| 项目 | 值 |
|---|---|
| 模型 | `app/src/main/assets/needle/needle2.cact`（13,737,807 B） |
| 静态库 | `app/src/main/cpp/needle/android-arm64/libneedle.a`（20,729,982 B） |
| 头文件 | `.../android-arm64/needle.h` |
| JNI 库 | `libneedlejni.so` |
| 原生 ABI | 仅 `arm64-v8a` |
| x86_64 | 空实现，`aiAvailable()` 返回 false |
| 上下文 | 约 256 tokens，按 450 字符切块 |
| 实测峰值内存 | 约 390 MB |
| 网络 | 无，模型本地加载 |

模型与静态库 SHA-256 已与官方 Hugging Face LFS 值核对。

C API：

```c
needle_load(model, size);
needle_init(system_prompt, tools_json, nullptr);
needle_complete(input, 512, output, sizeof(output));
needle_reset();
```

中文预处理：

```text
账号 / 用户名 / 邮箱 -> username
密码 / 口令 -> password
网址 / 链接 -> url
备注 / 说明 -> note
```

支持常见中文标签、三行纯文本、`名称 邮箱 密码` 单行。  
自然语言长句需要离线 LoRA：[TRAINING.md](TRAINING.md)。

## 5. 加密备份

| 项目 | 值 |
|---|---|
| 开关 | 设置 → 加密备份 |
| 开启后文件入口 | `vault.mixa` |
| 关闭后文件入口 | `vault.json` |
| 算法 | PBKDF2-HMAC-SHA256 210,000 次 + AES-256-GCM |
| 文件格式 | `MIXA1:salt:iv:ciphertext`（base64） |
| 保存位置 | `Download/MixaVault/backups/mixa-vault-backup-日期-时间.mixa` |
| 密码 | 不保存，导出与恢复各输入一次 |
| 导入 | 自动识别 `.mixa` 并解密 |
| 系统要求 | Android 10+；旧系统不支持直写 |

`vault.json` 本身仍是明文。加密只作用于导出备份。

## 6. 权限与 WebView

没有申请任何运行时权限：

- 没有 `INTERNET`
- 没有存储权限
- 明文导出使用系统 SAF 文件选择器
- 加密备份/诊断日志使用 `MediaStore.Downloads`（Android 10+）
- 文件导入使用系统文件选择器

WebView 配置：

```kotlin
settings.allowFileAccess = false
settings.allowContentAccess = true
settings.setForceDarkAllowed(false)
```

页面加载：

```text
https://appassets.androidplatform.net/assets/index.html
```

CSP：

```html
default-src 'none'
script-src 'self'
style-src 'self' 'unsafe-inline'
img-src 'self' data:
```

前端使用：

```text
Intl.Collator
URLSearchParams
FileReader
Blob / URL.createObjectURL
matchMedia
crypto.getRandomValues
crypto.subtle (PBKDF2 + AES-GCM)
```

最低建议 WebView 120+；`crypto.subtle`、`backdrop-filter`、`dvh`、`0fr → 1fr` 动画在旧内核可能缺失。

## 7. Android API 边界

| API | 最低 API | 处理 |
|---|---:|---|
| `MediaStore.Downloads` | 29 | 低于 29 不直写 |
| `View.setForceDarkAllowed` | 29 | `SDK_INT >= Q` |
| `ClipDescription.EXTRA_IS_SENSITIVE` | 33 | `SDK_INT >= TIRAMISU` |
| 自适应图标 | 26 | `mipmap-anydpi-v26` |
| 主题单色图标 | 33 | `mipmap-anydpi-v33` |
| `CreateDocument` | AndroidX | SAF |
| `WebViewAssetLoader` | AndroidX | webkit |

## 8. 应用标识

| 项目 | 值 |
|---|---|
| applicationId | `com.mixa.vault` |
| namespace | `com.mixa.vault` |
| versionName | `0.9.2` |
| versionCode | `19` |
| MainActivity | `com.mixa.vault.MainActivity` |
| Debug APK | `app/build/outputs/apk/debug/app-debug.apk` |
| Release APK | `app/build/outputs/apk/release/app-release.apk` |
| Release 签名 | `CN=D1rector` 个人 release keystore，APK Signature Scheme v2 |
| minify | 关闭 |

Debug APK 约 72 MB，主要来自 Chaquopy/Python、Needle 模型和 arm64 静态库。

不要随意修改 `applicationId`：会变成新应用，无法覆盖升级，旧数据不迁移。

## 9. 数据格式

本地：

```text
/data/data/com.mixa.vault/files/vault.json
```

```json
{
  "version": 1,
  "accounts": [
    {
      "id": "uuid",
      "title": "...",
      "username": "...",
      "password": "...",
      "url": "...",
      "note": "...",
      "createdAt": 0,
      "updatedAt": 0
    }
  ]
}
```

- UTF-8 明文。
- 原子写入：临时文件 + `os.replace`。
- 文件权限尝试 `0600`。
- `android:allowBackup="false"`。
- 卸载会删除全部账户。

明文导出为 JSON，直接写入：

```text
Download/MixaVault/mixa-vault-日期.json
```

加密导出为 `.mixa`，写入：

```text
Download/MixaVault/backups/
```

诊断日志：

```text
/data/data/com.mixa.vault/files/diagnostics.log
Download/mixa-vault-diagnostics-日期-时间.txt
```

## 10. JS ↔ Kotlin ↔ Python

Kotlin Bridge：

```text
call(action, payload)
getLanguage()
getVersion()
openUrl(url)
exportJson(fileName, content)
exportBackup(fileName, content)
exportLog(fileName, content)
aiAvailable()
analyzeText(text)
copyText(text)
haptic()
setOverlayOpen(open)
```

Python actions：

```text
status list save delete import diagnostics
```

回调：

```text
window.__onExportResult(ok)
window.__onBackupExportResult(ok)
window.__onLogExportResult(ok)
```

## 11. 构建检查清单

每次改动后至少执行：

```powershell
node --check app\src\main\assets\app.js
py -3.14 -m py_compile app\src\main\python\vault.py
.\gradlew.bat assembleDebug --offline
adb -s emulator-5554 install -r app\build\outputs\apk\debug\app-debug.apk
```

涉及 Needle 时必须用 arm64 真机验证：

```powershell
adb -s <serial> shell getprop ro.product.cpu.abi
# arm64-v8a
```

## 12. 已知限制

- 本地数据仍是明文，没有整库加密。
- 加密备份密码丢失不可恢复。
- AI 仅 arm64；x86_64 无按钮。
- 基础 Needle 模型对中文自然语言长句不稳定，需要 LoRA。
- Debug APK 可用 `run-as` 读取私有目录；正式使用建议 release。
- 只有 debug 签名，未配置发布签名。
- 图标主题效果取决于桌面启动器；部分启动器缓存图标。

## 13. 版本历史

| 版本 | versionCode | 内容 |
|---|---:|---|
| `0.9.0` | 17 | 首个发行版：iOS 风格密码库、AI 导入、加密备份、新图标、诊断日志 |
| `0.9.1` | 18 | 明文 JSON 直写 Download/MixaVault；顶部成功横幅；D1rector 签名 |
| `0.9.2` | 19 | 加密备份密码明确要求至少 8 位 |

后续版本规则：

```text
0.9.1  修复
0.10.0 功能
0.10.1 修复
```
