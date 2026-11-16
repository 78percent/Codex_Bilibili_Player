import { useState } from "react";
import { useApp } from "../../state/store";
import { Icon } from "../../components/ui/Icon";
import { IconButton } from "../../components/ui/Button";
import { Menu } from "../../components/ui/Menu";
import { EditDialog, ConfirmDialog } from "../../components/ui/EditDialog";
export function ThreadRow({ thread }: any) {
  const { state, dispatch } = useApp();
  const [dialog, setDialog] = useState("");
  const patch = (value: any) =>
    dispatch({ type: "UPDATE_THREAD", id: thread.id, patch: value });
  return (
    <>
      <div
        className={`thread-row ${state.activeThread === thread.id && state.page === "thread" ? "selected" : ""}`}
      >
        <button
          className="thread-label"
          onClick={() => dispatch({ type: "SELECT_THREAD", id: thread.id })}
        >
          <span className={`thread-indicator ${thread.status}`}>
            {thread.status === "running" ? (
              <Icon name="LoaderCircle" size={13} />
            ) : thread.status === "waiting" ? (
              <Icon name="CircleAlert" size={13} />
            ) : thread.unread ? (
              "•"
            ) : null}
          </span>
          <span>{thread.title}</span>
        </button>
        <span className="thread-actions">
          <Menu
            align="right"
            trigger={<IconButton icon="Ellipsis" label="任务菜单" />}
            items={[
              {
                label: "重命名",
                icon: "Pencil",
                action: () => setDialog("rename"),
              },
              {
                label: thread.pinned ? "取消置顶" : "置顶",
                icon: "Pin",
                action: () => patch({ pinned: !thread.pinned }),
              },
              {
                label: thread.unread ? "标为已读" : "标为未读",
                icon: "Mail",
                action: () => patch({ unread: !thread.unread }),
              },
              {
                label: thread.archived ? "恢复任务" : "归档任务",
                icon: "Archive",
                action: () => patch({ archived: !thread.archived }),
              },
              { divider: true },
              {
                label: "删除",
                icon: "Trash2",
                danger: true,
                action: () => setDialog("delete"),
              },
            ]}
          />
        </span>
        <span className="thread-age">
          {Math.max(1, Math.round((Date.now() - thread.updatedAt) / 3600000))}h
        </span>
      </div>
      {dialog === "rename" && (
        <EditDialog
          title="重命名任务"
          initial={thread.title}
          onSave={(title: string) => patch({ title })}
          onClose={() => setDialog("")}
        />
      )}
      {dialog === "delete" && (
        <ConfirmDialog
          title="删除任务？"
          onConfirm={() => dispatch({ type: "DELETE_THREAD", id: thread.id })}
          onClose={() => setDialog("")}
        >
          {thread.title}
        </ConfirmDialog>
      )}
    </>
  );
}
