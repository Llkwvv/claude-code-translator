/**
 * Translator Core
 * 统一翻译接口，支持多种翻译 API
 */

const providerLoaders = {
  libre: () => require('./providers/libre'),
  deepl: () => require('./providers/deepl'),
  google: () => require('./providers/google'),
  baidu: () => require('./providers/baidu'),
  ollama: () => require('./providers/ollama')
};

class Translator {
  constructor(config = {}) {
    this.api = config.api || process.env.TRANSLATE_API || 'libre';
    this.direction = config.direction || 'both'; // 'input', 'output', 'both'
    this.autoDetect = config.autoDetect !== false;
    this.showOriginal = config.showOriginal || false;

    const loadProvider = providerLoaders[this.api];
    if (!loadProvider) {
      console.warn(`[Translator] Unknown API "${this.api}", falling back to libre`);
      this.api = 'libre';
      this.provider = providerLoaders.libre();
    } else {
      this.provider = loadProvider();
    }
  }

  /**
   * 检测文本是否包含中文字符
   */
  hasChinese(text) {
    return /[一-鿿]/.test(text);
  }

  /**
   * 检测文本是否主要是英文
   */
  isEnglish(text) {
    // 简单检测：主要是 ASCII 字符且包含字母
    const asciiRatio = (text.match(/[a-zA-Z]/g) || []).length / text.length;
    return asciiRatio > 0.5;
  }

  /**
   * 判断是否需要翻译
   */
  shouldTranslate(text, direction) {
    if (!this.autoDetect) return true;

    if (direction === 'input') {
      // 输入：只翻译中文
      return this.hasChinese(text);
    } else if (direction === 'output') {
      // 输出：只翻译英文
      return this.isEnglish(text) && !this.hasChinese(text);
    }
    return true;
  }

  /**
   * 通用翻译方法
   */
  async translate(text, source = 'auto', target = 'en') {
    if (!text || text.trim() === '') {
      return text;
    }

    try {
      const result = await this.provider.translate(text, source, target);
      return result;
    } catch (error) {
      console.error(`[Translator] ${this.api} error:`, error.message);
      // 翻译失败时返回原文
      return text;
    }
  }

  /**
   * 中文 → 英文 (用于用户输入)
   */
  async toEnglish(text) {
    if (this.direction === 'output') {
      return text; // 只处理输出翻译
    }

    if (!this.shouldTranslate(text, 'input')) {
      return text;
    }

    const result = await this.translate(text, 'auto', 'en');
    if (this.showOriginal && result !== text) {
      return `${result}\n\n---\n[原文]: ${text}`;
    }
    return result;
  }

  /**
   * 英文 → 中文 (用于 Claude 响应)
   */
  async toChinese(text) {
    if (this.direction === 'input') {
      return text; // 只处理输入翻译
    }

    if (!this.shouldTranslate(text, 'output')) {
      return text;
    }

    const result = await this.translate(text, 'en', 'zh');
    if (this.showOriginal && result !== text) {
      return `${result}\n\n---\n[Original]: ${text}`;
    }
    return result;
  }
}

module.exports = Translator;
