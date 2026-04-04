import { readFile } from "node:fs/promises";
import path from "node:path";

import { closeDatabasePool, getDatabasePool } from "../lib/db.js";
import { config } from "../lib/config.js";
import type {
  CatalogDependencyType,
  CatalogProjectRecord,
  CatalogSource,
  CatalogSupportLevel,
  CatalogVersionType
} from "../modules/catalog/ingestion/canonical-types.js";
import type { CatalogSnapshot } from "../modules/catalog/ingestion/catalog-snapshot.js";

type ImportStats = {
  projectsProcessed: number;
  versionsProcessed: number;
  dependenciesInserted: number;
  dependenciesSkipped: number;
  conflictsInserted: number;
  conflictsSkipped: number;
};

type ParsedArgs = {
  snapshotPath: string;
};

function parseArgs(argv: string[]): ParsedArgs {
  let snapshotPath: string | null = null;

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--input") {
      const nextArg = argv[index + 1];

      if (!nextArg) {
        throw new Error("Missing value for --input.");
      }

      snapshotPath = nextArg;
      index += 1;
      continue;
    }

    if (arg) {
      snapshotPath = arg;
    }
  }

  return {
    snapshotPath: path.resolve(snapshotPath ?? `${config.catalogStorageDir}/modrinth/bootstrap.json`)
  };
}

function ensureSnapshot(value: unknown): CatalogSnapshot {
  if (!value || typeof value !== "object") {
    throw new Error("Invalid snapshot: expected object root.");
  }

  const snapshot = value as Partial<CatalogSnapshot>;

  if (!snapshot.source || !Array.isArray(snapshot.projects)) {
    throw new Error("Invalid snapshot: missing source or projects.");
  }

  return snapshot as CatalogSnapshot;
}

function buildProjectKey(source: CatalogSource, sourceProjectId: string): string {
  return `${source}:${sourceProjectId}`;
}

function buildVersionKey(source: CatalogSource, sourceVersionId: string): string {
  return `${source}:${sourceVersionId}`;
}

function toReleaseChannel(value: CatalogVersionType): string {
  switch (value) {
    case "release":
    case "beta":
    case "alpha":
    case "snapshot":
      return value;
    default:
      return "unknown";
  }
}

function toSupportLevel(value: CatalogSupportLevel): string {
  switch (value) {
    case "required":
    case "optional":
    case "unsupported":
      return value;
    default:
      return "unknown";
  }
}

function toDependencyKind(value: CatalogDependencyType): "required" | "optional" | "embedded" | "tool" | null {
  switch (value) {
    case "required":
    case "optional":
    case "embedded":
    case "tool":
      return value;
    default:
      return null;
  }
}

async function upsertMod(args: {
  source: CatalogSource;
  sourceProjectId: string;
  slug: string;
  title: string;
  summary: string | null;
  description: string | null;
  clientSupport: CatalogSupportLevel;
  serverSupport: CatalogSupportLevel;
}): Promise<string> {
  const pool = getDatabasePool();

  const modResult = await pool.query<{ id: string }>(
    `
      insert into mods (slug, title, summary, description, client_support, server_support)
      values ($1, $2, $3, $4, $5, $6)
      on conflict (slug)
      do update
      set
        title = excluded.title,
        summary = excluded.summary,
        description = excluded.description,
        client_support = excluded.client_support,
        server_support = excluded.server_support,
        updated_at = now()
      returning id
    `,
    [
      args.slug,
      args.title,
      args.summary,
      args.description,
      toSupportLevel(args.clientSupport),
      toSupportLevel(args.serverSupport)
    ]
  );

  const modId = modResult.rows[0]?.id;

  if (!modId) {
    throw new Error(`Failed to upsert mod ${args.sourceProjectId}.`);
  }

  await pool.query(
    `
      insert into mod_external_refs (mod_id, source, source_project_id, source_slug)
      values ($1::bigint, $2, $3, $4)
      on conflict (source, source_project_id)
      do update
      set
        mod_id = excluded.mod_id,
        source_slug = excluded.source_slug
    `,
    [modId, args.source, args.sourceProjectId, args.slug]
  );

  return modId;
}

