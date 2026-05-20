import { useEffect, useState } from "react";
import { text } from "./i18n/en";
import type { AppConfig } from "./lib/api";
import { fetchConfig } from "./lib/api";
import { DocsPage } from "./pages/DocsPage";
import { TasksPage } from "./pages/TasksPage";

type View = "docs" | "tasks";

export function App() {
  const [config, setConfig] = useState<AppConfig>();
  const [view, setView] = useState<View>("docs");

  useEffect(() => {
    fetchConfig()
      .then(setConfig)
      .catch(() => undefined);
  }, []);

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
            aria-current={view === "docs" ? "page" : undefined}
            type="button"
            onClick={() => setView("docs")}
          >
            {text.docs}
          </button>
          <button
            aria-current={view === "tasks" ? "page" : undefined}
            type="button"
            onClick={() => setView("tasks")}
          >
            {text.tasks}
          </button>
          <a aria-disabled="true">{text.workspace}</a>
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
          <span>{text.currentFocus}</span>
          <strong>{view === "docs" ? text.docsMvp : text.taskInventory}</strong>
        </div>
      </section>
      {view === "docs" ? <DocsPage /> : <TasksPage />}
    </div>
  );
}
