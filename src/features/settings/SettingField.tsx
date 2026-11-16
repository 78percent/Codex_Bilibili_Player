import { useApp } from "../../state/store";
export function SettingField({ field }: any) {
  const { state, dispatch } = useApp();
  const value = state.settings[field.key] ?? field.default;
  const set = (value: any) =>
    dispatch({ type: "SETTINGS", value: { [field.key]: value } });
  return (
    <div
      className={`setting-row ${field.type === "textarea" ? "stacked" : ""}`}
    >
      <label htmlFor={`setting-${field.key}`}>{field.label}</label>
      {field.type === "toggle" ? (
        <button
          id={`setting-${field.key}`}
          role="switch"
          aria-checked={!!value}
          aria-label={field.label}
          className={`switch ${value ? "on" : ""}`}
          onClick={() => set(!value)}
        >
          <span />
        </button>
      ) : field.type === "select" ? (
        <select
          id={`setting-${field.key}`}
          value={value}
          onChange={(e) => set(e.target.value)}
        >
          {field.options.map((option: string) => (
            <option key={option} value={option}>
              {({ light: "浅色", dark: "深色", system: "跟随系统" } as any)[
                option
              ] || option}
            </option>
          ))}
        </select>
      ) : field.type === "textarea" ? (
        <textarea
          id={`setting-${field.key}`}
          data-text-kind={field.textKind}
          rows={4}
          value={value}
          onChange={(e) => set(e.target.value)}
        />
      ) : (
        <input
          id={`setting-${field.key}`}
          value={value}
          onChange={(e) => set(e.target.value)}
        />
      )}
    </div>
  );
}
