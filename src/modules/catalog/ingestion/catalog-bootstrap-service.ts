import type { CatalogProjectRecord } from "./canonical-types.js";
import { CatalogFileRepository } from "./catalog-file-repository.js";
import type { CatalogIngestionResult, CatalogSnapshot } from "./catalog-snapshot.js";
import type { CatalogSourceAdapter } from "./source-adapter.js";

function deduplicateProjectIds(idsOrSlugs: string[]): string[] {
  return [...new Set(idsOrSlugs.map((value) => value.trim()).filter(Boolean))];
}

function countVersions(projects: CatalogProjectRecord[]): number {
  return projects.reduce((total, project) => total + project.versions.length, 0);
}

export class CatalogBootstrapService {
  public constructor(
    private readonly adapter: CatalogSourceAdapter,
    private readonly repository = new CatalogFileRepository()
  ) {}

  public async ingestProjects(
    idsOrSlugs: string[],
    fileName?: string
  ): Promise<CatalogIngestionResult> {
    const normalizedIds = deduplicateProjectIds(idsOrSlugs);

    if (normalizedIds.length === 0) {
      throw new Error("At least one Modrinth project id or slug is required for ingestion.");
    }

    const [loaders, gameVersions, projects] = await Promise.all([
      this.adapter.getLoaders(),
      this.adapter.getGameVersions(),
      Promise.all(normalizedIds.map((idOrSlug) => this.adapter.getProjectByIdOrSlug(idOrSlug)))
    ]);

    const snapshot: CatalogSnapshot = {
      source: this.adapter.source,
      fetchedAt: new Date().toISOString(),
      loaders,
      gameVersions,
      projects
    };
    const outputPath = await this.repository.saveSnapshot(snapshot, fileName);

    return {
      snapshot,
      outputPath,
      projectCount: projects.length,
      versionCount: countVersions(projects),
      projects: projects.map((project) => ({
        sourceProjectId: project.project.sourceProjectId,
        slug: project.project.slug,
        versionCount: project.versions.length
      }))
    };
  }
}
