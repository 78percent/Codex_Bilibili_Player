# Codex Desktop Reconstruction Implementation Plan

> Execute inline with executing-plans. User approved the edited design and directed immediate implementation; no further plan approval is required. User's no-test instruction overrides TDD and verification steps.

**Goal:** Ship a portable Windows EXE containing the approved complete frontend and fictional development scenarios.
**Architecture:** Electron window bridge; React feature modules; shared primitives; a local typed state store and deterministic scenario scheduler. Data and rendering remain separate.
**Tech Stack:** React 19, TypeScript, Vite, Electron, lucide-react, electron-builder portable target.
**Spec:** Approved Codex前端复刻设计.md and Codex页面与状态清单.md.

## Global Constraints
- Use actual REA-derived Codex style evidence, not the reader's theme.
- No tests, lint, type checking, screenshot comparison or validation launch.
- Production compilation and packaging are necessary to produce the requested EXE.
- All service, terminal and Git operations are fictional/local.
- Video module remains empty. No unnecessary explanatory UI labels.
- Fresh replacement only at D:\Codex_Bilibili_Player; staging is isolated under work/project.

## Task 1: Shell and shared contracts
- [x] Create package.json, vite.config.ts, electron/main.cjs, electron/preload.cjs.
- [x] Define src/state/types.ts: Project, Thread, Message, ToolCall, FileChange, ScenarioRun, AppState.
- [x] Implement src/state/store.tsx with useApp(), dispatch(Action), periodic persistence with final flush.
- [x] Create src/components/ui/{Icon,Button,Dialog,Menu,Select,SplitPane}.tsx and source-based theme tokens.

## Task 2: Coherent project data and scenario engine
- [x] Create four independent project datasets, shared catalog, settings registry.
- [x] Implement useScenarioEngine() using persisted step index and deterministic IDs.
- [x] Implement approvals, interrupt/continue and message streaming without real commands.

## Task 3: Desktop and conversations
- [x] Implement sidebar project/history operations, search, archive and settings navigation.
- [x] Implement titlebar, split workspace, conversation rendering, composer menus and attachments.
- [x] Bind keyboard shortcuts, theme and display preferences.

## Task 4: Development workspace
- [x] Implement ReviewPage, DiffView, CodeEditor, Terminal, BrowserPreview and WorkspaceTabs.
- [x] Connect per-thread files, logs and PR status to scenario outcomes and local edits.
- [x] Implement project and Work/content pages.

## Task 5: Full supporting pages
- [x] Implement automations CRUD/schedule/run history and scenario start.
- [x] Implement skills and app/plugin catalogs, details and local install/connect state.
- [x] Implement concrete settings registry, purpose-specific form controls and persistence.
- [x] Include empty video extension and source/about page.

## Task 6: Delivery
- [x] Perform one source-only whole-project review (no test commands).
- [x] Install dependencies; compile production assets and create a portable x64 EXE.
- [x] Confirm packaging command outcome and output-file metadata without executing EXE.
- [x] Replace exactly the authorized D-drive directory and copy the complete project.
- [x] Copy portable EXE and concise README into outputs; synchronize OpenSpec/logs/source evidence.

## Review Focus
- Restored interrupted streams must not duplicate records.
- Switching a thread must not retarget an active scenario.
- Theme/density changes must update their actual UI consumers.
- Electron production file paths and preload bridge must match packaged paths.
- Approval refusal must cancel dependent simulated steps.

## Ledger
- Design approved after user edit emphasizing REA-derived style; portable EXE added.
- Tests expressly prohibited; compilation/package generation only.
- This is a clean standalone project, not a change to an existing Git branch.

