/**
 * Google Translate Web Provider
 * 非官方 Web API，无需 API Key
 * 使用 Google Translate 网页接口
 */

const axios = require('axios');
const { getProxyConfig } = require('./proxy');

const ENDPOINT = 'https://translate.googleapis.com/translate_a/single';

async function translate(text, source = 'auto', target = 'en') {
  try {
    const params = new URLSearchParams({
      client: 'gtx',
      sl: source,
      tl: target,
      dt: 't',
      q: text
    });

    const response = await axios.get(`${ENDPOINT}?${params.toString()}`, {
      timeout: 10000,
      proxy: getProxyConfig(),
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    // 解析 Google 返回的嵌套数组结构
    const translated = response.data?.[0]
      ?.filter(part => Array.isArray(part) && part[0])
      .map(part => part[0])
      .join('');

    return translated || text;
  } catch (error) {
    if (error.response) {
      throw new Error(`Google Web API error: ${error.response.status}`);
    }
    throw error;
  }
}

module.exports = {
  name: 'google-web',
  translate,
  requiresApiKey: false,
  endpoint: ENDPOINT
};
