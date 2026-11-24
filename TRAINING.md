# Needle 2 中文笔记 LoRA 微调

手机端只做推理，不训练。LoRA 在电脑上离线完成，导出新的 `.cact` 后替换 APK 资源。

## 1. 桌面环境

建议 Python 3.10 / 3.11：

```powershell
py -3.11 -m venv .venv
.venv\Scripts\activate

pip install "cactus-needle[train]==2.0.10"
```

有 NVIDIA GPU：

```powershell
pip install "cactus-needle[train,gpu]==2.0.10"
```

如果 2.0.10 不可用，使用当前包并执行：

```powershell
needle finetune --help
needle build --help
```

以实际 CLI 参数为准。

## 2. 下载基础权重

```powershell
pip install huggingface_hub
huggingface-cli download Cactus-Compute/needle2 --include "checkpoints/*" --local-dir .
```

得到：

```text
checkpoints/needle2.pkl
```

## 3. 训练数据

一行一个 JSON。`tools` 只放一个 `save_accounts`：

```json
{
  "query": "微信\n账号：test@example.com\n密码：Test#123456\n备注：测试",
  "tools": [
    {
      "name": "save_accounts",
      "description": "Save account credentials from a note",
      "parameters": {
        "type": "object",
        "properties": {
          "accounts": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "title": { "type": "string" },
                "username": { "type": "string" },
                "password": { "type": "string" },
                "url": { "type": "string" },
                "note": { "type": "string" }
              },
              "required": ["title", "password"]
            }
          }
        },
        "required": ["accounts"]
      }
    }
  ],
  "answers": [
    {
      "name": "save_accounts",
      "arguments": {
        "accounts": [
          {
            "title": "微信",
            "username": "test@example.com",
            "password": "Test#123456",
            "note": "测试"
          }
        ]
      }
    }
  ],
  "reasoning": "'test@example.com' -> username; 'Test#123456' -> password"
}
```

无关笔记也要有，约 1/8：

```json
{
  "query": "今天下午三点开会",
  "tools": [ ... 同上 ... ],
  "answers": []
}
```

建议：

- 至少 300 条起，参数抽取稳定建议数千条；
- 覆盖：中文标签、三行纯文本、空格分隔、自然语言、多账号、重复账号、无密码、网址/备注；
- 密码必须来自原文，不能编造；
- 训练/验证拆分 90/10。

## 4. 训练

```powershell
needle finetune data.jsonl --epochs 10 --out adapter.pkl
```

小数据集可能需要 20–30 epochs。看验证 loss 趋势，不只看绝对值。

## 5. 导出 `.cact`

```powershell
needle build checkpoints/needle2.pkl --lora adapter.pkl --out tuned.cact
```

`adapter.pkl` 在导出时合并进基础权重，产物仍是单个 `.cact`，引擎无需重编。

## 6. 替换 APK 模型

```text
mixa-vault/app/src/main/assets/needle/needle2.cact
```

用 `tuned.cact` 覆盖上面这个文件，然后重新构建：

```powershell
cd mixa-vault
$env:JAVA_HOME = "C:\Users\s2086\.jdks\jbr-21.0.11"
.\gradlew.bat assembleDebug --offline
adb -s cd932080 install -r app\build\outputs\apk\debug\app-debug.apk
```

## 7. 验证

用同一批中文笔记测试：

- 标题、用户名、密码、网址、备注是否正确；
- 是否把“密码：”本身带进密码；
- 没有密码的笔记是否返回空；
- 长笔记是否会漏账号；
- 无关笔记是否被误识别。

## 注意

- 训练不是手机运行时自动完成的。
- 手机端只加载最终 `.cact`。
- 本地 LoRA 不训练 confidence head；置信度可能不可靠，当前 App 不依赖置信度。
- 当前基础模型 + 标签规范化已经能处理常见标签/三行文本；自然语言长句需要微调。
