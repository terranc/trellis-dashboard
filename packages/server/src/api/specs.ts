import type { Router } from "express";
import { Router as createRouter } from "express";
import type { TrellisProject } from "../lib/trellis.js";
import { buildSpecTree, readSpecDoc, searchSpecDocs } from "../lib/markdown.js";

export function specsRouter(project: TrellisProject): Router {
  const router = createRouter();

  router.get("/", (_request, response) => {
    response.json({ tree: buildSpecTree(project) });
  });

  router.get("/search", (request, response) => {
    const query = typeof request.query.q === "string" ? request.query.q : "";
    response.json({ matches: searchSpecDocs(project, query) });
  });

  router.get("/doc/*", (request, response, next) => {
    try {
      const params = request.params as { 0: string };
      response.json({ doc: readSpecDoc(project, `spec/${params[0]}`) });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
