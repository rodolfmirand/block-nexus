import type { Hono } from "hono";

import { getMetricsSnapshot } from "../lib/metrics.js";

export function registerMetricsRoutes(app: Hono): void {
  app.get("/metrics", (context) => {
    return context.json(getMetricsSnapshot(), 200);
  });
}
