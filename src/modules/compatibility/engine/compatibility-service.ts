import type {
  CompatibilityIssue,
  ConflictRule,
  DependencyRule,
  ReleaseChannel
} from "../domain/index.js";
import type {
  AnalyzableModVersion,
  CompatibilityAnalysisInput,
  CompatibilityAnalysisResult,
  MissingDependency,
  ResolvedDependency,
  ResolvedSelection
} from "./contracts.js";
import type { CompatibilityRepository } from "./compatibility-repository.js";

type PendingSelection = {
  modVersionId: string;
  origin: "user" | "dependency";
  requiredByModVersionId: string | null;
  depth: number;
  path: string[];
};

function getReleasePriority(channel: ReleaseChannel): number {
  switch (channel) {
    case "release":
      return 0;
    case "beta":
      return 1;
    case "alpha":
      return 2;
    case "snapshot":
      return 3;
    default:
      return 4;
  }
}

function sortCandidateVersions(versions: AnalyzableModVersion[]): AnalyzableModVersion[] {
  return [...versions].sort((left, right) => {
    const priorityDelta = getReleasePriority(left.releaseChannel) - getReleasePriority(right.releaseChannel);

    if (priorityDelta !== 0) {
      return priorityDelta;
    }

    const leftPublishedAt = left.publishedAt ? Date.parse(left.publishedAt) : 0;
    const rightPublishedAt = right.publishedAt ? Date.parse(right.publishedAt) : 0;

    return rightPublishedAt - leftPublishedAt;
  });
}

function buildIssueKey(issue: CompatibilityIssue): string {
  return [
    issue.kind,
    issue.severity,
    issue.modVersionId,
    issue.targetModVersionId ?? "-",
    issue.message
  ].join("|");
}

function isLoaderCompatible(version: AnalyzableModVersion, loader: string): boolean {
  return version.loaders.includes(loader);
}

function isMinecraftVersionCompatible(version: AnalyzableModVersion, minecraftVersion: string): boolean {
  return version.minecraftVersions.includes(minecraftVersion);
}

function conflictTargetsVersion(conflict: ConflictRule, version: AnalyzableModVersion): boolean {
  if (conflict.targetModVersionId && conflict.targetModVersionId === version.id) {
    return true;
  }

  return conflict.targetModId !== null && conflict.targetModId === version.modId;
}

export class CompatibilityService {
  public constructor(private readonly repository: CompatibilityRepository) {}

