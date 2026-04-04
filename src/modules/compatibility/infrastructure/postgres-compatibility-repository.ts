import type {
  ConflictSeverity,
  DependencyKind,
  ExternalReference,
  ReleaseChannel,
  SupportLevel
} from "../domain/index.js";
import { getDatabasePool } from "../../../lib/db.js";
import type { CompatibilityRepository } from "../engine/compatibility-repository.js";
import type { AnalyzableModVersion } from "../engine/contracts.js";

type VersionRow = {
  version_id: string;
  mod_id: string;
  slug: string;
  title: string;
  summary: string | null;
  description: string | null;
  client_support: SupportLevel;
  server_support: SupportLevel;
  version_number: string;
  display_name: string | null;
  release_channel: ReleaseChannel;
  status: string | null;
  featured: boolean;
  changelog: string | null;
  published_at: Date | string | null;
};

type ExternalReferenceRow = {
  mod_id: string;
  source: "modrinth" | "curseforge";
  source_project_id: string;
  source_slug: string | null;
};

type LoaderRow = {
  mod_version_id: string;
  loader_code: string;
};

type MinecraftVersionRow = {
  mod_version_id: string;
  minecraft_version_code: string;
};

type FileRow = {
  id: string;
  mod_version_id: string;
  filename: string;
  file_url: string;
  is_primary: boolean;
  size_bytes: string | number | null;
  sha1: string | null;
  sha512: string | null;
  md5: string | null;
};

type DependencyRow = {
  id: string;
  mod_version_id: string;
  dependency_kind: DependencyKind;
  target_mod_id: string | null;
  target_mod_version_id: string | null;
  target_external_project_id: string | null;
  target_external_version_id: string | null;
  target_file_name: string | null;
  reason: string | null;
};

type ConflictRow = {
  id: string;
  mod_version_id: string;
  target_mod_id: string | null;
  target_mod_version_id: string | null;
  severity: ConflictSeverity;
  reason: string;
};

function toIsoString(value: Date | string | null): string | null {
  if (!value) {
    return null;
  }

  return value instanceof Date ? value.toISOString() : value;
}

function toNullableNumber(value: string | number | null): number | null {
  if (value === null) {
    return null;
  }

  const parsed = typeof value === "number" ? value : Number(value);

  return Number.isFinite(parsed) ? parsed : null;
}

export class PostgresCompatibilityRepository implements CompatibilityRepository {
  public async getModVersionsByIds(ids: string[]): Promise<AnalyzableModVersion[]> {
    if (ids.length === 0) {
      return [];
    }

    return this.loadVersions(
      `
        select
          mv.id as version_id,
          mv.mod_id,
          m.slug,
          m.title,
          m.summary,
          m.description,
          m.client_support,
          m.server_support,
          mv.version_number,
          mv.display_name,
          mv.release_channel,
          mv.status,
          mv.featured,
          mv.changelog,
          mv.published_at
        from mod_versions mv
        inner join mods m on m.id = mv.mod_id
        where mv.id = any($1::bigint[])
      `,
      [ids]
    );
  }

  public async listCompatibleVersionsForMod(args: {
    modId: string;
    loader: string;
    minecraftVersion: string;
  }): Promise<AnalyzableModVersion[]> {
    return this.loadVersions(
      `
        select distinct
          mv.id as version_id,
          mv.mod_id,
          m.slug,
          m.title,
          m.summary,
          m.description,
          m.client_support,
          m.server_support,
          mv.version_number,
          mv.display_name,
          mv.release_channel,
          mv.status,
          mv.featured,
          mv.changelog,
          mv.published_at
        from mod_versions mv
        inner join mods m on m.id = mv.mod_id
        inner join mod_version_loaders mvl on mvl.mod_version_id = mv.id
        inner join mod_version_minecraft_versions mvmv on mvmv.mod_version_id = mv.id
        where mv.mod_id = $1::bigint
          and mvl.loader_code = $2
          and mvmv.minecraft_version_code = $3
      `,
      [args.modId, args.loader, args.minecraftVersion]
    );
  }

