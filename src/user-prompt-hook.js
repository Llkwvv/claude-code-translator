#!/usr/bin/env node

const Translator = require('./translator');

function debug(message) {
  if (process.env.DEBUG === 'translator') {
    console.error(`[Translator] ${message}`);
  }
}

// 判断文本是否包含中文
function containsChinese(text) {
  return /[一 - 鿿]/.test(text);
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
    return;
  }

  let hookInput;
  try {
    hookInput = JSON.parse(rawInput);
  } catch (error) {
    debug(`Invalid hook input JSON: ${error.message}`);
    // JSON 解析失败，直接放行
    return;
  }

  const prompt = hookInput.prompt || '';
  const translator = new Translator({
    api: process.env.TRANSLATE_API || 'libre',
    direction: process.env.TRANSLATE_DIRECTION || 'both',
    autoDetect: process.env.TRANSLATE_AUTO_DETECT !== 'false',
    showOriginal: false
  });

  if (!translator.shouldTranslate(prompt, 'input')) {
    // 不需要翻译，直接放行
    return;
  }

  // 如果已经是英文，直接放行
  if (looksLikeEnglish(prompt)) {
    debug('Prompt looks like English, bypassing translation');
    return;
  }

  const translated = await translator.toEnglish(prompt);

  // 如果翻译失败或返回原文，且原文不是明显的外语
  if (!translated || translated === prompt) {
    if (containsChinese(prompt)) {
      // 如果是中文但翻译失败，仍然允许发送（Claude 可以处理中文）
      debug(`Translation failed but allowing Chinese prompt through`);
      return;
    } else {
      // 无法确定语言，也不应该完全阻止
      debug(`Translation returned original text, allowing through`);
      return;
    }
  }

  debug(`Input translated: ${prompt} -> ${translated}`);

  writeJson({
    decision: 'block',
    reason: translated,
    suppressOutput: false
  });
}

main().catch((error) => {
  debug(`Hook failed: ${error.message}`);
  // Hook 出错时也放行，不让错误阻断用户输入
});
