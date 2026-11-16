import { useApp } from "../../state/store";
import { EditDialog, ConfirmDialog } from "../../components/ui/EditDialog";
export function ProjectDialogs({ dialog, onClose }: any) {
  const { state, dispatch } = useApp();
  return (
    <>
      {dialog?.type === "new" && (
        <EditDialog
          title="新建项目"
          onClose={() => onClose()}
          onSave={(name: string) => {
            const p = {
              id: crypto.randomUUID(),
              name,
              path: `D:/workspace/${name}`,
              stack: "Local workspace",
              description: "",
              color: "#899b93",
            };
            dispatch({
              type: "SET",
              value: {
                projects: [...state.projects, p],
                activeProject: p.id,
                page: "project",
              },
            });
          }}
        />
      )}
      {dialog?.type === "rename" && (
        <EditDialog
          title="重命名项目"
          initial={dialog.project.name}
          onClose={() => onClose()}
          onSave={(name: string) =>
            dispatch({
              type: "SET",
              value: {
                projects: state.projects.map((p) =>
                  p.id === dialog.project.id ? { ...p, name } : p,
                ),
              },
            })
          }
        />
      )}
      {dialog?.type === "delete" && (
        <ConfirmDialog
          title="移除项目？"
          onClose={() => onClose()}
          onConfirm={() => {
            dispatch({ type: "DELETE_PROJECT", id: dialog.project.id });
          }}
        >
          此项目的任务仍保留在搜索和历史中。
        </ConfirmDialog>
      )}
    </>
  );
}
