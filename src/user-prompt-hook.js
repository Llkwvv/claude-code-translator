#!/usr/bin/env node

const Translator = require('./translator');

function debug(message) {
  if (process.env.DEBUG === 'translator') {
    console.error(`[Translator] ${message}`);
  }
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
    return;
  }

  const translated = await translator.toEnglish(prompt);
  if (!translated || translated === prompt) {
    writeJson({
      decision: 'block',
      reason: 'Translation failed, so the original Chinese prompt was not sent to the model. Please retry after the translation service is available, or type the prompt in English.',
      suppressOutput: false
    });
    return;
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
});
