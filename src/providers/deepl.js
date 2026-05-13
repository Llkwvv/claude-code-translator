/**
 * DeepL Provider
 * 高质量翻译 API，免费额度 50 万字符/月
 * 获取 API Key: https://www.deepl.com/pro-api
 */

const axios = require('axios');
const { getProxyConfig } = require('./proxy');

const API_KEY = process.env.DEEPL_API_KEY;
const ENDPOINT = 'https://api-free.deepl.com/v2/translate';

if (!API_KEY) {
  console.warn('[DeepL] API key not set. Set DEEPL_API_KEY environment variable.');
}

async function translate(text, source = 'auto', target = 'en') {
  if (!API_KEY) {
    throw new Error('DeepL API key not configured');
  }

  try {
    // DeepL 的语言代码
    const sourceLang = source === 'auto' ? null : mapLanguageCode(source);
    const targetLang = mapLanguageCode(target);

    const params = {
      auth_key: API_KEY,
      text: text,
      target_lang: targetLang.toUpperCase()
    };

    if (sourceLang && sourceLang !== 'auto') {
      params.source_lang = sourceLang.toUpperCase();
    }

    const response = await axios.post(ENDPOINT, params, {
      timeout: 10000,
      proxy: getProxyConfig()
    });

    return response.data.translations?.[0]?.text || text;
  } catch (error) {
    if (error.response) {
      throw new Error(`DeepL API error: ${error.response.status}`);
    }
    throw error;
  }
}

function mapLanguageCode(code) {
  const map = {
    'zh': 'ZH',
    'en': 'EN',
    'ja': 'JA',
    'ko': 'KO',
    'fr': 'FR',
    'de': 'DE',
    'es': 'ES'
  };
  return map[code] || code;
}

module.exports = {
  name: 'deepl',
  translate,
  requiresApiKey: true
};
