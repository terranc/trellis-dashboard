import type { Router } from "express";
import { Router as createRouter } from "express";
import type { TrellisProject } from "../lib/trellis.js";
import { listTasks, readTaskDetail } from "../lib/tasks.js";

export function tasksRouter(project: TrellisProject): Router {
  const router = createRouter();

  router.get("/", (_request, response) => {
    response.json({ tasks: listTasks(project) });
  });

  router.get("/:taskId", (request, response, next) => {
    try {
      response.json({ task: readTaskDetail(project, request.params.taskId) });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