async function upsertVersion(args: {
  source: CatalogSource;
  sourceVersionId: string;
  modId: string;
  versionNumber: string;
  displayName: string | null;
  releaseChannel: CatalogVersionType;
  status: string | null;
  featured: boolean;
  changelog: string | null;
  publishedAt: string | null;
}): Promise<string> {
  const pool = getDatabasePool();

  const versionResult = await pool.query<{ id: string }>(
    `
      with existing as (
        select mod_version_id
        from mod_version_external_refs
        where source = $1 and source_version_id = $2
      ),
      inserted as (
        insert into mod_versions (
          mod_id,
          version_number,
          display_name,
          release_channel,
          status,
          featured,
          changelog,
          published_at
        )
        select
          $3::bigint,
          $4,
          $5,
          $6,
          $7,
          $8,
          $9,
          $10::timestamptz
        where not exists (select 1 from existing)
        returning id
      )
      select id from inserted
      union all
      select mod_version_id as id from existing
      limit 1
    `,
    [
      args.source,
      args.sourceVersionId,
      args.modId,
      args.versionNumber,
      args.displayName,
      toReleaseChannel(args.releaseChannel),
      args.status,
      args.featured,
      args.changelog,
      args.publishedAt
    ]
  );

  const versionId = versionResult.rows[0]?.id;

  if (!versionId) {
    throw new Error(`Failed to upsert version ${args.sourceVersionId}.`);
  }

  await pool.query(
    `
      update mod_versions
      set
        mod_id = $2::bigint,
        version_number = $3,
        display_name = $4,
        release_channel = $5,
        status = $6,
        featured = $7,
        changelog = $8,
        published_at = $9::timestamptz,
        updated_at = now()
      where id = $1::bigint
    `,
    [
      versionId,
      args.modId,
      args.versionNumber,
      args.displayName,
      toReleaseChannel(args.releaseChannel),
      args.status,
      args.featured,
      args.changelog,
      args.publishedAt
    ]
  );

  await pool.query(
    `
      insert into mod_version_external_refs (mod_version_id, source, source_version_id)
      values ($1::bigint, $2, $3)
      on conflict (source, source_version_id)
      do update
      set mod_version_id = excluded.mod_version_id
    `,
    [versionId, args.source, args.sourceVersionId]
  );

  return versionId;
}

async function syncVersionStaticData(args: {
  versionId: string;
  loaders: string[];
  gameVersions: string[];
  files: CatalogProjectRecord["versions"][number]["files"];
}): Promise<void> {
  const pool = getDatabasePool();

  await pool.query("delete from mod_version_loaders where mod_version_id = $1::bigint", [args.versionId]);
  await pool.query("delete from mod_version_minecraft_versions where mod_version_id = $1::bigint", [args.versionId]);
  await pool.query("delete from mod_files where mod_version_id = $1::bigint", [args.versionId]);

  for (const loader of [...new Set(args.loaders)]) {
    await pool.query(
      `insert into loaders (code, display_name) values ($1, $1) on conflict (code) do nothing`,
      [loader]
    );

    await pool.query(
      `
        insert into mod_version_loaders (mod_version_id, loader_code)
        values ($1::bigint, $2)
        on conflict (mod_version_id, loader_code) do nothing
      `,
      [args.versionId, loader]
    );
  }

  for (const gameVersion of [...new Set(args.gameVersions)]) {
    await pool.query(
      `insert into minecraft_versions (code, is_major) values ($1, false) on conflict (code) do nothing`,
      [gameVersion]
    );

    await pool.query(
      `
        insert into mod_version_minecraft_versions (mod_version_id, minecraft_version_code)
        values ($1::bigint, $2)
        on conflict (mod_version_id, minecraft_version_code) do nothing
      `,
      [args.versionId, gameVersion]
    );
  }

  for (const file of args.files) {
    await pool.query(
      `
        insert into mod_files (
          mod_version_id,
          source_file_id,
          filename,
          file_url,
          is_primary,
          size_bytes,
          sha1,
          sha512,
          md5
        )
        values ($1::bigint, $2, $3, $4, $5, $6, $7, $8, $9)
      `,
      [
        args.versionId,
        file.sourceFileId,
        file.filename,
        file.url,
        file.primary,
        file.size,
        file.hashes.sha1 ?? null,
        file.hashes.sha512 ?? null,
        file.hashes.md5 ?? null
      ]
    );
  }
}

