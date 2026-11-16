import { useState } from "react";
import { Icon } from "../../components/ui/Icon";
import type { Subagent } from "../../state/types";

const statusLabels = { running: "进行中", complete: "完成", waiting: "等待中" };
export function SubagentSummary({ agents }: { agents: Subagent[] }) {
  const [expanded, setExpanded] = useState(false);
  if (!agents.length) return null;
  const running = agents.filter(agent => agent.status === "running").length;
  const waiting = agents.filter(agent => agent.status === "waiting").length;
  const complete = agents.filter(agent => agent.status === "complete").length;
  return <section className="subagent-summary">
    <header><span>子智能体</span></header>
    <button className="resource-row subagent-summary-row" onClick={() => setExpanded(!expanded)} aria-expanded={expanded}>
      <span className="subagent-symbols">{agents.slice(0, 4).map(agent => <Icon key={agent.id} name={agent.icon} size={14} className={`subagent-symbol ${agent.color}`} />)}</span>
      <span>{running ? `${running} 进行中` : waiting ? `${waiting} 等待中` : `${complete} 完成`}</span>
    </button>
    {expanded && <div className="subagent-details">{agents.map(agent => <div className="subagent-detail" key={agent.id}>
      <Icon name={agent.icon} size={14} className={`subagent-symbol ${agent.color}`} />
      <div><span>{agent.name}</span><p>{agent.task}</p></div><small>{statusLabels[agent.status]}</small>
    </div>)}</div>}
  </section>;
}
