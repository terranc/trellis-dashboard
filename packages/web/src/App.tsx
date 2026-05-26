import { useCallback, useEffect, useState } from "react";
import { text } from "./i18n/en";
import type { AppConfig } from "./lib/api";
import { fetchConfig } from "./lib/api";
import type { AppRoute, NavigateOptions } from "./lib/route";
import {
  docsRoutePath,
  parseAppRoute,
  tasksRoutePath,
  workspaceRoutePath,
} from "./lib/route";
import { DocsPage } from "./pages/DocsPage";
import { TasksPage } from "./pages/TasksPage";
import { WorkspacePage } from "./pages/WorkspacePage";

export function App() {
  const [config, setConfig] = useState<AppConfig>();
  const [route, setRoute] = useState<AppRoute>(() =>
    parseAppRoute(window.location.pathname),
  );

  useEffect(() => {
    fetchConfig()
      .then(setConfig)
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    function updateFromLocation(): void {
      setRoute(parseAppRoute(window.location.pathname));
    }

    window.addEventListener("popstate", updateFromLocation);
    return () => window.removeEventListener("popstate", updateFromLocation);
  }, []);

  const navigate = useCallback((path: string, options?: NavigateOptions) => {
    if (path !== window.location.pathname) {
      const method = options?.replace ? "replaceState" : "pushState";
      window.history[method](null, "", path);
    } else if (options?.replace) {
      window.history.replaceState(null, "", path);
    }

    setRoute(parseAppRoute(path));
  }, []);

  const selectDocument = useCallback(
    (docPath: string, options?: NavigateOptions) => {
      navigate(docsRoutePath(docPath), options);
    },
    [navigate],
  );

  const selectTask = useCallback(
    (taskId: string | undefined, options?: NavigateOptions) => {
      navigate(tasksRoutePath(taskId), options);
    },
    [navigate],
  );

  const selectWorkspace = useCallback(
    (
      developerId: string | undefined,
      sessionId?: string | undefined,
      options?: NavigateOptions,
    ) => {
      navigate(workspaceRoutePath(developerId, sessionId), options);
    },
    [navigate],
  );

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <p>{text.appTitle}</p>
          <h1>{config?.project.name ?? text.appSubtitle}</h1>
          {config ? (
            <span>{`${text.projectRoot}: ${config.project.root}`}</span>
          ) : null}
        </div>
        <nav aria-label={text.appTitle}>
          <button
            aria-current={route.view === "docs" ? "page" : undefined}
            type="button"
            onClick={() => navigate(docsRoutePath())}
          >
            {text.docs}
          </button>
          <button
            aria-current={route.view === "tasks" ? "page" : undefined}
            type="button"
            onClick={() => navigate(tasksRoutePath())}
          >
            {text.tasks}
          </button>
          <button
            aria-current={route.view === "workspace" ? "page" : undefined}
            type="button"
            onClick={() => navigate(workspaceRoutePath())}
          >
            {text.workspace}
          </button>
        </nav>
      </header>
      <section className="summary-strip">
        <div>
          <span>{text.docsCount}</span>
          <strong>{config?.counts.specDocs ?? "-"}</strong>
        </div>
        <div>
          <span>{text.tasksCount}</span>
          <strong>{config?.counts.tasks ?? "-"}</strong>
        </div>
        <div>
          <span>{text.activeTask}</span>
          <strong title={config?.currentTask?.title}>
            {config ? (config.currentTask?.id ?? text.none) : "-"}
          </strong>
        </div>
      </section>
      {route.view === "docs" ? (
        <DocsPage
          selectedDocPath={route.docPath}
          onSelectDocument={selectDocument}
        />
      ) : null}
      {route.view === "tasks" ? (
        <TasksPage selectedTaskId={route.taskId} onSelectTask={selectTask} />
      ) : null}
      {route.view === "workspace" ? (
        <WorkspacePage
          selectedDeveloperId={route.developerId}
          selectedSessionId={route.sessionId}
          onSelectWorkspace={selectWorkspace}
        />
      ) : null}
    </div>
  );
}
