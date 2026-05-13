/**
 * Google Translate Provider
 * 官方 Cloud Translation API
 * 定价：$20/百万字符
 * 获取 API Key: https://cloud.google.com/translate
 */

const axios = require('axios');
const { getProxyConfig } = require('./proxy');

const API_KEY = process.env.GOOGLE_API_KEY;
const ENDPOINT = 'https://translation.googleapis.com/language/translate/v2';

if (!API_KEY) {
  console.warn('[Google Translate] API key not set. Set GOOGLE_API_KEY environment variable.');
}

async function translate(text, source = 'auto', target = 'en') {
  if (!API_KEY) {
    throw new Error('Google Translate API key not configured');
  }

  try {
    const params = new URLSearchParams({
      q: text,
      target: target,
      key: API_KEY,
      format: 'text'
    });

    if (source !== 'auto') {
      params.append('source', source);
    }

    const response = await axios.get(`${ENDPOINT}?${params.toString()}`, {
      timeout: 10000,
      proxy: getProxyConfig()
    });

    return response.data.data?.translations?.[0]?.translatedText || text;
  } catch (error) {
    if (error.response) {
      const errorData = error.response.data;
      throw new Error(`Google Translate API error: ${errorData.error?.message || error.response.status}`);
    }
    throw error;
  }
}

module.exports = {
  name: 'google',
  translate,
  requiresApiKey: true
};
