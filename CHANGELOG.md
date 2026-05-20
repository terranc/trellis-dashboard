# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-05-21

### Added
- Docs browser with full Markdown rendering for `.trellis/spec/` documents
- Task management page with list view and detail pages backed by `task.py`
- Workspace browser showing developer journals and session traces
- CLI entrypoint with auto port fallback and `--port` / `--no-open` options
- Published to npm as `@terranc/trellis-dashboard` — run via `npx @terranc/trellis-dashboard`
- Vite dev proxy forwarding `/api` to Express server
- Dual-language README (`README.md` + `README.zh-CN.md`)
