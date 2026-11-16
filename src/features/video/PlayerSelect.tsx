import { useEffect, useId, useRef, useState } from 'react';
import { Icon } from '../../components/ui/Icon';

type Option = { value: string; label: string };
export function PlayerSelect({ label, value, options, disabled, onChange }: { label: string; value: string; options: Option[]; disabled?: boolean; onChange: (value: string) => void }) {
  const [open, setOpen] = useState(false), id = useId();
  const root = useRef<HTMLDivElement>(null), trigger = useRef<HTMLButtonElement>(null), list = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    (list.current?.querySelector<HTMLButtonElement>('[aria-selected="true"]') || list.current?.querySelector<HTMLButtonElement>('[role="option"]'))?.focus();
    const outside = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)) setOpen(false); };
    document.addEventListener('pointerdown', outside);
    return () => document.removeEventListener('pointerdown', outside);
  }, [open]);
  useEffect(() => { if (disabled) setOpen(false); }, [disabled]);
  return <div className="bili-select" ref={root} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false); }}>
    <button ref={trigger} type="button" className="bili-select-trigger" disabled={disabled} aria-label={label} aria-haspopup="listbox" aria-expanded={open} aria-controls={id}
      onClick={() => setOpen(value => !value)} onKeyDown={event => { if (['ArrowDown', 'ArrowUp'].includes(event.key)) { event.preventDefault(); setOpen(true); } }}>
      <span>{options.find(option => option.value === value)?.label || '不可用'}</span><Icon name="ChevronDown" size={13} />
    </button>
    {open && <div id={id} ref={list} className="bili-select-options" role="listbox" aria-label={label} onKeyDown={event => {
      if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); setOpen(false); trigger.current?.focus(); }
      if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
        event.preventDefault(); const buttons = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="option"]'));
        const index = buttons.indexOf(document.activeElement as HTMLButtonElement);
        buttons[event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1 : (index + (event.key === 'ArrowDown' ? 1 : -1) + buttons.length) % buttons.length]?.focus();
      }
    }}>{options.map(option => <button type="button" role="option" aria-selected={option.value === value} key={option.value} onClick={() => { onChange(option.value); setOpen(false); trigger.current?.focus(); }}>
      <span>{option.label}</span>{option.value === value && <Icon name="Check" size={14} />}
    </button>)}</div>}
  </div>;
}
