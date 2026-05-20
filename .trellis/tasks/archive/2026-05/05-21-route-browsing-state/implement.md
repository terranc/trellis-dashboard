# Route-backed browsing state restore implementation plan

## Checklist

1. Add route helpers in `packages/web/src/lib/route.ts`.
   - Verify: helpers encode/decode docs and tasks paths without throwing on empty or malformed input.

2. Refactor `packages/web/src/App.tsx` to own parsed route state.
   - Verify: top navigation pushes `/docs` and `/tasks`, and `popstate` updates the rendered view.

3. Refactor `packages/web/src/pages/DocsPage.tsx` to use route-selected document state.
   - Verify: selecting categories, documents, and markdown links updates the route and derives the active left-nav category from the selected document.

4. Refactor `packages/web/src/pages/TasksPage.tsx` to use route-selected task modal state.
   - Verify: opening a task pushes `/tasks/<task-id>`, closing the modal pushes `/tasks`, and stale task ids are replaced with `/tasks`.

5. Remove route-competing docs `localStorage` persistence.
   - Verify: `/` and stale docs paths fall back to valid route state without reading old stored state.

6. Run quality gates.
   - Verify: `npm run format`, `npm run lint`, and `npm run type-check`.

7. Start the app and manually verify browser behavior.
   - Verify: refresh and back/forward preserve or clear state according to the PRD acceptance criteria.

## Risky Files

- `packages/web/src/App.tsx`
- `packages/web/src/pages/DocsPage.tsx`
- `packages/web/src/pages/TasksPage.tsx`
- `packages/web/src/lib/route.ts`

## Rollback Point

Before editing app files, the current behavior is fully component-local with docs `localStorage` fallback. If the route refactor becomes too broad, revert to a smaller version that only routes top-level view and task modal first, then docs selection second.
