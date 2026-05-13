# 翻译 API 配置指南

## 可用翻译服务（按推荐优先级排序）

### 🟢 免费可用（无需 API Key）

| API | 名称 | 说明 | 稳定性 |
|-----|------|------|--------|
| `google-web` | Google Web | 非官方网页接口，无需密钥 | ⭐⭐⭐ |
| `libre` | LibreTranslate | 公共实例，可能不稳定 | ⭐⭐ |

### 🔵 需要 API Key（免费额度高）

| API | 名称 | 免费额度 | 质量 | 国内访问 |
|-----|------|----------|------|----------|
| `baidu` | 百度翻译 | 100 万字符/月 | ⭐⭐⭐⭐ | ✅ 快 |
| `azure-cn` | Azure 中国版 | 200 万字符/月 | ⭐⭐⭐⭐⭐ | ✅ 快 |
| `bing` | 必应翻译 | 200 万字符/月 | ⭐⭐⭐⭐ | ✅ 快 |
| `deepl` | DeepL | 50 万字符/月 | ⭐⭐⭐⭐⭐ | ❌ 慢 |
| `google` | Google Cloud | $20/百万字符 | ⭐⭐⭐⭐ | ❌ 慢 |

### 🟣 本地方案

| API | 名称 | 要求 | 质量 |
|-----|------|------|------|
| `ollama` | Ollama 本地 | 需安装 Ollama，有 GPU 最好 | ⭐⭐⭐-⭐⭐⭐⭐ |

---

## 推荐配置组合

### 方案 A: 纯免费组合（最省事）
```bash
export TRANSLATE_API=google-web,libre
```
- ✅ 完全免费，无需配置
- ⚠️ 可能偶尔超时或失败

### 方案 B: 混合 fallback（推荐）
```bash
# 如果申请了百度翻译 API
export TRANSLATE_API=baidu,google-web,libre
```
- ✅ 主用免费高质量，fallback 可用
- ⚡ 需要申请 API Key

### 方案 C: 本地优先（隐私最佳）
```bash
export TRANSLATE_API=ollama,google-web,libre
```
- ✅ 离线可用，隐私保护好
- ⚡ 需要安装 Ollama

### 方案 D: 国内稳定组合
```bash
export TRANSLATE_API=azure-cn,baidu,google-web
```
- ✅ 国内访问速度快
- ⚡ 需要 API Key

---

## 快速申请 API Key

### 1. 百度翻译
1. 访问：https://api.fanyi.baidu.com/
2. 注册账号并实名认证
3. 创建应用获取 APP ID 和 Secret Key
4. 免费额度：100 万字符/月

```bash
export BAIDU_APP_ID=your_app_id
export BAIDU_SECRET_KEY=your_secret_key
```

### 2. Azure 中国版 (推荐国内用户)
1. 访问：https://portal.azure.cn/
2. 搜索 "Translator" 创建资源
3. 获取 API Key
4. 免费额度：200 万字符/月

```bash
export AZURE_CN_API_KEY=your_api_key
export AZURE_REGION=eastasia
```

### 3. 微软必应翻译
1. 访问：https://portal.azure.com/
2. 搜索 "Bing Translator" 创建资源
3. 获取 API Key
4. 免费额度：200 万字符/月

```bash
export BING_API_KEY=your_api_key
```

---

## 故障排查

### 翻译总是超时
1. 调整顺序，把更快的放前面
2. 增加超时时间

### 某个 API 不可用
系统会自动尝试下一个 API，无需担心

### 想只用某一个 API
```bash
export TRANSLATE_API=baidu  # 或其他任意一个
```
