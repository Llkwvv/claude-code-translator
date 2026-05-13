/**
 * Proxy configuration for translation providers
 */

const PROXY_URL = process.env.HTTP_PROXY || process.env.ALL_PROXY || process.env.http_proxy || null;

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
