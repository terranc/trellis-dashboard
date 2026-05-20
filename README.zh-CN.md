# Trellis Dashboard

> 本地 Web UI，用于浏览和管理 [Trellis](https://github.com/anthropics/trellis) 项目产物 — 规格文档、任务和工作空间日志。

[English](./README.md)

## 功能

- **文档浏览器** — 浏览 `.trellis/spec/` 目录下的文档，支持完整 Markdown 渲染
- **任务管理** — 查看任务列表、状态和详情页，底层调用 `task.py`
- **本地优先** — 完全在本地运行，直接读取 `.trellis/` 目录
- **多实例** — 可同时为不同项目启动多个 dashboard（端口自动递增）

## 快速开始

```bash
# 直接运行（无需安装）
npx @terranc/trellis-dashboard
```

或全局安装：

```bash
npm install -g @terranc/trellis-dashboard
trellis-dashboard
```

Dashboard 默认在 `http://localhost:3777` 打开（端口被占用时自动递增）。

### CLI 选项

```bash
trellis-dashboard              # 默认端口 3777
trellis-dashboard --port 8080  # 自定义端口
trellis-dashboard --no-open    # 不自动打开浏览器
```

## 项目结构

```
packages/
  server/    Express 后端 — 读取 .trellis/，提供 API 和静态文件服务
  web/       React SPA (Vite) — 文档浏览器、任务管理界面
bin/
  trellis-dashboard.js   CLI 入口
```

## 开发

```bash
# 启动 Vite 开发服务器（端口 5173，/api 代理到 localhost:3777）
cd packages/web && npx vite

# 单独启动 API 服务
node bin/trellis-dashboard.js

# 质量检查
npm run format && npm run lint && npm run type-check

# 运行测试
npm test
```

## 环境要求

- Node.js >= 18
- 项目目录中已初始化 `.trellis/`
- PATH 中可用的 `python3`（`task.py` 依赖）

## 许可证

MIT
