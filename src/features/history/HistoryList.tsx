import { Fragment } from 'react';
import { Icon } from '../../components/ui/Icon';
import { dayLabel, durationLabel, historyKey, type HistoryItem } from './types';

export function HistoryList({ items, viewed, current, selecting, onSelect }: {
  items: HistoryItem[]; viewed: Record<string,number>; current: string; selecting: string; onSelect: (item: HistoryItem) => void;
}) {
  let previousDay = '';
  return <>{items.map(item => {
    const key = historyKey(item), day = dayLabel(item.viewedAt), heading = day !== previousDay; previousDay = day;
    const finished = item.progress === -1 || (item.duration > 0 && item.progress >= item.duration);
    const progress = finished ? 100 : item.duration > 0 ? Math.min(100,Math.max(0,item.progress / item.duration * 100)) : 0;
    return <Fragment key={key}>
      {heading && <div className="history-day">{day}</div>}
      <button type="button" className="history-record" aria-current={current === key ? 'true' : undefined} disabled={!!selecting}
        aria-label={`${current === key ? '当前播放，' : ''}${item.title}，${item.author}，${finished ? '重新播放' : `从 ${durationLabel(item.progress)} 继续播放`}`} onClick={() => onSelect(item)}>
        <span className="history-cover">
          {item.cover ? <img src={item.cover} alt="" loading="lazy" referrerPolicy="no-referrer" /> : <Icon name="Film" size={20} />}
          {current === key && <span className="history-current-icon"><Icon name="Play" size={13} /></span>}
          <span className="history-duration">{durationLabel(item.duration)}</span><span className="history-progress" style={{width:`${progress}%`}} />
        </span>
        <span className="history-record-info"><span className="history-record-title">{item.title}{viewed[key] && <span className="history-local-mark">本软件看过</span>}</span>
          <span className="history-record-meta">{item.author}{item.authorId && ` · UID ${item.authorId}`}</span>
          <span className="history-record-meta">{item.bvid}{item.part && ` · ${item.part}`}</span>
          <span className="history-record-meta history-record-time">{new Date(item.viewedAt * 1000).toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit'})} · {selecting === key ? '正在打开…' : finished ? '已看完' : `看到 ${durationLabel(item.progress)}`}</span>
        </span>
      </button>
    </Fragment>;
  })}</>;
}
