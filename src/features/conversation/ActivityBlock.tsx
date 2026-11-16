import { useState } from "react";
import { Icon } from "../../components/ui/Icon";
import type { ToolCall } from "../../state/types";
export function ActivityBlock({ tool }: { tool: ToolCall }) {
  const [open, setOpen] = useState(false);
  const icon = tool.kind === "web" ? "Globe" : tool.kind === "image" ? "Image" : "Sparkles";
  return <div className={`activity-block ${tool.kind}`}>
    <button className="activity-summary" onClick={() => setOpen(!open)} aria-expanded={open}>
      <Icon name={tool.status === "running" ? "LoaderCircle" : icon} size={15} className={tool.status === "running" ? "spin" : ""} />
      <span>{tool.label}</span><Icon name={open ? "ChevronDown" : "ChevronRight"} size={13} />
    </button>
    {open && <div className="activity-detail">
      {tool.output && <p>{tool.output}</p>}
      {tool.sources?.map(source => <div className="source-result" key={source.url}><Icon name="Globe" size={16} /><div><strong>{source.title}</strong><span>{source.url}</span></div></div>)}
      {tool.image && <figure><img src={tool.image} alt="示例界面布局" /><figcaption>workspace-reference.svg</figcaption></figure>}
    </div>}
  </div>;
}