  public async listCompatibleVersionsForModSlug(args: {
    modSlug: string;
    loader: string;
    minecraftVersion: string;
  }): Promise<AnalyzableModVersion[]> {
    return this.loadVersions(
      `
        select distinct
          mv.id as version_id,
          mv.mod_id,
          m.slug,
          m.title,
          m.summary,
          m.description,
          m.client_support,
          m.server_support,
          mv.version_number,
          mv.display_name,
          mv.release_channel,
          mv.status,
          mv.featured,
          mv.changelog,
          mv.published_at
        from mod_versions mv
        inner join mods m on m.id = mv.mod_id
        inner join mod_version_loaders mvl on mvl.mod_version_id = mv.id
        inner join mod_version_minecraft_versions mvmv on mvmv.mod_version_id = mv.id
        where m.slug = $1
          and mvl.loader_code = $2
          and mvmv.minecraft_version_code = $3
      `,
      [args.modSlug, args.loader, args.minecraftVersion]
    );
  }

  public async listCompatibleVersionsForExternalProjectId(args: {
    externalProjectId: string;
    loader: string;
    minecraftVersion: string;
  }): Promise<AnalyzableModVersion[]> {
    return this.loadVersions(
      `
        select distinct
          mv.id as version_id,
          mv.mod_id,
          m.slug,
          m.title,
          m.summary,
          m.description,
          m.client_support,
          m.server_support,
          mv.version_number,
          mv.display_name,
          mv.release_channel,
          mv.status,
          mv.featured,
          mv.changelog,
          mv.published_at
        from mod_versions mv
        inner join mods m on m.id = mv.mod_id
        inner join mod_external_refs mer on mer.mod_id = m.id
        inner join mod_version_loaders mvl on mvl.mod_version_id = mv.id
        inner join mod_version_minecraft_versions mvmv on mvmv.mod_version_id = mv.id
        where mer.source_project_id = $1
          and mvl.loader_code = $2
          and mvmv.minecraft_version_code = $3
      `,
      [args.externalProjectId, args.loader, args.minecraftVersion]
    );
  }

