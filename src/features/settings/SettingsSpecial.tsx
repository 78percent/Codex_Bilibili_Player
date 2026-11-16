import { useApp, useNotify } from "../../state/store";
import { Button } from "../../components/ui/Button";
import { Icon } from "../../components/ui/Icon";
export function SettingsSpecial({ section }: any) {
  const { state, dispatch } = useApp();
  const notify = useNotify();
  if (section === "keyboard-shortcuts")
    return (
      <div className="settings-card">
        {[
          ["新任务", "Ctrl + N"],
          ["搜索任务", "Ctrl + K"],
          ["显示/隐藏侧栏", "Ctrl + B"],
          ["设置", "Ctrl + ,"],
          ["发送消息", "Enter"],
          ["换行", "Shift + Enter"],
          ["保存当前文件", "Ctrl + S"],
          ["关闭弹窗", "Escape"],
        ].map(([label, key]) => (
          <div className="setting-row" key={label}>
            <span>{label}</span>
            <kbd>{key}</kbd>
          </div>
        ))}
      </div>
    );
  if (section === "usage")
    return (
      <>
        <div className="usage-card">
          <Icon name="Gauge" size={24} />
          <h3>使用情况</h3>
          <div className="usage-meter">
            <span style={{ width: "34%" }} />
          </div>
          <div className="spread">
            <span>5 小时使用限额</span>
            <strong>剩余 66%</strong>
          </div>
          <small>16:00 重置</small>
        </div>
        <div className="usage-card">
          <div className="spread">
            <h3>每周限额</h3>
            <strong>剩余 82%</strong>
          </div>
          <div className="usage-meter">
            <span style={{ width: "18%" }} />
          </div>
          <small>周一 09:00 重置</small>
        </div>
      </>
    );
  if (section === "archived-chats")
    return (
      <div className="settings-card">
        {state.threads
          .filter((t) => t.archived)
          .map((t) => (
            <div className="setting-row" key={t.id}>
              <span>{t.title}</span>
              <Button
                onClick={() =>
                  dispatch({
                    type: "UPDATE_THREAD",
                    id: t.id,
                    patch: { archived: false },
                  })
                }
              >
                恢复
              </Button>
            </div>
          ))}
        {!state.threads.some((t) => t.archived) && (
          <div className="empty-state">暂无归档聊天</div>
        )}
      </div>
    );
  if (section === "licenses")
    return (
      <div className="settings-card license-text">
        <h3>开源组件</h3>
        <p>React — MIT</p>
        <p>Electron — MIT</p>
        <p>Vite — MIT</p>
        <p>Lucide — ISC</p>
        <p>TypeScript — Apache-2.0</p>
        <p>
          原版 Codex 样式与资源仅作本地界面研究参照，来源记录位于项目 docs。
        </p>
      </div>
    );
  if (section === "about")
    return (
      <div className="about-card">
        <img src="./blossom.svg" alt="" />
        <h2>Codex Bilibili Player</h2>
        <p>版本 1.0.0</p>
        <p>独立的本地前端演示，为后续 Bilibili 播放器保留扩展空间。</p>
        <div className="about-details">
          <span>界面参照</span>
          <strong>Codex Windows 26.1103.7773.0</strong>
          <span>交互</span>
          <strong>预设场景 · 本地存储</strong>
          <span>数据</span>
          <strong>虚构项目与开发记录</strong>
        </div>
      </div>
    );
  if (section === "storage")
    return (
      <div className="settings-card">
        <div className="setting-row">
          <span>本地数据</span>
          <span>
            {(new Blob([JSON.stringify(state)]).size / 1024).toFixed(0)} KB
          </span>
        </div>
        <div className="setting-row">
          <span>导出工作区</span>
          <Button
            icon="Download"
            onClick={() => {
              const blob = new Blob([JSON.stringify(state, null, 2)], {
                type: "application/json",
              });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = "codex-workspace.json";
              a.click();
              URL.revokeObjectURL(url);
              notify("已导出本地工作区");
            }}
          >
            导出
          </Button>
        </div>
      </div>
    );
  return null;
}