  public async analyze(
    input: CompatibilityAnalysisInput
  ): Promise<CompatibilityAnalysisResult> {
    const requestedIds = [...new Set(input.selectedModVersionIds.filter(Boolean))];
    const versionCache = new Map<string, AnalyzableModVersion>();
    const pendingQueue: PendingSelection[] = requestedIds.map((modVersionId) => ({
      modVersionId,
      origin: "user",
      requiredByModVersionId: null,
      depth: 0,
      path: [modVersionId]
    }));
    const pendingIds = new Set(requestedIds);
    const resolvedSelections: ResolvedSelection[] = [];
    const resolvedDependencies: ResolvedDependency[] = [];
    const missingDependencies: MissingDependency[] = [];
    const issues: CompatibilityIssue[] = [];
    const issueKeys = new Set<string>();
    const resolvedByModId = new Map<string, AnalyzableModVersion>();
    const resolvedByVersionId = new Map<string, AnalyzableModVersion>();

    await this.populateVersionCache(requestedIds, versionCache);

    while (pendingQueue.length > 0) {
      const currentSelection = pendingQueue.shift();

      if (!currentSelection) {
        continue;
      }

      pendingIds.delete(currentSelection.modVersionId);

      const currentVersion = await this.loadVersion(currentSelection.modVersionId, versionCache);

      if (!currentVersion) {
        this.addIssue(
          issues,
          issueKeys,
          {
            kind: "explicit",
            severity: "error",
            modVersionId: currentSelection.modVersionId,
            targetModVersionId: null,
            message: `Selected mod version ${currentSelection.modVersionId} was not found in the catalog.`
          }
        );
        continue;
      }

      const alreadyResolvedForMod = resolvedByModId.get(currentVersion.modId);

      if (alreadyResolvedForMod && alreadyResolvedForMod.id !== currentVersion.id) {
        this.addIssue(
          issues,
          issueKeys,
          {
            kind: "explicit",
            severity: "error",
            modVersionId: currentVersion.id,
            targetModVersionId: alreadyResolvedForMod.id,
            message: `Multiple versions of mod ${currentVersion.mod.slug} were selected in the same analysis.`
          }
        );
        continue;
      }

      if (!resolvedByVersionId.has(currentVersion.id)) {
        resolvedByModId.set(currentVersion.modId, currentVersion);
        resolvedByVersionId.set(currentVersion.id, currentVersion);
        resolvedSelections.push({
          modId: currentVersion.modId,
          modVersionId: currentVersion.id,
          requestedModVersionId: currentVersion.id,
          origin: currentSelection.origin,
          requiredByModVersionId: currentSelection.requiredByModVersionId,
          depth: currentSelection.depth,
          modSlug: currentVersion.mod.slug,
          versionNumber: currentVersion.versionNumber
        });
      }

      this.evaluateEnvironmentCompatibility(currentVersion, input, issues, issueKeys);
      this.evaluateExplicitConflicts(currentVersion, resolvedByVersionId, issues, issueKeys);

      for (const dependency of currentVersion.dependencies) {
        if (dependency.kind === "embedded" || dependency.kind === "tool") {
          continue;
        }

        const dependencySeverity = dependency.kind === "optional" ? "warning" : "error";
        const candidate = await this.resolveDependencyCandidate(dependency, input, versionCache);

        if (!candidate) {
          missingDependencies.push({
            sourceModVersionId: currentVersion.id,
            dependencyId: dependency.id,
            dependencyKind: dependency.kind,
            targetModId: dependency.targetModId,
            targetExternalProjectId: dependency.targetExternalProjectId,
            severity: dependencySeverity,
            message: `Dependency ${dependency.id} from ${currentVersion.mod.slug}@${currentVersion.versionNumber} could not be resolved.`
          });
          continue;
        }

        resolvedDependencies.push({
          sourceModVersionId: currentVersion.id,
          dependencyId: dependency.id,
          dependencyKind: dependency.kind,
          targetModVersionId: candidate.id,
          depth: currentSelection.depth + 1
        });

        if (currentSelection.path.includes(candidate.id)) {
          this.addIssue(
            issues,
            issueKeys,
            {
              kind: "cycle",
              severity: dependencySeverity,
              modVersionId: currentVersion.id,
              targetModVersionId: candidate.id,
              message: `Cycle detected while resolving dependency ${dependency.id}.`
            }
          );
          continue;
        }

        const selectedVersionForTargetMod = resolvedByModId.get(candidate.modId);

        if (selectedVersionForTargetMod && selectedVersionForTargetMod.id !== candidate.id) {
          this.addIssue(
            issues,
            issueKeys,
            {
              kind: "explicit",
              severity: dependencySeverity,
              modVersionId: currentVersion.id,
              targetModVersionId: selectedVersionForTargetMod.id,
              message: `Dependency ${dependency.id} requires ${candidate.mod.slug}@${candidate.versionNumber}, but ${selectedVersionForTargetMod.versionNumber} is already selected.`
            }
          );
          continue;
        }

        if (!resolvedByVersionId.has(candidate.id) && !pendingIds.has(candidate.id)) {
          pendingQueue.push({
            modVersionId: candidate.id,
            origin: "dependency",
            requiredByModVersionId: currentVersion.id,
            depth: currentSelection.depth + 1,
            path: [...currentSelection.path, candidate.id]
          });
          pendingIds.add(candidate.id);
        }
      }
    }

    return {
      status: issues.some((issue) => issue.severity === "error")
        || missingDependencies.some((dependency) => dependency.severity === "error")
        ? "incompatible"
        : "compatible",
      loader: input.loader,
      minecraftVersion: input.minecraftVersion,
      requestedModVersionIds: requestedIds,
      resolvedSelections,
      resolvedDependencies,
      missingDependencies,
      issues
    };
  }

