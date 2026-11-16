import { useLayoutEffect, useRef } from 'react';
import { Icon } from '../../components/ui/Icon';

export function RecentSearches({ terms, onSearch }: { terms: string[]; onSearch: (term: string) => void }) {
  const list = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const host = list.current;
    if (!host) return;
    const fit = () => {
      const buttons = [...host.querySelectorAll<HTMLButtonElement>('button')];
      buttons.forEach(button => { button.hidden = false; });
      const rows: number[] = [];
      const visible = buttons.map(button => {
        const top = button.offsetTop;
        if (!rows.some(row => Math.abs(row - top) < 2)) rows.push(top);
        return rows.length <= 3;
      });
      buttons.forEach((button, index) => { button.hidden = !visible[index]; });
    };
    fit();
    let width = host.getBoundingClientRect().width;
    const observer = new ResizeObserver(entries => {
      const next = entries[0].contentRect.width;
      if (next !== width) { width = next; fit(); }
    });
    observer.observe(host);
    document.fonts.ready.then(() => { if (host.isConnected) fit(); });
    return () => observer.disconnect();
  }, [terms]);
  if (!terms.length) return null;
  return <section className="video-recent-searches" aria-label="最近搜索">
    <h2><Icon name="History" size={14} />最近搜索</h2>
    <div className="video-recent-chips" ref={list}>{terms.slice(0, 10).map(term =>
      <button key={term} title={term} onClick={() => onSearch(term)}>{term}</button>,
    )}</div>
  </section>;
}
