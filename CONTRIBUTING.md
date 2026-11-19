# 贡献与本地开发

使用 Windows x64、Node.js 24 LTS 与 Git：

```powershell
npm ci
node node_modules/electron/install.js
.\Start-Development.cmd
```

仅开发网页布局可以使用 `npm run dev`。登录、播放、历史和 UP 业务需要 Electron。生产便携包使用 `npm run package`；生成目录为 `release/`。开发脚本使用独立的 `CodexBilibiliPlayer-Dev` 用户目录。

提交应说明触发条件、修改后的行为以及实际验证范围。项目按功能拆分模块，场景数据与界面分离；避免新增无关依赖和界面说明。使用项目自身素材或明确允许再分发的素材，并保留第三方许可。

可用检查命令：`npm test`、`npm run typecheck`、`npm run build`。`scripts/smoke-electron.cjs` 的隔离检查和联网选项见源码参数；只能用专门的临时用户目录，禁止指向已有 AppData。真实账号写操作不用于自动检查。

不要提交 `.env`、Cookie、签名证书、抓包、用户数据、带个人信息的截图或内部工作日志。`.gitignore` 不会自动移除已经跟踪的文件；提交前阅读 staged diff 和文件列表。Git 作者邮箱同样会公开，建议使用 GitHub noreply 邮箱。

问题报告请包含版本、平台和最小复现步骤；安全问题按 [SECURITY.md](SECURITY.md) 处理。贡献到项目自有代码的修改沿用 MIT，第三方组件保留原许可。
