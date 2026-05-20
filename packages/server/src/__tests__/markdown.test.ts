import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  extractHeadings,
  listSpecDocs,
  readSpecDoc,
  searchSpecDocs,
} from "../lib/markdown.js";
import { resolveTrellisProject } from "../lib/trellis.js";

describe("markdown helpers", () => {
  it("extracts markdown headings with slugs and line numbers", () => {
    expect(extractHeadings("# Title\n\n## Next Step")).toEqual([
      { depth: 1, text: "Title", slug: "title", line: 1 },
      { depth: 2, text: "Next Step", slug: "next-step", line: 3 },
    ]);
  });

  it("lists, reads, and searches spec markdown documents", () => {
    const root = createProject();
    const project = resolveTrellisProject(root);

    mkdirSync(path.join(root, ".trellis", "spec", "guides"), {
      recursive: true,
    });
    writeFileSync(
      path.join(root, ".trellis", "spec", "guides", "index.md"),
      "# Thinking Guides\n\nA reusable checklist.\n",
    );

    expect(listSpecDocs(project)).toHaveLength(1);
    expect(readSpecDoc(project, "spec/guides/index.md").title).toBe(
      "Thinking Guides",
    );
    expect(searchSpecDocs(project, "checklist")).toEqual([
      {
        path: "spec/guides/index.md",
        title: "Thinking Guides",
        line: 3,
        snippet: "A reusable checklist.",
      },
    ]);
  });
});

function createProject(): string {
  const root = mkdtempSync(path.join(tmpdir(), "trellis-dashboard-"));
  mkdirSync(path.join(root, ".trellis"));
  return root;
}
