export function SearchTelevision({ busy }: { busy: boolean }) {
  return <span className={`video-search-leading-icon${busy ? ' is-busy' : ''}`} role={busy ? 'status' : undefined} aria-label={busy ? '加载中' : undefined}>
    <svg className="video-search-tv" width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path className="video-search-tv-antenna" d="m8 2 4 4 4-4" />
      <rect className="video-search-tv-screen" x="3" y="6" width="18" height="14" rx="3.5" />
      <path d="M7 20v2m10-2v2" />
      <g className="video-search-tv-look">
        <g className="video-search-tv-eyes"><path d="M8 11v2m8-2v2" /></g>
        <path d="M10 15.5q2 2 4 0" />
      </g>
      <path className="video-search-tv-cheeks" d="M5.8 14.5h1m10.4 0h1" />
    </svg>
  </span>;
}
