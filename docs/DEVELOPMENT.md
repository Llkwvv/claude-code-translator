# 开发指南

## 项目结构

```
claude-code-translator/
├── README.md              # 项目说明
├── package.json           # npm 配置
├── install.sh             # 安装脚本
├── uninstall.sh           # 卸载脚本
├── test-api.js            # API 测试脚本
├── src/
│   ├── index.js           # 插件入口
│   ├── translator.js      # 翻译核心逻辑
│   └── providers/         # 翻译 API Provider
│       ├── libre.js       # LibreTranslate
│       ├── deepl.js       # DeepL
│       ├── google.js      # Google Translate
│       ├── baidu.js       # 百度翻译
│       └── ollama.js      # Ollama 本地模型
├── hooks/
│   ├── before-user-message.sh  # 输入翻译 Hook
│   └── after-model-response.sh  # 输出翻译 Hook
└── docs/
    ├── API_SETUP.md       # API 配置指南
    └── DEVELOPMENT.md     # 开发指南 (本文件)
```

## 本地开发

### 1. 安装依赖

```bash
cd claude-code-translator
npm install
```

### 2. 链接到 Claude Code

```bash
# 创建符号链接 (开发模式)
ln -s $(pwd)/src ~/.claude/plugins/claude-code-translator
```

或手动复制：

```bash
cp -r src/* ~/.claude/plugins/claude-code-translator/
```

### 3. 启用调试模式

```bash
export DEBUG=translator
claude
```

### 4. 修改代码

修改 `src/` 下的文件后，重启 Claude Code 即可生效。

## 添加新的翻译 Provider

1. 在 `src/providers/` 创建新文件：

```javascript
// src/providers/custom.js

async function translate(text, source = 'auto', target = 'en') {
  // 你的翻译逻辑
  const translated = await yourTranslationAPI(text, source, target);
  return translated;
}

module.exports = {
  name: 'custom',
  translate,
  requiresApiKey: true, // 是否需要 API Key
  isLocal: false        // 是否是本地服务
};
```

2. 在 `src/translator.js` 注册：

```javascript
const providers = {
  libre: require('./providers/libre'),
  deepl: require('./providers/deepl'),
  google: require('./providers/google'),
  baidu: require('./providers/baidu'),
  ollama: require('./providers/ollama'),
  custom: require('./providers/custom') // 添加你的 Provider
};
```

3. 更新 `install.sh` 添加 API Key 提示

4. 更新文档 `docs/API_SETUP.md`

## 测试

### 单元测试

```bash
npm test
```

### API 测试

```bash
# 测试所有已配置的 API
node test-api.js

# 测试特定 API
TRANSLATE_API=deepl node test-api.js
```

### 手动测试

```bash
# 安装插件
./install.sh

# 启动 Claude Code
claude

# 输入中文测试
> 帮我写个 Python 脚本

# 应该看到英文输出给 Claude
> Write a Python script for me
```

## Hook 系统

Claude Code 的 Hook 系统允许在特定时机执行脚本：

| Hook | 触发时机 | 用途 |
|------|---------|------|
| `before-user-message` | 用户发送消息前 | 输入翻译、命令别名 |
| `Stop` | Claude 响应后 | 输出翻译、日志记录 |

### 环境变量

Hook 脚本可以访问以下环境变量：

- `CLAUDE_USER_INPUT`: 用户输入
- `CLAUDE_MODEL`: 使用的模型
- `CLAUDE_SESSION_ID`: 会话 ID

> 输出翻译不依赖 `afterModelResponse` 这样的插件回调。当前可运行路径是 Claude Code 的 `Stop` hook，它能读取 `last_assistant_message` 并返回一段中文翻译作为用户可见结果。

### 示例：添加命令别名

```bash
#!/bin/bash
# ~/.claude/hooks/before-user-message.sh

if [[ "$CLAUDE_USER_INPUT" == "help" ]]; then
    export CLAUDE_USER_INPUT="请帮我解释一下这个命令的用法"
fi
```

## 发布

### 1. 更新版本号

```bash
# 编辑 package.json
npm version patch  # 1.0.0 -> 1.0.1
```

### 2. 更新 CHANGELOG

```markdown
## [1.0.1] - 2026-05-12

### Fixed
- 修复 LibreTranslate API 超时问题

### Added
- 新增百度翻译支持
```

### 3. 发布到 npm (可选)

```bash
npm publish
```

## 性能优化

### 缓存翻译结果

```javascript
const cache = new Map();

async function translate(text, source, target) {
  const key = `${source}:${target}:${text}`;
  
  if (cache.has(key)) {
    return cache.get(key);
  }
  
  const result = await callAPI(text, source, target);
  cache.set(key, result);
  return result;
}
```

### 批量翻译

对于长文本，可以分割后批量发送：

```javascript
async function batchTranslate(paragraphs, source, target) {
  const batchSize = 10;
  const results = [];
  
  for (let i = 0; i < paragraphs.length; i += batchSize) {
    const batch = paragraphs.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(p => translate(p, source, target))
    );
    results.push(...batchResults);
  }
  
  return results;
}
```

## 贡献代码

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 许可证

MIT License
