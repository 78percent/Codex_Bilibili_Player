import { useEffect, useLayoutEffect, useRef, type RefObject } from 'react';

type Position = { left: number; top: number; width: number };
export function useFloatingMotion(ref: RefObject<HTMLDivElement | null>, open: boolean, identity: string, reduced: boolean, position: (node: HTMLDivElement) => Position) {
  const previous = useRef({ open: false, identity }), animation = useRef<Animation | null>(null);
  const settled = useRef<DOMRect | null>(null);
  const latestPosition = useRef(position); latestPosition.current = position;
  const applyPosition = (node: HTMLDivElement) => {
    const first = latestPosition.current(node); node.style.width = `${first.width}px`;
    const target = latestPosition.current(node);
    node.style.left = `${target.left}px`; node.style.top = `${target.top}px`;
  };
  useLayoutEffect(() => {
    const node = ref.current; if (!node) return;
    const changed = previous.current.open !== open || previous.current.identity !== identity;
    if (!changed && !reduced) { if (open && !animation.current) { applyPosition(node); settled.current = node.getBoundingClientRect(); } return; }
    const visible = (!node.hidden && previous.current.open) || !!animation.current;
    const from = visible ? animation.current ? node.getBoundingClientRect() : settled.current || node.getBoundingClientRect() : null;
    const opacity = visible ? getComputedStyle(node).opacity : '0';
    animation.current?.cancel(); animation.current = null;
    node.style.overflow = '';
    previous.current = { open, identity };
    node.inert = !open;
    if (reduced) { node.hidden = !open; if (open) { applyPosition(node); settled.current = node.getBoundingClientRect(); } return; }
    if (!open && !visible) { node.hidden = true; return; }
    node.hidden = false;
    if (open) applyPosition(node);
    const target = node.getBoundingClientRect();
    const dx = from ? from.left - target.left : -6, dy = from ? from.top - target.top : 8;
    const moving = from && (Math.abs(dx) > 10 || Math.abs(dy) > 10);
    const resizing = !!from && (Math.abs(from.width - target.width) > 1 || Math.abs(from.height - target.height) > 1);
    if (resizing) node.style.overflow = 'clip';
    const running = node.animate([
      { transform:`translate(${dx}px,${dy}px)`, opacity, ...(resizing ? {width:`${from!.width}px`,height:`${from!.height}px`} : {}) },
      { transform:open ? 'translate(0,0)' : `translate(${dx}px,${dy + 6}px)`, opacity:open ? 1 : 0, ...(resizing ? {width:`${open ? target.width : from!.width}px`,height:`${open ? target.height : from!.height}px`} : {}) }
    ], { duration:open ? moving || resizing ? 280 : 200 : 130, easing:open ? 'cubic-bezier(.22,1,.36,1)' : 'cubic-bezier(.4,0,1,1)', fill:'both' });
    animation.current = running;
    running.finished.then(() => {
      if (animation.current !== running) return;
      running.cancel(); animation.current = null;
      node.style.overflow = '';
      if (!open) node.hidden = true;
      else { applyPosition(node); settled.current = node.getBoundingClientRect(); }
    }).catch(() => {});
  });
  useEffect(() => {
    const resize = () => { const node = ref.current; if (node && !node.hidden && !animation.current) { applyPosition(node); settled.current = node.getBoundingClientRect(); } };
    window.addEventListener('resize',resize);
    return () => { animation.current?.cancel(); window.removeEventListener('resize',resize); };
  }, []);
}
