/**
 * Ollama Provider
 * 本地大模型翻译，保护隐私
 * 需要安装 Ollama: https://ollama.ai
 * 推荐模型：llama3, qwen, chatglm
 */

const axios = require('axios');

const ENDPOINT = process.env.OLLAMA_ENDPOINT || 'http://localhost:11434/api/generate';
const MODEL = process.env.OLLAMA_MODEL || 'llama3';

async function translate(text, source = 'auto', target = 'en') {
  try {
    const targetLang = target === 'zh' ? '中文' : target === 'en' ? '英文' : target;

    const prompt = `Translate the following text to ${targetLang}. Only output the translation, nothing else:

${text}`;

    const response = await axios.post(ENDPOINT, {
      model: MODEL,
      prompt: prompt,
      stream: false,
      options: {
        temperature: 0.3,
        top_p: 0.9
      }
    }, {
      timeout: 30000
    });

    return response.data.response?.trim() || text;
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.error('[Ollama] Cannot connect. Make sure Ollama is running.');
    }
    if (error.response) {
      throw new Error(`Ollama API error: ${error.response.status}`);
    }
    throw error;
  }
}

module.exports = {
  name: 'ollama',
  translate,
  isLocal: true
};
