import { useCallback, useEffect, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { text } from "../i18n/en";
import type { TaskDetail, TaskDoc, TaskSummary } from "../lib/api";
import { fetchTaskDetail, fetchTasks } from "../lib/api";
import type { NavigateOptions } from "../lib/route";

const STATUS_ORDER = ["in_progress", "planning", "review", "completed"];

interface TasksPageProps {
  projectRoot: string | undefined;
  selectedTaskId: string | undefined;
  onSelectTask: (taskId: string | undefined, options?: NavigateOptions) => void;
}

export function TasksPage({
  projectRoot,
  selectedTaskId,
  onSelectTask,
}: TasksPageProps) {
  const [tasks, setTasks] = useState<TaskSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [copiedTaskId, setCopiedTaskId] = useState<string>();

  useEffect(() => {
    fetchTasks()
      .then(setTasks)
      .catch((nextError: Error) => setError(nextError.message))
      .finally(() => setLoading(false));
  }, []);

  const selectedTask = useMemo(
    () => tasks.find((task) => task.id === selectedTaskId),
    [selectedTaskId, tasks],
  );

  useEffect(() => {
    if (loading || !selectedTaskId) {
      return;
    }

    if (!tasks.some((task) => task.id === selectedTaskId)) {
      onSelectTask(undefined, { replace: true });
    }
  }, [loading, onSelectTask, selectedTaskId, tasks]);

  useEffect(() => {
    if (!selectedTask) {
      return;
    }

    function closeOnEscape(event: KeyboardEvent): void {
      if (event.key === "Escape") {
        onSelectTask(undefined);
      }
    }

    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [onSelectTask, selectedTask]);

  const groupedTasks = useMemo(() => groupTasks(tasks), [tasks]);
  const copyTaskHandoff = useCallback(
    (task: TaskSummary) => {
      void navigator.clipboard
        .writeText(buildTaskHandoffPrompt(task, projectRoot))
        .then(() => {
          setCopiedTaskId(task.id);
          setError(undefined);
        })
        .catch(() => setError(text.copyTaskHandoffFailed));
    },
    [projectRoot],
  );

  useEffect(() => {
    if (!copiedTaskId) {
      return;
    }

    const timeout = window.setTimeout(() => setCopiedTaskId(undefined), 1800);
    return () => window.clearTimeout(timeout);
  }, [copiedTaskId]);

  return (
    <main className="tasks-layout">
      <section className="tasks-panel">
        <header className="tasks-panel__header">
          <div>
            <p>{text.taskBoard}</p>
            <h2>{text.taskBoardSubtitle}</h2>
          </div>
          <strong>{tasks.length}</strong>
        </header>

        {error ? (
          <div className="notice">{`${text.error}: ${error}`}</div>
        ) : null}
        {loading ? <div className="notice">{text.loading}</div> : null}
        {!loading && tasks.length === 0 ? (
          <div className="notice">{text.noTasks}</div>
        ) : null}

        <div className="task-groups">
          {groupedTasks.map(([status, statusTasks]) => (
            <section className="task-group" key={status}>
              <div className="task-group__title">
                <h3>{statusLabel(status)}</h3>
                <span>{statusTasks.length}</span>
              </div>
              <div className="task-list">
                {statusTasks.map((task) => (
                  <article
                    aria-label={`${text.openTaskDetails}: ${task.title}`}
                    className="task-card"
                    key={task.path}
                    role="button"
                    tabIndex={0}
                    onClick={() => onSelectTask(task.id)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        onSelectTask(task.id);
                      }
                    }}
                  >
                    <div className="task-card__topline">
                      <span>{task.priority ?? statusLabel("unknown")}</span>
                      <small>{task.id}</small>
                    </div>
                    {canCopyTaskHandoff(task) ? (
                      <button
                        aria-label={`${text.copyTaskHandoff}: ${task.title}`}
                        aria-pressed={copiedTaskId === task.id}
                        className="task-copy-button task-card__copy"
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          copyTaskHandoff(task);
                        }}
                        onKeyDown={(event) => event.stopPropagation()}
                      >
                        {copiedTaskId === task.id
                          ? text.copiedTaskHandoff
                          : text.copyTaskHandoffShort}
                      </button>
                    ) : null}
                    <h4>{task.title}</h4>
                    {task.description ? <p>{task.description}</p> : null}
                    <dl>
                      <div>
                        <dt>{text.taskAssignee}</dt>
                        <dd>{task.assignee ?? statusLabel("unknown")}</dd>
                      </div>
                      <div>
                        <dt>{text.taskPackage}</dt>
                        <dd>{task.packageName ?? statusLabel("unknown")}</dd>
                      </div>
                      <div>
                        <dt>{text.taskCreated}</dt>
                        <dd>{task.createdAt ?? statusLabel("unknown")}</dd>
                      </div>
                    </dl>
                    <div className="task-card__artifacts">
                      <span>{text.taskArtifacts}</span>
                      {task.hasPrd ? <small>{text.taskPrd}</small> : null}
                      {task.hasDesign ? <small>{text.taskDesign}</small> : null}
                      {task.hasImplement ? (
                        <small>{text.taskPlan}</small>
                      ) : null}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      </section>
      {selectedTask ? (
        <TaskDetailsModal
          copied={copiedTaskId === selectedTask.id}
          task={selectedTask}
          onClose={() => onSelectTask(undefined)}
          onCopyTask={copyTaskHandoff}
        />
      ) : null}
    </main>
  );
}

interface TaskDetailsModalProps {
  copied: boolean;
  task: TaskSummary;
  onClose: () => void;
  onCopyTask: (task: TaskSummary) => void;
}

function TaskDetailsModal({
  copied,
  task,
  onClose,
  onCopyTask,
}: TaskDetailsModalProps) {
  const [detail, setDetail] = useState<TaskDetail>();
  const [activeDocKind, setActiveDocKind] = useState<TaskDoc["kind"]>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();

  useEffect(() => {
    setLoading(true);
    setError(undefined);
    setDetail(undefined);
    setActiveDocKind(undefined);

    fetchTaskDetail(task.id)
      .then((nextDetail) => {
        setDetail(nextDetail);
        setActiveDocKind(nextDetail.docs[0]?.kind);
      })
      .catch((nextError: Error) => setError(nextError.message))
      .finally(() => setLoading(false));
  }, [task.id]);

  const activeDoc = detail?.docs.find((doc) => doc.kind === activeDocKind);

  return (
    <div className="task-modal" role="presentation" onClick={onClose}>
      <section
        aria-label={text.taskDetails}
        aria-modal="true"
        className="task-modal__panel"
        role="dialog"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="task-modal__header">
          <div>
            <p>{text.taskDetails}</p>
            <h2>{task.title}</h2>
            <div className="task-modal__chips">
              <span>{statusLabel(task.status)}</span>
              <span>{task.priority ?? statusLabel("unknown")}</span>
              <span>{task.assignee ?? text.none}</span>
            </div>
          </div>
          <div className="task-modal__actions">
            {canCopyTaskHandoff(task) ? (
              <button
                aria-label={`${text.copyTaskHandoff}: ${task.title}`}
                aria-pressed={copied}
                className="task-copy-button"
                type="button"
                onClick={() => onCopyTask(task)}
              >
                {copied ? text.copiedTaskHandoff : text.copyTaskHandoff}
              </button>
            ) : null}
            <button
              aria-label={text.closeTaskDetails}
              type="button"
              onClick={onClose}
            >
              {text.closeTaskDetails}
            </button>
          </div>
        </header>

        <div className="task-modal__body">
          <aside className="task-modal__aside">
            <section>
              <h3>{text.taskDocs}</h3>
              <div className="task-doc-tabs">
                {detail?.docs.map((doc) => (
                  <button
                    aria-current={
                      doc.kind === activeDocKind ? "page" : undefined
                    }
                    key={doc.kind}
                    type="button"
                    onClick={() => setActiveDocKind(doc.kind)}
                  >
                    {docLabel(doc.kind)}
                  </button>
                ))}
                {!loading && detail?.docs.length === 0 ? (
                  <span>{text.noTaskDocs}</span>
                ) : null}
              </div>
            </section>

            <section>
              <h3>{text.taskDetails}</h3>
              <dl className="task-modal__meta">
                <TaskMeta label={text.taskPath} value={task.path} />
                <TaskMeta label={text.taskPackage} value={task.packageName} />
                <TaskMeta label={text.taskCreated} value={task.createdAt} />
                <TaskMeta label={text.taskParent} value={task.parent} />
                <TaskMeta
                  label={text.taskChildren}
                  value={task.children.length ? task.children.join(", ") : null}
                />
              </dl>
            </section>
          </aside>

          <section className="task-doc-viewer">
            {loading ? <div className="notice">{text.loading}</div> : null}
            {error ? (
              <div className="notice">{`${text.error}: ${error}`}</div>
            ) : null}
            {!loading && !activeDoc ? (
              <div className="notice">{text.noTaskDocs}</div>
            ) : null}
            {activeDoc ? (
              <article className="markdown-viewer task-doc">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {activeDoc.markdown}
                </ReactMarkdown>
              </article>
            ) : null}
          </section>
        </div>
      </section>
    </div>
  );
}

interface TaskMetaProps {
  label: string;
  value: string | null;
}

function TaskMeta({ label, value }: TaskMetaProps) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value ?? text.none}</dd>
    </div>
  );
}

function docLabel(kind: TaskDoc["kind"]): string {
  return text.taskDocLabels[kind];
}

function canCopyTaskHandoff(task: TaskSummary): boolean {
  return task.status !== "completed";
}

function buildTaskHandoffPrompt(
  task: TaskSummary,
  projectRoot: string | undefined,
): string {
  const taskDirectory = task.path.startsWith(".trellis/")
    ? task.path
    : `.trellis/${task.path}`;
  const lines = projectRoot ? [`cd ${quoteShellArg(projectRoot)}`] : [];

  lines.push(
    `./.trellis/scripts/task.py start ${quoteShellArg(taskDirectory)}`,
  );
  lines.push("");
  lines.push("/trellis:continue");

  return lines.join("\n");
}

function quoteShellArg(value: string): string {
  return `"${value.replace(/(["\\$`])/g, "\\$1")}"`;
}

function groupTasks(tasks: TaskSummary[]): [string, TaskSummary[]][] {
  const groups = new Map<string, TaskSummary[]>();
  for (const task of tasks) {
    groups.set(task.status, [...(groups.get(task.status) ?? []), task]);
  }

  return [...groups.entries()].sort(
    ([first], [second]) => statusOrder(first) - statusOrder(second),
  );
}

function statusOrder(status: string): number {
  const index = STATUS_ORDER.indexOf(status);
  return index === -1 ? STATUS_ORDER.length : index;
}

function statusLabel(status: string): string {
  const labels = text.taskStatusLabels as Record<string, string>;
  return labels[status] ?? status;
}
