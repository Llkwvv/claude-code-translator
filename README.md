# Claude Code Translator 翻译插件

**双向翻译**: 中文输入 → 英文发送给 Claude，英文输出 → 中文展示

## 功能

- 🔄 **双向翻译**: 用户中文输入自动翻译成英文；Claude 英文响应在 `Stop` hook 中翻译成中文后展示
- 🌍 **多 API 支持**: LibreTranslate (免费), DeepL, Google Translate, 百度翻译
- ⚡ **零配置**: 默认使用 LibreTranslate 免费 API，安装即用
- 🔒 **隐私保护**: 可选本地模型翻译 (Ollama)

## 快速开始

### 安装

```bash
# 克隆仓库
git clone https://github.com/your-username/claude-code-translator.git
cd claude-code-translator

# 运行安装脚本
./install.sh
```

### 验证

重启 Claude Code，输入中文测试：

```
输入：帮我写个 Python 脚本读取 CSV 文件
Claude 接收：Write a Python script to read a CSV file
用户看到：当然！这是一个读取 CSV 文件的 Python 脚本...

> 输出侧翻译通过 Claude Code 的 `Stop` hook 实现，原始英文回复仍会先生成，再由插件翻译成中文作为附加展示。
```

## 配置

### 切换翻译 API

```bash
# 使用 DeepL (需要 API key)
export TRANSLATE_API=deepl
export DEEPL_API_KEY=your-api-key

# 使用 Google Translate
export TRANSLATE_API=google
export GOOGLE_API_KEY=your-api-key

# 使用百度翻译
export TRANSLATE_API=baidu
export BAIDU_APP_ID=your-app-id
export BAIDU_SECRET_KEY=your-secret-key

# 使用 LibreTranslate 自建服务
export TRANSLATE_API=libre
export LIBRE_ENDPOINT=http://localhost:5000/translate

# 使用多 API 优先级配置 (推荐！)
# 按顺序尝试多个 API，提高成功率
export TRANSLATE_API=libre,google,deepl
```

### 配置文件

编辑 `~/.claude/settings.json`:

```json
{
  "translator": {
    "enabled": true,
    "api": "libre",
    "direction": "both",
    "autoDetect": true,
    "showOriginal": false
  }
}
```

| 配置项 | 说明 | 默认值 |
|--------|------|--------|
| `enabled` | 是否启用翻译 | `true` |
| `api` | 翻译 API (`libre`/`deepl`/`google`/`baidu`/`ollama`) | `libre` |
| `direction` | 翻译方向 (`input`/`output`/`both`) | `both` |
| `autoDetect` | 自动检测是否需要翻译 | `true` |
| `showOriginal` | 显示原文 | `false` |

## API 对比

| API | 免费额度 | 质量 | 需要 API Key |
|-----|---------|------|-------------|
| LibreTranslate | 完全免费 | ⭐⭐⭐ | ❌ |
| DeepL | 50 万字符/月 | ⭐⭐⭐⭐⭐ | ✅ |
| Google Translate | $20/月后付费 | ⭐⭐⭐⭐ | ✅ |
| 百度翻译 | 100 万字符/月 | ⭐⭐⭐⭐ | ✅ |
| Ollama 本地 | 免费 | ⭐⭐⭐ | ❌ |

### 推荐配置

**多 API 优先级配置 (最佳实践)**:
```bash
# 默认使用 LibreTranslate，失败时自动尝试 Google 和 DeepL
export TRANSLATE_API=libre,google,deepl

# 或者只用免费 API
export TRANSLATE_API=google,libre

# 高质量优先
export TRANSLATE_API=deepl,google
```

## 卸载

```bash
./uninstall.sh
```

## 故障排除

### 翻译失败

检查 API 连通性:

```bash
node test-api.js
```

### 翻译太慢

1. 切换到更快的 API (推荐 DeepL 或 Google)
2. 自建 LibreTranslate 服务

## 开发

```bash
# 安装依赖
npm install

# 测试
npm test
```

## License

MIT
