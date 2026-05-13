/**
 * Baidu Translate Provider (百度翻译)
 * 免费额度：100 万字符/月
 * 获取 API Key: https://api.fanyi.baidu.com
 */

const axios = require('axios');
const crypto = require('crypto');

const APP_ID = process.env.BAIDU_APP_ID;
const SECRET_KEY = process.env.BAIDU_SECRET_KEY;
const ENDPOINT = 'https://fanyi-api.baidu.com/api/trans/vip/translate';

if (!APP_ID || !SECRET_KEY) {
  console.warn('[Baidu Translate] API keys not set. Set BAIDU_APP_ID and BAIDU_SECRET_KEY.');
}

async function translate(text, source = 'auto', target = 'en') {
  if (!APP_ID || !SECRET_KEY) {
    throw new Error('Baidu Translate API keys not configured');
  }

  try {
    const fromLang = getLanguageCode(source);
    const toLang = getLanguageCode(target);

    const salt = Date.now();
    const signInput = `${APP_ID}${text}${salt}${SECRET_KEY}`;
    const signature = crypto.createHash('md5').update(signInput).digest('hex');

    const params = new URLSearchParams({
      q: text,
      appid: APP_ID,
      salt,
      from: fromLang,
      to: toLang,
      sign: signature
    });

    const response = await axios.get(`${ENDPOINT}?${params.toString()}`, {
      timeout: 10000
    });

    const result = response.data.trans_result?.map(t => t.dst)?.join('') || text;
    return result;
  } catch (error) {
    if (error.response) {
      throw new Error(`Baidu Translate error: ${error.response.data?.errmsg || error.response.status}`);
    }
    throw error;
  }
}

function getLanguageCode(lang) {
  const map = {
    'zh': 'zh',
    'zh-CN': 'zh',
    'en': 'en',
    'auto': 'auto'
  };
  return map[lang] || lang;
}

module.exports = {
  name: 'baidu',
  translate,
  requiresApiKey: true
};
