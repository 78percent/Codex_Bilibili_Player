import { useState } from 'react';
import { useAccount } from './AccountProvider';
import { biliRequest } from './api';
import { Button } from '../../components/ui/Button';
import { Icon } from '../../components/ui/Icon';
import { useHistory } from '../history/HistoryProvider';
export function ProfilePage() {
  const account = useAccount(), profile = account.profile;
  const history = useHistory();
  const [error,setError] = useState('');
  async function security() { try { await biliRequest('security'); } catch (e) { setError((e as Error).message); } }
  return <div className="page-scroll"><div className="bili-profile">
    <div className="bili-profile-header">
      {profile?.avatar ? <img src={profile.avatar} referrerPolicy="no-referrer" alt="B站头像" /> : <Icon name="CircleUserRound" size={64} />}
      <div><h1>{profile?.name || '哔哩哔哩'}</h1>{profile && <span>UID {profile.uid}</span>}</div>
    </div>
    {profile ? <>
      <dl className="bili-profile-details"><div><dt>会员</dt><dd>{profile.membership}</dd></div><div><dt>手机号</dt><dd>{profile.mobileVerified === true ? '已绑定' : profile.mobileVerified === false ? '未绑定' : '暂时无法确认'}</dd></div></dl>
      {profile.mobileVerified !== true && <div className="bili-profile-actions"><Button onClick={security} icon="ExternalLink">前往绑定</Button><Button disabled={account.checking} onClick={() => void account.refresh()}>重新检查</Button></div>}
      <div className="bili-profile-links">{[['Bookmark','收藏夹'],['History','观看历史'],['UsersRound','关注列表']].map(([icon,label]) => <button disabled={icon !== 'History'} key={label} onClick={() => history.toggleManager()}><Icon name={icon} size={18} /><span>{label}</span><Icon name="ChevronRight" size={15} /></button>)}</div>
      <div className="bili-profile-actions"><Button disabled={account.checking} icon="RefreshCw" onClick={() => void account.refresh()}>刷新资料</Button><Button disabled={account.checking} icon="LogOut" onClick={() => void account.logout()}>退出登录</Button></div>
    </> : <Button variant="primary" onClick={account.openLogin}>登录哔哩哔哩</Button>}
    {(error || account.error || account.persistenceError) && <p className="bili-error" role="alert">{error || account.error || account.persistenceError}</p>}
    {!profile && account.persistenceError && <Button disabled={account.checking} onClick={() => void account.logout()}>清除本机登录</Button>}
  </div></div>;
}
