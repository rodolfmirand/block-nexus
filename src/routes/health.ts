import type { Hono } from "hono";

import { config } from "../lib/config.js";
import { checkDatabaseConnection } from "../lib/db.js";

export function registerHealthRoutes(app: Hono): void {
  app.get("/health", async (context) => {
    const database = await checkDatabaseConnection();
    const status = database.status === "up" ? "ok" : "degraded";
    const httpStatus = database.status === "up" ? 200 : 503;

    return context.json(
      {
        status,
        service: "block-nexus",
        environment: config.nodeEnv,
        database
      },
      httpStatus
    );
  });
}
