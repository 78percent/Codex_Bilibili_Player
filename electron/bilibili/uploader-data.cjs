const { BiliError } = require('./client.cjs');

const PAGE_SIZE = 20;
function optionalId(value) {
  if (typeof value === 'number' && !Number.isSafeInteger(value)) return '';
  const result = String(value ?? '');
  return /^[1-9]\d{0,23}$/.test(result) ? result : '';
}
function id(value, label = '用户') {
  const result = optionalId(value);
  if (!result) throw new BiliError(`${label}编号不可用`, 'INPUT');
  return result;
}
function pageNumber(value = 1) {
  const result = Number(value);
  if (!Number.isSafeInteger(result) || result < 1 || result > 100000) throw new BiliError('页码不可用', 'INPUT');
  return result;
}
function count(value) {
  if (value === null || value === undefined || value === '') return null;
  const result = Number(value);
  return Number.isFinite(result) && result >= 0 ? result : null;
}
function pagination(totalValue, page, sizeValue = PAGE_SIZE, limit = Infinity) {
  const total = count(totalValue), size = Number(sizeValue);
  if (total === null || !Number.isSafeInteger(total) || !Number.isSafeInteger(size) || size < 1) throw new BiliError('B站未返回有效的分页信息');
  return { page, pages: Math.max(1, Math.ceil(Math.min(total, limit) / size)), total };
}
function imageUrl(value) {
  if (typeof value !== 'string' || !value) return '';
  try {
    const url = new URL(value.replace(/^\/\//, 'https://').replace(/^http:/, 'https:'));
    if (url.protocol !== 'https:' || url.port || url.username || url.password) return '';
    // Keep the existing renderer image policy; other CDN hosts stay unavailable.
    return url.hostname.endsWith('.hdslb.com') || url.hostname.endsWith('.bilibili.com') ? url.href : '';
  } catch { return ''; }
}
function duration(value) {
  if (typeof value === 'number') return Math.max(0, value);
  return String(value || '0').split(':').reduce((total, part) => total * 60 + (Number(part) || 0), 0);
}
function displayCount(value) {
  if (typeof value === 'string') {
    const match = value.replace(/,/g, '').match(/^(\d+(?:\.\d+)?)\s*([万亿])?$/);
    if (match) return Number(match[1]) * (match[2] === '万' ? 10000 : match[2] === '亿' ? 100000000 : 1);
  }
  return count(value) ?? 0;
}
function summary(row = {}) {
  return { mid: optionalId(row.mid), name: String(row.name ?? row.uname ?? ''), avatar: imageUrl(row.face ?? row.avatar), sign: String(row.sign || '') };
}
function video(row = {}) {
  if (!/^BV[0-9A-Za-z]{10}$/.test(row.bvid || '')) return null;
  return {
    bvid: row.bvid, title: String(row.title || ''), cover: imageUrl(row.pic ?? row.cover),
    author: String(row.owner?.name ?? row.author ?? ''), authorId: optionalId(row.owner?.mid ?? row.mid),
    duration: duration(row.duration ?? row.length ?? row.duration_text),
    views: displayCount(row.stat?.view ?? row.play ?? row.stat?.play),
    publishedAt: count(row.pubdate ?? row.created) ?? 0,
  };
}
function assertAccount(account, uid) {
  if (String(account.snapshot().profile?.uid || '') !== uid) throw new BiliError('账号已切换，请重新打开页面', 'CANCELLED');
}

module.exports = { PAGE_SIZE, optionalId, id, pageNumber, count, pagination, imageUrl, summary, video, assertAccount };
