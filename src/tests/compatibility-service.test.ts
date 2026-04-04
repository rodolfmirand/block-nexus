import { test } from "node:test";
import assert from "node:assert/strict";

import type { CompatibilityRepository } from "../modules/compatibility/engine/compatibility-repository.js";
import { CompatibilityService } from "../modules/compatibility/engine/compatibility-service.js";
import type { AnalyzableModVersion } from "../modules/compatibility/engine/contracts.js";

class InMemoryRepo implements CompatibilityRepository {
  public constructor(private readonly versions: AnalyzableModVersion[]) {}

  public async getModVersionsByIds(ids: string[]): Promise<AnalyzableModVersion[]> {
    return this.versions.filter((version) => ids.includes(version.id));
  }

  public async listCompatibleVersionsForMod(args: {
    modId: string;
    loader: string;
    minecraftVersion: string;
  }): Promise<AnalyzableModVersion[]> {
    return this.versions.filter(
      (version) =>
        version.modId === args.modId
        && version.loaders.includes(args.loader)
        && version.minecraftVersions.includes(args.minecraftVersion)
    );
  }

  public async listCompatibleVersionsForModSlug(args: {
    modSlug: string;
    loader: string;
    minecraftVersion: string;
  }): Promise<AnalyzableModVersion[]> {
    return this.versions.filter(
      (version) =>
        version.mod.slug === args.modSlug
        && version.loaders.includes(args.loader)
        && version.minecraftVersions.includes(args.minecraftVersion)
    );
  }

  public async listCompatibleVersionsForExternalProjectId(): Promise<AnalyzableModVersion[]> {
    return [];
  }
}

const travelersVersion: AnalyzableModVersion = {
  id: "41476",
  modId: "138",
  versionNumber: "1.21.1-10.1.34",
  displayName: "1.21.1-10.1.34",
  releaseChannel: "release",
  loaders: ["neoforge"],
  minecraftVersions: ["1.21.1"],
  publishedAt: "2026-04-04T00:00:00.000Z",
  isFeatured: true,
  status: "listed",
  changelog: null,
  files: [],
  dependencies: [],
  conflicts: [],
  mod: {
    id: "138",
    slug: "travelersbackpack",
    title: "Traveler's Backpack",
    summary: null,
    description: null,
    clientSupport: "required",
    serverSupport: "optional",
    externalReferences: []
  }
};

test("marks incompatible when a requested mod is not included in final selection", async () => {
  const service = new CompatibilityService(new InMemoryRepo([travelersVersion]));

  const result = await service.analyze({
    loader: "neoforge",
    minecraftVersion: "1.21.1",
    selectedMods: [
      { modSlug: "travelersbackpack" },
      { modId: "138", modSlug: "create" }
    ]
  });

  assert.equal(result.status, "incompatible");
  assert.ok(
    result.issues.some((issue) => issue.message.includes("Requested mod create was not included"))
  );
});
