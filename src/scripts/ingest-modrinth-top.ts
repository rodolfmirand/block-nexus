import { stat } from "node:fs/promises";
import path from "node:path";

import { CatalogFileRepository } from "../modules/catalog/ingestion/catalog-file-repository.js";
import type { CatalogProjectRecord } from "../modules/catalog/ingestion/canonical-types.js";
import type { CatalogSnapshot } from "../modules/catalog/ingestion/catalog-snapshot.js";
import { ModrinthClient } from "../modules/catalog/ingestion/modrinth/modrinth-client.js";

type ParsedArgs = {
  outputFileName: string;
  maxSizeBytes: number;
  targetProjects: number;
  pageSize: number;
};

function parseNumberArg(value: string | undefined, fallback: number): number {
  if (!value) {
    return fallback;
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
}

function parseArgs(argv: string[]): ParsedArgs {
  let outputFileName = "top-downloaded-mods.json";
  let maxSizeGb = 5;
  let targetProjects = 300;
  let pageSize = 100;

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--output") {
      const nextArg = argv[index + 1];

      if (nextArg) {
        outputFileName = nextArg;
        index += 1;
      }

      continue;
    }

    if (arg === "--max-size-gb") {
      maxSizeGb = parseNumberArg(argv[index + 1], maxSizeGb);
      index += 1;
      continue;
    }

    if (arg === "--target-projects") {
      targetProjects = Math.floor(parseNumberArg(argv[index + 1], targetProjects));
      index += 1;
      continue;
    }

    if (arg === "--page-size") {
      pageSize = Math.floor(parseNumberArg(argv[index + 1], pageSize));
      index += 1;
      continue;
    }
  }

  return {
    outputFileName,
    maxSizeBytes: Math.floor(maxSizeGb * 1024 * 1024 * 1024),
    targetProjects,
    pageSize: Math.min(pageSize, 100)
  };
}

function estimateRecordBytes(record: CatalogProjectRecord): number {
  return Buffer.byteLength(JSON.stringify(record), "utf8") + 2;
}

async function collectTopProjectSlugs(args: {
  client: ModrinthClient;
  targetProjects: number;
  pageSize: number;
}): Promise<string[]> {
  const slugs: string[] = [];
  const seen = new Set<string>();
  let offset = 0;

  while (slugs.length < args.targetProjects) {
    const hits = await args.client.searchTopDownloadedMods({
      limit: args.pageSize,
      offset
    });

    if (hits.length === 0) {
      break;
    }

    for (const hit of hits) {
      const slug = hit.slug?.trim();

      if (!slug || seen.has(slug)) {
        continue;
      }

      seen.add(slug);
      slugs.push(slug);

      if (slugs.length >= args.targetProjects) {
        break;
      }
    }

    offset += args.pageSize;
  }

  return slugs;
}

async function main(): Promise<void> {
  const { outputFileName, maxSizeBytes, targetProjects, pageSize } = parseArgs(process.argv.slice(2));
  const client = new ModrinthClient();
  const repository = new CatalogFileRepository();

  console.log("Fetching loaders and game versions from Modrinth...");
  const [loaders, gameVersions] = await Promise.all([client.getLoaders(), client.getGameVersions()]);

  console.log("Collecting top downloaded mod slugs from Modrinth search...");
  const slugs = await collectTopProjectSlugs({
    client,
    targetProjects,
    pageSize
  });

  console.log(`Collected ${slugs.length} candidate mods.`);

  const projects: CatalogProjectRecord[] = [];
  let estimatedBytes = Buffer.byteLength(
    JSON.stringify({ source: "modrinth", fetchedAt: new Date().toISOString(), loaders, gameVersions, projects: [] }),
    "utf8"
  );
  let skipped = 0;

  for (const slug of slugs) {
    try {
      const record = await client.getProjectByIdOrSlug(slug);
      const projectedSize = estimatedBytes + estimateRecordBytes(record);

      if (projectedSize > maxSizeBytes) {
        console.log(`Reached size limit near mod ${slug}. Stopping ingestion.`);
        break;
      }

      projects.push(record);
      estimatedBytes = projectedSize;
      console.log(`+ ${slug} (${projects.length}/${targetProjects})`);
    } catch (error: unknown) {
      skipped += 1;
      const message = error instanceof Error ? error.message : "Unknown ingestion error.";
      console.log(`- skipped ${slug}: ${message}`);
    }
  }

  const snapshot: CatalogSnapshot = {
    source: "modrinth",
    fetchedAt: new Date().toISOString(),
    loaders,
    gameVersions,
    projects
  };

  const outputPath = await repository.saveSnapshot(snapshot, outputFileName);
  const fileStats = await stat(outputPath);

  console.log("BlockNexus top mods snapshot completed.");
  console.log(`Output: ${path.resolve(outputPath)}`);
  console.log(`Projects included: ${projects.length}`);
  console.log(`Projects skipped: ${skipped}`);
  console.log(`Estimated size: ${(estimatedBytes / (1024 * 1024 * 1024)).toFixed(3)} GB`);
  console.log(`Actual file size: ${(fileStats.size / (1024 * 1024 * 1024)).toFixed(3)} GB`);
  console.log(`Hard limit: ${(maxSizeBytes / (1024 * 1024 * 1024)).toFixed(3)} GB`);
}

void main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Unknown top ingestion error.";

  console.error(`BlockNexus top mods snapshot failed: ${message}`);
  process.exitCode = 1;
});
