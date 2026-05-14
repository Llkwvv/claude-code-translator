/**
 * Ollama Provider
 * 本地大模型翻译，保护隐私
 * 需要安装 Ollama: https://ollama.ai
 * 推荐模型：llamafamily/llama3-chinese-8b-instruct (中文优秀)
 */

const axios = require('axios');

const ENDPOINT = process.env.OLLAMA_ENDPOINT || 'http://localhost:11434/api/generate';
const MODEL = process.env.OLLAMA_MODEL || 'llamafamily/llama3-chinese-8b-instruct';

async function translate(text, source = 'auto', target = 'en') {
  if (!text || text.trim() === '') {
    return text;
  }

  try {
    const targetLang = target === 'zh' ? 'Chinese' : 'English';

    // 优化 prompt，让模型只输出翻译结果
    const prompt = `Translate the following ${source === 'zh' ? 'Chinese' : 'English'} text to ${targetLang}. Output ONLY the translation, no explanations or quotes:

${text}`;

    const response = await axios.post(ENDPOINT, {
      model: MODEL,
      prompt: prompt,
      stream: false,
      options: {
        temperature: 0.3,
        top_p: 0.9,
        num_predict: 512  // 限制输出长度
      }
    }, {
      timeout: 60000,  // 增加超时时间
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const result = response.data.response?.trim() || text;
    // 清理可能的前后引号
    return result.replace(/^["']|["']$/g, '');
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      throw new Error('Ollama not running. Start with: ollama serve');
    }
    if (error.code === 'ECONNRESET') {
      throw new Error('Ollama request timed out');
    }
    throw error;
  }
}

module.exports = {
  name: 'ollama',
  translate,
  isLocal: true
};
