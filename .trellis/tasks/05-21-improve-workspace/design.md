# 完善 workspace 功能 - Design

## Architecture and Boundaries

This task adds a read-only Workspace slice across the existing server and web packages.

- Server:
  - Add `packages/server/src/lib/workspace.ts` for filesystem parsing of `.trellis/workspace/`.
  - Add `packages/server/src/api/workspace.ts` for Express routes.
  - Register the router under `/api/workspace` in `packages/server/src/index.ts`.
- Web:
  - Extend `packages/web/src/lib/api.ts` with Workspace response types and fetch helpers.
  - Extend `packages/web/src/lib/route.ts` with the `workspace` route.
  - Add `packages/web/src/pages/WorkspacePage.tsx`.
  - Wire navigation in `packages/web/src/App.tsx`.
  - Add only the required i18n keys in `packages/web/src/i18n/en.ts`.

The feature remains read-only. No code should write, create, delete, or normalize files under `.trellis/workspace/`.

## Data Flow and Contracts

### Server data model

`listWorkspaceDevelopers(project)` returns developer summaries from `.trellis/workspace/{developer}/index.md` and journal files:

- `id`: developer directory name.
- `name`: display name, initially same as `id`.
- `totalSessions`: parsed from developer index when available, otherwise counted from journals.
- `lastActive`: parsed from developer index when available, otherwise latest session date.
- `activeFile`: parsed from developer index when available.

`readWorkspaceDeveloper(project, developerId)` returns:

- `developer`: the summary.
- `sessions`: parsed from `journal-*.md`, sorted newest first.

Each session contains:

- `id`: stable URL id, based on the session number string.
- `number`: numeric session number when parseable.
- `title`
- `date`
- `task`
- `branch`
- `journalFile`
- `markdown`: only that session block, not the entire journal.

### HTTP API

- `GET /api/workspace`
  - Response: `{ developers: WorkspaceDeveloperSummary[] }`
- `GET /api/workspace/:developer`
  - Response: `{ developer: WorkspaceDeveloperSummary, sessions: WorkspaceSession[] }`

No separate journal-content endpoint is needed for the MVP because each parsed session already carries its own markdown detail. This keeps the client interaction simple while still satisfying session-level detail viewing.

### URL contract

- `/workspace` loads all developers, defaults to the most recently active developer, then defaults to that developer's most recent session.
- `/workspace/:developer` keeps the developer selection and defaults to that developer's most recent session.
- `/workspace/:developer/:sessionNumber` keeps both developer and session selection after refresh.

If a URL references a missing developer or session, the client replaces it with the nearest valid Workspace route.

## Parsing Rules

- Developer folders are direct child directories of `.trellis/workspace/`.
- Session blocks are split on headings matching `## Session {N}: {Title}`.
- Session metadata is parsed from the block body:
  - `**Date**: ...`
  - `**Task**: ...`
  - `**Branch**: ...`
- Missing metadata should not fail the entire page; use `null` for unavailable values.
- Journal files are read from `journal-*.md` only.

## Compatibility and Migration Notes

- Existing Docs and Tasks behavior should be unchanged.
- Existing Workspace markdown files require no migration.
- The route parser remains client-side and uses the existing History API approach.
- The server uses `safeTrellisRelativePath` and direct path checks so user-controlled route parameters cannot escape `.trellis/workspace/`.

## Trade-offs

- Returning session markdown in the developer-detail response avoids an extra endpoint and request, at the cost of larger payloads for long journals. This is acceptable for the read-only MVP because workspace journals are local project files and current journal files are capped by Trellis guidance.
- Session URLs use the session number rather than journal file and line number. This is easier to read and matches the requested simple deep-link shape, but duplicate session numbers across multiple journal files would need deterministic handling. The MVP should sort by journal file and session order, and use the first matching session if duplicates appear.

## Rollback Considerations

- Remove the `/api/workspace` router registration and Workspace web route to disable the feature.
- No data migration or cleanup is required because the feature is read-only.
