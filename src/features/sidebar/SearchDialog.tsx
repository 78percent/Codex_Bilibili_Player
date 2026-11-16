import { useState } from "react";
import { useApp } from "../../state/store";
import { Dialog } from "../../components/ui/Dialog";
import { Icon } from "../../components/ui/Icon";
export function SearchDialog() {
  const { state, dispatch } = useApp();
  const [query, setQuery] = useState("");
  const matches = state.threads
    .filter((t) =>
      (t.title + " " + t.messages.map((m) => m.text).join(" "))
        .toLowerCase()
        .includes(query.toLowerCase()),
    )
    .slice(0, 24);
  return (
    <Dialog
      title="搜索任务"
      onClose={() => dispatch({ type: "SET", value: { searchOpen: false } })}
    >
      <div className="search-input">
        <Icon name="Search" />
        <input
          placeholder="搜索任务、代码或项目…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />
      </div>
      <div className="search-results">
        {matches.map((t) => (
          <button
            key={t.id}
            onClick={() => {
              dispatch({ type: "SELECT_THREAD", id: t.id });
              dispatch({ type: "SET", value: { searchOpen: false } });
            }}
          >
            <Icon name={t.archived ? "Archive" : "MessageSquare"} size={17} />
            <span>
              {t.title}
              <small>
                {state.projects.find((p) => p.id === t.projectId)?.name ||
                  t.projectId}
              </small>
            </span>
            <Icon name="ArrowUpRight" size={15} />
          </button>
        ))}
        {!matches.length && <div className="empty-state">没有找到相关任务</div>}
      </div>
    </Dialog>
  );
}
