import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { resolveTrellisProject } from "../lib/trellis.js";
import {
  listWorkspaceDevelopers,
  readWorkspaceDeveloper,
} from "../lib/workspace.js";

describe("workspace helpers", () => {
  it("lists developer summaries from workspace files", () => {
    const root = createProject();
    const developerRoot = path.join(root, ".trellis", "workspace", "Ada");
    mkdirSync(developerRoot, { recursive: true });
    writeFileSync(
      path.join(developerRoot, "index.md"),
      [
        "# Workspace Index - Ada",
        "",
        "- **Active File**: `journal-1.md`",
        "- **Total Sessions**: 2",
        "- **Last Active**: 2026-05-21",
        "",
      ].join("\n"),
    );

    expect(listWorkspaceDevelopers(resolveTrellisProject(root))).toEqual([
      {
        id: "Ada",
        name: "Ada",
        totalSessions: 2,
        lastActive: "2026-05-21",
        activeFile: "journal-1.md",
      },
    ]);
  });

  it("parses journal files into session details", () => {
    const root = createProject();
    const developerRoot = path.join(root, ".trellis", "workspace", "Ada");
    mkdirSync(developerRoot, { recursive: true });
    writeFileSync(
      path.join(developerRoot, "journal-1.md"),
      [
        "# Journal - Ada",
        "",
        "## Session 1: Initial dashboard",
        "",
        "**Date**: 2026-05-20",
        "**Task**: 05-20-dashboard",
        "**Branch**: `main`",
        "",
        "### Summary",
        "",
        "Built the first pass.",
        "",
        "## Session 2: Workspace read-only",
        "",
        "**Date**: 2026-05-21",
        "**Task**: 05-21-improve-workspace",
        "**Branch**: `workspace`",
        "",
        "### Summary",
        "",
        "Added workspace planning.",
        "",
      ].join("\n"),
    );

    expect(
      readWorkspaceDeveloper(resolveTrellisProject(root), "Ada").sessions,
    ).toEqual([
      {
        id: "2",
        number: 2,
        title: "Workspace read-only",
        date: "2026-05-21",
        task: "05-21-improve-workspace",
        branch: "workspace",
        journalFile: "journal-1.md",
        markdown:
          "## Session 2: Workspace read-only\n\n**Date**: 2026-05-21\n**Task**: 05-21-improve-workspace\n**Branch**: `workspace`\n\n### Summary\n\nAdded workspace planning.",
      },
      {
        id: "1",
        number: 1,
        title: "Initial dashboard",
        date: "2026-05-20",
        task: "05-20-dashboard",
        branch: "main",
        journalFile: "journal-1.md",
        markdown:
          "## Session 1: Initial dashboard\n\n**Date**: 2026-05-20\n**Task**: 05-20-dashboard\n**Branch**: `main`\n\n### Summary\n\nBuilt the first pass.",
      },
    ]);
  });

  it("prevents developer paths from escaping workspace", () => {
    const root = createProject();
    mkdirSync(path.join(root, ".trellis", "tasks"), { recursive: true });

    expect(() =>
      readWorkspaceDeveloper(resolveTrellisProject(root), "../tasks"),
    ).toThrow("Workspace directory");
  });
});

function createProject(): string {
  const root = mkdtempSync(path.join(tmpdir(), "trellis-dashboard-"));
  mkdirSync(path.join(root, ".trellis", "workspace"), { recursive: true });
  return root;
}
