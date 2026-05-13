/**
 * Bing Translate Provider (微软必应翻译)
 * 免费额度：200 万字符/月
 * 获取 API Key: https://portal.azure.com/#create/Microsoft.CognitiveServicesBingTranslation
 */

const axios = require('axios');

const API_KEY = process.env.BING_API_KEY;
const ENDPOINT = 'https://api.cognitive.microsofttranslator.com/translate';

if (!API_KEY) {
  console.warn('[Bing Translate] API key not set. Set BING_API_KEY environment variable.');
}

async function translate(text, source = 'auto', target = 'en') {
  if (!API_KEY) {
    throw new Error('Bing Translate API key not configured');
  }

  try {
    const params = new URLSearchParams({
      'api-version': '3.0',
      to: target === 'zh' ? 'zh-Hans' : target,
      'includeSentenceLength': 'false'
    });

    if (source !== 'auto' && source) {
      params.append('from', source);
    }

    const response = await axios.post(`${ENDPOINT}?${params.toString()}`, [{ text }], {
      headers: {
        'Ocp-Apim-Subscription-Key': API_KEY,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });

    const result = response.data[0]?.translations?.[0]?.text || text;
    return result;
  } catch (error) {
    if (error.response) {
      throw new Error(`Bing Translate error: ${error.response.status}`);
    }
    throw error;
  }
}

module.exports = {
  name: 'bing',
  translate,
  requiresApiKey: true
};
