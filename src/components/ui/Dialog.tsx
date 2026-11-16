import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { IconButton } from "./Button";
export function Dialog({ title, children, onClose, wide = false }: any) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement;
    const panel = ref.current!;
    const focusables = () => [
      ...panel.querySelectorAll<HTMLElement>(
        'button:not(:disabled),input,textarea,select,[tabindex="0"]',
      ),
    ];
    (focusables()[0] || panel).focus();
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onClose();
      }
      if (event.key === "Tab") {
        const items = focusables();
        const first = items[0],
          last = items[items.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        }
        if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("keydown", key);
      previous?.focus();
    };
  }, []);
  return createPortal(
    <div
      className="modal-scrim"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        ref={ref}
        tabIndex={-1}
        className={`dialog ${wide ? "wide" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <header>
          <h2>{title}</h2>
          <IconButton icon="X" label="关闭" onClick={onClose} />
        </header>
        {children}
      </div>
    </div>,
    document.body,
  );
}
