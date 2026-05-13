/**
 * Baidu Translate Provider
 * 百度翻译 API
 * 免费额度：100 万字符/月 (标准版 ¥49/月)
 * 获取密钥：https://fanyi-api.baidu.com/
 */

const axios = require('axios');
const crypto = require('crypto');

const APP_ID = process.env.BAIDU_APP_ID;
const SECRET_KEY = process.env.BAIDU_SECRET_KEY;
const ENDPOINT = 'https://fanyi-api.baidu.com/api/trans/vip/translate';

if (!APP_ID || !SECRET_KEY) {
  console.warn('[Baidu Translate] API credentials not set. Set BAIDU_APP_ID and BAIDU_SECRET_KEY.');
}

async function translate(text, source = 'auto', target = 'en') {
  if (!APP_ID || !SECRET_KEY) {
    throw new Error('Baidu Translate credentials not configured');
  }

  try {
    // 百度语言代码映射
    const sourceLang = mapSourceCode(source);
    const targetLang = mapTargetCode(target);

    // 生成签名
    const salt = Date.now().toString();
    const signStr = APP_ID + text + salt + SECRET_KEY;
    const sign = crypto.createHash('md5').update(signStr).digest('hex');

    const response = await axios.get(ENDPOINT, {
      params: {
        q: text,
        from: sourceLang,
        to: targetLang,
        appid: APP_ID,
        salt: salt,
        sign: sign
      },
      timeout: 10000
    });

    if (response.data.error_code) {
      throw new Error(`Baidu API error: ${response.data.error_msg}`);
    }

    return response.data.trans_result?.[0]?.dst || text;
  } catch (error) {
    if (error.response) {
      throw new Error(`Baidu Translate API error: ${error.response.data?.error_msg || error.response.status}`);
    }
    throw error;
  }
}

function mapSourceCode(code) {
  const map = {
    'auto': 'auto',
    'zh': 'zh',
    'en': 'en',
    'jp': 'jp',
    'kor': 'kor',
    'fra': 'fra',
    'spa': 'spa',
    'de': 'de'
  };
  return map[code] || 'auto';
}

function mapTargetCode(code) {
  const map = {
    'en': 'en',
    'zh': 'zh',
    'jp': 'jp',
    'kor': 'kor',
    'fra': 'fra',
    'spa': 'spa',
    'de': 'de'
  };
  return map[code] || 'en';
}

module.exports = {
  name: 'baidu',
  translate,
  requiresApiKey: true
};
