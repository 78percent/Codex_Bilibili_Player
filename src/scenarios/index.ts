import atlas from "./atlas";
import harbor from "./harbor";
import orbit from "./orbit";
import prism from "./prism";
export const scenarios: Record<string, typeof atlas> = {
  atlas,
  harbor,
  orbit,
  prism,
};
export const projects = [
  {
    id: "atlas",
    name: "atlas-console",
    path: "D:/workspace/atlas-console",
    color: "#b59a73",
    stack: "React · TypeScript · TanStack Query",
    description: "面向多租户团队的管理控制台",
  },
  {
    id: "harbor",
    name: "harbor-api",
    path: "D:/workspace/harbor-api",
    color: "#829bba",
    stack: "FastAPI · PostgreSQL · Redis",
    description: "订单与支付事件处理服务",
  },
  {
    id: "orbit",
    name: "orbit-desktop",
    path: "D:/workspace/orbit-desktop",
    color: "#ab93b4",
    stack: "Electron · React · SQLite",
    description: "跨平台桌面工作区",
  },
  {
    id: "prism",
    name: "prism-pipeline",
    path: "D:/workspace/prism-pipeline",
    color: "#82a494",
    stack: "Python · DuckDB · Apache Arrow",
    description: "批处理与数据质量平台",
  },
];
