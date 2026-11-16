import { useEffect, useState } from 'react';

export const PLAYBACK_RATES = [.5, 1, 1.25, 1.5, 2];
export type DanmakuPreferences = {
  enabled: boolean; opacity: number; fontSize: number; area: number; speed: number; density: number;
  scroll: boolean; top: boolean; bottom: boolean; color: boolean; keywords: string;
};
export type PlayerPreferences = {
  rate: number; volume: number; subtitleLanguage: string; subtitleSize: number; subtitleBackground: boolean;
  danmaku: DanmakuPreferences;
};
export const DEFAULT_DANMAKU: DanmakuPreferences = { enabled: true, opacity: .8, fontSize: 18, area: .5, speed: 1, density: 2, scroll: true, top: true, bottom: true, color: true, keywords: '' };
const defaults: PlayerPreferences = { rate: 1, volume: 1, subtitleLanguage: 'auto', subtitleSize: 1, subtitleBackground: true, danmaku: DEFAULT_DANMAKU };
const storageKey = 'bilibili-player-preferences-v1';
function read(): PlayerPreferences {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || 'null');
    if (!saved || typeof saved !== 'object') return defaults;
    const result = { ...defaults, danmaku: { ...DEFAULT_DANMAKU } };
    if (PLAYBACK_RATES.includes(saved.rate)) result.rate = saved.rate;
    if (typeof saved.volume === 'number' && saved.volume >= 0 && saved.volume <= 1) result.volume = saved.volume;
    if (typeof saved.subtitleLanguage === 'string') result.subtitleLanguage = saved.subtitleLanguage;
    if ([1, 1.2, 1.4].includes(saved.subtitleSize)) result.subtitleSize = saved.subtitleSize;
    if (typeof saved.subtitleBackground === 'boolean') result.subtitleBackground = saved.subtitleBackground;
    const dm = saved.danmaku || {};
    for (const key of ['enabled', 'scroll', 'top', 'bottom', 'color'] as const) if (typeof dm[key] === 'boolean') result.danmaku[key] = dm[key];
    for (const [key, min, max] of [['opacity', .1, 1], ['fontSize', 12, 28], ['area', .25, 1], ['speed', .7, 1.5], ['density', 1, 3]] as const) {
      if (typeof dm[key] === 'number' && Number.isFinite(dm[key])) result.danmaku[key] = Math.max(min, Math.min(max, dm[key]));
    }
    if (typeof dm.keywords === 'string') result.danmaku.keywords = dm.keywords;
    return result;
  } catch { return defaults; }
}
export function usePlayerPreferences() {
  const [preferences, setPreferences] = useState(read);
  useEffect(() => { try { localStorage.setItem(storageKey, JSON.stringify(preferences)); } catch { /* Playback remains available when storage is full or disabled. */ } }, [preferences]);
  return { preferences, updatePreferences: (patch: Partial<PlayerPreferences>) => setPreferences(previous => ({ ...previous, ...patch })) };
}
