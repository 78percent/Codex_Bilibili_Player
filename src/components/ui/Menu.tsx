import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Icon } from "./Icon";
export function Menu({ trigger, items, align = "left" }: any) {
  const [anchor, setAnchor] = useState<DOMRect | null>(null);
  const triggerRef = useRef<HTMLSpanElement>(null),
    menuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!anchor) return;
    const close = (e: MouseEvent) => {
      if (
        !menuRef.current?.contains(e.target as Node) &&
        !triggerRef.current?.contains(e.target as Node)
      )
        setAnchor(null);
    };
    const key = (e: KeyboardEvent) => {
      const buttons = [
        ...(menuRef.current?.querySelectorAll<HTMLButtonElement>(
          "button:not(:disabled)",
        ) || []),
      ];
      if (e.key === "Escape") {
        setAnchor(null);
        triggerRef.current?.querySelector("button")?.focus();
      }
      if (["ArrowDown", "ArrowUp"].includes(e.key)) {
        e.preventDefault();
        const index = buttons.indexOf(
          document.activeElement as HTMLButtonElement,
        );
        buttons[
          (index + (e.key === "ArrowDown" ? 1 : -1) + buttons.length) %
            buttons.length
        ]?.focus();
      }
    };
    menuRef.current?.querySelector("button")?.focus();
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", key);
    };
  }, [anchor]);
  return (
    <>
      <span
        ref={triggerRef}
        className="menu-trigger"
        onClick={(e) => {
          e.stopPropagation();
          setAnchor(anchor ? null : e.currentTarget.getBoundingClientRect());
        }}
      >
        {trigger}
      </span>
      {anchor &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            className="menu"
            style={{
              left: Math.max(
                8,
                Math.min(
                  align === "right" ? anchor.right - 230 : anchor.left,
                  window.innerWidth - 242,
                ),
              ),
              top:
                anchor.bottom > window.innerHeight - 280
                  ? undefined
                  : anchor.bottom + 6,
              bottom:
                anchor.bottom > window.innerHeight - 280
                  ? window.innerHeight - anchor.top + 6
                  : undefined,
            }}
          >
            {items.map((item: any, i: number) =>
              item.divider ? (
                <hr key={i} />
              ) : (
                <button
                  role="menuitem"
                  key={i}
                  disabled={item.disabled}
                  className={item.danger ? "danger-text" : ""}
                  onClick={(e) => {
                    e.stopPropagation();
                    setAnchor(null);
                    item.action?.();
                  }}
                >
                  {item.icon && <Icon name={item.icon} size={16} />}
                  <span>{item.label}</span>
                  {item.selected && <Icon name="Check" size={15} />}{" "}
                  {item.shortcut && <kbd>{item.shortcut}</kbd>}
                </button>
              ),
            )}
          </div>,
          document.body,
        )}
    </>
  );
}
