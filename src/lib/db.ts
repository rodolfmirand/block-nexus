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

type ErrorWithMetadata = {
  message?: string;
  code?: string;
  errno?: string | number;
  syscall?: string;
};

function formatError(error: unknown): string {
  if (error instanceof Error) {
    return error.message.length > 0 ? error.message : error.name;
  }

  if (typeof error === "string" && error.length > 0) {
    return error;
  }

  if (error && typeof error === "object") {
    const metadata = error as ErrorWithMetadata;
    const parts: string[] = [];

    if (typeof metadata.message === "string" && metadata.message.length > 0) {
      parts.push(metadata.message);
    }

    if (typeof metadata.code === "string" && metadata.code.length > 0) {
      parts.push(`code=${metadata.code}`);
    }

    if (metadata.errno !== undefined) {
      parts.push(`errno=${String(metadata.errno)}`);
    }

    if (typeof metadata.syscall === "string" && metadata.syscall.length > 0) {
      parts.push(`syscall=${metadata.syscall}`);
    }

    if (parts.length > 0) {
      return parts.join(" | ");
    }
  }

  return "Unknown database error.";
}

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
      error: formatError(error)
    };
  }
}

export async function closeDatabasePool(): Promise<void> {
  await databasePool.end();
}
