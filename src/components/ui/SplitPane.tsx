export function ResizeHandle({
  value,
  onChange,
  reverse = false,
  min = 220,
  max = 620,
}: any) {
  return (
    <div
      className="resize-handle"
      role="separator"
      aria-label="调整面板宽度"
      aria-orientation="vertical"
      aria-valuenow={Math.round(value)}
      aria-valuemin={min}
      aria-valuemax={max}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "ArrowLeft" || e.key === "ArrowRight")
          onChange(
            Math.max(
              min,
              Math.min(
                max,
                value +
                  (e.key === "ArrowRight" ? 10 : -10) * (reverse ? -1 : 1),
              ),
            ),
          );
      }}
      onPointerDown={(e) => {
        const start = e.clientX;
        const target = e.currentTarget;
        target.setPointerCapture(e.pointerId);
        const move = (event: PointerEvent) =>
          onChange(
            Math.max(
              min,
              Math.min(
                max,
                value + (event.clientX - start) * (reverse ? -1 : 1),
              ),
            ),
          );
        const stop = () => {
          target.removeEventListener("pointermove", move);
          target.removeEventListener("pointerup", stop);
          target.removeEventListener("pointercancel", stop);
        };
        target.addEventListener("pointermove", move);
        target.addEventListener("pointerup", stop);
        target.addEventListener("pointercancel", stop);
      }}
    />
  );
}
