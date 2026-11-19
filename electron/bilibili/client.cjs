const { createHash } = require('node:crypto');
const MIXIN = [46,47,18,2,53,8,23,32,15,50,10,31,58,3,45,35,27,43,5,49,33,9,42,19,29,28,14,39,12,38,41,13,37,48,7,16,24,55,40,61,26,17,0,1,60,51,30,4,22,25,54,21,56,59,6,63,57,62,11,36,20,34,44,52];
class BiliError extends Error {
  constructor(message, code = 'NETWORK') { super(message); this.code = code; }
}
function createClient(session) {
  let wbi = '';
  const pending = new Set();
  let resetting = false;
  let generation = 0;
  function assertCurrent(current) {
    if (resetting || current !== generation) throw new BiliError('登录操作已取消', 'CANCELLED');
  }
  async function request(host, pathname, params = {}, signal, payloadKey = 'data', acceptedCodes = [], form, jsonBody) {
    if (resetting) throw new BiliError('登录操作已取消', 'CANCELLED');
    const url = new URL(pathname, `https://${host}`);
    for (const [key, value] of Object.entries(params)) url.searchParams.set(key, String(value));
    const controller = new AbortController();
    let finish;
    const entry = { controller, done: new Promise(resolve => { finish = resolve; }) };
    pending.add(entry);
    try {
      let response;
      try {
        const json = jsonBody !== undefined;
        response = await session.fetch(url.href, { credentials: 'include', method: json || form ? 'POST' : 'GET',
          body: json ? JSON.stringify(jsonBody) : form ? new URLSearchParams(form).toString() : undefined,
          headers: { Referer: 'https://www.bilibili.com/', ...(json ? { 'Content-Type': 'application/json' } : form ? { 'Content-Type': 'application/x-www-form-urlencoded' } : {}) },
          signal: AbortSignal.any([controller.signal, AbortSignal.timeout(20000), ...(signal ? [signal] : [])]) });
      } catch {
        if (controller.signal.aborted || signal?.aborted) throw new BiliError('登录操作已取消', 'CANCELLED');
        throw new BiliError('无法连接 B 站，请检查网络后重试');
      }
      if (!response.ok) { await response.body?.cancel(); throw new BiliError(`B 站请求失败（HTTP ${response.status}）`); }
      let result;
      try { result = await response.json(); } catch { throw new BiliError('B 站返回了无法识别的响应'); }
      if (result.code !== 0 && !acceptedCodes.includes(result.code)) {
        if (result.code === -101) throw new BiliError('登录已过期，请重新登录', 'EXPIRED');
        if ([-352,-412].includes(result.code) || result.data?.v_voucher) throw new BiliError('B 站要求验证，请打开官方登录窗口完成验证', 'VERIFICATION');
        throw new BiliError(`B 站暂时无法完成此请求（${result.code}）`, String(result.code));
      }
      if (result.data?.v_voucher) throw new BiliError('B 站要求验证，请打开官方登录窗口完成验证', 'VERIFICATION');
      return result[payloadKey];
    } finally { pending.delete(entry); finish(); }
  }
  async function nav(requireLogin = true) {
    const current = generation;
    const data = await request('api.bilibili.com', '/x/web-interface/nav', {}, undefined, 'data', requireLogin ? [] : [-101]);
    assertCurrent(current);
    if (requireLogin && !data.isLogin) throw new BiliError('登录已过期，请重新登录', 'EXPIRED');
    const keys = [data.wbi_img?.img_url, data.wbi_img?.sub_url].map(u => u ? new URL(u).pathname.split('/').pop().split('.')[0] : '').join('');
    wbi = keys.length === 64 ? MIXIN.map(i => keys[i]).join('').slice(0,32) : '';
    return data;
  }
  async function signed(pathname, params, allowGuest = false) {
    const current = generation;
    if (!wbi) await nav(!allowGuest);
    assertCurrent(current);
    if (!wbi) throw new BiliError('暂时无法获取 B 站接口签名，请重试');
    const values = { ...params, wts: Math.floor(Date.now()/1000) };
    const query = Object.keys(values).sort().map(k => `${encodeURIComponent(k)}=${encodeURIComponent(String(values[k]).replace(/[!'()*]/g,''))}`).join('&');
    const signedParams = Object.fromEntries(new URLSearchParams(query));
    signedParams.w_rid = createHash('md5').update(query + wbi).digest('hex');
    return request('api.bilibili.com', pathname, signedParams);
  }
  async function post(pathname, values, options = {}) {
    const current = generation;
    const [cookies, users] = await Promise.all([
      session.cookies.get({ url: 'https://www.bilibili.com/', name: 'bili_jct' }),
      options.expectedUid ? session.cookies.get({ url: 'https://www.bilibili.com/', name: 'DedeUserID' }) : Promise.resolve([]),
    ]);
    assertCurrent(current);
    if (options.expectedUid && users[0]?.value !== String(options.expectedUid)) throw new BiliError('账号已切换，请重新操作', 'CANCELLED');
    if (!cookies[0]?.value) throw new BiliError('登录已过期，请重新登录', 'EXPIRED');
    if (options.json) return request('api.bilibili.com', pathname, { csrf: cookies[0].value }, undefined, 'data', [], undefined, values);
    return request('api.bilibili.com', pathname, {}, undefined, 'data', [], { ...values, csrf: cookies[0].value });
  }
  return { request, nav, signed, post, reset: async () => {
    resetting = true; generation++;
    const entries = [...pending];
    for (const entry of entries) entry.controller.abort();
    await Promise.allSettled(entries.map(entry => entry.done));
    wbi = ''; resetting = false;
  } };
}
module.exports = { createClient, BiliError };
