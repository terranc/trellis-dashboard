export interface DocHeading {
  depth: number;
  text: string;
  slug: string;
  line: number;
}

export interface SpecTreeNode {
  name: string;
  path: string;
  title: string;
  children: SpecTreeNode[];
  headings: DocHeading[];
}

export interface SpecDoc {
  path: string;
  title: string;
  category: string;
  markdown: string;
  headings: DocHeading[];
  breadcrumbs: string[];
}

export interface SearchMatch {
  path: string;
  title: string;
  line: number;
  snippet: string;
}

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
  kind: "prd" | "design" | "implement";
  path: string;
  markdown: string;
}

export interface TaskDetail extends TaskSummary {
  docs: TaskDoc[];
}

export interface WorkspaceDeveloperSummary {
  id: string;
  name: string;
  totalSessions: number;
  lastActive: string | null;
  activeFile: string | null;
}

export interface WorkspaceSession {
  id: string;
  number: number | null;
  title: string;
  date: string | null;
  task: string | null;
  branch: string | null;
  journalFile: string;
  markdown: string;
}

export interface WorkspaceDeveloperDetail {
  developer: WorkspaceDeveloperSummary;
  sessions: WorkspaceSession[];
}

export interface AppConfig {
  project: {
    name: string;
    root: string;
  };
  counts: {
    specDocs: number;
    tasks: number;
  };
  currentTask: TaskSummary | null;
}

export async function fetchConfig(): Promise<AppConfig> {
  return getJson<{
    project: AppConfig["project"];
    counts: AppConfig["counts"];
    currentTask: AppConfig["currentTask"];
  }>("/api/config");
}

export async function fetchSpecTree(): Promise<SpecTreeNode[]> {
  const response = await getJson<{ tree: SpecTreeNode[] }>("/api/specs");
  return response.tree;
}

export async function fetchSpecDoc(path: string): Promise<SpecDoc> {
  const specPath = path.replace(/^spec\//, "");
  const response = await getJson<{ doc: SpecDoc }>(
    `/api/specs/doc/${encodeURIComponentPath(specPath)}`,
  );
  return response.doc;
}

export async function searchSpecs(query: string): Promise<SearchMatch[]> {
  const response = await getJson<{ matches: SearchMatch[] }>(
    `/api/specs/search?q=${encodeURIComponent(query)}`,
  );
  return response.matches;
}

export async function fetchTasks(): Promise<TaskSummary[]> {
  const response = await getJson<{ tasks: TaskSummary[] }>("/api/tasks");
  return response.tasks;
}

export async function fetchTaskDetail(taskId: string): Promise<TaskDetail> {
  const response = await getJson<{ task: TaskDetail }>(
    `/api/tasks/${encodeURIComponent(taskId)}`,
  );
  return response.task;
}

export async function fetchWorkspaceDevelopers(): Promise<
  WorkspaceDeveloperSummary[]
> {
  const response = await getJson<{
    developers: WorkspaceDeveloperSummary[];
  }>("/api/workspace");
  return response.developers;
}

export async function fetchWorkspaceDeveloper(
  developerId: string,
): Promise<WorkspaceDeveloperDetail> {
  return getJson<WorkspaceDeveloperDetail>(
    `/api/workspace/${encodeURIComponent(developerId)}`,
  );
}

async function getJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as {
      error?: string;
    } | null;
    throw new Error(body?.error ?? `Request failed: ${response.status}`);
  }
  return (await response.json()) as T;
}

function encodeURIComponentPath(value: string): string {
  return value.split("/").map(encodeURIComponent).join("/");
}
