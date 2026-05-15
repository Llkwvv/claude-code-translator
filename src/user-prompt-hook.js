#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const Translator = require('./translator');

const LOG_FILE = process.env.HOOK_LOG_FILE || '/home/lkw/.claude/translator-hook.log';

function debug(message) {
  if (process.env.DEBUG === 'translator') {
    console.error(`[Translator] ${message}`);
  }
}

function info(message) {
  const timestamp = new Date().toLocaleString('zh-CN');
  const logLine = `[${timestamp}] [Translator Hook] ${message}`;
  console.error(logLine);
  // 同时写入文件
  try {
    fs.appendFileSync(LOG_FILE, logLine + '\n');
  } catch (e) {
    // 忽略日志写入错误
  }
}

// 解析错误类型，返回友好的中文错误信息
function parseTranslationError(errorMsg) {
  if (!errorMsg) return '翻译服务不可用';
  if (errorMsg.includes('timeout')) {
    return '翻译请求超时，请检查网络连接';
  }
  if (errorMsg.includes('404')) {
    return '翻译服务未找到（Ollama 未运行或模型不存在）';
  }
  if (errorMsg.includes('401') || errorMsg.includes('403')) {
    return '翻译 API 认证失败，请检查 API Key';
  }
  if (errorMsg.includes('500') || errorMsg.includes('502') || errorMsg.includes('503')) {
    return '翻译服务器内部错误，请稍后重试';
  }
  if (errorMsg.includes('ECONNREFUSED')) {
    return '无法连接到翻译服务，请确保服务已启动';
  }
  if (errorMsg.includes('ENOTFOUND') || errorMsg.includes('EAI_AGAIN')) {
    return '无法解析翻译服务器地址，请检查网络';
  }
  return '翻译服务不可用，请检查网络或 API 配置';
}

// 判断文本是否包含中文
function containsChinese(text) {
  return /[一-鿿]/.test(text);
}

// 判断文本是否看起来像英文
function looksLikeEnglish(text) {
  const words = text.trim().split(/\s+/).filter(w => w.length > 0);
  if (words.length === 0) return false;

  const englishWords = words.filter(w => /^[a-zA-Z]+$/.test(w.replace(/[^a-zA-Z]/g, '')));
  return englishWords.length / words.length >= 0.5 && words.length >= 2;
}

function readStdin() {
  return new Promise((resolve, reject) => {
    let input = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk) => {
      input += chunk;
    });
    process.stdin.on('end', () => resolve(input));
    process.stdin.on('error', reject);
  });
}

function writeJson(value) {
  process.stdout.write(`${JSON.stringify(value)}\n`);
}

async function main() {
  const rawInput = await readStdin();

  if (!rawInput.trim()) {
    info('No input received, allowing through');
    return;
  }

  let hookInput;
  try {
    hookInput = JSON.parse(rawInput);
  } catch (error) {
    info(`Invalid JSON input: ${error.message}, allowing through`);
    // JSON 解析失败，直接放行
    return;
  }

  const prompt = hookInput.prompt || '';
  info(`Received prompt: "${prompt}"`);

  info(`API config: ${process.env.TRANSLATE_API || 'libre'}`);
  info(`Direction: ${process.env.TRANSLATE_DIRECTION || 'both'}`);
  info(`Auto-detect: ${process.env.TRANSLATE_AUTO_DETECT !== 'false'}`);

  const translator = new Translator({
    api: process.env.TRANSLATE_API || 'ollama,libre',
    direction: process.env.TRANSLATE_DIRECTION || 'both',
    autoDetect: process.env.TRANSLATE_AUTO_DETECT !== 'false',
    showOriginal: false
  });

  if (!translator.shouldTranslate(prompt, 'input')) {
    info('No translation needed for this input, allowing through');
    return;
  }

  info('Detected Chinese input, attempting translation...');

  // 如果已经是英文，直接放行
  if (looksLikeEnglish(prompt)) {
    info('Prompt looks like English, bypassing translation');
    return;
  }

  const translated = await translator.toEnglish(prompt);

  // 如果翻译失败或返回原文
  if (!translated || translated === prompt) {
    // 从 stderr 解析错误信息
    const errorMsg = containsChinese(prompt) ? '所有翻译 API 都不可用' : 'Translation failed';
    info(`Translation failed: ${errorMsg}`);
    const friendlyError = parseTranslationError(errorMsg);
    writeJson({
      decision: 'block',
      reason: `【翻译失败】${friendlyError}。原始中文输入未发送，请检查网络后重试或使用英文。`,
      suppressOutput: false
    });
    return;
  }

  info(`Translation SUCCESS: "${prompt}" -> "${translated}"`);
  info(`Blocking prompt and injecting translation`);

  writeJson({
    decision: 'block',
    reason: translated,
    suppressOutput: false
  });
}

main().catch((error) => {
  info(`Hook error: ${error.message}`);
  // Hook 出错时也放行，不让错误阻断用户输入
});
