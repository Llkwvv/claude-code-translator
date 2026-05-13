# Ollama 本地翻译设置指南

## 快速开始

### 1. 安装 Ollama (WSL2)

```bash
curl -fsSL https://ollama.com/install.sh | sh
```

**注意**: WSL2 默认使用 CPU 模式（不支持 AMD GPU 直通）。这仍然可以工作，只是速度会慢一些。

### 2. 启动 Ollama 服务

```bash
# 后台运行
ollama serve &

# 或者在前台运行（用于调试）
ollama serve
```

### 3. 拉取轻量级模型

推荐以下中文表现好的小模型：

```bash
# 最轻 (798MB) - 适合低配机器
ollama pull qwen2.5:0.5b

# 中等 (4.2GB) - 平衡性能和大小
ollama pull qwen2.5:1.5b

# 稍大但更好用 (7.6GB) - 如果内存够的话
ollama pull qwen2.5:3b
```

对于 AMD 780M + WSL2，建议先用 `qwen2.5:0.5b` 或 `qwen2.5:1.5b`。

### 4. 测试翻译

```bash
ollama run qwen2.5:0.5b "Translate to English: 你好世界"
```

如果返回英文翻译，说明配置成功！

### 5. 配置 translator 插件

编辑 `~/.claude/settings.json`:

```json
{
  "translator": {
    "enabled": true,
    "api": "ollama,qwen2.5:0.5b",
    "direction": "both"
  }
}
```

或者设置环境变量:

```bash
export TRANSLATE_API=ollama
export OLLAMA_MODEL=qwen2.5:0.5b
```

## 优先级混合配置 (推荐)

为了保险起见，建议配置多个 API 作为 fallback:

```bash
# 优先 Ollama，失败时使用 google-web
export TRANSLATE_API=ollama,google-web,libre

# 或者只使用免费在线服务
export TRANSLATE_API=google-web,libre
```

## 性能预期

| 模型 | 大小 | CPU 速度 (WSL2) | 适用场景 |
|------|------|----------------|----------|
| qwen2.5:0.5b | 798MB | ~2-5 tokens/s | 简单翻译 |
| qwen2.5:1.5b | 4.2GB | ~1-3 tokens/s | 一般翻译 |
| qwen2.5:3b | 7.6GB | ~1-2 tokens/s | 高质量翻译 |

**注意**: WSL2 CPU 模式下速度较慢，但对于短句翻译还是能接受的。

## 故障排除

### Ollama 无法连接

```bash
# 检查服务是否运行
ps aux | grep ollama

# 重启服务
pkill ollama
ollama serve &
```

### 翻译太慢

- 使用更小的模型 (`qwen2.5:0.5b`)
- 减少上下文长度：`export OLLAMA_NUM_CTX=512`
- 回退到在线服务

### 翻译质量差

- 换更大的模型
- 调整 temperature: `export OLLAMA_TEMP=0.1`

## 卸载

```bash
# 删除模型
ollama rm qwen2.5:0.5b

# 停止服务
pkill ollama
```
