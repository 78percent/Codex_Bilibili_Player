import { useAccount } from './AccountProvider';
import { Icon } from '../../components/ui/Icon';
import { useHistory } from '../history/HistoryProvider';
export function AccountMenu() {
  const account = useAccount(), history = useHistory();
  return <button ref={node => { history.avatar.current = node; }} className="bili-avatar-button" aria-label={account.profile ? `${account.profile.name}的账号菜单` : '登录哔哩哔哩'} title={account.profile?.name || '登录哔哩哔哩'} aria-haspopup={account.profile ? 'menu' : 'dialog'} aria-expanded={history.view.accountOpen} data-history-trigger onClick={event => history.toggleAccount(event.currentTarget)}>
    {account.profile?.avatar ? <img src={account.profile.avatar} referrerPolicy="no-referrer" alt="" /> : <Icon name="CircleUserRound" size={24} />}
  </button>;
}
