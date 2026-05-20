# Route-backed browsing state restore design

## Architecture

Add a small client-side route module in `packages/web/src/lib/route.ts` and make the route the source of truth for durable dashboard state. The app keeps ephemeral rendering state in React, but view selection, selected documentation file, and task modal selection are derived from `window.location.pathname`.

No routing library is needed for this scope. The app has only two primary surfaces and one modal overlay, and the server already returns `index.html` for unknown non-API paths in production.

## Route Shape

- `/` redirects in-app to the default docs route.
- `/docs` opens the docs view and selects the default documentation file.
- `/docs/<doc-path>` opens the docs view and selects the encoded spec document path.
- `/tasks` opens the tasks view with no modal.
- `/tasks/<task-id>` opens the tasks view and opens the task details modal for the matching task.

Document paths keep their existing `spec/...` shape after `/docs/`, with each segment encoded by `encodeURIComponent`. Task routes use `TaskSummary.id`, because it is stable and already used by the task detail API.

## Data Flow

`App` owns the current route state:

- Parse `window.location.pathname` on mount.
- Subscribe to `popstate` and update React route state when the user uses browser back/forward.
- Provide route update callbacks to `DocsPage` and `TasksPage`.
- Push new history entries when users click top navigation, select a doc, open a task, or close a modal.

`DocsPage` receives the route-selected doc path and an `onSelectDocument` callback. After the spec tree loads, it validates the route path against the tree. If the path is missing or stale, it falls back to the default doc and asks `App` to replace the current URL with the valid doc route. The active category is derived from the selected doc, while TOC heading state remains local.

`TasksPage` receives the route-selected task id and an `onSelectTask` callback. After tasks load, it finds the selected task by id. If the id is missing, no modal opens. If the id is stale, the page keeps the task list visible and asks `App` to replace the URL with `/tasks`.

## Compatibility

The existing `localStorage` doc/category persistence should be removed or ignored for durable browsing state. Old users who arrive at `/` should simply get the default docs route. This avoids two competing sources of truth.

Search query state stays local. Clicking a search result selects the document and updates the route.

## Error Handling

Invalid routes fall back to the nearest valid state:

- Unknown top-level path becomes the default docs route.
- Missing or stale doc path becomes the default docs route after the tree loads.
- Missing or stale task id becomes `/tasks` after the task list loads.

Network/API errors keep using the existing page notices. They should not cause route parsing failures.

## Testing Strategy

Manual/browser verification should cover:

- Docs document selection updates URL and survives refresh.
- Docs category selection follows selected document after refresh.
- Top navigation uses path routes and survives refresh.
- Task modal opens from `/tasks/<task-id>` after refresh.
- Closing the modal updates the URL to `/tasks`.
- Browser back/forward moves between document and task modal states.

Static validation must run `npm run format`, `npm run lint`, and `npm run type-check`.
