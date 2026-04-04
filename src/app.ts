import { randomUUID } from "node:crypto";

import { Hono } from "hono";

import { logInfo } from "./lib/logger.js";
import { recordRequestMetric } from "./lib/metrics.js";
import { registerAnalyzeRoutes } from "./routes/analyze.js";
import { registerDocsRoutes } from "./routes/docs.js";
import { registerHealthRoutes } from "./routes/health.js";
import { registerMetricsRoutes } from "./routes/metrics.js";
import { registerModsRoutes } from "./routes/mods.js";
import { registerSessionRoutes } from "./routes/sessions.js";

export function createApp(): Hono {
  const app = new Hono();

  app.use("*", async (context, next) => {
    const requestId = randomUUID();
    const start = performance.now();

    await next();

    const latencyMs = performance.now() - start;
    const path = new URL(context.req.url).pathname;
    const routeKey = `${context.req.method} ${path}`;
    const statusCode = context.res.status;

    recordRequestMetric(routeKey, latencyMs, statusCode);

    logInfo("http.request.completed", {
      requestId,
      method: context.req.method,
      path,
      statusCode,
      latencyMs: Number(latencyMs.toFixed(2))
    });
  });

  registerHealthRoutes(app);
  registerModsRoutes(app);
  registerAnalyzeRoutes(app);
  registerSessionRoutes(app);
  registerMetricsRoutes(app);
  registerDocsRoutes(app);

  return app;
}
