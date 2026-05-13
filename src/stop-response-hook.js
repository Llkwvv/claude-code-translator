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

function splitMarkdownSegments(text) {
  const parts = [];
  const fencePattern = /```[\s\S]*?```/g;
  let lastIndex = 0;
  let match;

  while ((match = fencePattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', value: text.slice(lastIndex, match.index) });
    }
    parts.push({ type: 'code', value: match[0] });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push({ type: 'text', value: text.slice(lastIndex) });
  }

  return parts;
}

function splitInlineCode(text) {
  const parts = [];
  const inlinePattern = /`[^`]*`/g;
  let lastIndex = 0;
  let match;

  while ((match = inlinePattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', value: text.slice(lastIndex, match.index) });
    }
    parts.push({ type: 'code', value: match[0] });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push({ type: 'text', value: text.slice(lastIndex) });
  }

  return parts;
}

async function translateAssistantMessage(translator, message) {
  const sections = splitMarkdownSegments(message);
  const translatedSections = [];

  for (const section of sections) {
    if (section.type === 'code') {
      translatedSections.push(section.value);
      continue;
    }

    const inlineSections = splitInlineCode(section.value);
    for (const inlineSection of inlineSections) {
      if (inlineSection.type === 'code') {
        translatedSections.push(inlineSection.value);
        continue;
      }

      const chunk = inlineSection.value;
      if (!chunk.trim()) {
        translatedSections.push(chunk);
        continue;
      }

      if (!translator.shouldTranslate(chunk, 'output')) {
        translatedSections.push(chunk);
        continue;
      }

      const translated = await translator.toChinese(chunk);
      translatedSections.push(translated || chunk);
    }
  }

  return translatedSections.join('');
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

  if (hookInput.stop_hook_active) {
    return;
  }

  const message = hookInput.last_assistant_message || '';
  if (!message.trim()) {
    return;
  }

  const translator = new Translator({
    api: process.env.TRANSLATE_API || 'libre',
    direction: process.env.TRANSLATE_DIRECTION || 'both',
    autoDetect: process.env.TRANSLATE_AUTO_DETECT !== 'false',
    showOriginal: false
  });

  try {
    const translated = await translateAssistantMessage(translator, message);
    if (!translated || translated === message) {
      return;
    }

    debug(`Output translated: ${message.slice(0, 80)} -> ${translated.slice(0, 80)}`);

    writeJson({
      continue: false,
      stopReason: translated,
      suppressOutput: true
    });
  } catch (error) {
    debug(`Failed to translate output: ${error.message}`);
  }
}

main().catch((error) => {
  debug(`Hook failed: ${error.message}`);
});
