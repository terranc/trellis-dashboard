import type { Router } from "express";
import { Router as createRouter } from "express";
import type { TrellisProject } from "../lib/trellis.js";
import {
  listWorkspaceDevelopers,
  readWorkspaceDeveloper,
} from "../lib/workspace.js";

export function workspaceRouter(project: TrellisProject): Router {
  const router = createRouter();

  router.get("/", (_request, response) => {
    response.json({ developers: listWorkspaceDevelopers(project) });
  });

  router.get("/:developer", (request, response, next) => {
    try {
      response.json(readWorkspaceDeveloper(project, request.params.developer));
    } catch (error) {
      next(error);
    }
  });

  return router;
}
