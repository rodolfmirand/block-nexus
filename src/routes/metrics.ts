import type { Hono } from "hono";

import { getAnalysisCacheMetrics } from "../lib/analysis-cache.js";
import { getMetricsSnapshot } from "../lib/metrics.js";
import { getSessionStoreMetrics } from "../lib/session-store.js";

export function registerMetricsRoutes(app: Hono): void {
  app.get("/metrics", (context) => {
    const http = getMetricsSnapshot();

    return context.json(
      {
        ...http,
        cache: getAnalysisCacheMetrics(),
        sessions: getSessionStoreMetrics()
      },
      200
    );
  });
}
