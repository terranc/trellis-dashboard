import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

export interface TrellisProject {
  root: string;
  trellisDir: string;
  projectName: string;
}

export function resolveTrellisProject(cwd: string): TrellisProject {
  const root = path.resolve(cwd);
  const trellisDir = path.join(root, ".trellis");

  if (!existsSync(trellisDir)) {
    throw new Error(
      "Current directory is not a Trellis project: .trellis was not found.",
    );
  }

  return {
    root,
    trellisDir,
    projectName: readProjectName(root),
  };
}

export function readProjectName(root: string): string {
  const configName = readNameFromConfig(
    path.join(root, ".trellis", "config.yaml"),
  );
  if (configName) {
    return configName;
  }

  const packageName = readNameFromPackageJson(path.join(root, "package.json"));
  if (packageName) {
    return packageName;
  }

  return path.basename(root);
}

export function safeTrellisRelativePath(
  project: TrellisProject,
  relativePath: string,
): string {
  const absolute = path.resolve(project.trellisDir, relativePath);
  const relative = path.relative(project.trellisDir, absolute);

  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error("Requested path escapes the Trellis directory.");
  }

  return absolute;
}

function readNameFromConfig(filePath: string): string | undefined {
  if (!existsSync(filePath)) {
    return undefined;
  }

  const content = readFileSync(filePath, "utf8");
  const match = content.match(
    /^\s*(?:project_name|project|name):\s*["']?([^"'\n#]+)["']?/m,
  );
  return match?.[1]?.trim();
}

function readNameFromPackageJson(filePath: string): string | undefined {
  if (!existsSync(filePath)) {
    return undefined;
  }

  try {
    const parsed = JSON.parse(readFileSync(filePath, "utf8")) as {
      name?: unknown;
    };
    return typeof parsed.name === "string" ? parsed.name : undefined;
  } catch {
    return undefined;
  }
}
