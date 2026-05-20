# Trellis Dashboard

## Goal

Build a reusable local web dashboard for Trellis projects so developers can inspect project knowledge, task state, and workspace activity without reading `.trellis/` files manually.

Source design: `docs/superpowers/specs/2026-05-21-trellis-dashboard-design.md`.

## User Value

- Give developers a low-friction overview of a Trellis project's current state.
- Make `.trellis/spec/` documentation easier to browse and search.
- Make active and archived tasks easier to inspect without bypassing `task.py` for state-changing operations.
- Keep the tool portable across Trellis projects as an independent npm package.

## Confirmed Facts

- The dashboard is intended as a general Trellis visualization tool, not a meal.server-specific product feature.
- This task lives in the independent implementation project at `~/www/trellis-dashboard`.
- It should run locally from a CLI command such as `npx trellis-dashboard`.
- The planned implementation is an independent npm package with an Express + TypeScript backend and React + Vite + Tailwind + shadcn/ui frontend.
- Write operations must go through `.trellis/scripts/task.py`; direct filesystem writes are not allowed for task state changes.
- Reads should prefer Trellis CLI commands where available, with direct filesystem reads only for data that has no CLI API: task details, markdown docs, spec docs, workspace journals, and config.
- MVP priority from the design document is the spec documentation browser.
- Task creation is explicitly out of scope for the dashboard.

## Requirements

- Provide a CLI entry point that verifies the current directory is a Trellis project, starts a local server, serves the SPA, chooses an available port, and optionally opens the browser.
- Provide a docs browser for `.trellis/spec/` with a navigation tree, markdown rendering, heading extraction, breadcrumbs, internal relative-link handling, and server-side search.
- Provide task APIs that can list active tasks, archives, current task, task details, task docs, and supported task actions through `task.py`.
- Provide task UI views for kanban, table/list, task detail drawer, parent/child progress, and archive browsing.
- Provide workspace APIs and UI for developer summaries and journal/session timeline browsing.
- Provide an overview dashboard with aggregate counts, task status distribution, recent active tasks, and entry points to docs/tasks/workspace.
- Keep the first implementation staged so Phase 1 delivers the docs browser and CLI foundation before broader task/workspace modules.
- Treat the package as reusable across Trellis projects and avoid hardcoding meal.server-specific paths beyond the Trellis directory contract.

## Acceptance Criteria

- [ ] Running the CLI inside a directory with `.trellis/` starts the dashboard and prints the actual local URL.
- [ ] Running the CLI outside a Trellis project exits with a clear error.
- [ ] If the default port is unavailable, the CLI tries subsequent ports and reports the selected port.
- [ ] The docs browser can render `.trellis/spec/guides/index.md` and other spec markdown files with GFM tables and code blocks.
- [ ] The docs browser builds a navigation tree from `.trellis/spec/` and highlights the selected document/section.
- [ ] Search returns matching spec files and line snippets for a keyword.
- [ ] No dashboard operation creates a Trellis task.
- [ ] All task state-changing operations, when implemented, call `task.py` instead of editing task files directly.
- [ ] The package can be built with the chosen TypeScript/Vite/tsup toolchain.
- [ ] Static checks required by the project/package pass before implementation is marked complete.

## Out Of Scope

- Creating Trellis tasks from the web UI.
- Editing spec documents or task planning markdown from the web UI.
- Authentication or multi-user server deployment.
- WebSocket/live push updates.
- Multi-repository aggregation in a single dashboard instance.

## Open Questions

- None for repository placement; implementation continues in this project directory.
