# Claude Code Translator

Claude Code 双向翻译插件：中文输入自动翻译为英文发送给模型，英文回复翻译为中文展示。

## 架构

```
用户输入中文 → UserPromptSubmit Hook → 翻译为英文 → Claude 接收英文
Claude 回复英文 → Stop Hook → 翻译为中文 → 用户看到中文
```

## 安装

### 1. 克隆仓库

```bash
git clone https://github.com/Llkwvv/claude-code-translator.git
cd claude-code-translator
```

### 2. 安装依赖

```bash
npm install
```

### 3. 安装 Hook 脚本

```bash
mkdir -p ~/.claude/hooks
cp hooks/before-user-message.sh ~/.claude/hooks/
cp hooks/after-model-response.sh ~/.claude/hooks/
chmod +x ~/.claude/hooks/*.sh
```

### 4. 配置 cc-switch 通用配置

打开 cc-switch，编辑 settings.json，在**通用配置片段**中添加以下内容：

```json
{
  "hooks": {
    "UserPromptSubmit": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "/home/lkw/.claude/hooks/before-user-message.sh",
            "timeout": 30
          }
        ]
      }
    ],
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "/home/lkw/.claude/hooks/after-model-response.sh",
            "timeout": 30
          }
        ]
      }
    ]
  },
  "env": {
    "CLAUDE_TRANSLATOR_PLUGIN_DIR": "/home/lkw/claude-code-translator",
    "HTTP_PROXY": "http://127.0.0.1:7897",
    "ALL_PROXY": "http://127.0.0.1:7897"
  }
}
```

> **注意**: 将路径替换为你本地的实际路径。`CLAUDE_TRANSLATOR_PLUGIN_DIR` 指向本仓库目录。

### 5. 为什么使用通用配置？

`cc-switch` 会在切换 API provider 时重写 `settings.json`。通用配置片段（Common Configuration Fragment）用于在 provider 之间共享非敏感配置（如 hooks、环境变量），切换时不会被覆盖。

> 如果插件或 hook 有更新，请重新提取通用配置以同步到所有 provider。

### 6. 验证

重启 Claude Code，输入中文测试：

```
输入：你好
Claude 接收：Hello
Claude 回复：Hello! How can I help you today?
Stop Hook 翻译后显示：你好！有什么我可以帮你的吗？
```

## 配置

### 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `CLAUDE_TRANSLATOR_PLUGIN_DIR` | 插件仓库路径 | `/home/lkw/claude-code-translator` |
| `HTTP_PROXY` | HTTP 代理地址 | - |
| `ALL_PROXY` | 全局代理地址 | - |
| `DEBUG` | 开启调试日志 | `translator` |
| `TRANSLATE_API` | 翻译 API | `ollama,libre` |
| `TRANSLATE_ENABLED` | 启用翻译插件 | `true` |
| `TRANSLATE_DIRECTION` | 翻译方向 | `both` |
| `TRANSLATE_AUTO_DETECT` | 自动检测语言 | `true` |
| `HOOK_LOG_FILE` | Hook 日志文件路径 | `~/.claude/translator-hook.log` |
| `OLLAMA_MODEL` | Ollama 模型名称 | `qwen2.5:0.5b` |
| `OLLAMA_ENDPOINT` | Ollama API 地址 | `http://localhost:11434/api/generate` |

### 翻译 API 切换

```bash
# Ollama 本地模型 (默认，优先尝试)
export TRANSLATE_API=ollama,libre

# 多 API 优先级（按顺序尝试）
export TRANSLATE_API=google-web,ollama,libre

# DeepL (高质量)
export TRANSLATE_API=deepl
export DEEPL_API_KEY=your-key

# 百度翻译
export TRANSLATE_API=baidu
export BAIDU_APP_ID=your-id
export BAIDU_SECRET_KEY=your-key

# Ollama (本地大模型，保护隐私)
export TRANSLATE_API=ollama
export OLLAMA_MODEL=llamafamily/llama3-chinese-8b-instruct
export OLLAMA_ENDPOINT=http://localhost:11434/api/generate
```

### Ollama 快速开始

1. 安装 Ollama: https://ollama.ai

2. 拉取推荐模型：
```bash
# 推荐：Llama3 中文优化版
ollama pull llamafamily/llama3-chinese-8b-instruct

# 其他可选模型
ollama pull qwen2.5:0.5b
ollama pull llama3.2
```

3. 启动 Ollama 服务：
```bash
ollama serve
```

4. 配置环境变量并测试：
```bash
export TRANSLATE_API=ollama
export OLLAMA_MODEL=llamafamily/llama3-chinese-8b-instruct
```

### 翻译 API 对比

| API | 免费 | 质量 | 需要 Key | 需要安装 | 离线可用 |
|-----|------|------|----------|----------|----------|
| google-web | ✅ | ⭐⭐⭐⭐ | ❌ | ❌ | ❌ |
| libre | ✅ | ⭐⭐⭐ | ❌ | ❌ | ❌ |
| deepl | ✅ 50万字符/月 | ⭐⭐⭐⭐⭐ | ✅ |
| baidu | ✅ 100万字符/月 | ⭐⭐⭐⭐ | ✅ |
| ollama | ✅ 本地 | ⭐⭐⭐~⭐⭐⭐⭐ | ❌ | ✅ | ✅ |

## 故障排查

### Hook 不生效

1. 确认 hook 脚本已安装：`ls ~/.claude/hooks/`
2. 确认通用配置已设置并包含 hooks
3. 重启 Claude Code
4. 开启调试：`export DEBUG=translator`

### 翻译失败

检查日志：
```bash
tail -f ~/.claude/translator-hook.log
```

常见错误：
- `翻译请求超时` — 检查代理或网络
- `翻译服务未找到` — Ollama 未运行或模型不存在
- `API 认证失败` — 检查 API Key
- `无法连接到翻译服务` — 检查代理地址

### 手动测试 Hook

```bash
echo '{"prompt": "你好"}' | node src/user-prompt-hook.js
```

### 手动测试翻译

```bash
node -e "
const Translator = require('./src/translator');
const t = new Translator({api: 'libre'});
t.toEnglish('你好').then(console.log);
"
```

## 卸载

```bash
# 删除 hook 脚本
rm -rf ~/.claude/hooks/

# 在 cc-switch 通用配置中移除 hooks 和 env 配置
# 重启 Claude Code
```

## License

MIT
