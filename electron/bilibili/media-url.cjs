const { BiliError } = require('./client.cjs');

function mediaURL(value) {
  const u = new URL(value);
  const cdn = u.hostname.endsWith('.bilivideo.com') || u.hostname.endsWith('.bilivideo.cn') || u.hostname.endsWith('.akamaized.net');
  const portAllowed = !u.port || (u.hostname.endsWith('.mcdn.bilivideo.cn') && ['4483', '8082'].includes(u.port));
  if (u.protocol !== 'https:' || !portAllowed || u.username || u.password || !cdn) throw new BiliError('此视频媒体地址暂不支持');
  return u.href;
}

function selectMediaURL(stream) {
  const candidates = [stream.baseUrl, stream.base_url,
    ...(Array.isArray(stream.backupUrl) ? stream.backupUrl : []),
    ...(Array.isArray(stream.backup_url) ? stream.backup_url : [])].filter(value => typeof value === 'string' && value);
  const supported = [];
  for (const value of new Set(candidates)) {
    try { supported.push(mediaURL(value)); } catch { /* Try another URL for this stream. */ }
  }
  const regular = supported.find(value => !new URL(value).hostname.endsWith('.mcdn.bilivideo.cn'));
  if (regular || supported.length) return regular || supported[0];
  // Never log signed media paths or credentials.
  throw new BiliError('此视频媒体地址暂不支持');
}

module.exports = { mediaURL, selectMediaURL };
