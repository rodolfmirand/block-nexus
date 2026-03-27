import { spawnSync } from "node:child_process";
import process from "node:process";

const serviceName = process.env.POSTGRES_SERVICE_NAME ?? "postgres";
const database = process.env.POSTGRES_DB ?? "blocknexus";
const user = process.env.POSTGRES_USER ?? "blocknexus";
const composeCommand = process.platform === "win32" ? "docker.exe" : "docker";
const composeArgs = [
  "compose",
  "exec",
  "-T",
  serviceName,
  "psql",
  "-U",
  user,
  "-d",
  database,
  "-f",
  "/schema/schema.sql"
];

const result = spawnSync(composeCommand, composeArgs, {
  stdio: "inherit",
  shell: false
});

if (result.error) {
  console.error(`Failed to apply schema: ${result.error.message}`);
  process.exit(1);
}

process.exit(result.status ?? 0);
