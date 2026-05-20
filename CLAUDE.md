# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Trellis Dashboard — a web UI for browsing and managing Trellis project artifacts (specs, tasks, workspace journals). npm workspaces monorepo with an Express backend serving a React SPA.

## Commands

```bash
# Install
npm install

# Build (web first, then server — order matters)
npm run build

# Quality checks (run all three before committing)
npm run format && npm run lint && npm run type-check

# Tests (server only, vitest)
npm test
npm run test --workspace @trellis-dashboard/server

# Run single test file
npx vitest run packages/server/src/__tests__/cli.test.ts

# Dev — start Vite dev server (web) with API proxy to server
# Web: port 5173, proxies /api → http://localhost:3777
cd packages/web && npx vite

# CLI — launch full dashboard (requires build first)
node bin/trellis-dashboard.js              # default port 3777, auto-increment if taken
node bin/trellis-dashboard.js --port 8080  # custom port
node bin/trellis-dashboard.js --no-open    # skip browser auto-open
```

## Architecture

```
bin/trellis-dashboard.js   → dynamic import packages/server/dist/cli.js
packages/
  server/                  → Express backend (tsup → ESM + DTS)
    src/cli.ts             → CLI entrypoint: arg parsing, port fallback, browser open
    src/index.ts           → createApp(): mount API routers + serve web/dist as static
    src/api/               → Express routers: config, specs, tasks
    src/lib/               → Domain logic: trellis.ts (project resolution), tasks.ts, markdown.ts
    src/__tests__/         → vitest unit tests
  web/                     → React SPA (Vite + react plugin)
    src/App.tsx            → Hash router: / → DocsPage, /tasks → TasksPage
    src/pages/             → DocsPage, TasksPage
    src/components/        → DocTree, MarkdownViewer
    src/lib/api.ts         → Fetch wrapper for /api/* endpoints
    src/lib/route.ts       → Client-side routing utilities
    src/i18n/en.ts         → UI string constants
```

**Data flow:** Web SPA → `fetch /api/*` → Express server → reads `.trellis/` directory (specs, tasks, config) or shells out to `task.py` for task mutations → returns JSON.

**Vite dev proxy:** In development, Vite on :5173 proxies `/api` requests to `http://localhost:3777`. In production, server serves `packages/web/dist/` as static files.

## Key Conventions

- **ESM throughout** — `"type": "module"` in all package.json files; use `.js` extensions in server imports
- **Server build** — tsup bundles `src/index.ts` + `src/cli.ts` to ESM with DTS
- **Web build** — `vite build` outputs to `packages/web/dist/`
- **i18n** — All UI-facing strings go through `packages/web/src/i18n/en.ts`, never hardcode
- **Hash routing** — Web SPA uses hash-based routing (`#/`, `#/tasks`)
- **Port fallback** — CLI tries up to 20 ports starting from target (default 3777)
- **`.trellis/` dependency** — Server expects a `.trellis/` directory in the working directory; CLI validates this at startup
- **Dual README** — `README.md` (English, default) + `README.zh-CN.md` (Chinese). Both must be updated together on user-facing changes

## Version Release Preference
<!-- github-push-and-release: release -->
This project uses full release mode: CHANGELOG + commit + git tag + GitHub release.
