import type {
  CatalogDependency,
  CatalogDependencyType,
  CatalogFileHashes,
  CatalogProject,
  CatalogProjectLinks,
  CatalogProjectRecord,
  CatalogProjectType,
  CatalogSupportLevel,
  CatalogVersion,
  CatalogVersionType
} from "../canonical-types.js";
import type { ModrinthProject, ModrinthVersion } from "./modrinth-types.js";

function mapProjectType(value: string): CatalogProjectType {
  switch (value) {
    case "mod":
    case "modpack":
    case "plugin":
    case "shader":
    case "resourcepack":
    case "datapack":
      return value;
    default:
      return "unknown";
  }
}

function mapSupportLevel(value: string): CatalogSupportLevel {
  switch (value) {
    case "required":
    case "optional":
    case "unsupported":
      return value;
    default:
      return "unknown";
  }
}

function mapVersionType(value: string): CatalogVersionType {
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

function mapDependencyType(value: string): CatalogDependencyType {
  switch (value) {
    case "required":
    case "optional":
    case "incompatible":
    case "embedded":
      return value;
    default:
      return "unknown";
  }
}

function compactStringRecord<T extends string>(
  record: Partial<Record<T, string | null | undefined>>
): Partial<Record<T, string>> {
  const result: Partial<Record<T, string>> = {};

  for (const [key, value] of Object.entries(record) as Array<[T, string | null | undefined]>) {
    if (typeof value === "string" && value.length > 0) {
      result[key] = value;
    }
  }

  return result;
}

function mapProjectLinks(project: ModrinthProject): CatalogProjectLinks {
  return compactStringRecord({
    issues: project.issues_url,
    source: project.source_url,
    wiki: project.wiki_url,
    discord: project.discord_url
  });
}

function mapFileHashes(versionFile: ModrinthVersion["files"][number]): CatalogFileHashes {
  return compactStringRecord({
    sha1: versionFile.hashes.sha1,
    sha512: versionFile.hashes.sha512
  });
}

export function mapModrinthProject(project: ModrinthProject): CatalogProject {
  return {
    source: "modrinth",
    sourceProjectId: project.id,
    slug: project.slug ?? null,
    projectType: mapProjectType(project.project_type),
    title: project.title,
    summary: project.description ?? null,
    description: project.body,
    publishedAt: project.published ?? null,
    updatedAt: project.updated ?? null,
    status: project.status ?? null,
    clientSupport: mapSupportLevel(project.client_side),
    serverSupport: mapSupportLevel(project.server_side),
    categories: [...project.categories, ...project.additional_categories],
    loaders: project.loaders,
    gameVersions: project.game_versions,
    links: mapProjectLinks(project)
  };
}

export function mapModrinthVersion(version: ModrinthVersion): CatalogVersion {
  return {
    source: "modrinth",
    sourceVersionId: version.id,
    sourceProjectId: version.project_id,
    versionNumber: version.version_number,
    displayName: version.name ?? null,
    versionType: mapVersionType(version.version_type),
    publishedAt: version.date_published ?? null,
    status: version.status ?? null,
    featured: version.featured,
    loaders: version.loaders,
    gameVersions: version.game_versions,
    files: version.files.map((file) => ({
      source: "modrinth",
      sourceFileId: file.id,
      filename: file.filename,
      url: file.url,
      primary: file.primary,
      size: Number.isFinite(file.size) ? file.size : null,
      hashes: mapFileHashes(file)
    })),
    dependencies: version.dependencies.map<CatalogDependency>((dependency) => ({
      source: "modrinth",
      dependencyType: mapDependencyType(dependency.dependency_type),
      targetProjectId: dependency.project_id,
      targetVersionId: dependency.version_id,
      targetFileName: dependency.file_name
    })),
    changelog: version.changelog
  };
}

export function mapModrinthProjectRecord(
  project: ModrinthProject,
  versions: ModrinthVersion[]
): CatalogProjectRecord {
  return {
    project: mapModrinthProject(project),
    versions: versions.map(mapModrinthVersion)
  };
}
