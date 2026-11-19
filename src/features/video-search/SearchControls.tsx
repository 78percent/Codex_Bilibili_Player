import { useId } from 'react';
import { Icon } from '../../components/ui/Icon';
import { searchPartitions } from './partitions';
import { defaultSearchOptions } from './options';
import type { SearchOptions } from './types';

const orders: { value: SearchOptions['order']; label: string }[] = [
  { value: 'totalrank', label: '综合排序' }, { value: 'click', label: '最多播放' },
  { value: 'pubdate', label: '最新发布' }, { value: 'dm', label: '最多弹幕' }, { value: 'stow', label: '最多收藏' },
];
const durations: { value: SearchOptions['duration']; label: string }[] = [
  { value: 0, label: '全部' }, { value: 1, label: '10 分钟以下' }, { value: 2, label: '10–30 分钟' },
  { value: 3, label: '30–60 分钟' }, { value: 4, label: '60 分钟以上' },
];

export function SearchControls({ options, filtersOpen, disabled, onChange, onToggle }: {
  options: SearchOptions; filtersOpen: boolean; disabled: boolean;
  onChange: (options: SearchOptions) => void; onToggle: () => void;
}) {
  const id = useId(), activeFilters = Number(options.duration !== 0) + Number(options.tids !== 0);
  return <div className="video-search-controls">
    <div className="video-search-tools"><div className="video-search-orders" role="group" aria-label="搜索结果排序">
      {orders.map(order => <button type="button" key={order.value} className="video-search-order" disabled={disabled}
        data-browser-focus={`search-order-${order.value}`} aria-pressed={options.order === order.value}
        onClick={() => { if (options.order !== order.value) onChange({ ...options, order: order.value }); }}>{order.label}</button>)}
    </div><button type="button" className="video-search-filter-toggle" disabled={disabled} data-browser-focus="search-filter-toggle"
      aria-expanded={filtersOpen} aria-controls={`${id}-filters`} onClick={onToggle}>
      <Icon name="SlidersHorizontal" size={14} /><span>更多筛选</span>
      {activeFilters > 0 && <span className="video-search-filter-count" aria-label={`已选 ${activeFilters} 项筛选`}>{activeFilters}</span>}
      <Icon name={filtersOpen ? 'ChevronUp' : 'ChevronDown'} size={14} />
    </button></div>
    <div className="video-search-filters" id={`${id}-filters`} hidden={!filtersOpen}>
      <div className="video-search-filter-row"><span className="video-search-filter-label" id={`${id}-duration`}>时长</span>
        <div className="video-search-filter-options" role="group" aria-labelledby={`${id}-duration`}>
          {durations.map(duration => <button type="button" key={duration.value} disabled={disabled}
            className="video-search-filter-option" data-browser-focus={`search-duration-${duration.value}`} aria-pressed={options.duration === duration.value}
            onClick={() => { if (options.duration !== duration.value) onChange({ ...options, duration: duration.value }); }}>{duration.label}</button>)}
        </div>
      </div>
      <div className="video-search-filter-row"><span className="video-search-filter-label" id={`${id}-partition`}>分区</span>
        <div className="video-search-filter-options" role="group" aria-labelledby={`${id}-partition`}>
          {searchPartitions.map(partition => <button type="button" key={partition.value} disabled={disabled}
            className="video-search-filter-option" data-browser-focus={`search-partition-${partition.value}`} aria-pressed={options.tids === partition.value}
            onClick={() => { if (options.tids !== partition.value) onChange({ ...options, tids: partition.value }); }}>{partition.label}</button>)}
        </div><button type="button" className="video-search-filter-reset" data-browser-focus="search-filter-reset"
          disabled={disabled || (activeFilters === 0 && options.order === 'totalrank')}
          onClick={() => onChange({ ...defaultSearchOptions })}>重置</button>
      </div>
    </div>
  </div>;
}
