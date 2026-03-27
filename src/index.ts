import { serve } from "@hono/node-server";

import { createApp } from "./app.js";
import { config } from "./lib/config.js";
import { closeDatabasePool } from "./lib/db.js";

const app = createApp();

async function shutdown(signal: string): Promise<void> {
  console.log(`Received ${signal}. Shutting down BlockNexus...`);

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
