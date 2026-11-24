# GitHub 发布指南

从新建仓库到发布第一个正式 APK 的完整流程。

## 0. 仓库信息

| 项目 | 建议值 |
|---|---|
| 仓库名 | `MixaVault` |
| 地址 | `https://github.com/d1irgger/MixaVault` |
| 描述 | `Local-first Android password manager with on-device Needle 2 extraction and encrypted backups.` |
| 可见性 | Public |
| 默认分支 | `main` |
| License | MIT（应用代码） |
| 第三方 | Needle 2 / AndroidX = Apache-2.0 |
| Topics | `android` `kotlin` `python` `chaquopy` `password-manager` `on-device-ai` `needle` `encryption` `privacy` `offline` |

仓库内已经准备好：

```text
LICENSE
THIRD_PARTY_NOTICES.md
LICENSES/Apache-2.0.txt
.gitignore
.gitattributes
README.md
README.en.md
BUILD.md
COMPATIBILITY.md
CHANGELOG.md
TRAINING.md
GITHUB.md
scripts/release.ps1
scripts/release.bat
```

不要提交：

```text
.keystore/
keystore.properties
local.properties
build/
.gradle/
.cxx/
MixaVault-*.apk
MixaVault-*.sha256
MixaVault-*-source.zip
```

## 1. 安装 Git

需要 Git 2.40 或更高版本。当前机器已安装：

```text
C:\Program Files\Git\cmd\git.exe
```

如果新终端里仍然找不到 `git`，重开终端，或直接使用完整路径：

```powershell
& "C:\Program Files\Git\cmd\git.exe" --version
```

可选安装 GitHub CLI：

```powershell
winget install --id GitHub.cli -e
gh --version
```

## 2. 新建 GitHub 仓库

### 网页方式

1. 打开 <https://github.com/new>
2. Owner 选 `d1irgger`
3. Repository name 填 `MixaVault`
4. Description 填：

```text
Local-first Android password manager with on-device Needle 2 extraction and encrypted backups.
```

5. 选 **Public**
6. **不要**勾选 README、.gitignore、license
7. 点 Create repository

### GitHub CLI 方式

```powershell
gh auth login
```

按提示登录后，在本地提交完成后再执行：

```powershell
gh repo create d1irgger/MixaVault --public `
  --description "Local-first Android password manager with on-device Needle 2 extraction and encrypted backups." `
  --source . --remote origin --push
```

## 3. 配置 Git 身份

```powershell
git config --global user.name "D1rector"
git config --global user.email "你的 GitHub 邮箱"
```

不要编造邮箱；使用 GitHub 账号绑定的邮箱，或 GitHub 提供的 noreply 地址。

## 4. 本地首次提交

```powershell
cd C:\Users\s2086\Documents\deepseek-harness\default-workspace\mixa-vault

git init -b main
git add .
```

提交前检查敏感文件：

```powershell
git status --short
```

输出里不应该出现：

```text
.keystore/
keystore.properties
local.properties
```

再确认忽略规则：

```powershell
git check-ignore -v .keystore\release-d1rector.keystore
git check-ignore -v keystore.properties
git check-ignore -v local.properties
```

正常会看到 `.gitignore` 命中。然后提交：

```powershell
git commit -m "feat: initial Mixa Vault 0.9.2 release"
```

## 5. 推送

```powershell
git remote add origin https://github.com/d1irgger/MixaVault.git
git branch -M main
git push -u origin main
```

之后日常更新：

```powershell
git add .
git commit -m "fix: ..."
git push
```

## 6. 构建正式 APK

先确认签名文件存在：

```powershell
Test-Path .keystore\release-d1rector.keystore
Test-Path keystore.properties
```

构建：

```powershell
.\scripts\release.bat
```

脚本会执行：

```text
clean assembleRelease
复制 MixaVault-版本.apk
生成 MixaVault-版本.sha256
生成 MixaVault-版本-source.zip
apksigner verify --print-certs
```

输出在项目根目录：

```text
MixaVault-0.9.2.apk
MixaVault-0.9.2.sha256
MixaVault-0.9.2-source.zip
```

如果使用当前已经构建好的产物，也可以直接使用工作区根目录的对应文件。

## 7. 创建 Release

```powershell
git tag -a v0.9.2 -m "Mixa Vault 0.9.2"
git push origin v0.9.2
```

### 网页方式

1. GitHub 仓库 → Releases → Draft a new release
2. Tag 选 `v0.9.2`
3. Title：`Mixa Vault 0.9.2`
4. 描述使用 `RELEASE_NOTES-0.9.2.md`
5. 上传：

