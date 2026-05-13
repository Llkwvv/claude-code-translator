/**
 * Microsoft Azure Translate Provider (中国版)
 * 免费额度：200 万字符/月
 * 适用于国内网络环境，访问更稳定
 * 获取 API Key: https://portal.azure.cn/#view/Microsoft_CognitiveServices_Translation/_/QuickStartModuleHub
 */

const axios = require('axios');

const API_KEY = process.env.AZURE_CN_API_KEY;
const REGION = process.env.AZURE_REGION || 'eastasia';  // 中国区默认区域
const ENDPOINT = `https://${REGION}.api.cognitive.azure.cn/translator/v3.0/translate`;

if (!API_KEY) {
  console.warn('[Azure CN Translate] API key not set. Set AZURE_CN_API_KEY.');
}

async function translate(text, source = 'auto', target = 'en') {
  if (!API_KEY) {
    throw new Error('Azure CN Translate API key not configured');
  }

  try {
    const params = new URLSearchParams({
      'api-version': '3.0',
      to: target === 'zh' ? 'zh-Hans' : target
    });

    if (source !== 'auto' && source) {
      params.append('from', source);
    }

    const response = await axios.post(`${ENDPOINT}?${params.toString()}`, [{ text }], {
      headers: {
        'Ocp-Apim-Subscription-Key': API_KEY,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      timeout: 15000  // 增加超时时间
    });

    const result = response.data[0]?.translations?.[0]?.text || text;
    return result;
  } catch (error) {
    if (error.response) {
      const msg = error.response.data?.error?.message || error.response.statusText;
      throw new Error(`Azure CN Translate error: ${msg}`);
    }
    throw error;
  }
}

module.exports = {
  name: 'azure-cn',
  translate,
  requiresApiKey: true
};
