# 构建 APK

当前工程已在以下环境验证：

```text
Windows 11
Android Studio
JDK 21.0.11 (JBR)
Android SDK 35
Build Tools 35.0.0
NDK 30.0.16248370
CMake 4.1.2
Python 3.14.7 (64-bit)
Gradle 8.11.1
AGP 8.9.2
```

## 1. 必需组件

Android Studio → **SDK Manager**：

**SDK Platforms**

- Android 15（API 35）

**SDK Tools**

- Android SDK Build-Tools 35.0.0
- Android SDK Platform-Tools
- Android Emulator
- NDK (Side by side) `30.0.16248370`
- CMake `4.1.2`

NDK 和 CMake 不是可选项：`NeedleBridge` 需要编译 `libneedlejni.so`。

Python 使用 64 位 3.14：

```powershell
py -3.14 --version
```

## 2. 打开工程

```text
Android Studio → Open
C:\Users\s2086\Documents\deepseek-harness\default-workspace\mixa-vault
```

打开的是 `mixa-vault` 这一层，不是上级目录。

Gradle JDK：

```text
File → Settings → Build, Execution, Deployment → Build Tools → Gradle
Gradle JDK → jbr-21.0.11
```

不要用 JDK 25；Gradle 8.11.1 不支持。

## 3. 本地配置

`local.properties` 不存在时创建：

```properties
sdk.dir=C\:\\Users\\s2086\\AppData\\Local\\Android\\Sdk
```

这个文件不应提交到版本库。

模型和静态库已经包含在工程里：

```text
app/src/main/assets/needle/needle2.cact
app/src/main/cpp/needle/android-arm64/libneedle.a
app/src/main/cpp/needle/android-arm64/needle.h
```

不需要另外下载。

## 4. 命令行构建

```powershell
$env:JAVA_HOME = "C:\Users\s2086\.jdks\jbr-21.0.11"
$env:Path = "$env:JAVA_HOME\bin;$env:Path"

cd C:\Users\s2086\Documents\deepseek-harness\default-workspace\mixa-vault
.\gradlew.bat assembleDebug --offline
```

输出：

```text
app\build\outputs\apk\debug\app-debug.apk
```

首次构建或修改 CMake 后去掉 `--offline`，让 Gradle 解析依赖。

## 5. 安装

查看设备：

```powershell
$adb = "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe"
& $adb devices -l
```

模拟器：

```powershell
& $adb -s emulator-5554 install -r app\build\outputs\apk\debug\app-debug.apk
```

真机：

```powershell
& $adb -s <设备序列号> install -r app\build\outputs\apk\debug\app-debug.apk
```

小米 / HyperOS 需要打开：

```text
开发者选项 → USB 调试
开发者选项 → USB 安装
```

如果出现 `INSTALL_FAILED_USER_RESTRICTED`，再打开“USB 调试（安全设置）”。

## 6. 设备限制

| 设备 | 应用 | AI |
|---|---|---|
| arm64 真机 | 可用 | 可用 |
| x86_64 模拟器 | 可用 | 不可用，显示空实现 |

Needle 官方 Android 静态库只有 `arm64-v8a`。  
`x86_64` 会编译 stub，所以 App 不会崩溃，但 `AI 识别` 按钮不会显示。

## 7. 常见错误

### `JAVA_HOME is not set`

```powershell
$env:JAVA_HOME = "C:\Users\s2086\.jdks\jbr-21.0.11"
$env:Path = "$env:JAVA_HOME\bin;$env:Path"
```

### `SDK location not found`

检查 `local.properties` 的 `sdk.dir`。

### `NDK not configured`

SDK Manager 安装 NDK `30.0.16248370`，或修改：

```kotlin
ndkVersion = "30.0.16248370"
```

### CMake 版本错误

工程指定：

```kotlin
externalNativeBuild {
    cmake {
        path = file("src/main/cpp/CMakeLists.txt")
        version = "4.1.2"
    }
}
```

SDK Manager 安装 CMake `4.1.2`。

### `Current thread does not hold the state lock for root project`

Chaquopy 与旧 AGP 的兼容问题。当前固定：

```text
AGP 8.9.2
Gradle 8.11.1
```

仍报错时：

```powershell
.\gradlew.bat --stop
Remove-Item .gradle -Recurse -Force
.\gradlew.bat assembleDebug --stacktrace
```

### Gradle 下载超时

工程使用腾讯镜像：

```properties
https\://mirrors.cloud.tencent.com/gradle/gradle-8.11.1-bin.zip
```

必要时删除 wrapper 缓存后重试：

```powershell
Remove-Item "$env:USERPROFILE\.gradle\wrapper\dists\gradle-8.11.1-bin" -Recurse -Force -ErrorAction SilentlyContinue
```

## 8. 数据位置

```text
/data/data/com.mixa.vault/files/vault.json
```

明文 JSON。卸载 App 会删除。

加密备份由用户在设置页导出到：

```text
Download/MixaVault/backups/
```

诊断日志由设置页直接写入：

```text
Download/
```

## 9. 发布版签名

当前使用个人 release keystore：

```text
mixa-vault/.keystore/release-d1rector.keystore
mixa-vault/keystore.properties
```

证书主题：

```text
CN=D1rector, O=D1rector, OU=Personal, C=HK
```

两者都被 `.gitignore` 忽略，也不会进入源码压缩包。**必须单独备份**；丢失后无法用同一签名更新已安装的 App。

构建 release：

```powershell
$env:JAVA_HOME = "C:\Users\s2086\.jdks\jbr-21.0.11"
$env:Path = "$env:JAVA_HOME\bin;$env:Path"

cd C:\Users\s2086\Documents\deepseek-harness\default-workspace\mixa-vault
.\gradlew.bat assembleRelease
```

输出：

```text
app\build\outputs\apk\release\app-release.apk
```

验证签名：

```powershell
& "$env:LOCALAPPDATA\Android\Sdk\build-tools\35.0.0\apksigner.bat" `
  verify --print-certs app\build\outputs\apk\release\app-release.apk
```

### 从 debug 迁移到 release

debug 和 release 使用不同证书，Android 不允许直接覆盖安装。迁移前必须：

```text
1. 打开 App → 设置 → 加密备份，导出 .mixa
2. 卸载旧 debug 版本（会清除本地数据）
3. 安装 release APK
4. 导入 → 选择 .mixa → 输入密码恢复
```

如果暂时没有重要数据，可以直接卸载重装。

### GitHub Release 更新

用户从 GitHub 下载后续版本时，**不需要卸载**。只要保持：

```text
applicationId = com.mixa.vault
同一个 release keystore
versionCode 递增
```

新 APK 会作为更新安装，数据保留。

不要每次发布都重新生成 keystore。  
如果使用 GitHub Actions 构建，keystore 和密码必须放在 Repository Secrets，不能提交到仓库。

GitHub 本身不提供后台自动更新；用户需要手动下载覆盖安装，或使用 Obtainium 跟踪 Release。Play Store / F-Droid 才提供商店级更新机制。
