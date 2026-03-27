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

export const config: AppConfig = {
  port: parsePort(process.env.PORT),
  nodeEnv: process.env.NODE_ENV ?? "development",
  databaseUrl:
    process.env.DATABASE_URL ?? "postgresql://blocknexus:blocknexus@localhost:5432/blocknexus",
  modrinthApiBaseUrl: process.env.MODRINTH_API_BASE_URL ?? "https://api.modrinth.com/v2",
  modrinthUserAgent:
    process.env.MODRINTH_USER_AGENT ?? "block-nexus-dev/0.1.0 (local-development)",
  catalogStorageDir: process.env.CATALOG_STORAGE_DIR ?? "storage/catalog"
};
