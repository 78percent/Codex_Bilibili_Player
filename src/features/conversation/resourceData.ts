import type { Thread } from "../../state/types";

export const outputPanels = [
  { id: "browser", label: "网页预览", icon: "Globe" },
  { id: "diff", label: "文件变更", icon: "FileDiff" },
  { id: "document", label: "文档", icon: "FileText" },
  { id: "terminal", label: "终端输出", icon: "SquareTerminal" },
];

export type ThreadSource = { id: string; name: string; image?: string; url?: string; content?: string };

export function threadSources(thread: Thread): ThreadSource[] {
  const sources = new Map<string, ThreadSource>();
  const add = (source: ThreadSource) => {
    const previous = sources.get(source.id);
    sources.set(source.id, { ...previous, ...source });
  };
  for (const message of thread.messages) {
    for (const name of message.attachments || []) add({ id: `file:${name}`, name });
    for (const image of message.images || []) add({ id: `file:${image.name}`, name: image.name, image: image.src });
    for (const tool of message.tools || []) {
      for (const source of tool.sources || []) {
        if (/^https?:\/\//i.test(source.url)) add({ id: source.url, name: source.title, url: source.url });
      }
      if (tool.file) add({ id: `file:${tool.file}`, name: tool.file, content: tool.output });
      if (tool.image) add({ id: tool.image, name: tool.label, image: tool.image });
    }
  }
  for (const name of thread.referenceFiles || []) add({ id: `file:${name}`, name });
  return [...sources.values()];
}
