#!/usr/bin/env node

/**
 * 翻译 API 测试脚本
 * 测试各个翻译 API 的连通性
 */

constTranslator = require('./src/translator');

async function testAPI(apiName, text = '你好，世界') {
  console.log(`\n${'='.repeat(50)}`);
  console.log(`测试 ${apiName} API...`);
  console.log(`${'='.repeat(50)}`);

  const translator = new Translator({ api: apiName });

  // 测试中文 → 英文
  console.log(`\n测试：中文 → 英文`);
  console.log(`原文：${text}`);

  try {
    const result = await translator.toEnglish(text);
    console.log(`译文：${result}`);

    if (result !== text && !/[一-鿿]/.test(result)) {
      console.log('✓ 翻译成功');
    } else if (result === text) {
      console.log('⚠ 返回原文，可能 API 未正确配置');
    }
  } catch (error) {
    console.log(`✗ 失败：${error.message}`);
  }

  // 测试英文 → 中文
  console.log(`\n测试：英文 → 中文`);
  const enText = 'Hello, world!';
  console.log(`原文：${enText}`);

  try {
    const result = await translator.toChinese(enText);
    console.log(`译文：${result}`);

    if (result !== enText && /[一-鿿]/.test(result)) {
      console.log('✓ 翻译成功');
    } else if (result === enText) {
      console.log('⚠ 返回原文，可能 API 未正确配置');
    }
  } catch (error) {
    console.log(`✗ 失败：${error.message}`);
  }
}

async function main() {
  console.log('Claude Code Translator - API 连通性测试');
  console.log('========================================\n');

  // 测试 LibreTranslate (默认，免费)
  await testAPI('libre');

  // 测试其他 API (如果配置了)
  if (process.env.DEEPL_API_KEY) {
    await testAPI('deepl');
  } else {
    console.log('\n跳过 DeepL 测试：未设置 DEEPL_API_KEY');
  }

  if (process.env.GOOGLE_API_KEY) {
    await testAPI('google');
  } else {
    console.log('\n跳过 Google 测试：未设置 GOOGLE_API_KEY');
  }

  if (process.env.BAIDU_APP_ID && process.env.BAIDU_SECRET_KEY) {
    await testAPI('baidu');
  } else {
    console.log('\n跳过百度测试：未设置百度 API 凭证');
  }

  console.log('\n========================================');
  console.log('测试完成!');
  console.log('========================================\n');
}

main().catch(console.error);
