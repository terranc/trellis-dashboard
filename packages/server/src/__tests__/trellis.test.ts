import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  readProjectName,
  resolveTrellisProject,
  safeTrellisRelativePath,
} from "../lib/trellis.js";

describe("trellis helpers", () => {
  it("requires a .trellis directory", () => {
    const root = mkdtempSync(path.join(tmpdir(), "not-trellis-"));

    expect(() => resolveTrellisProject(root)).toThrow(".trellis was not found");
  });

  it("prefers config project name before package fallback", () => {
    const root = createProject();
    writeFileSync(
      path.join(root, "package.json"),
      JSON.stringify({ name: "package-name" }),
    );
    writeFileSync(
      path.join(root, ".trellis", "config.yaml"),
      "name: config-name\n",
    );

    expect(readProjectName(root)).toBe("config-name");
  });

  it("prevents paths from escaping .trellis", () => {
    const project = resolveTrellisProject(createProject());

    expect(() => safeTrellisRelativePath(project, "../package.json")).toThrow(
      "escapes",
    );
  });
});

function createProject(): string {
  const root = mkdtempSync(path.join(tmpdir(), "trellis-dashboard-"));
  mkdirSync(path.join(root, ".trellis"));
  return root;
}
