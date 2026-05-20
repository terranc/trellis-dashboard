import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import type { TrellisProject } from "./trellis.js";
import { safeTrellisRelativePath } from "./trellis.js";

export interface DocHeading {
  depth: number;
  text: string;
  slug: string;
  line: number;
}

export interface SpecDocSummary {
  path: string;
  title: string;
  category: string;
  headings: DocHeading[];
}

export interface SpecTreeNode {
  name: string;
  path: string;
  title: string;
  children: SpecTreeNode[];
  headings: DocHeading[];
}

export interface SpecDoc extends SpecDocSummary {
  markdown: string;
  breadcrumbs: string[];
}

export interface SearchMatch {
  path: string;
  title: string;
  line: number;
  snippet: string;
}

export function listSpecDocs(project: TrellisProject): SpecDocSummary[] {
  const specRoot = path.join(project.trellisDir, "spec");
  if (!existsSync(specRoot)) {
    return [];
  }

  return walkMarkdownFiles(specRoot)
    .map((filePath) => readSpecDocSummary(project, filePath))
    .sort((a, b) => a.path.localeCompare(b.path));
}

export function buildSpecTree(project: TrellisProject): SpecTreeNode[] {
  const docs = listSpecDocs(project);
  const rootNodes = new Map<string, SpecTreeNode>();

  for (const doc of docs) {
    const parts = doc.path.replace(/^spec\//, "").split("/");
    const category = parts[0] ?? "spec";
    const root = ensureNode(rootNodes, category, `spec/${category}`, category);
    root.children.push({
      name: path.basename(doc.path),
      path: doc.path,
      title: doc.title,
      children: [],
      headings: doc.headings,
    });
  }

  return Array.from(rootNodes.values()).map((node) => ({
    ...node,
    children: node.children.sort((a, b) => a.path.localeCompare(b.path)),
  }));
}

export function readSpecDoc(project: TrellisProject, docPath: string): SpecDoc {
  const absolute = safeTrellisRelativePath(project, docPath);
  if (!absolute.endsWith(".md") || !existsSync(absolute)) {
    throw new Error("Spec document was not found.");
  }

  const markdown = readFileSync(absolute, "utf8");
  const relativePath = toSpecRelativePath(project, absolute);
  const headings = extractHeadings(markdown);
  const title = headings[0]?.text ?? path.basename(relativePath, ".md");

  return {
    path: relativePath,
    title,
    category: relativePath.split("/")[1] ?? "spec",
    markdown,
    headings,
    breadcrumbs: relativePath.replace(/^spec\//, "").split("/"),
  };
}

export function searchSpecDocs(
  project: TrellisProject,
  query: string,
): SearchMatch[] {
  const term = query.trim().toLocaleLowerCase();
  if (!term) {
    return [];
  }

  const matches: SearchMatch[] = [];

  for (const doc of listSpecDocs(project)) {
    const absolute = safeTrellisRelativePath(project, doc.path);
    const lines = readFileSync(absolute, "utf8").split(/\r?\n/);

    lines.forEach((line, index) => {
      if (line.toLocaleLowerCase().includes(term)) {
        matches.push({
          path: doc.path,
          title: doc.title,
          line: index + 1,
          snippet: line.trim(),
        });
      }
    });
  }

  return matches.slice(0, 50);
}

export function extractHeadings(markdown: string): DocHeading[] {
  return markdown.split(/\r?\n/).flatMap((line, index) => {
    const match = line.match(/^(#{1,6})\s+(.+)$/);
    if (!match) {
      return [];
    }

    const text = match[2].replace(/[#*_`]/g, "").trim();
    return [
      { depth: match[1].length, text, slug: slugify(text), line: index + 1 },
    ];
  });
}

function walkMarkdownFiles(root: string): string[] {
  return readdirSync(root).flatMap((entry) => {
    const absolute = path.join(root, entry);
    const stat = statSync(absolute);

    if (stat.isDirectory()) {
      return walkMarkdownFiles(absolute);
    }

    return absolute.endsWith(".md") ? [absolute] : [];
  });
}

function readSpecDocSummary(
  project: TrellisProject,
  filePath: string,
): SpecDocSummary {
  const markdown = readFileSync(filePath, "utf8");
  const relativePath = toSpecRelativePath(project, filePath);
  const headings = extractHeadings(markdown);

  return {
    path: relativePath,
    title: headings[0]?.text ?? path.basename(relativePath, ".md"),
    category: relativePath.split("/")[1] ?? "spec",
    headings,
  };
}

function toSpecRelativePath(project: TrellisProject, filePath: string): string {
  return path.relative(project.trellisDir, filePath).split(path.sep).join("/");
}

function ensureNode(
  nodes: Map<string, SpecTreeNode>,
  name: string,
  nodePath: string,
  title: string,
): SpecTreeNode {
  const current = nodes.get(name);
  if (current) {
    return current;
  }

  const node = { name, path: nodePath, title, children: [], headings: [] };
  nodes.set(name, node);
  return node;
}

function slugify(text: string): string {
  return text
    .toLocaleLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}
