export type Page =
  | "home"
  | "thread"
  | "project"
  | "automations"
  | "skills"
  | "apps"
  | "review"
  | "work"
  | "archive"
  | "profile";
export type ToolCall = {
  id: string;
  label: string;
  command: string;
  output: string;
  status: "done" | "running" | "approval" | "denied";
  file?: string;
  kind?: "thinking" | "web" | "image";
  sources?: { title: string; url: string }[];
  image?: string;
};
export type Message = {
  id: string;
  role: "user" | "assistant";
  text: string;
  tools?: ToolCall[];
  plan?: string[];
  createdAt: string;
  attachments?: string[];
  images?: { src: string; name: string }[];
  duration?: string;
  changes?: boolean;
};
export type FileChange = {
  path: string;
  before: string;
  after: string;
  staged?: boolean;
};
export type Thread = {
  id: string;
  projectId: string;
  title: string;
  messages: Message[];
  updatedAt: number;
  pinned?: boolean;
  archived?: boolean;
  unread?: boolean;
  status: "idle" | "running" | "waiting" | "stopped" | "complete";
  files: FileChange[];
  pr: number;
  branch: string;
  committed?: boolean;
  prState?: string;
  terminal: string[];
  outputPanels?: string[];
  referenceFiles?: string[];
  subagents?: Subagent[];
};
export type Subagent = {
  id: string;
  name: string;
  task: string;
  status: "running" | "complete" | "waiting";
  icon: string;
  color: "rose" | "blue" | "cyan";
};
export type Project = {
  id: string;
  name: string;
  path: string;
  color: string;
  stack: string;
  description: string;
};
export type Run = {
  threadId: string;
  step: number;
  offset: number;
  status: "running" | "waiting" | "stopped";
  response: string;
  approved?: boolean;
  runId: string;
  sceneTitle?: string;
  nextAt?: number;
  startedAt?: number;
  pausedAt?: number;
  pausedMs?: number;
  effort?: string;
  phase?: string;
};
export type Automation = {
  id: string;
  name: string;
  prompt: string;
  projectId: string;
  schedule: string;
  active: boolean;
  runs: { at: string; threadId: string; status: string }[];
};
export type AppState = {
  page: Page;
  activeThread: string;
  activeProject: string;
  projects: Project[];
  threads: Thread[];
  runs: Run[];
  automations: Automation[];
  settings: Record<string, any>;
  installed: string[];
  connected: string[];
  sidebarOpen: boolean;
  sidebarWidth: number;
  panelOpen: boolean;
  panelWidth: number;
  panelTab: string;
  searchOpen: boolean;
  toast: string;
  selectedFile: string;
  workTab: string;
  tabs: string[];
};
export type Action = { type: string; [key: string]: any };
