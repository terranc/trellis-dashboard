# Trellis Dashboard — 设计规格

> 为 Trellis 工作流系统提供可视化 Web 面板，支持文档浏览、任务管理和工作空间概览。

---

## 1. 项目定位

| 维度     | 决定                                                   |
| -------- | ------------------------------------------------------ |
| 定位     | Trellis 通用可视化工具，适用于任何 Trellis 项目        |
| 使用频率 | 低频检视——项目开发到一定阶段，定期打开查看全貌         |
| 部署方式 | 本地 CLI 启动，`npx trellis-dashboard` 打开浏览器      |
| 交互模式 | 读 + 更新/删除（不创建任务），写操作全部通过 `task.py` |
| 发布形态 | 独立 npm 包                                            |

---

## 2. 技术选型

| 层            | 选型                                           | 理由                   |
| ------------- | ---------------------------------------------- | ---------------------- |
| 后端          | Express + TypeScript                           | 成熟稳定，生态完整     |
| 前端          | React + Vite + Tailwind + shadcn/ui            | 组件质量高，开发效率好 |
| Markdown 渲染 | react-markdown + remark-gfm + rehype-highlight | GFM 表格、代码高亮     |
| 路由          | React Router                                   | SPA 路由               |
| 打包          | tsup（后端）+ Vite（前端）                     | CLI 发包标准方案       |
| CLI           | bin entry → Express serve + open browser       | 一键启动               |

---

## 3. 架构

### 3.1 项目结构

```
trellis-dashboard/
├── packages/
│   ├── server/                # Express 后端
│   │   ├── api/
│   │   │   ├── tasks.ts       # 任务 API
│   │   │   ├── specs.ts       # 文档 API
│   │   │   ├── workspace.ts   # 工作空间 API
│   │   │   └── overview.ts    # Dashboard 概览 API
│   │   ├── lib/
│   │   │   ├── task-runner.ts # task.py CLI 封装
│   │   │   ├── cli-parser.ts  # task.py 输出解析（strip ANSI + regex）
│   │   │   ├── markdown.ts    # Markdown 文件读取与解析
│   │   │   └── trellis.ts     # .trellis 目录约定和路径工具
│   │   └── index.ts
│   └── web/                   # React SPA（Vite）
│       ├── pages/
│       │   ├── Dashboard.tsx  # 首页概览
│       │   ├── Docs/          # 文档浏览器
│       │   ├── Tasks/         # 任务看板/列表
│       │   └── Workspace/     # 工作空间
│       ├── components/
│       │   ├── MarkdownViewer.tsx
│       │   ├── TaskCard.tsx
│       │   ├── TaskDetail.tsx
│       │   ├── DocTree.tsx
│       │   └── ...
│       └── lib/
│           └── api.ts         # 前端 API client
├── bin/
│   └── trellis-dashboard.js   # CLI 入口
├── package.json
└── tsconfig.json
```

### 3.2 数据流

```
用户浏览器 ←→ React SPA ←→ Express API
                                 │
                    ┌────────────┼────────────┐
                    ↓            ↓            ↓
              task.py CLI   直接读文件   .trellis/config.yaml
              (写操作 +     (task.json    (配置)
               list 读取)    spec/*.md
                             workspace/)
```

### 3.3 数据读写策略

**核心原则**：尽可能使用 Trellis 官方能力，最大化兼容未来版本升级。

**读取**：

| 数据      | 方式                                         | 来源                         |
| --------- | -------------------------------------------- | ---------------------------- |
| 任务列表  | 调用 `task.py list` 并解析输出               | 官方 CLI                     |
| 归档列表  | 调用 `task.py list-archive` 并解析输出       | 官方 CLI                     |
| 当前任务  | 调用 `task.py current` 并解析输出            | 官方 CLI                     |
| 任务详情  | 直接读取 `task.json`                         | 文件系统（CLI 无 show 命令） |
| 任务文档  | 直接读取 `prd.md`/`design.md`/`implement.md` | 文件系统                     |
| Spec 文档 | 直接读取 `spec/**/*.md`                      | 文件系统（无官方 API）       |
| 工作空间  | 直接读取 `workspace/**/*.md`                 | 文件系统（无官方 API）       |
| 配置      | 直接读取 `config.yaml`                       | 文件系统                     |

**写入（全部通过 task.py）**：

