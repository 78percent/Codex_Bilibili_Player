import { useState } from "react";
import { useApp, useThread } from "../../state/store";
import { Icon } from "../../components/ui/Icon";
import { IconButton } from "../../components/ui/Button";
import { Markdown } from "../conversation/Markdown";
export function BrowserPreview() {
  const [path, setPath] = useState("http://localhost:3000/workspaces/atlas");
  const [section, setSection] = useState("Overview");
  return (
    <div className="browser-preview">
      <div className="address-bar">
        <IconButton
          icon="ArrowLeft"
          label="后退"
          onClick={() => setSection("Overview")}
        />
        <IconButton
          icon="RotateCw"
          label="刷新"
          onClick={() => setSection("Overview")}
        />
        <Icon name="LockKeyhole" size={12} />
        <input
          aria-label="预览地址"
          value={path}
          onChange={(e) => setPath(e.target.value)}
        />
      </div>
      <div className="fake-web">
        <header>
          <span className="atlas-symbol">A</span>
          <b>Atlas</b>
          <span className="spacer" />
          <span className="avatar">L</span>
        </header>
        <nav>
          {["Overview", "Members", "Settings"].map((item) => (
            <button
              key={item}
              className={item === section ? "selected" : ""}
              onClick={() => setSection(item)}
            >
              {item}
            </button>
          ))}
        </nav>
        <h2>
          {section === "Overview"
            ? "Workspace overview"
            : section === "Members"
              ? "Team members"
              : "Workspace settings"}
        </h2>
        {section === "Overview" ? (
          <>
            <div className="metrics">
              <div>
                <small>Active projects</small>
                <strong>12</strong>
                <span>+3 this month</span>
              </div>
              <div>
                <small>Team members</small>
                <strong>24</strong>
                <span>Across 4 teams</span>
              </div>
            </div>
            <h3>Recent activity</h3>
            {[
              "Workspace permissions updated",
              "Routing cache migrated",
              "Members synchronized",
            ].map((t, i) => (
              <div className="activity-row" key={t}>
                <Icon name="CircleCheck" size={17} />
                <span>{t}</span>
                <small>{i + 2}m ago</small>
              </div>
            ))}
          </>
        ) : section === "Members" ? (
          [
            "Lin Chen · Owner",
            "Alex Rivera · Developer",
            "Maya Patel · Designer",
          ].map((t) => (
            <div className="activity-row" key={t}>
              <span className="avatar">{t[0]}</span>
              {t}
            </div>
          ))
        ) : (
          <label className="field">
            Workspace name
            <input defaultValue="Atlas Console" />
          </label>
        )}
      </div>
    </div>
  );
}
export function DocumentPreview() {
  const thread = useThread();
  const { state } = useApp();
  const project = state.projects.find((p) => p.id === thread?.projectId);
  return (
    <div className="document-preview">
      <span className="eyebrow">{project?.name} / docs</span>
      <Markdown
        text={`# ${thread?.title || "项目记录"}\n\n## 变更说明\n${thread?.messages.filter((m) => m.role === "assistant").slice(-1)[0]?.text || "选择任务以查看关联记录。"}\n\n## 文件清单\n${thread?.files.map((f) => "- " + f.path).join("\n") || ""}`}
      />
    </div>
  );
}