async function importSnapshot(snapshot: CatalogSnapshot): Promise<ImportStats> {
  const pool = getDatabasePool();
  const stats: ImportStats = {
    projectsProcessed: 0,
    versionsProcessed: 0,
    dependenciesInserted: 0,
    dependenciesSkipped: 0,
    conflictsInserted: 0,
    conflictsSkipped: 0
  };

  const projectMap = new Map<string, string>();
  const versionMap = new Map<string, string>();

  await pool.query("begin");

  try {
    for (const loader of [...new Set(snapshot.loaders)]) {
      await pool.query(
        `insert into loaders (code, display_name) values ($1, $1) on conflict (code) do nothing`,
        [loader]
      );
    }

    for (const gameVersion of [...new Set(snapshot.gameVersions)]) {
      await pool.query(
        `insert into minecraft_versions (code, is_major) values ($1, false) on conflict (code) do nothing`,
        [gameVersion]
      );
    }

    for (const record of snapshot.projects) {
      const fallbackSlug = `${record.project.source}-${record.project.sourceProjectId}`;
      const normalizedSlug = (record.project.slug ?? fallbackSlug).trim().toLowerCase();
      const modId = await upsertMod({
        source: record.project.source,
        sourceProjectId: record.project.sourceProjectId,
        slug: normalizedSlug,
        title: record.project.title,
        summary: record.project.summary,
        description: record.project.description,
        clientSupport: record.project.clientSupport,
        serverSupport: record.project.serverSupport
      });

      projectMap.set(buildProjectKey(record.project.source, record.project.sourceProjectId), modId);
      stats.projectsProcessed += 1;

      for (const version of record.versions) {
        const versionId = await upsertVersion({
          source: version.source,
          sourceVersionId: version.sourceVersionId,
          modId,
          versionNumber: version.versionNumber,
          displayName: version.displayName,
          releaseChannel: version.versionType,
          status: version.status,
          featured: version.featured,
          changelog: version.changelog,
          publishedAt: version.publishedAt
        });

        versionMap.set(buildVersionKey(version.source, version.sourceVersionId), versionId);
        stats.versionsProcessed += 1;

        await syncVersionStaticData({
          versionId,
          loaders: version.loaders,
          gameVersions: version.gameVersions,
          files: version.files
        });
      }
    }

    for (const record of snapshot.projects) {
      for (const version of record.versions) {
        const sourceVersionKey = buildVersionKey(version.source, version.sourceVersionId);
        const sourceVersionId = versionMap.get(sourceVersionKey);

        if (!sourceVersionId) {
          continue;
        }

        await pool.query("delete from mod_dependencies where mod_version_id = $1::bigint", [sourceVersionId]);
        await pool.query("delete from mod_conflicts where mod_version_id = $1::bigint", [sourceVersionId]);

        for (const dependency of version.dependencies) {
          const targetModId = dependency.targetProjectId
            ? projectMap.get(buildProjectKey(version.source, dependency.targetProjectId)) ?? null
            : null;
          const targetModVersionId = dependency.targetVersionId
            ? versionMap.get(buildVersionKey(version.source, dependency.targetVersionId)) ?? null
            : null;

          if (dependency.dependencyType === "incompatible") {
            if (!targetModId && !targetModVersionId) {
              stats.conflictsSkipped += 1;
              continue;
            }

            await pool.query(
              `
                insert into mod_conflicts (
                  mod_version_id,
                  target_mod_id,
                  target_mod_version_id,
                  severity,
                  reason
                )
                values ($1::bigint, $2::bigint, $3::bigint, 'error', $4)
              `,
              [
                sourceVersionId,
                targetModId,
                targetModVersionId,
                `Imported incompatible dependency (${dependency.source})`
              ]
            );
            stats.conflictsInserted += 1;
            continue;
          }

          const dependencyKind = toDependencyKind(dependency.dependencyType);

          if (!dependencyKind) {
            stats.dependenciesSkipped += 1;
            continue;
          }

          if (
            !targetModId
            && !targetModVersionId
            && !dependency.targetProjectId
            && !dependency.targetVersionId
            && !dependency.targetFileName
          ) {
            stats.dependenciesSkipped += 1;
            continue;
          }

          await pool.query(
            `
              insert into mod_dependencies (
                mod_version_id,
                dependency_kind,
                target_mod_id,
                target_mod_version_id,
                target_external_project_id,
                target_external_version_id,
                target_file_name,
                reason
              )
              values ($1::bigint, $2, $3::bigint, $4::bigint, $5, $6, $7, $8)
            `,
            [
              sourceVersionId,
              dependencyKind,
              targetModId,
              targetModVersionId,
              dependency.targetProjectId,
              dependency.targetVersionId,
              dependency.targetFileName,
              `Imported dependency (${dependency.source})`
            ]
          );

          stats.dependenciesInserted += 1;
        }
      }
    }

    await pool.query("commit");
    return stats;
  } catch (error: unknown) {
    await pool.query("rollback");
    throw error;
  }
}

async function main(): Promise<void> {
  const { snapshotPath } = parseArgs(process.argv.slice(2));
  const snapshotRaw = await readFile(snapshotPath, "utf8");
  const snapshot = ensureSnapshot(JSON.parse(snapshotRaw));

  const stats = await importSnapshot(snapshot);

  console.log("BlockNexus catalog import completed.");
  console.log(`Snapshot: ${snapshotPath}`);
  console.log(`Source: ${snapshot.source}`);
  console.log(`Projects processed: ${stats.projectsProcessed}`);
  console.log(`Versions processed: ${stats.versionsProcessed}`);
  console.log(`Dependencies inserted: ${stats.dependenciesInserted}`);
  console.log(`Dependencies skipped: ${stats.dependenciesSkipped}`);
  console.log(`Conflicts inserted: ${stats.conflictsInserted}`);
  console.log(`Conflicts skipped: ${stats.conflictsSkipped}`);
}

void main()
  .catch((error: unknown) => {
    const message = error instanceof Error ? error.message : "Unknown import error.";

    console.error(`BlockNexus catalog import failed: ${message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closeDatabasePool();
  });

