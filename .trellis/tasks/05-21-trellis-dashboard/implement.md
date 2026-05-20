# Trellis Dashboard Implementation Plan

## Phase 0: Repository Placement Decision

- [x] Confirm source should live in `~/www/trellis-dashboard` as an independent project directory.
- [ ] Verify package manager/tooling expectations before scaffolding.

## Phase 1: CLI + Docs MVP

- [ ] Scaffold package layout with server, web, bin entry, TypeScript config, and build scripts.
- [ ] Implement Trellis project detection and project-name fallback.
- [ ] Implement Express server startup, static SPA serving, port fallback, `--port`, `--no-open`, and SIGINT handling.
- [ ] Implement spec directory scanning, markdown loading, heading extraction, breadcrumbs, and search API.
- [ ] Implement React docs browser with tree navigation, search, and markdown rendering.
- [ ] Verify against this repository's `.trellis/spec/` docs.

## Phase 2: Task Management

- [ ] Add task runner wrapper for `task.py` commands.
- [ ] Add ANSI stripping and output parser for list/current/archive commands.
- [ ] Add task detail/doc APIs using direct reads for task files.
- [ ] Add Start/Finish/Archive/Set Branch/Set Base Branch/Set Scope/Subtask endpoints through `task.py`.
- [ ] Build kanban, list, archive, parent/child, and detail drawer UI.

## Phase 3: Overview + Workspace

- [ ] Add overview aggregation API and dashboard page.
- [ ] Add workspace developer summary API.
- [ ] Parse journal files into session timeline entries.
- [ ] Build workspace list and timeline UI.

## Phase 4: Polish

- [ ] Add Mermaid rendering if needed by real spec docs.
- [ ] Add responsive layout and theme polish.
- [ ] Add focused tests for CLI parsing, path helpers, markdown tree/search, and task-runner command construction.
- [ ] Prepare npm package metadata and release checklist.

## Validation

- [ ] `npm run format` or package equivalent.
- [ ] `npm run lint` or package equivalent.
- [ ] `npm run type-check` or package equivalent.
- [ ] `npm run build`.
- [ ] Manual verification: run CLI inside this repository and open the docs browser.
- [ ] Manual verification: run CLI outside a Trellis project and confirm clear failure.

## Risk Points

- `task.py list` output format changes can break parsing; keep parser isolated and tested.
- Cross-platform process spawning and browser opening need conservative implementation.
- Serving Vite-built assets from the published package needs packaging checks before release.
- Direct filesystem reads must be path-normalized to avoid escaping the Trellis project root.

## Review Gate Before Start

- User confirms repository placement and initial deliverable scope.
- PRD/design/implementation plan reviewed.
- Then run `python3 ./.trellis/scripts/task.py start 05-21-trellis-dashboard` only after explicit approval to implement.