| 操作         | 命令                                      |
| ------------ | ----------------------------------------- |
| 激活任务     | `task.py start <dir>`                     |
| 完成任务     | `task.py finish`                          |
| 归档任务     | `task.py archive <dir>`                   |
| 设置分支     | `task.py set-branch <dir> <branch>`       |
| 设置目标分支 | `task.py set-base-branch <dir> <branch>`  |
| 设置 scope   | `task.py set-scope <dir> <scope>`         |
| 链接子任务   | `task.py add-subtask <parent> <child>`    |
| 解除子任务   | `task.py remove-subtask <parent> <child>` |

### 3.4 CLI 输出解析

`task.py list` 输出带 ANSI 颜色码的终端文本。解析策略：

1. 去除 ANSI 转义序列：`text.replace(/\x1b\[[0-9;]*m/g, '')`
2. 逐行 regex 匹配任务条目：`/^\s*-\s+(\S+)\s+\((\w+)\)\s+(?:\[(\S+)\])?/`
3. 识别缩进层级判断 parent/child 关系
4. 提取 `[N/M done]` 进度信息

---

## 4. 功能模块

### 4.1 Dashboard 首页（`/`）

项目全景概览，一眼看清当前状态。

- **统计卡片**：活跃任务数、归档任务数、spec 文档数、开发者数
- **任务状态分布**：按 planning / in_progress / completed 的比例展示
- **最近活跃任务**：Top 5，显示 title + status + assignee + 更新时间
- **快捷入口**：跳转到文档浏览器、任务看板、工作空间

### 4.2 文档浏览器（`/docs`）— MVP 首发

**布局**：左侧导航树 + 右侧 Markdown 渲染区。

**导航树构建**：

- 扫描 `spec/` 目录下的子文件夹（features/、backend/、guides/）
- 解析每个分类下的 `index.md` 获取文档列表和描述
- 构建三级树：分类 → 文档 → 章节（从 markdown heading 提取）

**Markdown 渲染**：

- GFM 支持（表格、任务列表、删除线）
- 代码块语法高亮（PHP、SQL、JavaScript、TypeScript、YAML、JSON、Bash）
- Mermaid 图表渲染（如有）
- 内部链接跳转（spec 文档间的相对引用）

**全文搜索**：

- 服务端对所有 spec markdown 建立简单的内存索引
- 搜索返回：匹配文件名、匹配行内容片段、文件路径
- 前端高亮匹配关键词

**面包屑导航**：`spec > backend > order-payment`

### 4.3 任务管理（`/tasks`）

**Kanban 看板视图**：

- 三列：planning → in_progress → completed
- 卡片信息：title、assignee 头像/名称、priority 标签、创建日期
- Parent 任务卡片额外显示子任务进度条（`[N/M done]`）

**列表视图**：

- 表格形式，列：title、status、priority、assignee、createdAt、branch
- 支持按列排序
- 支持按 status / assignee / priority 过滤

**任务详情面板**（侧滑抽屉）：

- 上半部分：task.json 字段展示（title, description, status, priority, assignee, branch, base_branch, scope, dates, pr_url）
- 下半部分：标签页切换 prd.md / design.md / implement.md 的 Markdown 渲染
- 操作按钮：Start / Finish / Archive / Set Branch

**归档浏览**：

- 独立标签页
- 按月份分组（2026-05、2026-04、2026-03...）
- 点击展开月份内的归档任务列表

**Parent/Child 可视化**：

- 任务卡片上显示子任务数量和完成进度
- 详情面板中列出子任务列表，可点击跳转

### 4.4 工作空间（`/workspace`）

**开发者列表**：

- 从 `workspace/` 子目录枚举所有开发者
- 显示：名称、总 session 数、最近活跃时间

**Session Timeline**：

- 解析 `journal-*.md`，提取每次 session 的标题、日期、关联任务
- 以时间线形式展示
- 点击展开 session 的 markdown 详情

---

## 5. API 设计