  private addIssue(
    issues: CompatibilityIssue[],
    issueKeys: Set<string>,
    issue: CompatibilityIssue
  ): void {
    const issueKey = buildIssueKey(issue);

    if (issueKeys.has(issueKey)) {
      return;
    }

    issueKeys.add(issueKey);
    issues.push(issue);
  }

  private async populateVersionCache(
    ids: string[],
    versionCache: Map<string, AnalyzableModVersion>
  ): Promise<void> {
    if (ids.length === 0) {
      return;
    }

    const versions = await this.repository.getModVersionsByIds(ids);

    for (const version of versions) {
      versionCache.set(version.id, version);
    }
  }

  private async loadVersion(
    id: string,
    versionCache: Map<string, AnalyzableModVersion>
  ): Promise<AnalyzableModVersion | null> {
    const cachedVersion = versionCache.get(id);

    if (cachedVersion) {
      return cachedVersion;
    }

    const versions = await this.repository.getModVersionsByIds([id]);
    const version = versions[0] ?? null;

    if (version) {
      versionCache.set(version.id, version);
    }

    return version;
  }

  private evaluateEnvironmentCompatibility(
    version: AnalyzableModVersion,
    input: CompatibilityAnalysisInput,
    issues: CompatibilityIssue[],
    issueKeys: Set<string>
  ): void {
    if (!isLoaderCompatible(version, input.loader)) {
      this.addIssue(
        issues,
        issueKeys,
        {
          kind: "loader_incompatibility",
          severity: "error",
          modVersionId: version.id,
          targetModVersionId: null,
          message: `${version.mod.slug}@${version.versionNumber} does not support loader ${input.loader}.`
        }
      );
    }

    if (!isMinecraftVersionCompatible(version, input.minecraftVersion)) {
      this.addIssue(
        issues,
        issueKeys,
        {
          kind: "minecraft_version_incompatibility",
          severity: "error",
          modVersionId: version.id,
          targetModVersionId: null,
          message: `${version.mod.slug}@${version.versionNumber} does not support Minecraft ${input.minecraftVersion}.`
        }
      );
    }
  }

  private evaluateExplicitConflicts(
    version: AnalyzableModVersion,
    resolvedByVersionId: Map<string, AnalyzableModVersion>,
    issues: CompatibilityIssue[],
    issueKeys: Set<string>
  ): void {
    for (const resolvedVersion of resolvedByVersionId.values()) {
      if (resolvedVersion.id === version.id) {
        continue;
      }

      for (const conflict of version.conflicts) {
        if (conflictTargetsVersion(conflict, resolvedVersion)) {
          this.addIssue(
            issues,
            issueKeys,
            {
              kind: "explicit",
              severity: conflict.severity,
              modVersionId: version.id,
              targetModVersionId: resolvedVersion.id,
              message: conflict.reason
            }
          );
        }
      }

      for (const conflict of resolvedVersion.conflicts) {
        if (conflictTargetsVersion(conflict, version)) {
          this.addIssue(
            issues,
            issueKeys,
            {
              kind: "explicit",
              severity: conflict.severity,
              modVersionId: resolvedVersion.id,
              targetModVersionId: version.id,
              message: conflict.reason
            }
          );
        }
      }
    }
  }

  private async resolveDependencyCandidate(
    dependency: DependencyRule,
    input: CompatibilityAnalysisInput,
    versionCache: Map<string, AnalyzableModVersion>
  ): Promise<AnalyzableModVersion | null> {
    if (dependency.targetModVersionId) {
      return this.loadVersion(dependency.targetModVersionId, versionCache);
    }

    let candidates: AnalyzableModVersion[] = [];

    if (dependency.targetModId) {
      candidates = await this.repository.listCompatibleVersionsForMod({
        modId: dependency.targetModId,
        loader: input.loader,
        minecraftVersion: input.minecraftVersion
      });
    } else if (dependency.targetExternalProjectId) {
      candidates = await this.repository.listCompatibleVersionsForExternalProjectId({
        externalProjectId: dependency.targetExternalProjectId,
        loader: input.loader,
        minecraftVersion: input.minecraftVersion
      });
    }

    const selectedCandidate = sortCandidateVersions(candidates)[0] ?? null;

    if (selectedCandidate) {
      versionCache.set(selectedCandidate.id, selectedCandidate);
    }

    return selectedCandidate;
  }
}
