# Route-backed browsing state restore

## Goal

Make primary dashboard navigation state recoverable after a browser refresh by representing durable browsing state in the route. Users should return to the same major view, selected documentation file, and open task detail modal after refreshing the page.

## User Value

- Users can refresh without losing their place in the dashboard.
- Meaningful UI states can be shared, bookmarked, and navigated with browser back/forward controls.
- State recovery is handled consistently through routing rather than isolated click handlers or ad hoc storage.

## Confirmed Facts

- The top-level app currently stores the active view in local React state, defaulting to `docs`.
- `DocsPage` currently stores the selected category and selected document in React state and mirrors those values to `localStorage`.
- The table-of-contents heading state is component-local and does not need route persistence.
- `TasksPage` currently stores the selected task modal in React state, so a refresh closes the modal.
- Existing UI text is centralized through `packages/web/src/i18n/en.ts`; new user-facing strings must continue to use i18n.

## Requirements

- The active top navigation view must be represented in the URL.
- The selected documentation file must be represented in the URL.
- Refreshing a documentation URL must restore the same selected document and left navigation selection when the document still exists.
- The table-of-contents active heading must remain non-persistent.
- The active task detail modal must be represented in the URL.
- Refreshing a task detail URL must reopen the task modal when the task still exists.
- Closing a task modal must update the URL so the modal does not reopen on the next refresh.
- Browser back and forward navigation must move through durable view/document/modal state changes coherently.
- Invalid or stale route state must fall back to the nearest valid default without breaking the page.

## Acceptance Criteria

- [ ] From the docs view, selecting a document changes the URL and a refresh restores that document as selected.
- [ ] From the docs view, selecting a document in a different left-nav category restores that category and document after refresh.
- [ ] The table-of-contents selection is not encoded in the URL and may reset after refresh.
- [ ] Switching to the tasks view changes the URL and a refresh keeps the tasks view active.
- [ ] Opening a task detail modal changes the URL and a refresh reopens the same modal.
- [ ] Closing the task detail modal removes the modal state from the URL.
- [ ] Invalid document or task route state falls back to a valid page state without an uncaught error.
- [ ] Existing validation commands pass: `npm run format`, `npm run lint`, and `npm run type-check`.

## Out of Scope

- Persisting table-of-contents scroll/heading state.
- Persisting transient search query state unless it naturally falls out of the chosen route model.
- Adding new task-management features beyond restoring the existing modal state.
- Introducing hardcoded user-facing strings.

## Decisions

- Use path-style routes for durable browsing state.
- Do not add a routing dependency unless implementation proves the small route surface needs it.

## Notes

- This is a complex task. Add `design.md` and `implement.md` before starting implementation.
