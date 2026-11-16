import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { Icon } from "../../components/ui/Icon";
import { ModelPicker, modelLabel } from "./ModelPicker";

const efforts = ["低", "中", "高", "极高", "Ultra"];
const stars = [
  [7, 35, 5.3, -1.2, 4], [11, 67, 7.1, -3.7, 6], [17, 43, 4.7, -2.1, 3],
  [23, 28, 6.8, -4.4, 5], [29, 70, 5.9, -1.8, 4], [35, 46, 8.1, -5.2, 6],
  [41, 61, 6.3, -3.2, 3], [47, 36, 4.9, -2.9, 5], [52, 73, 7.7, -4.9, 4],
  [58, 29, 5.6, -1.1, 6], [64, 51, 8.4, -6.1, 3], [70, 66, 6.6, -2.6, 5],
  [76, 39, 5.1, -3.9, 4], [82, 58, 7.4, -5.5, 6], [89, 32, 6.1, -2.3, 3],
];

function ReasoningSlider({ effort, onChange }: {
  effort: string; onChange: (value: string) => void;
}) {
  const level = Math.max(0, efforts.indexOf(effort));
  return (
    <div className={`reasoning-slider ${level === 4 ? "is-ultra" : ""}`}>
      <div className="reasoning-slider-progress" style={{ width: `calc(${level * 25}% + ${36 - level * 9}px)` }} aria-hidden="true">
        <div className="reasoning-slider-fill">
          <div className="reasoning-starfield">
            {stars.map(([left, top, duration, delay, travel], index) => (
              <i key={index} style={{ left: `${left}%`, top: `${top}%`,
                "--star-duration": `${duration}s`, "--star-delay": `${delay}s`, "--star-travel": `${travel}px`,
              } as CSSProperties} />
            ))}
          </div>
        </div>
        <div className="reasoning-slider-thumb" />
      </div>
      <div className="reasoning-stops" aria-hidden="true">
        {efforts.map((value, index) => <i key={value} className={index <= level ? "reached" : ""} />)}
      </div>
      <input type="range" min={0} max={4} step={1} value={level} aria-label="推理强度" aria-valuetext={efforts[level]}
        onChange={(event) => onChange(efforts[Number(event.target.value)])} />
    </div>
  );
}

export function ReasoningControl({ model, effort, onChange }: {
  model: string; effort: string; onChange: (value: { model?: string; effort?: string }) => void;
}) {
  const [panel, setPanel] = useState<"reasoning" | "models" | null>(null);
  const [position, setPosition] = useState({ left: 0, top: 0 });
  const trigger = useRef<HTMLButtonElement>(null);
  const popover = useRef<HTMLDivElement>(null);
  const selectedModel = modelLabel(model);
  const selectedEffort = efforts.includes(effort) ? effort : "高";

  useLayoutEffect(() => {
    if (!panel) return;
    const place = () => {
      const anchor = trigger.current?.getBoundingClientRect();
      const floating = popover.current?.getBoundingClientRect();
      if (!anchor || !floating) return;
      const margin = 12;
      const above = anchor.top - floating.height - 8;
      const desiredTop = above >= margin ? above : anchor.bottom + 8;
      setPosition({
        left: Math.max(margin, Math.min(anchor.right - floating.width, window.innerWidth - floating.width - margin)),
        top: Math.max(margin, Math.min(desiredTop, window.innerHeight - floating.height - margin)),
      });
    };
    place();
    const resize = new ResizeObserver(place);
    if (popover.current) resize.observe(popover.current);
    if (trigger.current) resize.observe(trigger.current);
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      resize.disconnect();
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [panel]);

  useEffect(() => {
    if (!panel) return;
    if (panel === "reasoning") popover.current?.querySelector<HTMLInputElement>('input[type="range"]')?.focus();
    const outside = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!popover.current?.contains(target) && !trigger.current?.contains(target)) setPanel(null);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      setPanel(null);
      trigger.current?.focus();
    };
    const blur = (event: FocusEvent) => {
      const target = event.target as Node;
      if (!popover.current?.contains(target) && !trigger.current?.contains(target)) setPanel(null);
    };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    document.addEventListener("focusin", blur);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", escape);
      document.removeEventListener("focusin", blur);
    };
  }, [panel]);

  return (
    <>
      <button ref={trigger} className={`reasoning-trigger ${panel ? "is-open" : ""}`}
        aria-haspopup="dialog" aria-expanded={!!panel} aria-label={`选择推理强度，${selectedModel}，${selectedEffort}`}
        title={`${selectedModel} · ${selectedEffort}`} onClick={() => setPanel(panel ? null : "reasoning")}>
        <span>{panel ? "选择推理强度" : <>{selectedModel} <span className={selectedEffort === "Ultra" ? "reasoning-effort is-ultra" : "reasoning-effort"}>{selectedEffort}</span></>}</span><Icon name="ChevronDown" size={13} />
      </button>
      {panel && createPortal(
        <div ref={popover} role="dialog" aria-label={panel === "models" ? "选择模型" : "选择推理强度"}
          className={`reasoning-popover ${panel === "models" ? "show-models" : ""}`} style={position}>
          {panel === "models" ? (
            <ModelPicker model={selectedModel} onSelect={(value) => { onChange({ model: value }); setPanel("reasoning"); }} />
          ) : (
            <div className="reasoning-card">
              <button className="reasoning-reset" aria-label="恢复默认" title="恢复默认"
                onClick={() => onChange({ model: "6 Astra", effort: "高" })}><Icon name="RotateCcw" size={18} /></button>
              <div className={`reasoning-value ${selectedEffort === "Ultra" ? "is-ultra" : ""}`} aria-live="polite">{selectedEffort}</div>
              <button className="reasoning-model" onClick={() => setPanel("models")} aria-haspopup="menu">
                {selectedModel}<Icon name="ChevronRight" size={13} />
              </button>
              <ReasoningSlider effort={selectedEffort} onChange={(value) => onChange({ effort: value })} />
            </div>
          )}
        </div>, document.body,
      )}
    </>
  );
}
