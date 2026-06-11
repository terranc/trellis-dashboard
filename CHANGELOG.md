# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.4] - 2026-06-11

### Fixed
- Task board column order: Planning now appears to the left of In progress (server-side sort fix)

## [0.1.3] - 2026-06-11

### Fixed
- Task board column order: Planning now appears to the left of In progress (code fix missing from v0.1.2)

## [0.1.2] - 2026-05-28

### Fixed
- Task board column order: Planning now appears to the left of In progress

## [0.1.1] - 2026-05-26

### Added
- Copy dropdown menu on task cards and task detail modal with three options:
  - Copy task ID
  - Copy continue prompt (`/trellis:continue <task-id>`)
  - Copy finish prompt (`/trellis:finish-work <task-id>`)

## [0.1.0] - 2026-05-21

### Added
- Docs browser with full Markdown rendering for `.trellis/spec/` documents
- Task management page with list view and detail pages backed by `task.py`
- Workspace browser showing developer journals and session traces
- CLI entrypoint with auto port fallback and `--port` / `--no-open` options
- Published to npm as `@terranc/trellis-dashboard` — run via `npx @terranc/trellis-dashboard`
- Vite dev proxy forwarding `/api` to Express server
- Dual-language README (`README.md` + `README.zh-CN.md`)