  private async loadVersions(query: string, params: unknown[]): Promise<AnalyzableModVersion[]> {
    const pool = getDatabasePool();
    const versionRowsResult = await pool.query<VersionRow>(query, params);
    const versionRows = versionRowsResult.rows;

    if (versionRows.length === 0) {
      return [];
    }

    const versionIds = versionRows.map((row) => row.version_id);
    const modIds = [...new Set(versionRows.map((row) => row.mod_id))];

    const [externalRefsResult, loadersResult, minecraftVersionsResult, filesResult, dependenciesResult, conflictsResult] = await Promise.all([
      pool.query<ExternalReferenceRow>(
        `
          select mod_id, source, source_project_id, source_slug
          from mod_external_refs
          where mod_id = any($1::bigint[])
        `,
        [modIds]
      ),
      pool.query<LoaderRow>(
        `
          select mod_version_id, loader_code
          from mod_version_loaders
          where mod_version_id = any($1::bigint[])
        `,
        [versionIds]
      ),
      pool.query<MinecraftVersionRow>(
        `
          select mod_version_id, minecraft_version_code
          from mod_version_minecraft_versions
          where mod_version_id = any($1::bigint[])
        `,
        [versionIds]
      ),
      pool.query<FileRow>(
        `
          select id, mod_version_id, filename, file_url, is_primary, size_bytes, sha1, sha512, md5
          from mod_files
          where mod_version_id = any($1::bigint[])
        `,
        [versionIds]
      ),
      pool.query<DependencyRow>(
        `
          select id, mod_version_id, dependency_kind, target_mod_id, target_mod_version_id,
                 target_external_project_id, target_external_version_id, target_file_name, reason
          from mod_dependencies
          where mod_version_id = any($1::bigint[])
        `,
        [versionIds]
      ),
      pool.query<ConflictRow>(
        `
          select id, mod_version_id, target_mod_id, target_mod_version_id, severity, reason
          from mod_conflicts
          where mod_version_id = any($1::bigint[])
        `,
        [versionIds]
      )
    ]);

    const externalRefsByModId = new Map<string, ExternalReference[]>();
    const loadersByVersionId = new Map<string, string[]>();
    const minecraftVersionsByVersionId = new Map<string, string[]>();
    const filesByVersionId = new Map<string, AnalyzableModVersion["files"]>();
    const dependenciesByVersionId = new Map<string, AnalyzableModVersion["dependencies"]>();
    const conflictsByVersionId = new Map<string, AnalyzableModVersion["conflicts"]>();

    for (const row of externalRefsResult.rows) {
      const currentValues = externalRefsByModId.get(row.mod_id) ?? [];
      currentValues.push({
        source: row.source,
        externalId: row.source_project_id,
        slug: row.source_slug
      });
      externalRefsByModId.set(row.mod_id, currentValues);
    }

    for (const row of loadersResult.rows) {
      const currentValues = loadersByVersionId.get(row.mod_version_id) ?? [];
      currentValues.push(row.loader_code);
      loadersByVersionId.set(row.mod_version_id, currentValues);
    }

    for (const row of minecraftVersionsResult.rows) {
      const currentValues = minecraftVersionsByVersionId.get(row.mod_version_id) ?? [];
      currentValues.push(row.minecraft_version_code);
      minecraftVersionsByVersionId.set(row.mod_version_id, currentValues);
    }

    for (const row of filesResult.rows) {
      const currentValues = filesByVersionId.get(row.mod_version_id) ?? [];
      currentValues.push({
        id: row.id,
        modVersionId: row.mod_version_id,
        filename: row.filename,
        url: row.file_url,
        isPrimary: row.is_primary,
        sizeBytes: toNullableNumber(row.size_bytes),
        hashes: {
          ...(row.sha1 ? { sha1: row.sha1 } : {}),
          ...(row.sha512 ? { sha512: row.sha512 } : {}),
          ...(row.md5 ? { md5: row.md5 } : {})
        }
      });
      filesByVersionId.set(row.mod_version_id, currentValues);
    }

    for (const row of dependenciesResult.rows) {
      const currentValues = dependenciesByVersionId.get(row.mod_version_id) ?? [];
      currentValues.push({
        id: row.id,
        modVersionId: row.mod_version_id,
        kind: row.dependency_kind,
        targetModId: row.target_mod_id,
        targetModVersionId: row.target_mod_version_id,
        targetExternalProjectId: row.target_external_project_id,
        targetExternalVersionId: row.target_external_version_id,
        targetFileName: row.target_file_name,
        reason: row.reason
      });
      dependenciesByVersionId.set(row.mod_version_id, currentValues);
    }

    for (const row of conflictsResult.rows) {
      const currentValues = conflictsByVersionId.get(row.mod_version_id) ?? [];
      currentValues.push({
        id: row.id,
        modVersionId: row.mod_version_id,
        targetModId: row.target_mod_id,
        targetModVersionId: row.target_mod_version_id,
        severity: row.severity,
        reason: row.reason
      });
      conflictsByVersionId.set(row.mod_version_id, currentValues);
    }

    return versionRows.map((row) => ({
      id: row.version_id,
      modId: row.mod_id,
      versionNumber: row.version_number,
      displayName: row.display_name,
      releaseChannel: row.release_channel,
      loaders: loadersByVersionId.get(row.version_id) ?? [],
      minecraftVersions: minecraftVersionsByVersionId.get(row.version_id) ?? [],
      publishedAt: toIsoString(row.published_at),
      isFeatured: row.featured,
      status: row.status,
      changelog: row.changelog,
      files: filesByVersionId.get(row.version_id) ?? [],
      dependencies: dependenciesByVersionId.get(row.version_id) ?? [],
      conflicts: conflictsByVersionId.get(row.version_id) ?? [],
      mod: {
        id: row.mod_id,
        slug: row.slug,
        title: row.title,
        summary: row.summary,
        description: row.description,
        clientSupport: row.client_support,
        serverSupport: row.server_support,
        externalReferences: externalRefsByModId.get(row.mod_id) ?? []
      }
    }));
  }
}