```text
MixaVault-0.9.2.apk
MixaVault-0.9.2.sha256
MixaVault-0.9.2-source.zip
```

6. 点击 Publish release

### GitHub CLI 方式

```powershell
gh release create v0.9.2 `
  MixaVault-0.9.2.apk `
  MixaVault-0.9.2.sha256 `
  MixaVault-0.9.2-source.zip `
  --title "Mixa Vault 0.9.2" `
  --notes-file RELEASE_NOTES-0.9.2.md
```

## 8. 签名密钥与 GitHub Secrets

签名文件：

```text
.keystore/release-d1rector.keystore
keystore.properties
```

这两个文件**绝不能提交**。  
必须单独备份：密码管理器、加密压缩包、离线 U 盘。

如果以后使用 GitHub Actions，在仓库：

```text
Settings → Secrets and variables → Actions → New repository secret
```

添加：

| Secret | 内容 |
|---|---|
| `KEYSTORE_BASE64` | keystore 的 Base64 |
| `KEYSTORE_PASSWORD` | storePassword |
| `KEY_ALIAS` | `d1rector` |
| `KEY_PASSWORD` | keyPassword |

生成 Base64：

```powershell
[Convert]::ToBase64String(
  [IO.File]::ReadAllBytes("mixa-vault\.keystore\release-d1rector.keystore")
) | Set-Clipboard
```

不要把 Base64 或密码发到 Issue、Discussion、README 或聊天记录里。

当前推荐**本地构建 + 手动上传 Release**；签名链路最可控。CI 可以以后再加。

## 9. 后续版本发布

每次只改这些：

1. `app/build.gradle.kts`

```kotlin
versionCode = 20
versionName = "0.9.3"
```

2. `app/src/main/assets/app.js` 的 fallback：

```js
: '0.9.3';
```

3. `README.md` / `COMPATIBILITY.md` / `CHANGELOG.md`

4. 构建、标签、Release：

```powershell
.\scripts\release.bat

git add .
git commit -m "release: 0.9.3"
git tag -a v0.9.3 -m "Mixa Vault 0.9.3"
git push
git push origin v0.9.3

gh release create v0.9.3 `
  MixaVault-0.9.3.apk `
  MixaVault-0.9.3.sha256 `
  MixaVault-0.9.3-source.zip `
  --title "Mixa Vault 0.9.3" `
  --notes-file CHANGELOG.md
```

## 10. 用户更新规则

只要保持：

```text
applicationId = com.mixa.vault
同一个 release keystore
versionCode 递增
```

用户直接下载新 APK 覆盖安装即可，**不需要卸载**，数据保留。

需要卸载的情况只有：

- 换了签名密钥
- 改了 applicationId
- 用户安装的是 debug / 其他开发者的包

GitHub 本身没有 Play Store 的后台自动更新。用户需要手动下载覆盖安装，或使用 Obtainium 跟踪 Release。

## 11. 发布前验收

```powershell
# 版本、包名、ABI
& "$env:LOCALAPPDATA\Android\Sdk\build-tools\35.0.0\aapt2.exe" `
  dump badging MixaVault-0.9.2.apk |
  Select-String "package:|application-label:|native-code"

# 签名
& "$env:LOCALAPPDATA\Android\Sdk\build-tools\35.0.0\apksigner.bat" `
  verify --print-certs MixaVault-0.9.2.apk

# 校验和
Get-FileHash MixaVault-0.9.2.apk -Algorithm SHA256

# 安装
adb -s emulator-5554 install -r MixaVault-0.9.2.apk
```

确认：

- `versionCode` 比上一版大
- 签名仍是 `CN=D1rector`
- 没有 `DEBUGGABLE`
- APK 能覆盖安装
- GitHub Release 上传了 APK、SHA256、源码包

## 12. 常见错误

### `git` 不是命令

安装 Git 后重开终端。

### `remote origin already exists`

```powershell
git remote set-url origin https://github.com/d1irgger/MixaVault.git
```

### 推送被拒

```powershell
git pull --rebase origin main
git push
```

### GitHub 拒绝大文件

当前最大文件约 20.7 MB，低于 50 MB，不需要 Git LFS。  
不要把 APK、build 目录、keystore 提交进去。

### 用户提示签名不一致

说明旧包不是 D1rector 签名。  
让用户先导出 `.mixa`，卸载旧包，安装新包，再导入。