```
# ===== Dashboard =====
GET  /api/overview                 # 聚合统计数据

# ===== 任务 =====
GET  /api/tasks                    # 任务列表 → task.py list
GET  /api/tasks/current            # 当前活跃任务 → task.py current
GET  /api/tasks/archive            # 归档列表 → task.py list-archive
GET  /api/tasks/archive/:month     # 按月归档 → task.py list-archive YYYY-MM
GET  /api/tasks/:dir               # 任务详情 → 读取 task.json + markdown 文件
GET  /api/tasks/:dir/doc/:name     # 任务文档 → 读取 prd.md/design.md/implement.md

POST /api/tasks/:dir/start         # → task.py start <dir>
POST /api/tasks/:dir/finish        # → task.py finish
POST /api/tasks/:dir/archive       # → task.py archive <dir>
POST /api/tasks/:dir/set-branch    # body: { branch } → task.py set-branch
POST /api/tasks/:dir/set-base-branch # body: { branch } → task.py set-base-branch
POST /api/tasks/:dir/set-scope     # body: { scope } → task.py set-scope
POST /api/tasks/:dir/subtask       # body: { action, child } → add-subtask/remove-subtask

# ===== 文档 =====
GET  /api/specs                    # Spec 目录树
GET  /api/specs/:category/:file    # Spec 文档内容
GET  /api/specs/search?q=keyword   # 全文搜索

# ===== 工作空间 =====
GET  /api/workspace                # 开发者列表 + 概要
GET  /api/workspace/:dev           # 开发者详情 + session 列表
GET  /api/workspace/:dev/journal/:file  # Journal 文件内容

# ===== 配置 =====
GET  /api/config                   # Trellis 配置
```

---

## 6. CLI 入口

```bash
npx trellis-dashboard              # 默认端口 3777，被占用则自动递增寻找可用端口
npx trellis-dashboard --port 8080  # 自定义端口（被占用同样自动递增）
npx trellis-dashboard --no-open    # 不自动打开浏览器
```

**启动流程**：

1. 检测当前目录是否存在 `.trellis/` 目录，不存在则报错退出
2. 检测 `python3` 是否可用，不可用则报错（task.py 依赖）
3. 构建前端静态资源（或使用预构建的）
4. 尝试绑定目标端口；若被占用，自动从目标端口 +1 开始递增尝试，直到找到可用端口（上限尝试 20 次）
5. 启动 Express 服务，serve 前端 + API
6. 终端输出实际绑定的端口和项目名称：`Trellis Dashboard: meal.server → http://localhost:3778`
7. 自动打开浏览器到实际端口
8. 监听 SIGINT，优雅退出

**多实例支持**：

- 多个项目可同时启动各自的 dashboard，各占不同端口
- 浏览器标签页 title 显示项目名称：`Trellis Dashboard — meal.server`
- 页面顶部 header 固定显示当前项目名称和路径，避免多标签页混淆
- 项目名称取自：`config.yaml` 的项目名 → `package.json` 的 name → 目录名（按优先级 fallback）

---

## 7. MVP 迭代计划

### Phase 1: 文档浏览器（MVP）

- 后端：spec 目录扫描 + markdown 读取 + 全文搜索
- 前端：导航树 + Markdown 渲染 + 搜索
- CLI：基本启动流程

### Phase 2: 任务管理

- 后端：task.py CLI 封装 + 输出解析 + task.json 读取
- 前端：Kanban 看板 + 列表视图 + 详情面板 + 操作按钮
- 归档浏览

### Phase 3: Dashboard 首页 + 工作空间

- 首页聚合统计
- 工作空间开发者列表 + session timeline

### Phase 4: 增强

- 深色/浅色主题
- 响应式布局
- Mermaid 图表支持
- 内部链接跳转

---

## 8. 非目标

- **不做创建任务**：创建任务涉及复杂的 AI brainstorm 流程，不适合在 WebUI 中简化
- **不做文档编辑**：spec 文档的编辑应在 AI session 中通过 `trellis-update-spec` 完成
- **不做实时推送**：低频使用场景不需要 WebSocket
- **不做用户认证**：本地工具，无需登录
- **不做多仓库聚合**：每个项目独立启动自己的 dashboard

---

## 9. 兼容性考虑

- **Trellis 版本升级**：写操作全走 `task.py` CLI，读取优先用 CLI 命令。只在 CLI 不覆盖的场景（task.json 详情、spec 文档、workspace journal）才直接读文件，且遵循 Trellis 目录约定而非硬编码路径
- **Python 环境**：依赖 `python3` 可用（task.py 需要），CLI 启动时检测
- **跨平台**：Node.js + 浏览器，macOS/Linux/Windows 均可用
