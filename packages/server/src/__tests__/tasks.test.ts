import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { listTasks, readCurrentTask, readTaskDetail } from "../lib/tasks.js";
import { resolveTrellisProject } from "../lib/trellis.js";

describe("task helpers", () => {
  it("lists task summaries from task.json files", () => {
    const root = createProject();
    const taskDir = path.join(root, ".trellis", "tasks", "01-example");
    mkdirSync(taskDir, { recursive: true });
    writeFileSync(
      path.join(taskDir, "task.json"),
      JSON.stringify({
        title: "Example task",
        description: "A useful task",
        status: "planning",
        priority: "P1",
        assignee: "terranc",
        package: "web",
        children: ["01-child"],
        createdAt: "2026-05-21",
      }),
    );
    writeFileSync(path.join(taskDir, "prd.md"), "# Example task\n");

    expect(listTasks(resolveTrellisProject(root))).toEqual([
      {
        id: "01-example",
        path: "tasks/01-example",
        title: "Example task",
        description: "A useful task",
        status: "planning",
        priority: "P1",
        assignee: "terranc",
        packageName: "web",
        parent: null,
        children: ["01-child"],
        createdAt: "2026-05-21",
        hasPrd: true,
        hasDesign: false,
        hasImplement: false,
      },
    ]);
  });

  it("reads task markdown docs for detail view", () => {
    const root = createProject();
    const taskDir = path.join(root, ".trellis", "tasks", "02-docs");
    mkdirSync(taskDir, { recursive: true });
    writeFileSync(
      path.join(taskDir, "task.json"),
      JSON.stringify({ title: "Docs task", status: "in_progress" }),
    );
    writeFileSync(path.join(taskDir, "prd.md"), "# PRD\n\nDetails.\n");
    writeFileSync(path.join(taskDir, "implement.md"), "# Plan\n\n- Do it.\n");

    expect(readTaskDetail(resolveTrellisProject(root), "02-docs").docs).toEqual(
      [
        {
          kind: "prd",
          path: "tasks/02-docs/prd.md",
          markdown: "# PRD\n\nDetails.\n",
        },
        {
          kind: "implement",
          path: "tasks/02-docs/implement.md",
          markdown: "# Plan\n\n- Do it.\n",
        },
      ],
    );
  });

  it("reads the task used by Trellis continue", () => {
    const root = createProject();
    const taskDir = path.join(root, ".trellis", "tasks", "03-current");
    const sessionDir = path.join(root, ".trellis", ".runtime", "sessions");
    mkdirSync(taskDir, { recursive: true });
    mkdirSync(sessionDir, { recursive: true });
    writeFileSync(
      path.join(taskDir, "task.json"),
      JSON.stringify({ title: "Current task", status: "in_progress" }),
    );
    writeFileSync(
      path.join(sessionDir, "codex.json"),
      JSON.stringify({ current_task: ".trellis/tasks/03-current" }),
    );

    expect(readCurrentTask(resolveTrellisProject(root))?.id).toBe("03-current");
  });

  it("does not guess a continue task from multiple active tasks", () => {
    const root = createProject();
    const taskDir = path.join(root, ".trellis", "tasks", "04-active");
    mkdirSync(taskDir, { recursive: true });
    writeFileSync(
      path.join(taskDir, "task.json"),
      JSON.stringify({ title: "Active task", status: "in_progress" }),
    );

    expect(readCurrentTask(resolveTrellisProject(root))).toBeNull();
  });
});

function createProject(): string {
  const root = mkdtempSync(path.join(tmpdir(), "trellis-dashboard-"));
  mkdirSync(path.join(root, ".trellis", "tasks"), { recursive: true });
  return root;
}
