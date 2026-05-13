# API 配置指南

## LibreTranslate (免费，默认)

无需配置，直接使用公共实例：

```bash
# 直接使用
export TRANSLATE_API=libre

# 或使用自建实例
export LIBRE_ENDPOINT=http://your-server:5000/translate
```

### 自建 LibreTranslate

```bash
docker run -p 5000:5000 \
  -e APIKEY=your-api-key \
  --restart unless-stopped \
  libretranslate/libretranslate
```

## DeepL (推荐，高质量)

1. 注册账号：https://www.deepl.com/pro-api
2. 获取 API Key
3. 配置环境变量：

```bash
export TRANSLATE_API=deepl
export DEEPL_API_KEY=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx:fx
```

### 免费额度
- 50 万字符/月
- 约等于 25-30 万次对话

## Google Translate

1. 访问 Google Cloud Console: https://console.cloud.google.com/
2. 创建项目并启用 Cloud Translation API
3. 创建 API Key
4. 配置：

```bash
export TRANSLATE_API=google
export GOOGLE_API_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 定价
- $20 / 百万字符
- 前 50 万字符免费/月

## 百度翻译

1. 注册百度翻译开放平台：https://fanyi-api.baidu.com/
2. 开发者认证
3. 创建应用获取 App ID 和密钥
4. 配置：

```bash
export TRANSLATE_API=baidu
export BAIDU_APP_ID=2024xxxxxxxxxxxx
export BAIDU_SECRET_KEY=xxxxxxxxxxxxxxxx
```

### 免费额度
- 标准版：100 万字符/月 (¥49/月)
- 高级版：无限制

## Ollama 本地翻译

1. 安装 Ollama: https://ollama.ai

```bash
curl -fsSL https://ollama.ai/install.sh | sh
```

2. 拉取模型：

```bash
ollama pull llama3
# 或
ollama pull qwen
```

3. 配置：

```bash
export TRANSLATE_API=ollama
export OLLAMA_MODEL=llama3
# 如果 Ollama 不在默认端口
export OLLAMA_ENDPOINT=http://localhost:11434/api/generate
```

---

## 测试 API 连通性

```bash
cd claude-code-translator
node test-api.js
```

## 切换 API

```bash
# 临时切换
export TRANSLATE_API=deepl
claude

# 永久切换 (添加到 ~/.bashrc 或 ~/.zshrc)
echo "export TRANSLATE_API=deepl" >> ~/.bashrc
source ~/.bashrc
```

## 故障排除

### API 返回原文

可能原因：
1. API Key 无效
2. 网络问题
3. 服务不可用

解决：
```bash
# 测试 API
node test-api.js

# 检查网络连接
curl -X POST https://libretranslate.de/translate \
  -H "Content-Type: application/json" \
  -d '{"q":"test","source":"auto","target":"en"}'
```

### 翻译失败但无错误信息

启用调试模式：
```bash
export DEBUG=translator
claude
```

查看详细日志：
```bash
# 查看 Claude Code 日志
tail -f ~/.claude/claude.log | grep -i translator
```
