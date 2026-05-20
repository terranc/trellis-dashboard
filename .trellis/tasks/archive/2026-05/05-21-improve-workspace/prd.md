# 完善 workspace 功能

## Goal

进一步完善 Trellis Dashboard 的 Workspace 功能，让开发者可以在 Web 界面中查看 `.trellis/workspace/` 下的开发者活动、session 历史和 journal 详情，而不需要手动打开 Markdown 文件。

## User Value

- 快速看清当前项目有哪些开发者工作记录。
- 快速定位某位开发者最近的 session、关联任务、提交和后续步骤。
- 保留 Workspace 作为 Trellis 会话记忆的只读观察面板，避免误改 journal 或索引文件。

## Confirmed Facts

- 当前 Trellis task：`.trellis/tasks/05-21-improve-workspace`，状态为 `planning`。
- 原始 Dashboard 设计文档已规划 Workspace：
  - `GET /api/workspace`：开发者列表和概要。
  - `GET /api/workspace/:dev`：开发者详情和 session 列表。
  - `GET /api/workspace/:dev/journal/:file`：journal 文件内容。
  - `/workspace` 页面展示开发者列表、session timeline，并支持点击展开 session markdown 详情。
- 当前前端 `packages/web/src/App.tsx` 中 Workspace 导航仍是禁用入口。
- 当前路由只支持 `docs` 和 `tasks`，尚无 `workspace` view。
- 当前 i18n 文件已有 `workspace` 字符串，新增 UI 文案必须继续走 i18n，不能硬编码。
- `.trellis/workspace/` 当前包含：
  - 全局 `index.md`，记录 workspace 文件结构、开发者表格、session 模板。
  - `TerranChao/index.md`，包含当前状态、active documents、session history。
  - `TerranChao/journal-1.md`，包含 session 标题、日期、任务、分支、摘要、提交、测试、状态、下一步等结构。
- Workspace 数据没有现成 Trellis CLI 读取 API，原设计允许直接读取 `.trellis/workspace/**/*.md`。

## Requirements

- Workspace 首版坚持只读 MVP。
- 提供 Workspace 后端读取能力，覆盖开发者概要、开发者详情、journal markdown 内容。
- 提供 `/workspace` 前端页面，替换当前禁用入口。
- 页面应至少展示开发者列表、总 session 数、最近活跃时间、当前 active file。
- 进入 `/workspace` 时默认选中最近活跃开发者，并展示其 session timeline。
- 选择开发者后，应展示 session timeline。
- 进入某位开发者视图时默认选中最近一条 session，并显示其详情。
- 点击 timeline 中的 session 时，详情区只展示该 session 的独立内容，而不是整个 journal 文件。
- Workspace 选择状态需要通过 URL 保持，采用 `/workspace/:developer/:sessionNumber` 形式表达当前开发者和 session。
- 所有新增用户可见文案必须通过 i18n。
- 读取路径必须限制在 `.trellis/workspace/` 内，避免路径逃逸。
- 保持首版 scope 简洁，不引入 journal 编辑、生成、同步或写操作。

## Acceptance Criteria

- 导航栏 Workspace 可点击，并进入 `/workspace`。
- `/workspace` 能列出 `.trellis/workspace/` 下的开发者概要。
- `/workspace` 首屏默认选中最近活跃开发者。
- 选择开发者后能看到该开发者的 session 列表或 timeline。
- 进入开发者视图后默认选中最近一条 session，并显示详情。
- 点击 session 后能查看该 session 的 markdown 内容，且内容渲染与现有 Markdown viewer 风格一致或复用现有组件。
- 刷新 `/workspace/:developer/:sessionNumber` 后仍保留对应开发者和 session 详情。
- 从 timeline 切换 session 时，浏览器 URL 同步更新。
- 没有 workspace 数据时显示空状态，而不是报错或空白页。
- 后端测试覆盖：
  - 开发者列表读取。
  - journal/session 解析。
  - 非法 developer 或 journal 路径不能逃逸 `.trellis/workspace/`。
- 实现完成后运行 format、lint、type-check，并报告精确结果。

## Out of Scope

- 编辑、创建、删除 workspace journal。
- 写入 `.trellis/workspace/index.md` 或开发者 `index.md`。
- 自动调用 `add_session.py`。
- 多项目 workspace 聚合。
- 复杂全文搜索、过滤器或统计图表。

## Open Questions

- None.
