<div align="center">

<h1>密匣 · Mixa Vault</h1>

<p>本地优先的 Android 账户密码管理器。</p>

<p><strong><a href="https://d1irgger.github.io/MixaVault/">在线预览 →</a></strong></p>

<p>
<a href="https://github.com/d1irgger/MixaVault/releases/latest">下载 APK</a> ·
<a href="README.en.md">English</a>
</p>

<p><code>0.9.2</code> · <code>Android 10+</code> · <code>本地 AI</code> · <code>加密备份</code></p>

</div>

> 在线页面包含完整截图、功能说明、安装步骤和文件位置。README 只保留折叠摘要。

<details>
<summary><strong>项目简介</strong></summary>

<br>

一个个人自用的 Android 账户密码管理器。界面是 iOS 分组列表，数据保存在设备本地，AI 识别完全离线运行。

- 无网络权限
- 无广告、无遥测
- 支持明文 JSON 和加密 `.mixa` 备份

</details>

<details>
<summary><strong>功能</strong></summary>

<br>

| 模块 | 说明 |
|---|---|
| 账户管理 | 搜索、添加、编辑、删除 |
| 密码操作 | 显示/隐藏、敏感剪贴板复制 |
| 导入 | JSON、CSV、TXT、Markdown、HTML |
| 本地 AI | Needle 2 识别中文标签和三行文本 |
| 备份 | 明文 JSON 或 AES-GCM 加密 `.mixa` |
| 界面 | 浅色/深色、中英文 |

</details>

<details>
<summary><strong>截图</strong></summary>

<br>

<table align="center">
  <tr valign="top">
    <td align="center">
      <img src="docs/preview.png" width="280" alt="账户列表">
      <br><sub>账户列表</sub>
    </td>
    <td align="center">
      <img src="docs/preview-cards.png" width="280" alt="账户卡片">
      <br><sub>账户卡片</sub>
    </td>
  </tr>
</table>

</details>

<details>
<summary><strong>安全</strong></summary>

<br>

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

<br>

从 [GitHub Releases](https://github.com/d1irgger/MixaVault/releases/latest) 下载 APK。

| 场景 | 操作 |
|---|---|
| 首次安装 | 允许“安装未知应用” |
| 同一签名的新版本 | 直接覆盖安装，数据保留 |
| debug / 旧签名 | 先导出 `.mixa`，卸载，再安装 |
| AI 支持 | 仅 `arm64` 真机 |

GitHub 版没有后台自动更新，需要手动下载覆盖安装，或使用 Obtainium 跟踪 Release。

</details>

<details>
<summary><strong>备份与文件位置</strong></summary>

<br>

| 内容 | 位置 |
|---|---|
| 明文导出 | `Download/MixaVault` |
| 加密备份 | `Download/MixaVault/backups` |
| 诊断日志 | `Download` |

恢复方式：

```text
导入 → 选择 .mixa → 输入密码
```

</details>

<details>
<summary><strong>构建与文档</strong></summary>

<br>

```powershell
cd mixa-vault
.\gradlew.bat assembleRelease
```

- [BUILD.md](BUILD.md)
- [COMPATIBILITY.md](COMPATIBILITY.md)
- [GITHUB.md](GITHUB.md)
- [TRAINING.md](TRAINING.md)
- [CHANGELOG.md](CHANGELOG.md)

</details>

<details>
<summary><strong>第三方与 License</strong></summary>

<br>

Needle 2 由 Cactus Compute 发布，Apache-2.0，详见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。

应用代码使用 MIT License，见 [LICENSE](LICENSE)。

</details>
