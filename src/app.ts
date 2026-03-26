import { Hono } from "hono";

import { registerHealthRoutes } from "./routes/health.js";

export function createApp(): Hono {
  const app = new Hono();

  registerHealthRoutes(app);

  return app;
}
