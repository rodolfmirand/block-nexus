import type { CatalogProjectRecord, CatalogSource } from "./canonical-types.js";

export type CatalogSnapshot = {
  source: CatalogSource;
  fetchedAt: string;
  loaders: string[];
  gameVersions: string[];
  projects: CatalogProjectRecord[];
};

export type CatalogSnapshotProjectSummary = {
  sourceProjectId: string;
  slug: string | null;
  versionCount: number;
};

export type CatalogIngestionResult = {
  snapshot: CatalogSnapshot;
  outputPath: string;
  projectCount: number;
  versionCount: number;
  projects: CatalogSnapshotProjectSummary[];
};
