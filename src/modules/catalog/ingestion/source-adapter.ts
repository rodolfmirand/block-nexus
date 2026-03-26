import type { CatalogProjectRecord, CatalogSource } from "./canonical-types.js";

export type CatalogSourceAdapter = {
  readonly source: CatalogSource;
  getLoaders(): Promise<string[]>;
  getGameVersions(): Promise<string[]>;
  getProjectByIdOrSlug(idOrSlug: string): Promise<CatalogProjectRecord>;
};
