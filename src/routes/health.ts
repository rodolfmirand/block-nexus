import type { Hono } from "hono";

import { config } from "../lib/config.js";

export function registerHealthRoutes(app: Hono): void {
  app.get("/health", (context) => {
    return context.json({
      status: "ok",
      service: "block-nexus",
      environment: config.nodeEnv
    });
  });
}
