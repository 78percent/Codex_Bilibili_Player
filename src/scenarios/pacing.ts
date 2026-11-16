import type { Run } from "../state/types";

// Local demonstration pacing, separate from the real Bilibili services.
export function scenarioPacing(effort: string, fileCount: number) {
  const scale = ({ "低": .8, "中": .9, "高": 1, "极高": 1.2, Ultra: 2.2 } as Record<string, number>)[effort] || 1;
  const complexity = Math.min(3, Math.max(0, fileCount - 1)) * 400;
  return {
    understand: Math.round(4000 * scale),
    search: Math.round((5000 + complexity) * scale),
    read: Math.round((6000 + complexity) * scale),
    apply: Math.round((6000 + complexity) * scale),
  };
}

export function responseChunk(text: string, offset: number) {
  const rest = text.slice(offset);
  const boundary = rest.slice(0, 9).search(/[，。！？；\n]/);
  let size = boundary < 0 ? Math.min(6, rest.length) : boundary + 1;
  // Do not split an emoji's surrogate pair between animation frames.
  if (size < rest.length && /[\uD800-\uDBFF]/.test(rest[size - 1])) size += 1;
  const chunk = rest.slice(0, size);
  return { offset: offset + size, delay: chunk.endsWith("\n") ? 420 : /[。！？；]$/.test(chunk) ? 280 : 110 };
}

export function runElapsed(run: Run, now = Date.now()) {
  return Math.max(0, (run.pausedAt ?? now) - (run.startedAt ?? now) - (run.pausedMs || 0));
}

export function formatDuration(milliseconds: number) {
  const seconds = Math.floor(milliseconds / 1000);
  return seconds < 60 ? `${seconds} 秒` : `${Math.floor(seconds / 60)} 分钟 ${seconds % 60} 秒`;
}
