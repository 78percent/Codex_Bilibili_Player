export default {
  title: "重构工作区权限与路由守卫",
  branch: "feat/workspace-permissions",
  pr: 248,
  prompt:
    "把工作区的权限校验收敛到统一的路由守卫。现在切换 workspace 时偶尔会看到上一个租户的数据，顺便把侧栏的权限状态同步一下。保持 API 兼容。",
  intro:
    "我会先确认路由加载和缓存的关联，再沿着工作区切换路径处理权限与侧栏状态。",
  plan: [
    "定位工作区切换与查询缓存的边界",
    "统一权限解析与路由守卫",
    "同步侧栏状态并整理改动",
  ],
  command: 'rg "workspaceId|permission" src/router src/features/workspace',
  output:
    "src/router/guard.ts:18: resolveWorkspacePermission\nsrc/features/workspace/useWorkspace.ts:31: queryKey\nsrc/components/sidebar/WorkspaceNav.tsx:42: canAccess",
  read: "读取 src/router/guard.ts 和 src/features/workspace/useWorkspace.ts",
  analysis:
    "缓存键只包含 resource，未包含 workspaceId。路由组件在权限请求结束前读取了前一个 workspace 的缓存快照。切换工作区时需要取消旧请求，并将权限状态纳入同一查询键。",
  response:
    "已将工作区切换收敛到同一条权限解析路径。\n\n### 关键改动\n- 查询缓存使用 `workspaceId + resource`，不同租户的数据不再复用同一个 key。\n- 路由守卫等待权限解析，侧栏读取相同的权限结果。\n- 切换时取消旧工作区请求，防止较晚返回的响应覆盖当前视图。\n\n修改集中在路由、查询键与侧栏三个位置，原有 API 的调用方式保持兼容。右侧可以逐文件查看差异。",
  followups: [
    "切换租户时清理悬挂请求",
    "统一成员列表的分页缓存",
    "修复侧栏展开状态",
    "整理路由迁移记录",
  ],
  files: [
    {
      path: "src/router/guard.ts",
      before:
        "export async function guard(route: Route) {\n  const workspace = getCurrentWorkspace();\n  return loadPermissions(workspace.id);\n}\n",
      after:
        'export async function guard(route: Route) {\n  const workspaceId = route.params.workspaceId;\n  const permissions = await resolveWorkspacePermission(workspaceId);\n  if (!permissions.canRead) return redirect("/forbidden");\n  return { workspaceId, permissions };\n}\n',
      staged: false,
    },
    {
      path: "src/features/workspace/queryKeys.ts",
      before: "export const workspaceKey = (resource: string) => [resource];\n",
      after:
        'export const workspaceKey = (workspaceId: string, resource: string) =>\n  ["workspace", workspaceId, resource] as const;\n',
      staged: false,
    },
    {
      path: "src/features/workspace/useWorkspace.ts",
      before:
        'const query = useQuery({\n  queryKey: ["members"],\n  queryFn: () => api.members(workspaceId),\n});\n',
      after:
        'const query = useQuery({\n  queryKey: workspaceKey(workspaceId, "members"),\n  queryFn: ({ signal }) => api.members(workspaceId, { signal }),\n  enabled: permissions.canRead,\n});\n',
      staged: false,
    },
    {
      path: "src/components/sidebar/WorkspaceNav.tsx",
      before:
        "const canAccess = useState(true);\nreturn <Navigation workspace={workspace} />;\n",
      after:
        "const { permissions, pending } = useWorkspacePermission(workspace.id);\nreturn <Navigation workspace={workspace} permissions={permissions} loading={pending} />;\n",
      staged: false,
    },
  ],
};
