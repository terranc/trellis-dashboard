import express, { type ErrorRequestHandler } from "express";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { configRouter } from "./api/config.js";
import { specsRouter } from "./api/specs.js";
import { tasksRouter } from "./api/tasks.js";
import type { TrellisProject } from "./lib/trellis.js";

export interface CreateAppOptions {
  project: TrellisProject;
  webDistPath?: string;
}

export function createApp({
  project,
  webDistPath = defaultWebDistPath(),
}: CreateAppOptions) {
  const app = express();

  app.use(express.json());
  app.use("/api/config", configRouter(project));
  app.use("/api/specs", specsRouter(project));
  app.use("/api/tasks", tasksRouter(project));

  if (existsSync(webDistPath)) {
    app.use(express.static(webDistPath));
    app.get("*", (_request, response) => {
      response.sendFile(path.join(webDistPath, "index.html"));
    });
  }

  app.use(errorHandler);

  return app;
}

function defaultWebDistPath(): string {
  const currentFile = fileURLToPath(import.meta.url);
  return path.resolve(path.dirname(currentFile), "../../web/dist");
}

const errorHandler: ErrorRequestHandler = (
  error,
  _request,
  response,
  _next,
) => {
  response.status(400).json({
    error: error instanceof Error ? error.message : "Unexpected server error.",
  });
};
