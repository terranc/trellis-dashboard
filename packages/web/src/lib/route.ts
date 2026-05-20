export type AppView = "docs" | "tasks" | "workspace";

export interface AppRoute {
  view: AppView;
  docPath?: string;
  taskId?: string;
  developerId?: string;
  sessionId?: string;
}

export interface NavigateOptions {
  replace?: boolean;
}

export function parseAppRoute(pathname: string): AppRoute {
  const segments = pathname
    .split("/")
    .filter(Boolean)
    .map((segment) => safeDecode(segment));
  const [view, ...rest] = segments;

  if (view === "tasks") {
    return {
      view: "tasks",
      taskId: rest[0],
    };
  }

  if (view === "docs") {
    return {
      view: "docs",
      docPath: rest.length ? rest.join("/") : undefined,
    };
  }

  if (view === "workspace") {
    return {
      view: "workspace",
      developerId: rest[0],
      sessionId: rest[1],
    };
  }

  return { view: "docs" };
}

export function docsRoutePath(docPath?: string): string {
  return docPath ? `/docs/${encodePath(docPath)}` : "/docs";
}

export function tasksRoutePath(taskId?: string): string {
  return taskId ? `/tasks/${encodeURIComponent(taskId)}` : "/tasks";
}

export function workspaceRoutePath(
  developerId?: string,
  sessionId?: string,
): string {
  if (!developerId) {
    return "/workspace";
  }

  const base = `/workspace/${encodeURIComponent(developerId)}`;
  return sessionId ? `${base}/${encodeURIComponent(sessionId)}` : base;
}

function encodePath(value: string): string {
  return value
    .split("/")
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}
