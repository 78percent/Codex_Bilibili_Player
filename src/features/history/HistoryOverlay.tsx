import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useApp } from '../../state/store';
import { Icon } from '../../components/ui/Icon';
import { useAccount } from '../account/AccountProvider';
import { useVideo } from '../video/VideoProvider';
import { PlayerSelect } from '../video/PlayerSelect';
import { useHistory } from './HistoryProvider';
import { HistoryList } from './HistoryList';
import { historyKey, dayLabel, type HistoryItem } from './types';
import { useFloatingMotion } from './useFloatingMotion';

export function HistoryOverlay() {
  const history = useHistory(), account = useAccount(), player = useVideo(), {state,dispatch} = useApp();
  const {view,snapshot} = history;
  const accountMenu = useRef<HTMLDivElement>(null), panel = useRef<HTMLDivElement>(null), list = useRef<HTMLDivElement>(null), search = useRef<HTMLInputElement>(null);
  const latest = useRef(history); latest.current = history;
  const [systemReduced,setSystemReduced] = useState(() => matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [selecting,setSelecting] = useState(''), [playError,setPlayError] = useState('');
  const picking = useRef(false), pickRevision = useRef(0);
  const reduced = state.settings.reducedMotion || systemReduced;
  const clamp = (value: number, max: number) => Math.max(8,Math.min(value,Math.max(8,max)));
  useEffect(() => { const media = matchMedia('(prefers-reduced-motion: reduce)'); const change = () => setSystemReduced(media.matches); media.addEventListener('change',change); return () => media.removeEventListener('change',change); }, []);
  useEffect(() => { pickRevision.current++; picking.current = false; setSelecting(''); setPlayError(''); }, [history.uid]);
  useEffect(() => { if (!view.open) { pickRevision.current++; picking.current = false; setSelecting(''); setPlayError(''); } }, [view.open]);
  useFloatingMotion(accountMenu,view.accountOpen,'account',reduced,node => {
    const anchor = history.avatar.current?.getBoundingClientRect(); const width = Math.min(230,window.innerWidth - 16);
    return { width,left:clamp(anchor?.left || 8,window.innerWidth - width - 8),top:clamp((anchor?.top || window.innerHeight - 20) - node.offsetHeight - 8,window.innerHeight - node.offsetHeight - 8) };
  });
  useFloatingMotion(panel,view.open,view.mode,reduced,node => {
    const width = Math.min(view.mode === 'quick' ? 330 : 500,window.innerWidth - 24);
    if (view.mode === 'manager') {
      const rail = document.querySelector('.activity-rail')?.getBoundingClientRect(), top = document.querySelector('.desktop-bar')?.getBoundingClientRect().bottom || 36;
      return {width,left:clamp((rail?.right || 42) + 8,window.innerWidth - width - 8),top:clamp(top + 8,window.innerHeight - node.offsetHeight - 8)};
    }
    const menu = accountMenu.current, anchor = history.avatar.current?.getBoundingClientRect();
    const menuLeft = parseFloat(menu?.style.left || '8'), right = menuLeft + (menu?.offsetWidth || 230) + 8;
    return {width,left:clamp(right + width <= window.innerWidth - 8 ? right : menuLeft - width - 8,window.innerWidth - width - 8),top:clamp((anchor?.top || window.innerHeight - 20) - 8 - node.offsetHeight,window.innerHeight - node.offsetHeight - 8)};
  });
  useLayoutEffect(() => { if (view.open && list.current) list.current.scrollTop = snapshot.scroll[view.mode]; }, [view.open,view.mode,snapshot.items,snapshot.date,snapshot.progress,history.uid]);
  useEffect(() => { if (view.open) search.current?.focus({preventScroll:true}); else if (view.accountOpen) accountMenu.current?.querySelector<HTMLButtonElement>('button:not(:disabled)')?.focus({preventScroll:true}); }, [view.open,view.mode,view.accountOpen]);
  useEffect(() => {
    const outside = (event: PointerEvent) => {
      const active = latest.current; if (!active.view.open && !active.view.accountOpen) return;
      const target = event.target as Node;
      if (panel.current?.contains(target) || accountMenu.current?.contains(target) || (target instanceof Element && target.closest('[data-history-trigger]'))) return;
      active.close();
    };
    const key = (event: KeyboardEvent) => {
      const active = latest.current;
      if (event.defaultPrevented || event.key !== 'Escape' || (!active.view.open && !active.view.accountOpen)) return;
      event.preventDefault(); active.close(); (active.view.mode === 'manager' && active.view.open ? active.clock.current : active.avatar.current)?.focus({preventScroll:true});
    };
    document.addEventListener('pointerdown',outside); document.addEventListener('keydown',key);
    return () => { document.removeEventListener('pointerdown',outside); document.removeEventListener('keydown',key); };
  }, []);
  function action(run: () => void) { history.close(); run(); }
  async function select(item: HistoryItem) {
    if (picking.current) return;
    picking.current = true; const token = ++pickRevision.current;
    setSelecting(historyKey(item)); setPlayError('');
    try {
      await player.playSearchVideo(item.bvid,{cid:item.cid || undefined,time:item.progress < 0 || item.progress >= item.duration ? 0 : item.progress});
      if (token === pickRevision.current && latest.current.view.open && latest.current.view.mode === 'quick') { history.close(); history.avatar.current?.focus({preventScroll:true}); }
    } catch (e) { if (token === pickRevision.current) setPlayError((e as Error).message); }
    finally { if (token === pickRevision.current) { picking.current = false; setSelecting(''); } }
  }
  const managing = view.mode === 'manager';
  const items = snapshot.items.filter(item => {
    if (!managing) return true;
    if (snapshot.date !== 'all' && dayLabel(item.viewedAt) !== (snapshot.date === 'today' ? '今天' : '昨天')) return false;
    const finished = item.progress === -1 || (item.duration > 0 && item.progress >= item.duration);
    return snapshot.progress === 'all' || (snapshot.progress === 'finished' ? finished : !finished);
  });
  const filter = (patch: Partial<typeof snapshot>) => history.patch({...patch,scroll:{...snapshot.scroll,manager:0}});
  return createPortal(<>
    <div ref={accountMenu} className="history-account-menu" role="menu" aria-label="账号菜单" aria-hidden={!view.accountOpen} hidden onKeyDown={event => {
      if (!['ArrowDown','ArrowUp','Home','End'].includes(event.key)) return;
      event.preventDefault();
      const buttons = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('button:not(:disabled)'));
      const index = buttons.indexOf(document.activeElement as HTMLButtonElement);
      buttons[event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1 : (index + (event.key === 'ArrowDown' ? 1 : -1) + buttons.length) % buttons.length]?.focus();
    }}>
      <button role="menuitem" onClick={() => action(() => dispatch({type:'NAVIGATE',page:'profile'}))}><Icon name="UserRound" size={16}/><span>{account.profile?.name || 'B站账号'}</span></button>
      <button role="menuitem" onClick={() => action(() => dispatch({type:'NAVIGATE',page:'profile'}))}><Icon name="ContactRound" size={16}/><span>个人资料</span></button><hr/>
      <button role="menuitem" disabled><Icon name="Bookmark" size={16}/><span>收藏夹</span></button>
      <button role="menuitem" aria-haspopup="dialog" aria-expanded={view.open && !managing} onClick={history.openQuick}><Icon name="History" size={16}/><span>观看历史</span><Icon name="ChevronRight" size={14}/></button>
      <button role="menuitem" disabled><Icon name="UsersRound" size={16}/><span>关注列表</span></button><hr/>
      <button role="menuitem" disabled={account.checking} onClick={() => action(() => { void account.logout(); })}><Icon name="LogOut" size={16}/><span>退出登录</span></button>
    </div>
    <div ref={panel} className="history-panel" data-mode={view.mode} role="dialog" aria-label={managing ? '观看记录' : '观看历史'} aria-hidden={!view.open} hidden>
      <header className="history-heading"><h2>{managing ? '观看记录' : '观看历史'}</h2><div>
        <button type="button" className="history-icon" title="刷新记录" aria-label="刷新记录" disabled={history.loading || !history.ready} onClick={() => void history.refresh()}><Icon name="RefreshCw" size={15}/></button>
        {!managing && <button type="button" className="history-icon" title="管理观看记录" aria-label="管理观看记录" onClick={history.expand}><Icon name="Expand" size={16}/></button>}
        <button type="button" className="history-icon" aria-label="关闭观看记录" onClick={() => { history.close(); (managing ? history.clock.current : history.avatar.current)?.focus({preventScroll:true}); }}><Icon name="X" size={17}/></button>
      </div></header>
      <form className="history-search" onSubmit={event => { event.preventDefault(); void history.search(); }}><Icon name="Search" size={17}/>
        <input ref={search} type="search" maxLength={200} placeholder="搜索观看历史" aria-label="搜索观看历史" value={snapshot.draft} onChange={event => history.patch({draft:event.target.value})}/>
        <button type="submit" disabled={!history.ready || history.loading}>{history.loading ? <Icon name="LoaderCircle" size={15}/> : '搜索'}</button>
      </form>
      <div className="history-filters">
        {managing && <><PlayerSelect label="已加载记录的观看日期" value={snapshot.date} options={[{value:'all',label:'全部日期'},{value:'today',label:'今天'},{value:'yesterday',label:'昨天'}]} onChange={date => filter({date})}/>
          <PlayerSelect label="已加载记录的观看进度" value={snapshot.progress} options={[{value:'all',label:'全部进度'},{value:'unfinished',label:'未看完'},{value:'finished',label:'已看完'}]} onChange={progress => filter({progress})}/></>}
        <span className="history-count" aria-live="polite">{items.length}{snapshot.more ? '+' : ''} 条</span>
      </div>
      {(history.error || playError) && <div className="history-error" role="alert"><span>{playError || history.error}</span>{history.error && <button onClick={() => void history.retry()}>重试</button>}</div>}
      {history.syncError && <div className="history-error" role="status">{history.syncError}</div>}
      <div ref={list} className="history-list" aria-busy={history.loading} onScroll={event => { if (view.open) history.rememberScroll(view.mode,event.currentTarget.scrollTop); }}>
        {!account.profile ? <div className="history-empty"><button onClick={() => action(account.openLogin)}>登录哔哩哔哩</button></div> : !history.ready ? <div className="history-empty">正在加载…</div> : <>
          <HistoryList items={items} viewed={snapshot.viewed} current={player.video ? historyKey(player.video) : ''} selecting={selecting} onSelect={item => void select(item)}/>
          {!items.length && !history.loading && !history.error && <div className="history-empty">{snapshot.keyword || snapshot.date !== 'all' || snapshot.progress !== 'all' ? '没有匹配的观看记录' : '暂无观看记录'}</div>}
          {history.loading && !items.length && <div className="history-empty">正在加载…</div>}
          {snapshot.more && <button className="history-load-more" disabled={history.loading} onClick={() => void history.more()}>{history.loading ? '正在加载…' : '加载更多'}</button>}
        </>}
      </div>
      {!managing && <footer className="history-footer"><button onClick={history.expand}>全部记录<Icon name="ArrowRight" size={13}/></button></footer>}
    </div>
  </>,document.body);
}
