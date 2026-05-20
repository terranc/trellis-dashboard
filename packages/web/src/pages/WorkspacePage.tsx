import { useEffect, useMemo, useState } from "react";
import { MarkdownViewer } from "../components/MarkdownViewer";
import { text } from "../i18n/en";
import type {
  SpecDoc,
  WorkspaceDeveloperDetail,
  WorkspaceDeveloperSummary,
  WorkspaceSession,
} from "../lib/api";
import { fetchWorkspaceDeveloper, fetchWorkspaceDevelopers } from "../lib/api";
import type { NavigateOptions } from "../lib/route";

interface WorkspacePageProps {
  selectedDeveloperId: string | undefined;
  selectedSessionId: string | undefined;
  onSelectWorkspace: (
    developerId: string | undefined,
    sessionId?: string | undefined,
    options?: NavigateOptions,
  ) => void;
}

export function WorkspacePage({
  selectedDeveloperId,
  selectedSessionId,
  onSelectWorkspace,
}: WorkspacePageProps) {
  const [developers, setDevelopers] = useState<WorkspaceDeveloperSummary[]>([]);
  const [detail, setDetail] = useState<WorkspaceDeveloperDetail>();
  const [loadingDevelopers, setLoadingDevelopers] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [error, setError] = useState<string>();

  useEffect(() => {
    fetchWorkspaceDevelopers()
      .then(setDevelopers)
      .catch((nextError: Error) => setError(nextError.message))
      .finally(() => setLoadingDevelopers(false));
  }, []);

  useEffect(() => {
    if (loadingDevelopers || developers.length === 0) {
      return;
    }

    const developerExists = developers.some(
      (developer) => developer.id === selectedDeveloperId,
    );
    if (!selectedDeveloperId || !developerExists) {
      onSelectWorkspace(developers[0].id, undefined, { replace: true });
    }
  }, [developers, loadingDevelopers, onSelectWorkspace, selectedDeveloperId]);

  useEffect(() => {
    if (!selectedDeveloperId) {
      return;
    }

    setLoadingDetail(true);
    setDetail(undefined);
    fetchWorkspaceDeveloper(selectedDeveloperId)
      .then(setDetail)
      .catch((nextError: Error) => setError(nextError.message))
      .finally(() => setLoadingDetail(false));
  }, [selectedDeveloperId]);

  useEffect(() => {
    if (!detail || detail.sessions.length === 0) {
      return;
    }

    const sessionExists = detail.sessions.some(
      (session) => session.id === selectedSessionId,
    );
    if (!selectedSessionId || !sessionExists) {
      onSelectWorkspace(detail.developer.id, detail.sessions[0].id, {
        replace: true,
      });
    }
  }, [detail, onSelectWorkspace, selectedSessionId]);

  const selectedSession = useMemo(
    () =>
      detail?.sessions.find((session) => session.id === selectedSessionId) ??
      detail?.sessions[0],
    [detail, selectedSessionId],
  );

  return (
    <main className="workspace-layout">
      <aside className="workspace-sidebar">
        <header className="workspace-panel__header">
          <div>
            <p>{text.workspaceActivity}</p>
            <h2>{text.workspaceSubtitle}</h2>
          </div>
          <strong>{developers.length}</strong>
        </header>

        {error ? (
          <div className="notice">{`${text.error}: ${error}`}</div>
        ) : null}
        {loadingDevelopers ? (
          <div className="notice">{text.loading}</div>
        ) : null}
        {!loadingDevelopers && developers.length === 0 ? (
          <div className="notice">{text.noWorkspaceDevelopers}</div>
        ) : null}

        <div className="workspace-developer-list">
          {developers.map((developer) => (
            <button
              aria-current={
                developer.id === selectedDeveloperId ? "page" : undefined
              }
              className="workspace-developer"
              key={developer.id}
              type="button"
              onClick={() => onSelectWorkspace(developer.id)}
            >
              <span>{developer.name}</span>
              <small>
                {`${text.totalSessions}: ${developer.totalSessions}`}
              </small>
              <small>
                {`${text.lastActive}: ${developer.lastActive ?? text.none}`}
              </small>
            </button>
          ))}
        </div>
      </aside>

      <section className="workspace-content">
        <section
          className="workspace-timeline"
          aria-label={text.sessionTimeline}
        >
          <header>
            <h2>{text.sessionTimeline}</h2>
            {detail?.developer.activeFile ? (
              <span>{`${text.activeFile}: ${detail.developer.activeFile}`}</span>
            ) : null}
          </header>

          {loadingDetail ? <div className="notice">{text.loading}</div> : null}
          {!loadingDetail && detail?.sessions.length === 0 ? (
            <div className="notice">{text.noWorkspaceSessions}</div>
          ) : null}

          <div className="workspace-session-list">
            {detail?.sessions.map((session) => (
              <button
                aria-current={
                  session.id === selectedSession?.id ? "page" : undefined
                }
                className="workspace-session"
                key={`${session.journalFile}-${session.id}`}
                type="button"
                onClick={() =>
                  onSelectWorkspace(detail.developer.id, session.id)
                }
              >
                <span>{session.title}</span>
                <small>{session.date ?? text.none}</small>
              </button>
            ))}
          </div>
        </section>

        <section className="workspace-session-detail">
          {selectedSession ? (
            <SessionDetail session={selectedSession} />
          ) : !loadingDetail ? (
            <div className="notice">{text.noWorkspaceSessions}</div>
          ) : null}
        </section>
      </section>
    </main>
  );
}

function SessionDetail({ session }: { session: WorkspaceSession }) {
  const doc: SpecDoc = {
    path: `workspace/${session.journalFile}`,
    title: session.title,
    category: "workspace",
    markdown: session.markdown,
    headings: [],
    breadcrumbs: [text.workspace, session.journalFile, session.title],
  };

  return (
    <>
      <div className="workspace-session-meta">
        <span>{`${text.sessionDate}: ${session.date ?? text.none}`}</span>
        <span>{`${text.sessionTask}: ${session.task ?? text.none}`}</span>
        <span>{`${text.sessionBranch}: ${session.branch ?? text.none}`}</span>
        <span>{`${text.journalFile}: ${session.journalFile}`}</span>
      </div>
      <MarkdownViewer doc={doc} onNavigate={() => undefined} />
    </>
  );
}
