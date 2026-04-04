import { Hono } from "hono";

import { registerAnalyzeRoutes } from "./routes/analyze.js";
import { registerDocsRoutes } from "./routes/docs.js";
import { registerHealthRoutes } from "./routes/health.js";
import { registerModsRoutes } from "./routes/mods.js";

export function createApp(): Hono {
  const app = new Hono();

  registerHealthRoutes(app);
  registerModsRoutes(app);
  registerAnalyzeRoutes(app);
  registerDocsRoutes(app);

  return app;
}
