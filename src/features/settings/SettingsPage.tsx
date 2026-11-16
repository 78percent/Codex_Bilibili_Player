import { useState } from "react";
import { useApp, useNotify } from "../../state/store";
import { Icon } from "../../components/ui/Icon";
import { Button } from "../../components/ui/Button";
import { sections } from "./registry";
import { SettingField } from "./SettingField";
import { SettingsSpecial } from "./SettingsSpecial";
export function SettingsPage() {
  const { state, dispatch } = useApp();
  const notify = useNotify();
  const [query, setQuery] = useState("");
  const current =
    sections.find((s) => s.id === state.settingsSection) || sections[0];
  const groups = [...new Set(sections.map((s) => s.group))];
  return (
    <div className="settings-layout">
      <aside className="settings-nav">
        <div className="search-input compact">
          <Icon name="Search" size={15} />
          <input
            placeholder="搜索设置"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        {groups.map((group) => (
          <section key={group}>
            {sections.some(
              (s) =>
                s.group === group &&
                (s.label + s.id).toLowerCase().includes(query.toLowerCase()),
            ) && <h4>{group}</h4>}
            {sections
              .filter(
                (s) =>
                  s.group === group &&
                  (s.label + s.id).toLowerCase().includes(query.toLowerCase()),
              )
              .map((s) => (
                <button
                  className={s.id === current.id ? "selected" : ""}
                  key={s.id}
                  onClick={() =>
                    dispatch({ type: "SET", value: { settingsSection: s.id } })
                  }
                >
                  <Icon name={s.icon} size={16} />
                  {s.label}
                </button>
              ))}
          </section>
        ))}
      </aside>
      <div className="settings-scroll" key={current.id}>
        <div className="settings-content">
          <h1>{current.label}</h1>
          {current.id === "appearance" && (
            <div className="theme-previews">
              {["light", "dark", "system"].map((theme) => (
                <button
                  key={theme}
                  className={`${theme} ${state.settings.theme === theme ? "selected" : ""}`}
                  onClick={() =>
                    dispatch({ type: "SETTINGS", value: { theme } })
                  }
                >
                  <div className="theme-mini">
                    <aside />
                    <main>
                      <i />
                      <i />
                      <i />
                      <footer />
                    </main>
                  </div>
                  <span>
                    {theme === "light"
                      ? "浅色"
                      : theme === "dark"
                        ? "深色"
                        : "跟随系统"}
                  </span>
                </button>
              ))}
            </div>
          )}
          {current.fields.length > 0 && (
            <div className="settings-card">
              {current.fields.map((field) => (
                <SettingField key={field.key} field={field} />
              ))}
            </div>
          )}
          <SettingsSpecial section={current.id} />
          {[
            "connections",
            "mcp-settings",
            "cloud-environments",
            "local-environments",
            "hooks-settings",
          ].includes(current.id) && (
            <div className="settings-footer">
              <span className="status-pill">
                <span className="status-dot" />
                配置已保存
              </span>
              <Button
                variant="secondary"
                onClick={() => notify("配置已保存到本地演示工作区")}
              >
                保存配置
              </Button>
            </div>
          )}
          {current.id === "skills-settings" && (
            <Button
              icon="Shapes"
              onClick={() => dispatch({ type: "NAVIGATE", page: "skills" })}
            >
              管理技能
            </Button>
          )}
          {current.id === "plugins-settings" && (
            <Button
              icon="Blocks"
              onClick={() => dispatch({ type: "NAVIGATE", page: "apps" })}
            >
              管理应用
            </Button>
          )}
          {current.id === "teams" && (
            <div className="settings-card">
              {[
                "Lin Chen · Owner",
                "Alex Rivera · Developer",
                "Maya Patel · Designer",
              ].map((name) => (
                <div className="setting-row" key={name}>
                  <span className="avatar">{name[0]}</span>
                  <span>{name}</span>
                  <span className="chip">活跃</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
