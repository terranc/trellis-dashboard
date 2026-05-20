# 完善 workspace 功能 - Implement

## Implementation Checklist

1. Add server Workspace parsing.
   - Create `packages/server/src/lib/workspace.ts`.
   - Parse developer summaries from `.trellis/workspace/{developer}/index.md`.
   - Parse `journal-*.md` files into session blocks.
   - Verify with focused Vitest coverage.

2. Add server Workspace API.
   - Create `packages/server/src/api/workspace.ts`.
   - Register `/api/workspace` in `packages/server/src/index.ts`.
   - Verify API shape through helper tests and existing server test suite.

3. Add web API and route support.
   - Extend `packages/web/src/lib/api.ts` with Workspace types and fetchers.
   - Extend `packages/web/src/lib/route.ts` with `/workspace`, `/workspace/:developer`, and `/workspace/:developer/:sessionNumber`.
   - Verify type-check catches route contract mismatches.

4. Add Workspace UI.
   - Create `packages/web/src/pages/WorkspacePage.tsx`.
   - Show developer list, session timeline, and selected session markdown.
   - Default to the most recent developer and most recent session.
   - Sync URL on developer/session changes.
   - Reuse existing UI patterns and `MarkdownViewer` where practical.

5. Wire app shell and strings.
   - Enable Workspace navigation in `packages/web/src/App.tsx`.
   - Add required i18n keys to `packages/web/src/i18n/en.ts`.
   - Add scoped CSS only for new Workspace layout.

6. Final validation.
   - Run `npm run format`.
   - Run `npm run lint`.
   - Run `npm run type-check`.
   - Run `npm run test`.
   - If a frontend behavior risk remains, run the app and verify `/workspace` manually.

## Validation Commands

```bash
npm run format
npm run lint
npm run type-check
npm run test
```

## Risky Files and Rollback Points

- `packages/server/src/lib/workspace.ts`: parsing logic and path safety.
- `packages/web/src/lib/route.ts`: route parsing must not break existing `/docs` and `/tasks`.
- `packages/web/src/App.tsx`: app-level route switch must preserve Docs and Tasks behavior.
- `packages/web/src/pages/WorkspacePage.tsx`: default-selection effects must avoid navigation loops.

Rollback is straightforward because the feature is additive and read-only.

## Follow-up Checks Before Start

- Confirm PRD, design, and implementation plan are approved.
- Run `python3 ./.trellis/scripts/task.py start 05-21-improve-workspace` before code changes.
- Load `trellis-before-dev` for package-specific implementation guidance.
