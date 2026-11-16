import { scenarios } from "./index";
import { desktopScenario } from "./desktopScenario";
import type { FileChange } from '../state/types';
type Scenario = Omit<(typeof scenarios)[string], 'files'> & { files: FileChange[] };
export const variants: Record<string, (Partial<Scenario> & { title: string })[]> = {};
variants.atlas = [
  {
    title: "切换租户时清理悬挂请求",
    files: [
      {
        path: "src/features/workspace/switchWorkspace.ts",
        before: "const next = await loadWorkspace(id);\nsetWorkspace(next);\n",
        after:
          "controller?.abort();\ncontroller = new AbortController();\nconst next = await loadWorkspace(id, controller.signal);\nif (!controller.signal.aborted) setWorkspace(next);\n",
        staged: false,
      },
    ],
    prompt: "请处理切换租户时清理悬挂请求，结合当前实现给出聚焦的改动。",
    intro: "我会沿着切换租户时清理悬挂请求的调用路径定位状态和数据边界。",
    analysis:
      "旧请求没有取消，较晚返回的响应覆盖了当前租户。为每次切换建立独立 AbortController，并在写回前检查取消状态。",
    plan: [
      "取消上一租户的网络请求",
      "将取消信号传递到加载器",
      "阻止已取消响应写回",
    ],
    command: "读取 src/features/workspace/switchWorkspace.ts",
    output: "const next = await loadWorkspace(id);\nsetWorkspace(next);",
    read: "读取 src/features/workspace/switchWorkspace.ts",
    response:
      "### 切换租户时清理悬挂请求\n\n旧请求没有取消，较晚返回的响应覆盖了当前租户。为每次切换建立独立 AbortController，并在写回前检查取消状态。\n\n改动位于 `src/features/workspace/switchWorkspace.ts`，右侧文件面板包含修改前后的内容。\n\n- 取消上一租户的网络请求\n- 将取消信号传递到加载器\n- 阻止已取消响应写回",
  },
  {
    title: "统一成员列表的分页缓存",
    files: [
      {
        path: "src/features/members/queryKeys.ts",
        before: 'export const memberKey = ["members"];\n',
        after:
          'export const memberKey = (workspaceId: string, page: number) =>\n  ["workspace", workspaceId, "members", page] as const;\n',
        staged: false,
      },
    ],
    prompt: "请处理统一成员列表的分页缓存，结合当前实现给出聚焦的改动。",
    intro: "我会沿着统一成员列表的分页缓存的调用路径定位状态和数据边界。",
    analysis:
      "分页参数没有进入查询键，下一页读取了上一页快照。查询键统一包含租户、资源和页码。",
    plan: ["检查分页参数", "统一查询键", "调整列表缓存读取"],
    command: "读取 src/features/members/queryKeys.ts",
    output: 'export const memberKey = ["members"];',
    read: "读取 src/features/members/queryKeys.ts",
    response:
      "### 统一成员列表的分页缓存\n\n分页参数没有进入查询键，下一页读取了上一页快照。查询键统一包含租户、资源和页码。\n\n改动位于 `src/features/members/queryKeys.ts`，右侧文件面板包含修改前后的内容。\n\n- 检查分页参数\n- 统一查询键\n- 调整列表缓存读取",
  },
  {
    title: "修复侧栏展开状态",
    files: [
      {
        path: "src/components/sidebar/useExpanded.ts",
        before: "const [expanded, setExpanded] = useState(false);\n",
        after:
          "const [expanded, setExpanded] = usePersistentState(\n  `sidebar:${workspaceId}:expanded`, true\n);\n",
        staged: false,
      },
    ],
    prompt: "请处理修复侧栏展开状态，结合当前实现给出聚焦的改动。",
    intro: "我会沿着修复侧栏展开状态的调用路径定位状态和数据边界。",
    analysis:
      "侧栏展开状态在组件重建时被重置。将其存入按工作区隔离的持久化键。",
    plan: ["定位展开状态归属", "隔离工作区存储键", "恢复上次展开状态"],
    command: "读取 src/components/sidebar/useExpanded.ts",
    output: "const [expanded, setExpanded] = useState(false);",
    read: "读取 src/components/sidebar/useExpanded.ts",
    response:
      "### 修复侧栏展开状态\n\n侧栏展开状态在组件重建时被重置。将其存入按工作区隔离的持久化键。\n\n改动位于 `src/components/sidebar/useExpanded.ts`，右侧文件面板包含修改前后的内容。\n\n- 定位展开状态归属\n- 隔离工作区存储键\n- 恢复上次展开状态",
  },
  {
    title: "整理路由迁移记录",
    files: [
      {
        path: "docs/routing-migration.md",
        before: "# Routing\nLegacy guards are still active.\n",
        after:
          "# Routing migration\n\n1. Resolve workspace permissions before loading the route.\n2. Share the permission snapshot with navigation.\n3. Cancel old requests when switching workspace.\n\nAPI contracts remain unchanged.\n",
        staged: false,
      },
    ],
    prompt: "请处理整理路由迁移记录，结合当前实现给出聚焦的改动。",
    intro: "我会沿着整理路由迁移记录的调用路径定位状态和数据边界。",
    analysis:
      "迁移记录缺少加载顺序与回滚边界。文档现按权限解析、路由加载和缓存清理三个步骤组织。",
    plan: ["梳理路由调用顺序", "记录兼容接口", "整理回滚边界"],
    command: "读取 docs/routing-migration.md",
    output: "# Routing\nLegacy guards are still active.",
    read: "读取 docs/routing-migration.md",
    response:
      "### 整理路由迁移记录\n\n迁移记录缺少加载顺序与回滚边界。文档现按权限解析、路由加载和缓存清理三个步骤组织。\n\n改动位于 `docs/routing-migration.md`，右侧文件面板包含修改前后的内容。\n\n- 梳理路由调用顺序\n- 记录兼容接口\n- 整理回滚边界",
  },
];
variants.harbor = [
  {
    title: "追踪队列积压与重试退避",
    files: [
      {
        path: "app/queue/retry.py",
        before: "delay = 1\nawait queue.retry(event, delay=delay)\n",
        after:
          "delay = min(300, 2 ** event.attempt)\nawait queue.retry(event, delay=delay, max_attempts=8)\n",
        staged: false,
      },
    ],
    prompt: "请处理追踪队列积压与重试退避，结合当前实现给出聚焦的改动。",
    intro: "我会沿着追踪队列积压与重试退避的调用路径定位状态和数据边界。",
    analysis:
      "固定一秒重试在服务恢复时形成集中负载。使用有上限的指数退避，并将重试次数限制在事件处理层。",
    plan: ["检查积压事件", "设置退避上限", "记录重试终态"],
    command: "读取 app/queue/retry.py",
    output: "delay = 1\nawait queue.retry(event, delay=delay)",
    read: "读取 app/queue/retry.py",
    response:
      "### 追踪队列积压与重试退避\n\n固定一秒重试在服务恢复时形成集中负载。使用有上限的指数退避，并将重试次数限制在事件处理层。\n\n改动位于 `app/queue/retry.py`，右侧文件面板包含修改前后的内容。\n\n- 检查积压事件\n- 设置退避上限\n- 记录重试终态",
  },
  {
    title: "支付事件字段兼容改造",
    files: [
      {
        path: "app/payments/schema.py",
        before: 'amount = payload["amount"]\n',
        after:
          'amount = payload.get("amount_minor")\nif amount is None:\n    amount = decimal_to_minor(payload["amount"])\n',
        staged: false,
      },
    ],
    prompt: "请处理支付事件字段兼容改造，结合当前实现给出聚焦的改动。",
    intro: "我会沿着支付事件字段兼容改造的调用路径定位状态和数据边界。",
    analysis:
      "新旧回调使用不同金额字段。优先读取明确的最小货币单位字段，并保留旧字段转换。",
    plan: ["比较两版字段", "实现兼容转换", "统一下游金额单位"],
    command: "读取 app/payments/schema.py",
    output: 'amount = payload["amount"]',
    read: "读取 app/payments/schema.py",
    response:
      "### 支付事件字段兼容改造\n\n新旧回调使用不同金额字段。优先读取明确的最小货币单位字段，并保留旧字段转换。\n\n改动位于 `app/payments/schema.py`，右侧文件面板包含修改前后的内容。\n\n- 比较两版字段\n- 实现兼容转换\n- 统一下游金额单位",
  },
  {
    title: "数据库迁移回滚说明",
    files: [
      {
        path: "docs/migrations.md",
        before: "# Rollback\nDrop processed_events.\n",
        after:
          "# Rollback\n\n1. Stop new webhook consumers.\n2. Drain pending events.\n3. Restore the previous service revision.\n4. Retain processed_events until the retention window closes.\n",
        staged: false,
      },
    ],
    prompt: "请处理数据库迁移回滚说明，结合当前实现给出聚焦的改动。",
    intro: "我会沿着数据库迁移回滚说明的调用路径定位状态和数据边界。",
    analysis:
      "直接删表会让已消费事件失去幂等记录。回滚顺序改为先停接入、排空事件、恢复服务，再按保留期清理记录。",
    plan: ["确定停机边界", "保留幂等记录", "补充迁移顺序"],
    command: "读取 docs/migrations.md",
    output: "# Rollback\nDrop processed_events.",
    read: "读取 docs/migrations.md",
    response:
      "### 数据库迁移回滚说明\n\n直接删表会让已消费事件失去幂等记录。回滚顺序改为先停接入、排空事件、恢复服务，再按保留期清理记录。\n\n改动位于 `docs/migrations.md`，右侧文件面板包含修改前后的内容。\n\n- 确定停机边界\n- 保留幂等记录\n- 补充迁移顺序",
  },
  {
    title: "梳理 webhook 错误分类",
    files: [
      {
        path: "app/payments/errors.py",
        before: "except Exception:\n    return Response(status=500)\n",
        after:
          "except InvalidSignature:\n    return Response(status=401)\nexcept InvalidPayload:\n    return Response(status=422)\nexcept TemporaryStorageError:\n    return Response(status=503)\n",
        staged: false,
      },
    ],
    prompt: "请处理梳理 webhook 错误分类，结合当前实现给出聚焦的改动。",
    intro: "我会沿着梳理 webhook 错误分类的调用路径定位状态和数据边界。",
    analysis:
      "所有异常返回 500 导致无效事件持续重试。将签名、参数与暂时性存储异常分开处理。",
    plan: ["列出错误来源", "映射响应状态", "隔离可重试错误"],
    command: "读取 app/payments/errors.py",
    output: "except Exception:\n    return Response(status=500)",
    read: "读取 app/payments/errors.py",
    response:
      "### 梳理 webhook 错误分类\n\n所有异常返回 500 导致无效事件持续重试。将签名、参数与暂时性存储异常分开处理。\n\n改动位于 `app/payments/errors.py`，右侧文件面板包含修改前后的内容。\n\n- 列出错误来源\n- 映射响应状态\n- 隔离可重试错误",
  },
];
variants.orbit = [
  {
    title: "统一窗口主题与标题栏",
    files: [
      {
        path: "src/theme/windowTheme.ts",
        before: "document.body.className = theme;\n",
        after:
          "document.documentElement.dataset.theme = theme;\nwindowBridge.setTitlebarTheme(theme);\n",
        staged: false,
      },
    ],
    prompt: "请处理统一窗口主题与标题栏，结合当前实现给出聚焦的改动。",
    intro: "我会沿着统一窗口主题与标题栏的调用路径定位状态和数据边界。",
    analysis:
      "渲染层主题与原生标题栏分开更新会产生短暂色差。使用统一主题事件同步两端。",
    plan: ["统一主题入口", "同步窗口标题栏", "保存用户偏好"],
    command: "读取 src/theme/windowTheme.ts",
    output: "document.body.className = theme;",
    read: "读取 src/theme/windowTheme.ts",
    response:
      "### 统一窗口主题与标题栏\n\n渲染层主题与原生标题栏分开更新会产生短暂色差。使用统一主题事件同步两端。\n\n改动位于 `src/theme/windowTheme.ts`，右侧文件面板包含修改前后的内容。\n\n- 统一主题入口\n- 同步窗口标题栏\n- 保存用户偏好",
  },
  {
    title: "编辑器标签拖动体验",
    files: [
      {
        path: "src/editor/reorderTabs.ts",
        before: "tabs.sort((a, b) => a.index - b.index);\n",
        after:
          "const next = tabs.slice();\nconst [tab] = next.splice(from, 1);\nnext.splice(to, 0, tab);\nsetTabs(next);\n",
        staged: false,
      },
    ],
    prompt: "请处理编辑器标签拖动体验，结合当前实现给出聚焦的改动。",
    intro: "我会沿着编辑器标签拖动体验的调用路径定位状态和数据边界。",
    analysis:
      "原地排序修改共享数组，拖动中其他订阅无法识别变化。改用新数组并保留活动标签身份。",
    plan: ["确认标签排序", "使用不可变状态", "保留当前活动标签"],
    command: "读取 src/editor/reorderTabs.ts",
    output: "tabs.sort((a, b) => a.index - b.index);",
    read: "读取 src/editor/reorderTabs.ts",
    response:
      "### 编辑器标签拖动体验\n\n原地排序修改共享数组，拖动中其他订阅无法识别变化。改用新数组并保留活动标签身份。\n\n改动位于 `src/editor/reorderTabs.ts`，右侧文件面板包含修改前后的内容。\n\n- 确认标签排序\n- 使用不可变状态\n- 保留当前活动标签",
  },
  {
    title: "处理最小化后的状态恢复",
    files: [
      {
        path: "electron/windowState.ts",
        before: 'window.on("close", saveBounds);\n',
        after:
          'window.on("close", () => {\n  if (!window.isMinimized()) saveBounds(window.getNormalBounds());\n});\n',
        staged: false,
      },
    ],
    prompt: "请处理处理最小化后的状态恢复，结合当前实现给出聚焦的改动。",
    intro: "我会沿着处理最小化后的状态恢复的调用路径定位状态和数据边界。",
    analysis:
      "最小化时记录的窗口边界不适合下次恢复。保存正常窗口边界，并跳过最小化状态。",
    plan: ["读取窗口状态", "保存正常边界", "恢复上次布局"],
    command: "读取 electron/windowState.ts",
    output: 'window.on("close", saveBounds);',
    read: "读取 electron/windowState.ts",
    response:
      "### 处理最小化后的状态恢复\n\n最小化时记录的窗口边界不适合下次恢复。保存正常窗口边界，并跳过最小化状态。\n\n改动位于 `electron/windowState.ts`，右侧文件面板包含修改前后的内容。\n\n- 读取窗口状态\n- 保存正常边界\n- 恢复上次布局",
  },
  {
    title: "整理桌面端快捷键",
    files: [
      {
        path: "docs/shortcuts.md",
        before: "# Shortcuts\n",
        after:
          "# Shortcuts\n\n- Ctrl+N: New task\n- Ctrl+K: Search\n- Ctrl+B: Toggle sidebar\n- Ctrl+S: Save active file\n- Escape: Close current dialog\n",
        staged: false,
      },
    ],
    prompt: "请处理整理桌面端快捷键，结合当前实现给出聚焦的改动。",
    intro: "我会沿着整理桌面端快捷键的调用路径定位状态和数据边界。",
    analysis:
      "快捷键文档按应用、编辑器与弹窗作用域整理，避免同一组合在多个层级重复触发。",
    plan: ["收集快捷键", "标注作用域", "整理冲突规则"],
    command: "读取 docs/shortcuts.md",
    output: "# Shortcuts",
    read: "读取 docs/shortcuts.md",
    response:
      "### 整理桌面端快捷键\n\n快捷键文档按应用、编辑器与弹窗作用域整理，避免同一组合在多个层级重复触发。\n\n改动位于 `docs/shortcuts.md`，右侧文件面板包含修改前后的内容。\n\n- 收集快捷键\n- 标注作用域\n- 整理冲突规则",
  },
];
variants.prism = [
  {
    title: "异常记录隔离与重放",
    files: [
      {
        path: "pipeline/quarantine.py",
        before: "for row in batch:\n    output.write(transform(row))\n",
        after:
          "for row in batch:\n    try:\n        output.write(transform(row))\n    except InvalidRecord as error:\n        quarantine.write(row, reason=str(error))\n",
        staged: false,
      },
    ],
    prompt: "请处理异常记录隔离与重放，结合当前实现给出聚焦的改动。",
    intro: "我会沿着异常记录隔离与重放的调用路径定位状态和数据边界。",
    analysis:
      "单条异常记录会阻塞整个批次。把可定位的数据异常写入隔离输出，保留原始记录和原因以便重放。",
    plan: ["识别记录级异常", "保存隔离输出", "定义重放入口"],
    command: "读取 pipeline/quarantine.py",
    output: "for row in batch:\n    output.write(transform(row))",
    read: "读取 pipeline/quarantine.py",
    response:
      "### 异常记录隔离与重放\n\n单条异常记录会阻塞整个批次。把可定位的数据异常写入隔离输出，保留原始记录和原因以便重放。\n\n改动位于 `pipeline/quarantine.py`，右侧文件面板包含修改前后的内容。\n\n- 识别记录级异常\n- 保存隔离输出\n- 定义重放入口",
  },
  {
    title: "日报自动化与调度日志",
    files: [
      {
        path: "pipeline/report.py",
        before: 'report.write("completed")\n',
        after:
          'report.write({\n    "partitions": committed_partitions,\n    "checkpoint": checkpoint.current,\n    "rows_written": metrics.rows_written,\n})\n',
        staged: false,
      },
    ],
    prompt: "请处理日报自动化与调度日志，结合当前实现给出聚焦的改动。",
    intro: "我会沿着日报自动化与调度日志的调用路径定位状态和数据边界。",
    analysis:
      "原日报只有完成状态，缺少分区和检查点。现在报告输出已提交分区、行数和最新检查点。",
    plan: ["关联调度记录", "补充分区指标", "输出日报"],
    command: "读取 pipeline/report.py",
    output: 'report.write("completed")',
    read: "读取 pipeline/report.py",
    response:
      "### 日报自动化与调度日志\n\n原日报只有完成状态，缺少分区和检查点。现在报告输出已提交分区、行数和最新检查点。\n\n改动位于 `pipeline/report.py`，右侧文件面板包含修改前后的内容。\n\n- 关联调度记录\n- 补充分区指标\n- 输出日报",
  },
  {
    title: "DuckDB 查询计划整理",
    files: [
      {
        path: "queries/daily_summary.sql",
        before: "SELECT * FROM read_parquet($paths);\n",
        after:
          "SELECT partition_id, count(*) AS rows\nFROM read_parquet($paths)\nWHERE partition_id >= $checkpoint\nGROUP BY partition_id;\n",
        staged: false,
      },
    ],
    prompt: "请处理DuckDB 查询计划整理，结合当前实现给出聚焦的改动。",
    intro: "我会沿着DuckDB 查询计划整理的调用路径定位状态和数据边界。",
    analysis:
      "查询读取所有列并扫描历史分区。改用必要列和检查点过滤，将分区裁剪前移。",
    plan: ["定位全量扫描", "前移分区过滤", "记录查询结构"],
    command: "读取 queries/daily_summary.sql",
    output: "SELECT * FROM read_parquet($paths);",
    read: "读取 queries/daily_summary.sql",
    response:
      "### DuckDB 查询计划整理\n\n查询读取所有列并扫描历史分区。改用必要列和检查点过滤，将分区裁剪前移。\n\n改动位于 `queries/daily_summary.sql`，右侧文件面板包含修改前后的内容。\n\n- 定位全量扫描\n- 前移分区过滤\n- 记录查询结构",
  },
  {
    title: "分区输出命名规范",
    files: [
      {
        path: "pipeline/paths.py",
        before: "return output_dir / filename\n",
        after:
          'return output_dir / f"partition={partition_id}" / f"batch-{batch_id:05d}.parquet"\n',
        staged: false,
      },
    ],
    prompt: "请处理分区输出命名规范，结合当前实现给出聚焦的改动。",
    intro: "我会沿着分区输出命名规范的调用路径定位状态和数据边界。",
    analysis:
      "输出文件名无法稳定关联分区。采用分区目录与固定宽度批次编号，使恢复与审阅使用相同路径约定。",
    plan: ["统一分区目录", "定义批次命名", "关联检查点路径"],
    command: "读取 pipeline/paths.py",
    output: "return output_dir / filename",
    read: "读取 pipeline/paths.py",
    response:
      "### 分区输出命名规范\n\n输出文件名无法稳定关联分区。采用分区目录与固定宽度批次编号，使恢复与审阅使用相同路径约定。\n\n改动位于 `pipeline/paths.py`，右侧文件面板包含修改前后的内容。\n\n- 统一分区目录\n- 定义批次命名\n- 关联检查点路径",
  },
];
export function getScenario(projectId: string, text = "", variant = -1): Scenario {
  if (projectId === "orbit" && /播放器|视频|截图|字体|网页/.test(text)) return desktopScenario;
  const base = scenarios[projectId] || scenarios.atlas;
  const list = variants[projectId] || [];
  const match =
    variant >= 0
      ? list[variant]
      : list.find(
          (item) =>
            text.includes(item.title) ||
            item.title
              .split(/[与的]/)
              .some((part: string) => part.length > 3 && text.includes(part)),
        );
  return match ? { ...base, ...match } : base;
}
