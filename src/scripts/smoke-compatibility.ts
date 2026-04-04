import type { ConflictRule, DependencyRule, Mod, ModFile } from "../modules/compatibility/domain/index.js";
import type { CompatibilityRepository } from "../modules/compatibility/engine/compatibility-repository.js";
import { CompatibilityService } from "../modules/compatibility/engine/compatibility-service.js";
import type { AnalyzableModVersion } from "../modules/compatibility/engine/contracts.js";

function createMod(id: string, slug: string, title: string): Mod {
  return {
    id,
    slug,
    title,
    summary: null,
    description: null,
    clientSupport: "required",
    serverSupport: "optional",
    externalReferences: []
  };
}

function createVersion(args: {
  id: string;
  mod: Mod;
  versionNumber: string;
  loaders: string[];
  minecraftVersions: string[];
  dependencies?: DependencyRule[];
  conflicts?: ConflictRule[];
}): AnalyzableModVersion {
  const files: ModFile[] = [];

  return {
    id: args.id,
    modId: args.mod.id,
    versionNumber: args.versionNumber,
    displayName: args.versionNumber,
    releaseChannel: "release",
    loaders: args.loaders,
    minecraftVersions: args.minecraftVersions,
    publishedAt: "2026-03-27T00:00:00.000Z",
    isFeatured: true,
    status: "listed",
    changelog: null,
    files,
    dependencies: args.dependencies ?? [],
    conflicts: args.conflicts ?? [],
    mod: args.mod
  };
}

class InMemoryCompatibilityRepository implements CompatibilityRepository {
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

const alphaMod = createMod("1", "alpha-core", "Alpha Core");
const betaMod = createMod("2", "beta-lib", "Beta Library");
const gammaMod = createMod("3", "gamma-addon", "Gamma Addon");

const betaVersion = createVersion({
  id: "102",
  mod: betaMod,
  versionNumber: "2.0.0",
  loaders: ["fabric"],
  minecraftVersions: ["1.21.1"],
  conflicts: [
    {
      id: "902",
      modVersionId: "102",
      targetModId: gammaMod.id,
      targetModVersionId: null,
      severity: "error",
      reason: "Beta Library conflicts with Gamma Addon in Fabric 1.21.1."
    }
  ]
});

const alphaVersion = createVersion({
  id: "101",
  mod: alphaMod,
  versionNumber: "1.0.0",
  loaders: ["fabric"],
  minecraftVersions: ["1.21.1"],
  dependencies: [
    {
      id: "901",
      modVersionId: "101",
      kind: "required",
      targetModId: betaMod.id,
      targetModVersionId: null,
      targetExternalProjectId: null,
      targetExternalVersionId: null,
      targetFileName: null,
      reason: "Alpha Core requires Beta Library."
    }
  ]
});

const gammaVersion = createVersion({
  id: "103",
  mod: gammaMod,
  versionNumber: "3.4.0",
  loaders: ["fabric"],
  minecraftVersions: ["1.21.1"]
});

async function main(): Promise<void> {
  const service = new CompatibilityService(
    new InMemoryCompatibilityRepository([alphaVersion, betaVersion, gammaVersion])
  );
  const result = await service.analyze({
    loader: "fabric",
    minecraftVersion: "1.21.1",
    selectedModVersionIds: ["101", "103"]
  });

  console.log(JSON.stringify(result, null, 2));
}

void main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Unknown compatibility smoke error.";

  console.error(message);
  process.exitCode = 1;
});

