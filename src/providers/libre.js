/**
 * LibreTranslate Provider
 * 免费开源的翻译 API，无需 API Key
 * 公共实例：https://libretranslate.de
 * 自建：https://github.com/LibreTranslate/LibreTranslate
 */

const axios = require('axios');

const ENDPOINT = process.env.LIBRE_ENDPOINT || 'https://libretranslate.de/translate';
const USE_PROXY = process.env.TRANSLATE_USE_PROXY === 'true';
const GOOGLE_ENDPOINT = 'https://translate.googleapis.com/translate_a/single';

function requestOptions(timeout = 10000) {
  return {
    proxy: USE_PROXY ? undefined : false,
    timeout
  };
}

async function translate(text, source = 'auto', target = 'en') {
  if (process.env.TRANSLATE_DISABLE_GOOGLE_FALLBACK !== 'true') {
    try {
      const translated = await translateWithGoogleWeb(text, source, target);
      if (translated && translated !== text) {
        return translated;
      }
    } catch (_error) {
      // Fall back to LibreTranslate below.
    }
  }

  try {
    const response = await axios.post(ENDPOINT, {
      q: text,
      source: source,
      target: target,
      format: 'text'
    }, {
      headers: {
        'Content-Type': 'application/json'
      },
      ...requestOptions(),
      timeout: 10000
    });

    return response.data.translatedText || text;
  } catch (error) {
    if (error.response) {
      throw new Error(`LibreTranslate API error: ${error.response.status} ${error.response.data?.error || ''}`);
    }
    throw error;
  }
}

async function translateWithGoogleWeb(text, source = 'auto', target = 'en') {
  const response = await axios.get(GOOGLE_ENDPOINT, {
    params: {
      client: 'gtx',
      sl: source,
      tl: target,
      dt: 't',
      q: text
    },
    ...requestOptions(10000)
  });

  const translated = response.data?.[0]?.map((part) => part?.[0] || '').join('');
  return translated || text;
}

module.exports = {
  name: 'libre',
  translate,
  endpoint: ENDPOINT
};
