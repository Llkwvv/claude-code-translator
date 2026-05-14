/**
 * Proxy configuration for translation providers
 * Default proxy: http://127.0.0.1:7897
 */

const DEFAULT_PROXY = 'http://127.0.0.1:7897';
const PROXY_URL = process.env.HTTP_PROXY || process.env.ALL_PROXY || process.env.http_proxy || DEFAULT_PROXY;

function getProxyConfig() {
  if (!PROXY_URL) {
    return false; // 不使用代理
  }

  // 解析代理 URL (支持 http://host:port 格式)
  const match = PROXY_URL.match(/http:\/\/([^:]+):(\d+)/);
  if (match) {
    return {
      host: match[1],
      port: parseInt(match[2], 10),
      protocol: 'http'
    };
  }

  return false;
}

module.exports = { getProxyConfig };
