import { useCallback, useEffect, useRef, type KeyboardEvent, type RefObject } from 'react';
import { useVideo } from './VideoProvider';

function ownsKeys(target: EventTarget | null) {
  return target instanceof HTMLElement && (target.isContentEditable || !!target.closest('input, textarea, select, [role="slider"], [role="textbox"], [role="combobox"], [role="listbox"], [role="menu"], [data-player-menu]'));
}

export function usePlayerShortcuts(root: RefObject<HTMLDivElement | null>, enabled: boolean, flash: (message: string) => void) {
  const player = useVideo(), latest = useRef({ player, enabled, flash }); latest.current = { player, enabled, flash };
  const held = useRef(new Set<string>()), volumeKey = useRef('');
  const delay = useRef<ReturnType<typeof setTimeout> | null>(null), interval = useRef<ReturnType<typeof setInterval> | null>(null);
  const stopVolume = useCallback(() => {
    if (delay.current) clearTimeout(delay.current);
    if (interval.current) clearInterval(interval.current);
    delay.current = null; interval.current = null; volumeKey.current = '';
  }, []);
  const stop = useCallback(() => { held.current.clear(); stopVolume(); }, [stopVolume]);
  useEffect(() => {
    if (!enabled) { stop(); return; }
    const keyup = (event: globalThis.KeyboardEvent) => { held.current.delete(event.key); if (volumeKey.current === event.key) stopVolume(); };
    const visibility = () => { if (document.hidden) stop(); };
    window.addEventListener('keyup', keyup); window.addEventListener('blur', stop); document.addEventListener('visibilitychange', visibility);
    return () => { stop(); window.removeEventListener('keyup', keyup); window.removeEventListener('blur', stop); document.removeEventListener('visibilitychange', visibility); };
  }, [enabled, stop, stopVolume]);
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!latest.current.enabled || event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || event.nativeEvent.isComposing || ownsKeys(event.target)) return;
    if (!root.current?.contains(event.target as Node)) return;
    const key = event.key;
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'm', 'M', 'd', 'D'].includes(key)) return;
    event.preventDefault();
    if (event.repeat || held.current.has(key)) return;
    held.current.add(key);
    const { player: current, flash: show } = latest.current;
    if (key === 'ArrowLeft' || key === 'ArrowRight') {
      if (current.loading || current.preparing || !current.quality) return;
      const delta = key === 'ArrowRight' ? 5 : -5;
      current.seek(current.getMediaElement().currentTime + delta);
      show(`${delta > 0 ? '前进' : '后退'} 5 秒`);
    } else if (key === 'ArrowUp' || key === 'ArrowDown') {
      stopVolume(); volumeKey.current = key;
      const step = key === 'ArrowUp' ? .05 : -.05;
      const change = () => {
        const { player: live, flash: feedback } = latest.current;
        if (!latest.current.enabled || !root.current?.contains(document.activeElement) || ownsKeys(document.activeElement) || document.hidden) { stop(); return; }
        const volume = Math.max(0, Math.min(1, Math.round((live.getMediaElement().volume + step) * 100) / 100));
        live.setVolume(volume); feedback(`音量 ${Math.round(volume * 100)}%`);
      };
      change();
      if (volumeKey.current !== key) return;
      delay.current = setTimeout(() => {
        delay.current = null;
        if (volumeKey.current === key) interval.current = setInterval(change, 95);
      }, 330);
    } else if (key.toLowerCase() === 'm') {
      current.toggleMute(); show(current.getMediaElement().volume === 0 ? '已静音' : '声音已恢复');
    } else {
      const enabled = !current.preferences.danmaku.enabled;
      current.updatePreferences({ danmaku: { ...current.preferences.danmaku, enabled } });
      show(enabled ? '弹幕已开启' : '弹幕已关闭');
    }
  };
  return { onKeyDown, onBlur: stop };
}
