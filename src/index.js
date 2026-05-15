/**
 * Claude Code Translator Plugin
 *
 * 双向翻译插件：
 * - 用户中文输入 → 自动翻译成英文发送给 Claude
 * - Claude 英文响应 → 自动翻译成中文显示给用户
 *
 * 使用方式：
 * 1. 作为 Claude Code Plugin 加载
 * 2. 或通过 Hook 系统拦截输入输出
 */

const Translator = require('./translator');

// 从配置或环境变量初始化
const translator = new Translator({
  api: process.env.TRANSLATE_API || 'ollama,libre',
  direction: process.env.TRANSLATE_DIRECTION || 'both',
  autoDetect: process.env.TRANSLATE_AUTO_DETECT !== 'false',
  showOriginal: process.env.TRANSLATE_SHOW_ORIGINAL === 'true'
});

/**
 * Claude Code Plugin 接口
 *
 * Claude Code 插件系统提供以下钩子：
 * - beforeUserMessage: 用户消息发送给 Claude 之前
 * - afterModelResponse: Claude 响应返回给用户之后
 */

module.exports = {
  name: 'claude-code-translator',
  version: '1.0.0',
  description: '双向翻译：中文 ↔ 英文',

  /**
   * 插件初始化
   */
  async init(config) {
    console.log(`[Translator] Initialized with API: ${translator.api}, direction: ${translator.direction}`);

    // 验证 API 可用性 (可选)
    if (translator.provider.requiresApiKey && !process.env[`${translator.api.toUpperCase()}_API_KEY`]) {
      console.warn(`[Translator] Warning: ${translator.api} requires API key but not configured`);
    }

    return this;
  },

  /**
   * 拦截用户输入
   * 将中文翻译成英文后发送给 Claude
   */
  async beforeUserMessage({ message, context }) {
    const originalMessage = message;

    // 检测是否需要翻译
    if (!translator.shouldTranslate(message, 'input')) {
      return { message };
    }

    try {
      const translated = await translator.toEnglish(message);

      if (translated !== originalMessage) {
        // 在开发模式下输出日志
        if (process.env.DEBUG === 'translator') {
          console.log(`[Translator] 输入翻译:`);
          console.log(`  原文：${originalMessage}`);
          console.log(`  译文：${translated}`);
        }

        // 如果配置了显示原文，添加到消息末尾
        if (translator.showOriginal) {
          return {
            message: `${translated}\n\n[原文]: ${originalMessage}`,
            metadata: {
              translator: {
                original: originalMessage,
                translated: translated
              }
            }
          };
        }

        return {
          message: translated,
          metadata: {
            translator: {
              original: originalMessage,
              translated: translated
            }
          }
        };
      }

      return { message };
    } catch (error) {
      console.error('[Translator] Failed to translate input:', error.message);
      return { message: originalMessage };
    }
  },

  /**
   * 拦截 Claude 响应
   * 将英文翻译成中文后显示给用户
   */
  async afterModelResponse({ response, context }) {
    const originalResponse = response;

    // 检测是否需要翻译
    if (!translator.shouldTranslate(response, 'output')) {
      return { response };
    }

    try {
      const translated = await translator.toChinese(response);

      if (translated !== originalResponse) {
        if (process.env.DEBUG === 'translator') {
          console.log(`[Translator] 输出翻译:`);
          console.log(`  Original: ${originalResponse.substring(0, 100)}...`);
          console.log(`  Translated: ${translated.substring(0, 100)}...`);
        }

        if (translator.showOriginal) {
          return {
            response: `${translated}\n\n---\n[Original]: ${originalResponse}`,
            metadata: {
              translator: {
                original: originalResponse,
                translated: translated
              }
            }
          };
        }

        return {
          response: translated,
          metadata: {
            translator: {
              original: originalResponse,
              translated: translated
            }
          }
        };
      }

      return { response };
    } catch (error) {
      console.error('[Translator] Failed to translate response:', error.message);
      return { response: originalResponse };
    }
  },

  /**
   * 获取翻译器实例 (用于测试)
   */
  getTranslator() {
    return translator;
  }
};
