import { useState } from "react";
import { useApp } from "../../state/store";
import { Icon } from "../../components/ui/Icon";
import { stats } from "../review/diff";
import type { FileChange } from "../../state/types";
export function ChangeSummary({ files }: { files: FileChange[] }) {
  const { dispatch } = useApp();
  const [expanded, setExpanded] = useState(false);
  const count = stats(files);
  const open = (selectedFile = "") => dispatch({ type: "SET", value: { panelOpen: true, panelTab: "diff", selectedFile } });
  if (!files.length) return null;
  return <section className="change-summary">
    <header><span className="change-symbol"><Icon name="FileDiff" size={20} /></span><div><strong>已编辑 {files.length} 个文件</strong><span className="diff-stat"><b>+{count.added}</b><em>−{count.removed}</em></span></div><button onClick={() => open()}>查看变更</button></header>
    <div>{(expanded ? files : files.slice(0, 3)).map(file => {
      const n = stats([file]);
      return <button className="summary-file" key={file.path} onClick={() => open(file.path)}><span>{file.path}</span><b>+{n.added}</b><em>−{n.removed}</em></button>;
    })}</div>
    {files.length > 3 && <button className="summary-more" onClick={() => setExpanded(!expanded)}>{expanded ? "收起文件" : `再显示 ${files.length - 3} 个文件`}<Icon name={expanded ? "ChevronUp" : "ChevronDown"} size={14} /></button>}
  </section>;
}

