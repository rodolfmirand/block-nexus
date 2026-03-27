import { Pool } from "pg";

import { config } from "./config.js";

const databasePool = new Pool({
  connectionString: config.databaseUrl,
  max: 10,
  idleTimeoutMillis: 30000
});

export type DatabaseHealth = {
  status: "up" | "down";
  database: string | null;
  latencyMs: number | null;
  error: string | null;
};

export function getDatabasePool(): Pool {
  return databasePool;
}

export async function checkDatabaseConnection(): Promise<DatabaseHealth> {
  const startedAt = Date.now();

  try {
    const result = await databasePool.query<{ current_database: string }>(
      "select current_database() as current_database"
    );

    return {
      status: "up",
      database: result.rows[0]?.current_database ?? null,
      latencyMs: Date.now() - startedAt,
      error: null
    };
  } catch (error: unknown) {
    return {
      status: "down",
      database: null,
      latencyMs: Date.now() - startedAt,
      error: error instanceof Error ? error.message : "Unknown database error."
    };
  }
}

export async function closeDatabasePool(): Promise<void> {
  await databasePool.end();
}
