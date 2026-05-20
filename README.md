# Trellis Dashboard

> A local web UI for browsing and managing [Trellis](https://github.com/anthropics/trellis) project artifacts — specs, tasks, and workspace journals.

[中文文档](./README.zh-CN.md)

## Features

- **Docs Browser** — Navigate and read `.trellis/spec/` documents with full Markdown rendering
- **Task Management** — View task list, status, and detail pages backed by `task.py`
- **Local-first** — Runs entirely on your machine, reads directly from `.trellis/` directory
- **Multi-instance** — Run multiple dashboards for different projects simultaneously (auto port fallback)

## Quick Start

```bash
# Run directly (no install needed)
npx @terranc/trellis-dashboard
```

Or install globally:

```bash
npm install -g @terranc/trellis-dashboard
trellis-dashboard
```

The dashboard opens at `http://localhost:3777` (auto-increments if the port is taken).

### CLI Options

```bash
trellis-dashboard              # default port 3777
trellis-dashboard --port 8080  # custom port
trellis-dashboard --no-open    # don't auto-open browser
```

## Project Structure

```
packages/
  server/    Express backend — reads .trellis/, serves API + static files
  web/       React SPA (Vite) — docs browser, task management UI
bin/
  trellis-dashboard.js   CLI entrypoint
```

## Development

```bash
# Start Vite dev server (port 5173, proxies /api → localhost:3777)
cd packages/web && npx vite

# Start API server separately
node bin/trellis-dashboard.js

# Quality checks
npm run format && npm run lint && npm run type-check

# Run tests
npm test
```

## Requirements

- Node.js >= 18
- A project directory with `.trellis/` initialized
- `python3` available in PATH (required by `task.py`)

## License

MIT
