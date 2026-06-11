import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import type { TrellisProject } from "./trellis.js";
import { safeTrellisRelativePath } from "./trellis.js";

type TaskDocKind = "prd" | "design" | "implement";

export interface TaskSummary {
  id: string;
  path: string;
  title: string;
  description: string;
  status: string;
  priority: string | null;
  assignee: string | null;
  packageName: string | null;
  parent: string | null;
  children: string[];
  createdAt: string | null;
  hasPrd: boolean;
  hasDesign: boolean;
  hasImplement: boolean;
}

export interface TaskDoc {
  kind: TaskDocKind;
  path: string;
  markdown: string;
}

export interface TaskDetail extends TaskSummary {
  docs: TaskDoc[];
}

export function listTasks(project: TrellisProject): TaskSummary[] {
  const tasksRoot = path.join(project.trellisDir, "tasks");
  if (!existsSync(tasksRoot)) {
    return [];
  }

  return readdirSync(tasksRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .flatMap((entry) => {
      const summary = readTaskSummary(tasksRoot, entry.name);
      return summary ? [summary] : [];
    })
    .sort(compareTasks);
}

export function readCurrentTask(project: TrellisProject): TaskSummary | null {
  const taskRef = readCurrentTaskRef(project);
  const taskId = taskRef ? taskIdFromRef(project, taskRef) : undefined;
  if (!taskId) {
    return null;
  }

  return (
    readTaskSummary(path.join(project.trellisDir, "tasks"), taskId) ?? null
  );
}

export function readTaskDetail(
  project: TrellisProject,
  taskId: string,
): TaskDetail {
  ensureTaskDirectoryName(taskId);
  const taskJsonPath = safeTrellisRelativePath(
    project,
    `tasks/${taskId}/task.json`,
  );
  const taskDir = path.dirname(taskJsonPath);
  const summary = readTaskSummary(path.dirname(taskDir), taskId);

  if (!summary) {
    throw new Error(`Task not found: ${taskId}`);
  }

  return {
    ...summary,
    docs: readTaskDocs(taskDir, taskId),
  };
}

function readTaskSummary(
  tasksRoot: string,
  directoryName: string,
): TaskSummary | undefined {
  const taskDir = path.join(tasksRoot, directoryName);
  const taskJsonPath = path.join(taskDir, "task.json");
  if (!existsSync(taskJsonPath)) {
    return undefined;
  }

  const data = JSON.parse(readFileSync(taskJsonPath, "utf8")) as Record<
    string,
    unknown
  >;

  return {
    id: directoryName,
    path: `tasks/${directoryName}`,
    title: readString(data.title) ?? directoryName,
    description: readString(data.description) ?? "",
    status: readString(data.status) ?? "unknown",
    priority: readString(data.priority) ?? null,
    assignee: readString(data.assignee) ?? null,
    packageName: readString(data.package) ?? null,
    parent: readString(data.parent) ?? null,
    children: readStringArray(data.children),
    createdAt: readString(data.createdAt) ?? null,
    hasPrd: existsSync(path.join(taskDir, "prd.md")),
    hasDesign: existsSync(path.join(taskDir, "design.md")),
    hasImplement: existsSync(path.join(taskDir, "implement.md")),
  };
}

function compareTasks(a: TaskSummary, b: TaskSummary): number {
  const statusRank = statusOrder(a.status) - statusOrder(b.status);
  if (statusRank !== 0) {
    return statusRank;
  }

  const priorityRank = priorityOrder(a.priority) - priorityOrder(b.priority);
  if (priorityRank !== 0) {
    return priorityRank;
  }

  return a.id.localeCompare(b.id);
}

function statusOrder(status: string): number {
  const order: Record<string, number> = {
    planning: 0,
    in_progress: 1,
    review: 2,
    completed: 3,
  };
  return order[status] ?? 4;
}

function priorityOrder(priority: string | null): number {
  const order: Record<string, number> = { P0: 0, P1: 1, P2: 2, P3: 3 };
  return priority ? (order[priority] ?? 4) : 4;
}

function readString(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function readStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function readCurrentTaskRef(project: TrellisProject): string | undefined {
  const legacyTaskFile = path.join(project.trellisDir, ".current-task");
  if (existsSync(legacyTaskFile)) {
    return readFileSync(legacyTaskFile, "utf8").trim() || undefined;
  }

  const sessionsRoot = path.join(project.trellisDir, ".runtime", "sessions");
  if (!existsSync(sessionsRoot)) {
    return undefined;
  }

  const taskRefs = readdirSync(sessionsRoot, { withFileTypes: true }).flatMap(
    (entry) => {
      if (!entry.isFile() || !entry.name.endsWith(".json")) {
        return [];
      }

      const sessionData = readJsonObject(path.join(sessionsRoot, entry.name));
      const currentTask = sessionData
        ? readString(sessionData.current_task)
        : undefined;
      return currentTask ? [currentTask] : [];
    },
  );

  return taskRefs.length === 1 ? taskRefs[0] : undefined;
}

function taskIdFromRef(
  project: TrellisProject,
  taskRef: string,
): string | undefined {
  const normalizedRef = taskRef.replace(/\\/g, "/").replace(/^\.\//, "");
  const taskId = taskIdFromRelativeRef(normalizedRef);
  if (taskId) {
    return taskId;
  }

  if (!path.isAbsolute(taskRef)) {
    return undefined;
  }

  const relativePath = path.relative(
    path.join(project.trellisDir, "tasks"),
    taskRef,
  );
  if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
    return undefined;
  }

  return taskIdFromRelativeRef(`tasks/${relativePath.replace(/\\/g, "/")}`);
}

function taskIdFromRelativeRef(taskRef: string): string | undefined {
  const match = taskRef.match(/^(?:\.trellis\/)?tasks\/([^/]+)$/);
  return match?.[1];
}

function readJsonObject(filePath: string): Record<string, unknown> | undefined {
  try {
    const parsed = JSON.parse(readFileSync(filePath, "utf8")) as unknown;
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : undefined;
  } catch {
    return undefined;
  }
}

function readTaskDocs(taskDir: string, taskId: string): TaskDoc[] {
  const docs: Array<{ kind: TaskDocKind; fileName: string }> = [
    { kind: "prd", fileName: "prd.md" },
    { kind: "design", fileName: "design.md" },
    { kind: "implement", fileName: "implement.md" },
  ];

  return docs.flatMap(({ kind, fileName }) => {
    const filePath = path.join(taskDir, fileName);
    if (!existsSync(filePath)) {
      return [];
    }

    return [
      {
        kind,
        path: `tasks/${taskId}/${fileName}`,
        markdown: readFileSync(filePath, "utf8"),
      },
    ];
  });
}

function ensureTaskDirectoryName(taskId: string): void {
  if (
    !taskId ||
    taskId === "." ||
    taskId === ".." ||
    taskId.includes("/") ||
    taskId.includes("\\")
  ) {
    throw new Error("Invalid task id.");
  }
}
