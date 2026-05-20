import type { Router } from "express";
import { Router as createRouter } from "express";
import type { TrellisProject } from "../lib/trellis.js";
import { listSpecDocs } from "../lib/markdown.js";
import { listTasks } from "../lib/tasks.js";

export function configRouter(project: TrellisProject): Router {
  const router = createRouter();

  router.get("/", (_request, response) => {
    response.json({
      project: {
        name: project.projectName,
        root: project.root,
      },
      counts: {
        specDocs: listSpecDocs(project).length,
        tasks: listTasks(project).length,
      },
    });
  });

  return router;
}
