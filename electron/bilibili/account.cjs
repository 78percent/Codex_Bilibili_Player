const { BrowserWindow, safeStorage, shell } = require('electron');
const fs = require('node:fs/promises');
const path = require('node:path');
const { BiliError } = require('./client.cjs');
function createAccount({ session, client, userData, parent, onChange }) {
  const file = path.join(userData, 'bilibili-session.bin');
  let profile = null, loginWindow = null, generation = 0, qr = null, persistenceError = '';
  let qrGeneration = 0, qrController = null;
  function cancelQR() { qrGeneration++; qr = null; qrController?.abort(); qrController = null; }
  let writes = Promise.resolve();
  let clearing = null;
  const allowed = u => { try { const x = new URL(u); return x.protocol === 'https:' && (x.hostname === 'bilibili.com' || x.hostname.endsWith('.bilibili.com') || x.hostname.endsWith('.geetest.com')); } catch { return false; } };
  const snapshot = () => ({ profile, persistenceError });
  async function save() {
    if (!safeStorage.isEncryptionAvailable()) { persistenceError = '本机加密不可用，无法记住登录'; return; }
    const current = generation;
    const cookies = await session.cookies.get({ domain: 'bilibili.com' });
    const bytes = safeStorage.encryptString(JSON.stringify(cookies));
    writes = writes.catch(() => {}).then(async () => {
      if (current !== generation) return;
      await fs.mkdir(userData, { recursive: true });
      await fs.writeFile(file + '.tmp', bytes);
      await fs.rename(file + '.tmp', file);
    });
    try { await writes; persistenceError = ''; } catch { persistenceError = '登录成功，但本机登录状态未保存'; }
  }
  async function restore() {
    let bytes;
    try { bytes = await fs.readFile(file); } catch (e) { if (e.code !== 'ENOENT') persistenceError = '无法读取本机登录状态'; return; }
    try {
      if (!safeStorage.isEncryptionAvailable()) throw new Error('encryption unavailable');
      const cookies = JSON.parse(safeStorage.decryptString(bytes));
      for (const cookie of cookies) {
        if (cookie.expirationDate && cookie.expirationDate <= Date.now()/1000) continue;
        const domain = cookie.domain.replace(/^\./,'');
        if (domain !== 'bilibili.com' && !domain.endsWith('.bilibili.com')) continue;
        const { name, value, path: cookiePath, secure, httpOnly, sameSite, expirationDate } = cookie;
        await session.cookies.set({ url: `https://${domain}${cookiePath || '/'}`, domain: cookie.domain, name, value, path: cookiePath, secure, httpOnly, sameSite, ...(expirationDate ? { expirationDate } : {}) });
      }
    } catch { persistenceError = '无法解密本机登录，请重新登录'; }
  }
  async function clear() {
    if (clearing) return clearing;
    generation++; cancelQR(); profile = null;
    if (loginWindow && !loginWindow.isDestroyed()) loginWindow.destroy();
    clearing = (async () => {
      await client.reset();
      await writes.catch(() => {});
      await session.closeAllConnections();
      await session.clearStorageData();
      await fs.rm(file, { force: true });
      persistenceError = ''; onChange(snapshot());
    })();
    try { await clearing; } finally { clearing = null; }
  }
  async function check() {
    if (clearing) { await clearing; return snapshot(); }
    const current = generation;
    const cookies = await session.cookies.get({ name: 'SESSDATA' });
    if (current !== generation) return snapshot();
    if (!cookies.length) { profile = null; return snapshot(); }
    let data;
    try { data = await client.nav(); }
    catch (e) { if (e.code === 'EXPIRED' && current === generation) await clear(); throw e; }
    if (current !== generation) throw new BiliError('登录操作已取消', 'CANCELLED');
    const status = data.vip?.status ?? data.vipStatus;
    profile = {
      uid: String(data.mid), name: data.uname, avatar: String(data.face || '').replace(/^http:/,'https:'),
      mobileVerified: data.mobile_verified === 1 ? true : data.mobile_verified === 0 ? false : null,
      membership: status === 1 ? (data.vip?.label?.text || data.vip_label?.text || '大会员') : status === 0 ? '普通会员' : '暂未获取',
    };
    await save();
    if (current !== generation) throw new BiliError('登录操作已取消', 'CANCELLED');
    onChange(snapshot());
    return snapshot();
  }
  async function requireBound() {
    const state = await check();
    if (!state.profile) throw new BiliError('请先登录 B 站', 'EXPIRED');
    if (state.profile.mobileVerified !== true) throw new BiliError(state.profile.mobileVerified === false ? '请先在 B 站绑定手机号，再重新检查' : '暂时无法确认手机号绑定状态，请重试', 'PHONE_REQUIRED');
    return state.profile;
  }
  async function createQR() {
    if (clearing) await clearing;
    cancelQR(); qrController = new AbortController();
    const token = generation, attempt = qrGeneration;
    const data = await client.request('passport.bilibili.com', '/x/passport-login/web/qrcode/generate', {}, qrController.signal);
    if (token !== generation || attempt !== qrGeneration) throw new BiliError('登录操作已取消', 'CANCELLED');
    qr = { key: data.qrcode_key, created: Date.now() };
    return { url: data.url };
  }
  async function pollQR() {
    const current = qr;
    if (!current) return { status: 'cancelled' };
    const data = await client.request('passport.bilibili.com', '/x/passport-login/web/qrcode/poll', { qrcode_key: current.key }, qrController?.signal);
    if (qr !== current) return { status: 'cancelled' };
    if (data.code === 0) { qr = null; return { status: 'success', account: await check() }; }
    if (data.code === 86038) { qr = null; return { status: 'expired' }; }
    if (![86090,86101].includes(data.code)) throw new BiliError(`扫码登录暂不可用（${data.code}）`);
    return { status: data.code === 86090 ? 'scanned' : 'waiting' };
  }
  function openOfficial(method) {
    if (clearing) throw new BiliError('正在退出登录，请稍后再试');
    if (!['password','sms'].includes(method)) throw new BiliError('未知登录方式');
    cancelQR();
    if (loginWindow && !loginWindow.isDestroyed()) { loginWindow.focus(); return; }
    loginWindow = new BrowserWindow({ width: 1080, height: 760, title: method === 'sms' ? 'B站手机验证码登录' : 'B站账号密码登录', parent: parent(), autoHideMenuBar: true,
      webPreferences: { session, sandbox: true, contextIsolation: true, nodeIntegration: false } });
    const win = loginWindow;
    win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
    win.webContents.on('will-navigate', (event, url) => { if (!allowed(url)) event.preventDefault(); });
    win.webContents.on('will-redirect', (event, url) => { if (!allowed(url)) event.preventDefault(); });
    const label = method === 'sms' ? '短信登录' : '密码登录';
    // Only select the observed official tab. Never read password or SMS inputs.
    win.webContents.on('did-finish-load', () => {
      if (!win.webContents.getURL().startsWith('https://passport.bilibili.com/login')) return;
      win.webContents.executeJavaScript(`(() => { const choose = () => { const tab = [...document.querySelectorAll('.tabs_wp > div')].find(x => x.textContent.trim() === ${JSON.stringify(label)}); if (!tab) return false; tab.click(); return true; }; if (choose()) return; const observer = new MutationObserver(() => { if (choose()) observer.disconnect(); }); observer.observe(document.body,{childList:true,subtree:true}); setTimeout(() => observer.disconnect(),10000); })()`).catch(() => {});
    });
    let timer, checking = false;
    const changed = (_event, cookie, _cause, removed) => {
      if (removed || cookie.name !== 'SESSDATA' || checking) return;
      clearTimeout(timer);
      timer = setTimeout(async () => {
        checking = true;
        try { const state = await check(); if (state.profile && !win.isDestroyed()) win.close(); }
        catch { /* The app's explicit check action presents network errors. */ }
        finally { checking = false; }
      }, 800);
    };
    session.cookies.on('changed', changed);
    win.on('closed', () => { clearTimeout(timer); session.cookies.removeListener('changed', changed); if (loginWindow === win) loginWindow = null; });
    win.loadURL('https://passport.bilibili.com/login').catch(() => {});
  }
  return { restore, check, clear, requireBound, createQR, pollQR, openOfficial, snapshot,
    cancelQR,
    openSecurity: () => shell.openExternal('https://passport.bilibili.com/account/security'),
  };
}
module.exports = { createAccount };
