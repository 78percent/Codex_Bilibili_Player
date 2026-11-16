import type { Thread, FileChange, ToolCall } from "../state/types";
import { demoFiles, referenceActivities } from "./desktopDemo";

const additions: [string, string][] = [
  ["src/conversation/ModelPicker.tsx", 'const models = ["6.1 Sol", "6 Astra", "6 Sol", "6 Luna",\n  "5.6 Sol", "5.6 Terra", "5.6 Luna"];\n\nexport function ModelPicker({ value, onChange }) {\n  return <ModelList options={models} value={value} onChange={onChange} />;\n}'],
  ["src/conversation/ReasoningControl.tsx", 'const levels = ["低", "中", "高", "极高", "Ultra"];\n\nexport function ReasoningControl({ model, value }) {\n  return (\n    <Popover>\n      <ModelPicker value={model} />\n      <StrengthSlider levels={levels} value={value} />\n    </Popover>\n  );\n}'],
  ["src/conversation/AstraTrack.tsx", 'export function AstraTrack({ particles }) {\n  return (\n    <div className="astra-track">\n      {particles.map(point => (\n        <i key={point.id} style={point.motion} />\n      ))}\n    </div>\n  );\n}'],
  ["src/conversation/Composer.tsx", 'export function Composer() {\n  return (\n    <section className="composer">\n      <AttachmentStrip />\n      <textarea placeholder="随心输入" />\n      <div className="composer-controls">\n        <PermissionPicker />\n        <ReasoningControl />\n        <SendButton />\n      </div>\n    </section>\n  );\n}'],
  ["src/conversation/NewChat.tsx", 'export function NewChat() {\n  return (\n    <main className="new-chat">\n      <h1>我们要构建什么？</h1>\n      <footer>\n        <ProjectPicker />\n        <Composer />\n      </footer>\n    </main>\n  );\n}'],
  ["src/conversation/AssistantTurn.tsx", 'export function AssistantTurn({ process, reply }) {\n  return (\n    <article>\n      <ProcessSummary messages={process} />\n      <Markdown text={reply.text} />\n      <ChangeSummary files={reply.files} />\n    </article>\n  );\n}'],
  ["src/review/DiffFileSection.tsx", 'export function DiffFileSection({ file, open, onToggle }) {\n  return (\n    <section>\n      <FileHeader file={file} onClick={onToggle} />\n      {open && <DiffLines before={file.before} after={file.after} />}\n    </section>\n  );\n}'],
  ["src/styles/fonts.css", '@font-face {\n  font-family: "Open Sans";\n  src: url("./fonts/open-sans.ttf") format("truetype");\n  font-weight: 400;\n  font-style: normal;\n}'],
  ["src/styles/astra.css", '.astra-track {\n  background: linear-gradient(100deg, #2443dc, #9354ff, #ba76ff);\n}\n\n.astra-track i {\n  animation: float-point var(--period) ease-in-out infinite alternate;\n}\n\n@keyframes float-point {\n  from { transform: translateY(-4px); }\n  to { transform: translateY(5px); }\n}'],
  ["src/state/preferences.ts", 'export const preferences = {\n  model: "6 Astra",\n  effort: "高",\n  videoOpen: false,\n  homePanelOpen: false,\n};'],
  ["src/styles/new-chat.css", '.new-chat {\n  display: flex;\n  flex-direction: column;\n  height: 100%;\n}\n\n.new-chat footer {\n  width: min(750px, 90%);\n  margin: auto auto 16px;\n}'],
  ["docs/composer-design.md", '# 输入区设计\n\n模型和推理强度使用独立浮层。\nAstra 轨道使用慢速漂浮光点。\n减少动态效果时保留静态渐变。'],
];
export const composerDemoFiles: FileChange[] = [
  ...demoFiles,
  ...additions.map(([path, after]) => ({ path, before: "", after })),
];
const command = (id: string, label: string, output: string): ToolCall => ({ id, label, command: label.includes("编辑") ? "apply_patch" : "读取组件与样式", output, status: "done" });
export function createComposerDemo(now = Date.now()): Thread {
  return {
    id: "desktop-demo-composer", projectId: "orbit", title: "调整输入区、模型切换与 Astra 动画",
    updatedAt: now + 5000, status: "complete", pr: 0, branch: "feat/composer-motion",
    files: composerDemoFiles.map(file => ({ ...file })), terminal: ["$ git diff --stat", "16 files changed", "$"],
    messages: [
      { id: "composer-demo-user", role: "user", text: "把输入区和模型选择做成参考图里的样子，加入 Astra 的渐变光点，整理新聊天页和正常的回复结构。", createdAt: "15:20", images: [{ src: "./workspace-reference.svg", name: "界面参考示意" }] },
      { id: "composer-demo-observe", role: "assistant", text: "我会先对齐输入区和模型浮层的层级，再整理新聊天页的留白。变更区默认展示文件列表，点开一行再看代码。", createdAt: "15:20", tools: [command("composer-inspect", "运行了命令", "Composer → ReasoningControl → ModelPicker\nConversation → AssistantTurn")] },
      { id: "composer-demo-research", role: "assistant", text: "模型列表从浮层底部向上进入。推理强度保留离散刻度，Astra 使用蓝紫渐变，各个光点使用不同的周期和起始位置。", createdAt: "15:21", tools: referenceActivities("composer-reference").filter(tool => tool.kind !== "thinking") },
      { id: "composer-demo-edit", role: "assistant", text: "新聊天的标题放在页面中央，项目选择条与输入框贴在底部。聊天里的过程说明合并在“用时”下面，操作记录用一行灰色文字呈现。", createdAt: "15:22", tools: [command("composer-edit", "编辑了文件运行了命令", "更新了输入区、模型菜单、对话布局和字体样式。视频区域保持空渲染窗口。")] },
      { id: "composer-demo-package", role: "assistant", text: "字体作为本地资源随应用打包。变更列表、模型选择和过程展开状态继续保存在当前工作区。", createdAt: "15:23", tools: [command("composer-read", "读取了 4 个文件", "Open Sans Regular\n模型、强度、分栏与过程状态各自维护。\n")] },
      { id: "composer-demo-result", role: "assistant", duration: "3 分钟 12 秒", text: "已调整输入区、模型选择、新聊天页与变更列表。\n\n- 点击模型与强度入口，打开推理强度浮层；再点模型名称可切换模型。\n- 选择 6 Astra 后，轨道显示渐变和浮动光点。\n- 点击上面的用时行，展开过程记录。\n\n视频窗口保留在右侧底部，默认收起。", changes: true, createdAt: "15:24" },
    ],
  };
}
