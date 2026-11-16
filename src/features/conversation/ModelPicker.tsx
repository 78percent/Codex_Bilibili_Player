import { useEffect, useRef } from "react";
import { Icon } from "../../components/ui/Icon";

const models = ["6.1 Sol", "6 Astra", "6 Sol", "6 Luna", "5.6 Sol", "5.6 Terra", "5.6 Luna"];
const legacyNames: Record<string, string> = {
  "GPT-6.1": "6.1 Sol", "GPT-6": "6 Sol", "GPT-6 mini": "6 Luna", "GPT-5.6": "5.6 Sol",
};

export function modelLabel(model: string) {
  return legacyNames[model] || model || "6 Astra";
}

export function ModelPicker({ model, onSelect }: {
  model: string;
  onSelect: (model: string) => void;
}) {
  const list = useRef<HTMLDivElement>(null);
  const selected = modelLabel(model);
  useEffect(() => {
    list.current?.querySelector<HTMLButtonElement>('[aria-checked="true"]')?.focus();
  }, []);
  return (
    <div className="model-picker">
      <div className="model-picker-title" id="composer-model-title">选择模型</div>
      <div ref={list} role="menu" aria-labelledby="composer-model-title" onKeyDown={(event) => {
        if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
        event.preventDefault();
        const buttons = Array.from(list.current?.querySelectorAll<HTMLButtonElement>("button") || []);
        const current = buttons.indexOf(document.activeElement as HTMLButtonElement);
        const index = event.key === "Home" ? 0 : event.key === "End" ? buttons.length - 1
          : (current + (event.key === "ArrowDown" ? 1 : -1) + buttons.length) % buttons.length;
        buttons[index]?.focus();
      }}>
        <button className="model-picker-default" role="menuitemradio" aria-checked={selected === "默认"} onClick={() => onSelect("默认")}>
          <span>默认<small>推荐模型集</small></span>
          {selected === "默认" && <Icon name="Check" size={18} />}
        </button>
        {models.map((name) => (
          <button key={name} role="menuitemradio" aria-checked={selected === name} onClick={() => onSelect(name)}>
            <span>{name}</span>
            {selected === name && <Icon name="Check" size={18} />}
          </button>
        ))}
      </div>
    </div>
  );
}
