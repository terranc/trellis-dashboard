# Trellis Dashboard Technical Design

## Scope

Implement an independent local dashboard package for Trellis projects. The package serves a React SPA through an Express API and reads project data from the Trellis project where the CLI is launched.

## Architecture

```text
Browser SPA
  <-> Express API
      <-> task.py CLI for supported task reads/writes
      <-> filesystem reads for markdown, task.json, config, workspace journals
```

Proposed source layout follows the source design:

```text
trellis-dashboard/
  packages/server/
  packages/web/
  bin/trellis-dashboard.js
  package.json
  tsconfig.json
```

## Server Boundaries

- `api/specs.ts`: spec tree, markdown content, search.
- `api/tasks.ts`: task lists, archive lists, current task, task details, and task actions.
- `api/workspace.ts`: developer summaries and journal content.
- `api/overview.ts`: aggregate counts and recent activity.
- `lib/trellis.ts`: project-root detection, `.trellis` path helpers, config/project-name fallback.
- `lib/task-runner.ts`: safe `python3 .trellis/scripts/task.py ...` wrapper.
- `lib/cli-parser.ts`: ANSI stripping and structured parsing for task list output.
- `lib/markdown.ts`: markdown discovery, heading extraction, relative link metadata, search indexing.

## Data Contracts

- Spec tree response should preserve filesystem path, display title, category, headings, and optional index description.
- Markdown content response should include path, title, raw markdown, headings, and breadcrumbs.
- Search response should include file path, title, matched line number, and snippet.
- Task action endpoints should return the executed operation result and refreshed task state when practical.

## Read/Write Policy

- Reads use `task.py` when Trellis exposes a stable command.
- Reads use direct filesystem access when no command exists, such as `task.json`, `prd.md`, `design.md`, `implement.md`, `.trellis/spec/**/*.md`, `.trellis/workspace/**/*.md`, and `.trellis/config.yaml`.
- Writes always call `task.py`; the dashboard must not mutate task files directly.

## CLI Behavior

- Detect `.trellis/` in the current working directory.
- Detect `python3` before enabling task operations.
- Try the requested/default port, then increment up to 20 attempts.
- Serve built web assets and API from one Express process.
- Print project name, root path, and final URL.
- Respect `--port` and `--no-open`.
- Handle SIGINT cleanly.

## Frontend Shape

- Navigation: Dashboard, Docs, Tasks, Workspace.
- Docs MVP: left tree, search, breadcrumb, markdown viewer, heading anchors.
- Tasks: kanban/list toggle, filters, detail drawer, archive tab.
- Workspace: developer list and session timeline.
- Use compact operational UI patterns suitable for a developer tool rather than a marketing page.

## Compatibility Notes

- Keep Trellis path assumptions centralized in `lib/trellis.ts`.
- Treat CLI output parsing as best-effort and isolate regex assumptions in `lib/cli-parser.ts`.
- Avoid meal.server-specific labels or business logic.

## Tradeoffs

- Direct markdown/task JSON reads are less future-proof than an official API, but they are necessary for data not exposed by `task.py`.
- A simple in-memory search index is enough for low-frequency local use and avoids adding a persistent database.
- Task creation remains out of scope because it is tied to AI planning workflows and would be easy to oversimplify in a generic UI.

## Rollback

- Since this is an additive package/scaffold, rollback is removing the new package files and Trellis task artifacts created for planning.
- Task state writes remain mediated through `task.py`, reducing risk to existing Trellis data.
