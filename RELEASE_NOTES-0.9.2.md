# Mixa Vault 0.9.2

首个公开发行版。

## 功能

- iOS 风格账户列表、搜索、添加、编辑、删除。
- 密码显示/隐藏、敏感剪贴板复制。
- 自动浅色/深色模式和中英文。
- JSON / CSV / TXT / Markdown / HTML 导入。
- 本地 Needle 2 AI 识别（arm64 真机）。
- AES-256-GCM 加密备份，PBKDF2-HMAC-SHA256 210,000 次。
- `.mixa` 备份直接恢复。
- 明文 JSON 直接写入 `Download/MixaVault`。
- 诊断日志直接写入 `Download`。
- 顶部细横幅保存提示。
- 自适应应用图标。

## 安装

- Android 10 及以上。
- arm64 真机支持 AI；x86_64 模拟器无 AI。
- 如果从 debug 或旧证书版本升级，需要先导出 `.mixa`，卸载旧版，再安装本版。

## 资产

- `MixaVault-0.9.2.apk`
- `MixaVault-0.9.2.sha256`
- `MixaVault-0.9.2-source.zip`

安装前建议校验 SHA-256。
