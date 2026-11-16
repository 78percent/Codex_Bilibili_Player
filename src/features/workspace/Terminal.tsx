import { useState, useEffect, useRef } from "react";
import { useApp, useThread } from "../../state/store";
import { IconButton } from "../../components/ui/Button";
export function Terminal() {
  const { state, dispatch } = useApp();
  const thread = useThread();
  const [command, setCommand] = useState("");
  const bottom = useRef<HTMLDivElement>(null);
  useEffect(
    () => bottom.current?.scrollIntoView({ block: "end" }),
    [thread?.terminal.length],
  );
  const execute = () => {
    if (!thread || !command.trim()) return;
    const cmd = command.trim();
    let output = "";
    if (cmd === "clear") {
      dispatch({
        type: "UPDATE_THREAD",
        id: thread.id,
        patch: { terminal: ["$"] },
      });
      setCommand("");
      return;
    }
    if (cmd === "help")
      output =
        "本地工作区命令：pwd · ls · cat <file> · git status · git diff · git log · clear";
    else if (cmd === "pwd")
      output =
        state.projects.find((p) => p.id === thread.projectId)?.path ||
        "/workspace";
    else if (cmd === "ls" || cmd === "dir")
      output = thread.files.map((f) => f.path).join("\n");
    else if (cmd.startsWith("cat "))
      output =
        thread.files.find((f) => f.path === cmd.slice(4))?.after ||
        "文件不存在";
    else if (cmd === "git status" || cmd === "git status --short")
      output =
        `On branch ${thread.branch}\n` +
        thread.files
          .map((f) => `${f.staged ? "M " : " M"} ${f.path}`)
          .join("\n");
    else if (cmd.startsWith("git diff"))
      output = thread.files
        .map(
          (f) =>
            `diff --git a/${f.path} b/${f.path}\n--- a/${f.path}\n+++ b/${f.path}\n${f.after
              .split("\n")
              .map((l) => "+" + l)
              .join("\n")}`,
        )
        .join("\n");
    else if (cmd === "git log")
      output = `a71c93d (HEAD -> ${thread.branch}) ${thread.title}\n39b82f1 refactor: consolidate shared state\n8ac13d0 feat: add workspace boundaries`;
    else output = `未配置该命令的演示输出。输入 help 查看本地工作区命令。`;
    dispatch({ type: "TERMINAL", command: cmd, output });
    setCommand("");
  };
  return (
    <div className="terminal">
      <div className="terminal-toolbar">
        <span>PowerShell</span>
        <span className="spacer" />
        <IconButton
          icon="Trash2"
          label="清空终端"
          onClick={() =>
            thread &&
            dispatch({
              type: "UPDATE_THREAD",
              id: thread.id,
              patch: { terminal: ["$"] },
            })
          }
        />
      </div>
      <div className="terminal-output">
        <pre>{(thread?.terminal || ["$"]).join("\n")}</pre>
        <div ref={bottom} />
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          execute();
        }}
      >
        <span>❯</span>
        <input
          aria-label="终端命令"
          spellCheck={false}
          value={command}
          onChange={(e) => setCommand(e.target.value)}
        />
      </form>
    </div>
  );
}
