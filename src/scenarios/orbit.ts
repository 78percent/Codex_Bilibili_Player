export default {
  title: "修复多窗口布局同步与焦点恢复",
  branch: "fix/window-layout-sync",
  pr: 127,
  prompt:
    "分离工作区窗口后，调整右侧面板会影响主窗口。请把布局状态按窗口隔离，同时处理关闭弹窗之后的焦点恢复。",
  intro:
    "我会检查窗口 ID 如何进入布局 store，再处理弹窗焦点与主窗口状态的关联。",
  plan: [
    "定位跨窗口共享的布局状态",
    "将分栏尺寸按窗口存储",
    "恢复弹窗前的键盘焦点",
  ],
  command: 'rg "panelWidth|windowId|restoreFocus" src electron',
  output:
    'src/layout/store.ts:12: localStorage.getItem("panel-width")\nsrc/ui/Dialog.tsx:26: dialogRef.current.focus()\nelectron/windows.ts:44: createWindow(windowId)',
  read: "读取 src/layout/store.ts 与 src/ui/Dialog.tsx",
  analysis:
    "所有窗口写入同一个 panel-width key；共享存储事件又将值广播回主窗口。布局键需要包含窗口 ID，弹窗卸载时则应恢复到触发按钮。",
  response:
    "窗口布局状态已按窗口 ID 隔离。\n\n- 独立窗口使用自己的布局键，主窗口不再接收其分栏尺寸。\n- 弹窗关闭后恢复触发元素焦点，Escape 与遮罩关闭行为一致。\n- 拖动时保留光标与边界限制，窗口缩小时内容区仍有可用宽度。\n\n相关修改集中在 layout store、Dialog 和窗口初始化三个模块。",
  followups: [
    "统一窗口主题与标题栏",
    "编辑器标签拖动体验",
    "处理最小化后的状态恢复",
    "整理桌面端快捷键",
  ],
  files: [
    {
      path: "src/layout/store.ts",
      before:
        'const key = "panel-width";\nexport const width = Number(localStorage.getItem(key)) || 420;\n',
      after:
        "export function createLayoutStore(windowId: string) {\n  const key = `layout:${windowId}:panel-width`;\n  return persistedStore(key, { width: 420 });\n}\n",
      staged: false,
    },
    {
      path: "src/ui/Dialog.tsx",
      before: "useEffect(() => {\n  dialogRef.current?.focus();\n}, []);\n",
      after:
        "useEffect(() => {\n  const trigger = document.activeElement as HTMLElement;\n  dialogRef.current?.focus();\n  return () => trigger?.focus();\n}, []);\n",
      staged: false,
    },
    {
      path: "electron/windows.ts",
      before: "const window = new BrowserWindow(options);\n",
      after:
        "const window = new BrowserWindow({\n  ...options,\n  webPreferences: { ...options.webPreferences, additionalArguments: [`--window-id=${id}`] },\n});\n",
      staged: false,
    },
  ],
};
