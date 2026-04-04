import type { CatalogProjectRecord } from "../canonical-types.js";
import type { CatalogSourceAdapter } from "../source-adapter.js";
import { config } from "../../../../lib/config.js";
import { mapModrinthProjectRecord } from "./modrinth-mapper.js";
import type {
  ModrinthGameVersionTag,
  ModrinthLoaderTag,
  ModrinthProject,
  ModrinthSearchHit,
  ModrinthSearchResponse,
  ModrinthVersion
} from "./modrinth-types.js";

export class ModrinthClient implements CatalogSourceAdapter {
  public readonly source = "modrinth";

  public constructor(
    private readonly baseUrl = config.modrinthApiBaseUrl,
    private readonly userAgent = config.modrinthUserAgent
  ) {}

  public async getLoaders(): Promise<string[]> {
    const tags = await this.getJson<ModrinthLoaderTag[]>("/tag/loader");

    return tags.map((tag) => tag.name);
  }

  public async getGameVersions(): Promise<string[]> {
    const tags = await this.getJson<ModrinthGameVersionTag[]>("/tag/game_version");

    return tags.map((tag) => tag.version);
  }

  public async getProjectByIdOrSlug(idOrSlug: string): Promise<CatalogProjectRecord> {
    const project = await this.getJson<ModrinthProject>(`/project/${encodeURIComponent(idOrSlug)}`);
    const versions = await this.getJson<ModrinthVersion[]>(
      `/project/${encodeURIComponent(idOrSlug)}/version`
    );

    return mapModrinthProjectRecord(project, versions);
  }

  public async searchTopDownloadedMods(args: {
    limit: number;
    offset: number;
  }): Promise<ModrinthSearchHit[]> {
    const facets = encodeURIComponent(JSON.stringify([["project_type:mod"]]));
    const query = `/search?index=downloads&query=&facets=${facets}&limit=${args.limit}&offset=${args.offset}`;
    const response = await this.getJson<ModrinthSearchResponse>(query);

    return response.hits.filter((hit) => hit.project_type === "mod");
  }

  private async getJson<T>(path: string): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      headers: {
        "User-Agent": this.userAgent
      }
    });

    if (!response.ok) {
      throw new Error(`Modrinth request failed: ${response.status} ${response.statusText}`);
    }

    return (await response.json()) as T;
  }
}
