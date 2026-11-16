import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Dialog } from '../../components/ui/Dialog';
import { Button } from '../../components/ui/Button';
import { Icon } from '../../components/ui/Icon';
import { biliRequest } from './api';
import { useAccount } from './AccountProvider';
type Method = 'qr' | 'password' | 'sms';
export function LoginDialog({ onClose }: { onClose: () => void }) {
  const [method,setMethod] = useState<Method>('qr'), [qr,setQR] = useState(''), [message,setMessage] = useState(''), [error,setError] = useState('');
  const [refreshKey,setRefreshKey] = useState(0), [busy,setBusy] = useState(false), [expired,setExpired] = useState(false);
  const account = useAccount();
  useEffect(() => {
    let cancelled = false, timer: ReturnType<typeof setTimeout>;
    setError(''); setQR(''); setExpired(false); setMessage('');
    if (method !== 'qr') return;
    async function poll() {
      try {
        const result = await biliRequest<{ status: string }>('pollQR');
        if (cancelled) return;
        if (result.status === 'success') { await account.refresh(); return; }
        if (result.status === 'expired' || result.status === 'cancelled') { setExpired(true); setMessage('二维码已过期'); return; }
        setMessage(result.status === 'scanned' ? '请在手机上确认登录' : '使用哔哩哔哩 App 扫码');
        timer = setTimeout(poll,2000);
      } catch (e) { if (!cancelled) { setError((e as Error).message); setExpired(true); } }
    }
    void (async () => {
      try {
        const { url } = await biliRequest<{url: string}>('qr');
        const image = await QRCode.toDataURL(url,{ width: 220, margin: 2, errorCorrectionLevel: 'M' });
        if (!cancelled) { setQR(image); setMessage('使用哔哩哔哩 App 扫码'); timer = setTimeout(poll,2000); }
      } catch (e) { if (!cancelled) { setError((e as Error).message); setExpired(true); } }
    })();
    return () => { cancelled = true; clearTimeout(timer); void biliRequest('cancelQR').catch(() => {}); };
  },[method,refreshKey]);
  const openOfficial = async () => {
    setBusy(true); setError('');
    try { await biliRequest('officialLogin',method); setMessage('在 B 站窗口完成登录后将自动返回'); }
    catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  };
  return <Dialog title="登录哔哩哔哩" onClose={onClose}>
    <div className="bili-login-tabs" role="tablist" aria-label="登录方式">
      {([['qr','扫码登录'],['password','账号密码'],['sms','手机验证码']] as const).map(([key,label]) => <button role="tab" aria-selected={method === key} key={key} onClick={() => setMethod(key)}>{label}</button>)}
    </div>
    <div className="bili-login-content" role="tabpanel">
      {method === 'qr' ? <>
        <div className={`bili-qr ${expired ? 'expired' : ''}`}>{qr ? <img src={qr} alt="B站登录二维码" /> : <Icon name="QrCode" size={72} />}</div>
        <p>{message || (!error ? '正在获取二维码…' : '')}</p>
        {expired && <Button onClick={() => setRefreshKey(k => k+1)} icon="RefreshCw">刷新二维码</Button>}
      </> : <>
        <Icon name={method === 'sms' ? 'Smartphone' : 'KeyRound'} size={38} />
        <Button variant="primary" disabled={busy} onClick={openOfficial}>打开 B 站{method === 'sms' ? '短信' : '密码'}登录</Button>
        <p>{message || '在官方窗口输入信息并完成验证'}</p>
        <Button disabled={account.checking} onClick={() => void account.refresh()}>我已完成登录</Button>
      </>}
      {(error || account.error) && <p className="bili-error" role="alert">{error || account.error}</p>}
    </div>
  </Dialog>;
}
