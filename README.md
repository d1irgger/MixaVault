<div align="center" id="home">

<h1>密匣 · Mixa Vault</h1>

本地优先的 Android 账户密码管理器。

iOS 分组列表 · 本地数据 · 离线 AI · 加密备份

`Android 10+` · `0.9.2`

[在线预览](https://d1irgger.github.io/MixaVault/) · [下载最新版本](https://github.com/d1irgger/MixaVault/releases/latest) · [English](README.en.md)

</div>

---

<p align="center">
<a href="#screens">截图</a> ·
<a href="#overview">总表</a> ·
<a href="#details">详情</a> ·
<a href="#paths">文件位置</a> ·
<a href="#license">License</a>
</p>

<h2 id="screens">截图</h2>

<table align="center">
  <tr valign="top">
    <td align="center">
      <img src="docs/preview.png" width="300" alt="账户列表">
      <br><sub>账户列表</sub>
    </td>
    <td align="center">
      <img src="docs/preview-cards.png" width="300" alt="账户卡片">
      <br><sub>账户卡片</sub>
    </td>
  </tr>
</table>

<h2 id="overview">总表</h2>

| 模块 | 说明 |
|---|---|
| 账户管理 | 搜索、添加、编辑、删除 |
| 密码操作 | 显示/隐藏、敏感剪贴板复制 |
| 导入 | JSON、CSV、TXT、Markdown、HTML |
| 本地 AI | Needle 2 识别中文标签和三行文本 |
| 备份 | 明文 JSON 或 AES-GCM 加密 `.mixa` |
| 系统 | 浅色/深色、中英文、无网络权限 |

<h2 id="details">详情</h2>

<details>
<summary><strong>账户与界面</strong></summary>

- iOS 风格分组卡片和底部 Tab Bar。
- 搜索、添加、编辑、删除账户。
- 点击卡片展开密码、网址、备注。
- 密码默认模糊，点眼睛显示。
- 一键复制，Android 剪贴板标记为敏感内容。
- 自动跟随系统浅色/深色模式。
- 自动跟随系统中英文。

</details>

<details>
<summary><strong>安全说明</strong></summary>

- 本地账户默认是应用私有目录中的明文 JSON，没有主密码。
- “加密备份”只保护导出的 `.mixa`，不改变本地数据。
- 备份密码不保存，忘记后无法恢复。
- 应用没有网络权限，不上传账户或日志。
- 已关闭 Android 自动备份。
- 卸载应用或清除数据会删除本地账户。

> 已解锁设备、root 环境或 debug 版本仍可能读取本地明文数据。

</details>

<details>
<summary><strong>安装与升级</strong></summary>

从 [GitHub Releases](https://github.com/d1irgger/MixaVault/releases/latest) 下载最新 APK。

| 场景 | 操作 |
|---|---|
| 首次安装 | 允许“安装未知应用” |
| 同一签名的新版本 | 直接覆盖安装，数据保留 |
| debug / 旧签名升级 | 先导出 `.mixa`，卸载，再安装 |
| AI 支持 | 仅 `arm64` 真机；模拟器不显示 AI 按钮 |

GitHub 版没有后台自动更新，需要手动下载覆盖安装，或使用 Obtainium 跟踪 Release。

</details>

<details>
<summary><strong>备份与恢复</strong></summary>

设置 → 文件：

```text
关闭加密备份 → Download/MixaVault/明文 JSON
打开加密备份 → Download/MixaVault/backups/.mixa
```

恢复：

```text
导入 → 选择 .mixa → 输入密码
```

诊断日志：

```text
设置 → 诊断日志 → 导出
```

</details>

<details>
<summary><strong>构建</strong></summary>

完整步骤见 [BUILD.md](BUILD.md)。

```powershell
cd mixa-vault
.\gradlew.bat assembleRelease
```

需要 JDK 21、Android SDK 35、NDK、CMake 和 64 位 Python 3.14。具体版本见 [COMPATIBILITY.md](COMPATIBILITY.md)。

</details>

<details>
<summary><strong>文档</strong></summary>

- [BUILD.md](BUILD.md) — 从零构建 APK
- [COMPATIBILITY.md](COMPATIBILITY.md) — 工具链与兼容性
- [GITHUB.md](GITHUB.md) — 仓库和 Release 流程
- [TRAINING.md](TRAINING.md) — AI 离线微调
- [CHANGELOG.md](CHANGELOG.md) — 版本记录

</details>

<h2 id="paths">文件位置</h2>

| 内容 | 位置 |
|---|---|
| 本地账户 | 应用私有目录 |
| 明文导出 | `Download/MixaVault` |
| 加密备份 | `Download/MixaVault/backups` |
| 诊断日志 | `Download` |

<h2 id="license">第三方与 License</h2>

Needle 2 由 Cactus Compute 发布，Apache-2.0，详见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。

应用代码使用 MIT License，见 [LICENSE](LICENSE)。

---

<p align="center">
<sub>密匣 / Mixa Vault · 0.9.2 · 无广告 · 无遥测</sub>
</p>
