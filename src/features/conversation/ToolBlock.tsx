import { useState } from "react";
import { useApp } from "../../state/store";
import { Icon } from "../../components/ui/Icon";
import { Button } from "../../components/ui/Button";
import { ActivityBlock } from "./ActivityBlock";
export function ToolBlock({ tool, threadId }: any) {
  const [open, setOpen] = useState(tool.status === "approval");
  const { dispatch } = useApp();
  const approval = tool.status === "approval";
  if (tool.kind) return <ActivityBlock tool={tool} />;
  return (
    <div className={`tool-block ${approval ? "approval" : ""}`}>
      <button className="tool-summary" onClick={() => setOpen(!open)}>
        <Icon
          name={
            tool.status === "running"
              ? "LoaderCircle"
              : tool.status === "denied"
                ? "X"
                : approval
                  ? "ShieldQuestion"
                  : tool.command.includes("apply_patch") ? "Pencil" : tool.file ? "FileText" : "SquareTerminal"
          }
          size={14}
          className={tool.status === "running" ? "spin" : ""}
        />
        <span>{tool.status === "done" && tool.command.includes("apply_patch") ? "编辑了文件" : tool.label === "搜索工作区" ? "运行了命令" : tool.label}</span>
        <Icon name={open ? "ChevronDown" : "ChevronRight"} size={13} className="tool-chevron" />
      </button>
      {(open || approval) && (
        <div className="tool-detail">
          <div className="command-line">
            <Icon name="Terminal" size={14} />
            <code>{tool.command}</code>
          </div>
          <pre>{tool.output || "正在执行…"}</pre>
          {tool.file && (
            <Button
              icon="FileCode2"
              onClick={() =>
                dispatch({
                  type: "SET",
                  value: {
                    panelOpen: true,
                    panelTab: "file",
                    selectedFile: tool.file,
                  },
                })
              }
            >
              {tool.file.split("/").pop()}
            </Button>
          )}
          {approval && (
            <div className="approval-actions">
              <Button
                variant="primary"
                onClick={() =>
                  dispatch({ type: "APPROVAL", id: threadId, approved: true })
                }
              >
                允许这次操作
              </Button>
              <Button
                onClick={() =>
                  dispatch({ type: "APPROVAL", id: threadId, approved: false })
                }
              >
                拒绝
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
