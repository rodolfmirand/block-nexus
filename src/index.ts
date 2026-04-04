import { serve } from "@hono/node-server";

import { createApp } from "./app.js";
import { cleanupExpiredCache, configureAnalysisCache } from "./lib/analysis-cache.js";
import { config } from "./lib/config.js";
import { closeDatabasePool } from "./lib/db.js";
import { logInfo } from "./lib/logger.js";
import { cleanupExpiredSessions, configureSessionStore } from "./lib/session-store.js";

configureAnalysisCache({
  ttlMs: config.analysisCacheTtlMs,
  maxEntries: config.analysisCacheMaxEntries
});

configureSessionStore({
  ttlMs: config.sessionTtlMs,
  maxEntries: config.sessionMaxEntries
});

const app = createApp();

const cleanupTimer = setInterval(() => {
  const expiredCacheEntries = cleanupExpiredCache();
  const expiredSessions = cleanupExpiredSessions();

  if (expiredCacheEntries > 0 || expiredSessions > 0) {
    logInfo("cleanup.completed", {
      expiredCacheEntries,
      expiredSessions
    });
  }
}, config.cleanupIntervalMs);

async function shutdown(signal: string): Promise<void> {
  console.log(`Received ${signal}. Shutting down BlockNexus...`);

  clearInterval(cleanupTimer);
  await closeDatabasePool();
  process.exit(0);
}

process.on("SIGINT", () => {
  void shutdown("SIGINT");
});

process.on("SIGTERM", () => {
  void shutdown("SIGTERM");
});

serve(
  {
    fetch: app.fetch,
    port: config.port
  },
  (info) => {
    console.log(`BlockNexus listening on http://localhost:${info.port}`);
  }
);
