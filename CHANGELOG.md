# Changelog

## 0.9.0 — 2026-11-24 — 首个发行版

- iOS 风格账户列表、搜索、添加、编辑、删除。
- 点击卡片展开密码、网址、备注；密码默认模糊。
- 自动跟随系统浅色/深色和中英文。
- JSON / CSV / TXT / Markdown / HTML 导入，支持直接粘贴。
- 本地 Needle 2 AI 识别，arm64 真机可用。
- 中文标签规范化和三行/单行纯文本预处理。
- 可选 AES-256-GCM 加密备份，PBKDF2-HMAC-SHA256 210,000 次。
- `.mixa` 导入解密恢复。
- 加密备份写入 `Download/MixaVault/backups/`。
- 诊断日志直接写入 `Download/`。
- 自适应图标：前景/背景/夜间背景/Android 13 单色主题层。
- 个人 release keystore 签名（CN=D1rector），替代 debug 签名的安装警告。
- 顶部细横幅 + 成功图标 + 两行保存路径。
- 无网络权限、无广告/分析 SDK、无遥测。
- 首个发行版版本号：`0.9.0`，versionCode `17`。

## 0.9.1 — 2026-11-24

- 明文 JSON 直接写入 `Download/MixaVault`，不再弹系统保存选择器。
- 保存提示统一为顶部细横幅：成功图标 + 标题 + 两行路径。
- 签名证书改为 `CN=D1rector`。
- 版本号：`0.9.1`，versionCode `18`。

## 0.9.2 — 2026-11-24

- 加密备份密码框明确提示至少 8 位。
- 版本号：`0.9.2`，versionCode `19`。
