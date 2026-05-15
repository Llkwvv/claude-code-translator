/**
 * Translator Core
 * 统一翻译接口，支持多种翻译 API
 */

const providerLoaders = {
  libre: () => require('./providers/libre'),
  'google-web': () => require('./providers/google-web'),
  deepl: () => require('./providers/deepl'),
  google: () => require('./providers/google'),
  baidu: () => require('./providers/baidu'),
  bing: () => require('./providers/bing'),
  'azure-cn': () => require('./providers/azure-cn'),
  ollama: () => require('./providers/ollama')
};

class Translator {
  constructor(config = {}) {
    this.direction = config.direction || process.env.TRANSLATE_DIRECTION || 'both';
    this.autoDetect = config.autoDetect !== false;
    this.showOriginal = config.showOriginal || false;

    // 支持多 API 优先级配置 (逗号分隔或数组)
    let apiList = config.api || process.env.TRANSLATE_API || 'ollama,libre';
    if (typeof apiList === 'string' && apiList.includes(',')) {
      apiList = apiList.split(',').map(a => a.trim()).filter(a => a);
    } else if (!Array.isArray(apiList)) {
      apiList = [apiList];
    }

    this.apiStack = [];
    for (const api of apiList) {
      const loadProvider = providerLoaders[api];
      if (loadProvider) {
        this.apiStack.push({
          name: api,
          provider: loadProvider()
        });
      }
    }

    // 至少有一个可用的提供者
    if (this.apiStack.length === 0) {
      console.warn(`[Translator] No valid APIs configured, falling back to libre`);
      this.apiStack = [{ name: 'libre', provider: providerLoaders.libre() }];
    }

    this.currentApi = this.apiStack[0]?.name || 'libre';
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
   * 通用翻译方法 - 按优先级尝试多个 API
   * 返回: { result: string, error: string | null }
   */
  async translate(text, source = 'auto', target = 'en') {
    if (!text || text.trim() === '') {
      return { result: text, error: null };
    }

    const errors = [];

    for (const { name, provider } of this.apiStack) {
      try {
        const result = await provider.translate(text, source, target);
        if (result && result !== text) {
          this.currentApi = name; // 记录成功使用的 API
          return { result, error: null };
        }
      } catch (error) {
        errors.push(`${name}: ${error.message}`);
        // 继续尝试下一个 API
      }
    }

    // 所有 API 都失败，返回原文和错误信息
    const errorMsg = errors.length > 0 ? errors.join('; ') : 'Unknown error';
    return { result: text, error: errorMsg };
  }

  /**
   * 中文 → 英文 (用于用户输入)
   * 返回: { result: string, error: string | null }
   */
  async toEnglish(text) {
    if (this.direction === 'output') {
      return text; // 只处理输出翻译
    }

    if (!this.shouldTranslate(text, 'input')) {
      return text;
    }

    const { result, error } = await this.translate(text, 'auto', 'en');
    if (error) {
      console.error(`[Translator] All APIs failed: ${error}`);
    }
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

    const { result, error } = await this.translate(text, 'en', 'zh');
    if (error) {
      console.error(`[Translator] All APIs failed: ${error}`);
    }
    if (this.showOriginal && result !== text) {
      return `${result}\n\n---\n[Original]: ${text}`;
    }
    return result;
  }
}

module.exports = Translator;
