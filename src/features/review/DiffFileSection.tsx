import { useId, useMemo } from "react";
import type { FileChange } from "../../state/types";
import { Icon } from "../../components/ui/Icon";
import { Button, IconButton } from "../../components/ui/Button";
import { Menu } from "../../components/ui/Menu";
import { diffLines } from "./diff";
import { CodeLine } from "./CodeLine";
import { ReviewFileIcon } from "./ReviewFileIcon";

type DiffFileSectionProps = {
  file: FileChange;
  open: boolean;
  mode: "split" | "unified";
  comments: Record<string, string>;
  commentLine: string;
  register: (element: HTMLElement | null) => void;
  onToggle: () => void;
  onStage: () => void;
  onOpenEditor: () => void;
  onCommentLine: (line: string) => void;
  onCommentChange: (line: string, value: string) => void;
  onSaveComment: () => void;
};

export function DiffFileSection({
  file, open, mode, comments, commentLine, register, onToggle,
  onStage, onOpenEditor, onCommentLine, onCommentChange, onSaveComment,
}: DiffFileSectionProps) {
  const contentId = useId();
  const rows = useMemo(() => diffLines(file.before, file.after), [file.before, file.after]);
  const added = rows.filter((row) => row.kind === "add").length;
  const removed = rows.filter((row) => row.kind === "remove").length;
  const separator = Math.max(file.path.lastIndexOf("/"), file.path.lastIndexOf("\\"));
  const directory = file.path.slice(0, separator + 1);
  const filename = file.path.slice(separator + 1);

  return (
    <section className={`diff-file-section ${open ? "is-open" : ""}`}>
      <header ref={register} className="diff-file-heading">
        <button
          className="diff-file-toggle"
          aria-expanded={open}
          aria-controls={contentId}
          title={file.path}
          onClick={onToggle}
        >
          <ReviewFileIcon path={file.path} />
          <span className="diff-file-path"><span className="diff-file-directory">{directory}</span><span className="diff-file-name">{filename}</span></span>
          {file.staged && <span className="diff-file-staged" title="已暂存" aria-label="已暂存"><Icon name="Check" size={12} /></span>}
          <span className="diff-stat"><b>+{added}</b><em>-{removed}</em></span>
        </button>
        <IconButton icon="ExternalLink" label={`打开文件 ${filename}`} onClick={onOpenEditor} />
        <Menu
          align="right"
          trigger={<IconButton icon="Ellipsis" label={`${filename} 更多操作`} />}
          items={[
            { label: open ? "折叠差异" : "展开差异", icon: open ? "ChevronUp" : "ChevronDown", action: onToggle },
            { label: "在编辑器中打开", icon: "ExternalLink", action: onOpenEditor },
            { divider: true },
            { label: file.staged ? "取消暂存" : "暂存文件", icon: file.staged ? "Minus" : "Plus", action: onStage },
          ]}
        />
      </header>
      {open && (
        <div className="diff-document" id={contentId}>
          {mode === "split" ? (
            <div className="split-code"><pre>{file.before || " "}</pre><pre>{file.after || " "}</pre></div>
          ) : (
            <div className="diff-lines">
              {rows.map((row, index) => {
                const line = `${file.path}:${index}`;
                return (
                  <div key={line}>
                    <div className={`diff-line ${row.kind}`} onDoubleClick={() => onCommentLine(line)}>
                      <span className="line-number">{row.old}</span>
                      <span className="line-number">{row.next}</span>
                      <span className="diff-sign">{row.kind === "add" ? "+" : row.kind === "remove" ? "−" : " "}</span>
                      <code><CodeLine text={row.text || " "} /></code>
                      <button className="line-comment" title="添加评论" aria-label={`为 ${filename} 第 ${row.next || row.old} 行添加评论`} onClick={() => onCommentLine(line)}>+</button>
                    </div>
                    {commentLine === line && (
                      <div className="inline-comment">
                        <textarea
                          aria-label="行内评论"
                          placeholder="添加评论…"
                          value={comments[line] || ""}
                          onChange={(event) => onCommentChange(line, event.target.value)}
                        />
                        <Button onClick={onSaveComment}>保存评论</Button>
                      </div>
                    )}
                    {comments[line] && commentLine !== line && (
                      <div className="saved-comment"><Icon name="MessageSquare" size={13} />{comments[line]}</div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
