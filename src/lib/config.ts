import { existsSync } from "node:fs";
import { loadEnvFile } from "node:process";

if (existsSync(".env")) {
  loadEnvFile(".env");
}

type AppConfig = {
  port: number;
  nodeEnv: string;
  databaseUrl: string;
  modrinthApiBaseUrl: string;
  modrinthUserAgent: string;
  catalogStorageDir: string;
  analysisCacheTtlMs: number;
  analysisCacheMaxEntries: number;
  sessionTtlMs: number;
  sessionMaxEntries: number;
  cleanupIntervalMs: number;
  corsAllowedOrigins: string[];
};

function parsePort(value: string | undefined): number {
  const fallbackPort = 3000;

  if (!value) {
    return fallbackPort;
  }

  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return fallbackPort;
  }

  return parsed;
}

function parsePositiveInt(value: string | undefined, fallback: number): number {
  if (!value) {
    return fallback;
  }

  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
}

function parseCsvOrigins(value: string | undefined, fallback: string[]): string[] {
  if (!value) {
    return fallback;
  }

  const parsed = value
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);

  return parsed.length > 0 ? parsed : fallback;
}

export const config: AppConfig = {
  port: parsePort(process.env.PORT),
  nodeEnv: process.env.NODE_ENV ?? "development",
  databaseUrl:
    process.env.DATABASE_URL ?? "postgresql://blocknexus:blocknexus@localhost:5432/blocknexus",
  modrinthApiBaseUrl: process.env.MODRINTH_API_BASE_URL ?? "https://api.modrinth.com/v2",
  modrinthUserAgent:
    process.env.MODRINTH_USER_AGENT ?? "block-nexus-dev/0.1.0 (local-development)",
  catalogStorageDir: process.env.CATALOG_STORAGE_DIR ?? "storage/catalog",
  analysisCacheTtlMs: parsePositiveInt(process.env.ANALYSIS_CACHE_TTL_MS, 300000),
  analysisCacheMaxEntries: parsePositiveInt(process.env.ANALYSIS_CACHE_MAX_ENTRIES, 1000),
  sessionTtlMs: parsePositiveInt(process.env.SESSION_TTL_MS, 3600000),
  sessionMaxEntries: parsePositiveInt(process.env.SESSION_MAX_ENTRIES, 1000),
  cleanupIntervalMs: parsePositiveInt(process.env.CLEANUP_INTERVAL_MS, 60000),
  corsAllowedOrigins: parseCsvOrigins(process.env.CORS_ALLOWED_ORIGINS, [
    "http://localhost:5173"
  ])
};
