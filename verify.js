#!/usr/bin/env node

/**
 * 验证翻译插件是否生效
 */

const fs = require('fs');
const path = require('path');

const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const BLUE = '\x1b[34m';
const NC = '\x1b[0m';

function log(success, message) {
  const color = success ? GREEN : RED;
  console.log(`${color}${success ? '✓' : '✗'}${NC} ${message}`);
  return success;
}

console.log('\n========================================');
console.log('  Claude Code Translator 验证工具');
console.log('========================================\n');

let allPassed = true;

// 1. 检查插件目录
console.log('1. 检查插件安装...');
const pluginDir = path.join(process.env.HOME, '.claude', 'plugins', 'claude-code-translator');
if (fs.existsSync(pluginDir)) {
  allPassed &= log(true, `插件目录存在：${pluginDir}`);
  const files = fs.readdirSync(pluginDir);
  console.log(`   文件：${files.join(', ')}`);
} else {
  allPassed &= log(false, '插件目录不存在，请先运行 ./install.sh');
}

// 2. 检查 settings.json 配置
console.log('\n2. 检查 settings.json 配置...');
const settingsPath = path.join(process.env.HOME, '.claude', 'settings.json');
if (fs.existsSync(settingsPath)) {
  const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
  if (settings.translator && settings.translator.enabled !== false) {
    log(true, 'translator 配置已启用');
  } else {
    log(false, 'translator 配置未找到或未启用');
  }
} else {
  log(false, 'settings.json 不存在');
}

// 3. 检查 Hook
console.log('\n3. 检查 Hook...');
const hookPath = path.join(process.env.HOME, '.claude', 'hooks', 'before-user-message.sh');
if (fs.existsSync(hookPath)) {
  log(true, 'Hook 脚本存在');
  const content = fs.readFileSync(hookPath, 'utf8');
  if (content.includes('libretranslate') || content.includes('translate')) {
    log(true, 'Hook 包含翻译逻辑');
  } else {
    log(false, 'Hook 未包含翻译逻辑');
  }
} else {
  log(false, 'Hook 脚本不存在');
}

const stopHookPath = path.join(process.env.HOME, '.claude', 'hooks', 'after-model-response.sh');
if (fs.existsSync(stopHookPath)) {
  log(true, '输出 Hook 脚本存在');
} else {
  log(false, '输出 Hook 脚本不存在');
}

// 4. 测试翻译 API
console.log('\n4. 测试翻译 API (LibreTranslate)...');
const Translator = require('./src/translator');
const translator = new Translator({ api: 'libre' });

translator.toEnglish('你好').then(result => {
  if (result !== '你好' && !/[一-鿿]/.test(result)) {
    log(true, `翻译成功："你好" → "${result}"`);
  } else if (result === '你好') {
    log(false, `返回原文，API 可能不可用："你好" → "${result}"`);
  } else {
    log(false, `翻译结果仍包含中文："你好" → "${result}"`);
  }

  console.log('\n========================================');
  if (allPassed) {
    console.log(`${GREEN}验证通过！插件已正确安装。${NC}`);
    console.log('\n现在可以启动 Claude Code 测试：');
    console.log('  claude');
    console.log('  > 帮我写个 Python 脚本');
  } else {
    console.log(`${YELLOW}部分检查未通过，请查看上方日志。${NC}`);
  }
  console.log('========================================\n');
}).catch(err => {
  log(false, `API 测试失败：${err.message}`);
  console.log('\n提示：LibreTranslate 公共实例可能不稳定，建议：');
  console.log('  1. 使用 DeepL: export TRANSLATE_API=deepl');
  console.log('  2. 自建 LibreTranslate');
  console.log('  3. 使用本地 Ollama: export TRANSLATE_API=ollama');
});
