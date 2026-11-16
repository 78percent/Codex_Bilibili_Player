import { useAccount } from './AccountProvider';
import { useApp } from '../../state/store';
import { Menu } from '../../components/ui/Menu';
import { Icon } from '../../components/ui/Icon';
export function AccountMenu() {
  const account = useAccount(), { dispatch } = useApp();
  const avatar = <button className="bili-avatar-button" aria-label={account.profile ? `${account.profile.name}的账号菜单` : '登录哔哩哔哩'} title={account.profile?.name || '登录哔哩哔哩'}>
    {account.profile?.avatar ? <img src={account.profile.avatar} referrerPolicy="no-referrer" alt="" /> : <Icon name="CircleUserRound" size={24} />}
  </button>;
  if (!account.profile) return <span onClick={account.openLogin}>{avatar}</span>;
  return <Menu trigger={avatar} items={[
    { label: account.profile.name, icon: 'UserRound', action: () => dispatch({ type: 'NAVIGATE', page: 'profile' }) },
    { label: '个人资料', icon: 'ContactRound', action: () => dispatch({ type: 'NAVIGATE', page: 'profile' }) },
    { divider: true },
    { label: '收藏夹', icon: 'Bookmark', disabled: true }, { label: '观看历史', icon: 'History', disabled: true }, { label: '关注列表', icon: 'UsersRound', disabled: true },
    { divider: true }, { label: '退出登录', icon: 'LogOut', disabled: account.checking, action: () => void account.logout() },
  ]} />;
}
