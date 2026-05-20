import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import type { TrellisProject } from "./trellis.js";
import { safeTrellisRelativePath } from "./trellis.js";

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

export function listWorkspaceDevelopers(
  project: TrellisProject,
): WorkspaceDeveloperSummary[] {
  const workspaceRoot = workspacePath(project);
  if (!existsSync(workspaceRoot)) {
    return [];
  }

  return readdirSync(workspaceRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => readDeveloperSummary(project, entry.name))
    .sort(compareDevelopers);
}

export function readWorkspaceDeveloper(
  project: TrellisProject,
  developerId: string,
): WorkspaceDeveloperDetail {
  const developerRoot = developerPath(project, developerId);
  if (!existsSync(developerRoot) || !statSync(developerRoot).isDirectory()) {
    throw new Error("Workspace developer was not found.");
  }

  const sessions = readDeveloperSessions(developerRoot);
  return {
    developer: readDeveloperSummary(project, developerId, sessions),
    sessions,
  };
}

function readDeveloperSummary(
  project: TrellisProject,
  developerId: string,
  prefetchedSessions?: WorkspaceSession[],
): WorkspaceDeveloperSummary {
  const developerRoot = developerPath(project, developerId);
  const indexPath = path.join(developerRoot, "index.md");
  const indexMarkdown = existsSync(indexPath)
    ? readFileSync(indexPath, "utf8")
    : "";
  const sessions = prefetchedSessions ?? readDeveloperSessions(developerRoot);

  return {
    id: developerId,
    name: developerId,
    totalSessions:
      parseNumberMetadata(indexMarkdown, "Total Sessions") ?? sessions.length,
    lastActive:
      parseStringMetadata(indexMarkdown, "Last Active") ??
      sessions[0]?.date ??
      null,
    activeFile: parseBacktickMetadata(indexMarkdown, "Active File"),
  };
}

function readDeveloperSessions(developerRoot: string): WorkspaceSession[] {
  if (!existsSync(developerRoot)) {
    return [];
  }

  return readdirSync(developerRoot, { withFileTypes: true })
    .filter((entry) => entry.isFile() && /^journal-\d+\.md$/.test(entry.name))
    .sort((a, b) => a.name.localeCompare(b.name))
    .flatMap((entry) =>
      parseJournalSessions(
        readFileSync(path.join(developerRoot, entry.name), "utf8"),
        entry.name,
      ),
    )
    .sort(compareSessions);
}

function parseJournalSessions(
  markdown: string,
  journalFile: string,
): WorkspaceSession[] {
  const headingPattern = /^## Session\s+(\d+):\s*(.+)$/gm;
  const matches = Array.from(markdown.matchAll(headingPattern));

  return matches.map((match, index) => {
    const start = match.index ?? 0;
    const end = matches[index + 1]?.index ?? markdown.length;
    const block = markdown.slice(start, end).trim();
    const sessionNumber = Number.parseInt(match[1], 10);

    return {
      id: match[1],
      number: Number.isNaN(sessionNumber) ? null : sessionNumber,
      title: match[2].trim(),
      date: parseStringMetadata(block, "Date"),
      task: parseStringMetadata(block, "Task"),
      branch: parseBacktickMetadata(block, "Branch"),
      journalFile,
      markdown: block,
    };
  });
}

function parseStringMetadata(markdown: string, label: string): string | null {
  const match = markdown.match(
    new RegExp(
      `^\\s*(?:[-*]\\s*)?\\*\\*${escapeRegExp(label)}\\*\\*:\\s*(.+)$`,
      "m",
    ),
  );
  return match?.[1]?.replace(/`/g, "").trim() || null;
}

function parseBacktickMetadata(markdown: string, label: string): string | null {
  const value = parseStringMetadata(markdown, label);
  return value ?? null;
}

function parseNumberMetadata(
  markdown: string,
  label: string,
): number | undefined {
  const value = parseStringMetadata(markdown, label);
  if (!value) {
    return undefined;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? undefined : parsed;
}

function workspacePath(project: TrellisProject): string {
  return safeTrellisRelativePath(project, "workspace");
}

function developerPath(project: TrellisProject, developerId: string): string {
  const workspaceRoot = workspacePath(project);
  const absolute = safeTrellisRelativePath(
    project,
    path.join("workspace", developerId),
  );
  const relative = path.relative(workspaceRoot, absolute);

  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error("Requested path escapes the Workspace directory.");
  }

  return absolute;
}

function compareDevelopers(
  left: WorkspaceDeveloperSummary,
  right: WorkspaceDeveloperSummary,
): number {
  const byDate = compareNullableDate(right.lastActive, left.lastActive);
  return byDate || left.id.localeCompare(right.id);
}

function compareSessions(
  left: WorkspaceSession,
  right: WorkspaceSession,
): number {
  const byDate = compareNullableDate(right.date, left.date);
  return byDate || (right.number ?? 0) - (left.number ?? 0);
}

function compareNullableDate(
  left: string | null,
  right: string | null,
): number {
  if (left && right) {
    return left.localeCompare(right);
  }
  if (left) {
    return 1;
  }
  if (right) {
    return -1;
  }
  return 0;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
