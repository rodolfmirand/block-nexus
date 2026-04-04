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
  ResolvedSelection,
  SelectedMod
} from "./contracts.js";
import type { CompatibilityRepository } from "./compatibility-repository.js";

type PendingSelection = {
  modVersionId: string;
  origin: "user" | "dependency";
  requiredByModVersionId: string | null;
  depth: number;
  path: string[];
};

type CandidateGroup = {
  requestedMod: SelectedMod;
  candidates: AnalyzableModVersion[];
};

const MAX_CANDIDATE_COMBINATIONS = 40;

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

function hasConflictBetween(left: AnalyzableModVersion, right: AnalyzableModVersion): boolean {
  for (const conflict of left.conflicts) {
    if (conflictTargetsVersion(conflict, right)) {
      return true;
    }
  }

  for (const conflict of right.conflicts) {
    if (conflictTargetsVersion(conflict, left)) {
      return true;
    }
  }

  return false;
}

function resultScore(result: CompatibilityAnalysisResult): number {
  const errorIssues = result.issues.filter((issue) => issue.severity === "error").length;
  const warningIssues = result.issues.length - errorIssues;
  const errorMissingDeps = result.missingDependencies.filter((dependency) => dependency.severity === "error").length;
  const warningMissingDeps = result.missingDependencies.length - errorMissingDeps;

  return (errorIssues * 100) + (errorMissingDeps * 100) + (warningIssues * 10) + warningMissingDeps;
}

function requestedModLabel(requestedMod: SelectedMod): string {
  return requestedMod.modSlug ?? requestedMod.modId ?? "unknown-mod";
}

function selectionMatchesRequestedMod(selection: ResolvedSelection, requestedMod: SelectedMod): boolean {
  if (requestedMod.modId && selection.modId !== requestedMod.modId) {
    return false;
  }

  if (requestedMod.modSlug && selection.modSlug.toLowerCase() !== requestedMod.modSlug.toLowerCase()) {
    return false;
  }

  return true;
}

export class CompatibilityService {
  public constructor(private readonly repository: CompatibilityRepository) {}

  public async analyze(
    input: CompatibilityAnalysisInput
  ): Promise<CompatibilityAnalysisResult> {
    const selectedMods = input.selectedMods?.filter((mod) => Boolean(mod.modId || mod.modSlug)) ?? [];

    if (selectedMods.length > 0) {
      return this.analyzeFromSelectedMods({
        loader: input.loader,
        minecraftVersion: input.minecraftVersion,
        selectedMods
      });
    }

    const requestedIds = [...new Set((input.selectedModVersionIds ?? []).filter(Boolean))];
    const requestedMods = input.selectedMods?.length ? input.selectedMods : undefined;

    return this.analyzeFromVersionIds({
      loader: input.loader,
      minecraftVersion: input.minecraftVersion,
      requestedIds,
      requestedMods
    });
  }

  private async analyzeFromSelectedMods(args: {
    loader: string;
    minecraftVersion: string;
    selectedMods: SelectedMod[];
  }): Promise<CompatibilityAnalysisResult> {
    const groups: CandidateGroup[] = [];
    const issues: CompatibilityIssue[] = [];
    const issueKeys = new Set<string>();
    const seenResolvedModIds = new Set<string>();

    for (const requestedMod of args.selectedMods) {
      const candidates = await this.listCandidatesForSelectedMod({
        requestedMod,
        loader: args.loader,
        minecraftVersion: args.minecraftVersion
      });

      const sortedCandidates = sortCandidateVersions(candidates);

      if (sortedCandidates.length === 0) {
        const requestedLabel = requestedModLabel(requestedMod);

        this.addIssue(
          issues,
          issueKeys,
          {
            kind: "ambiguous_version",
            severity: "error",
            modVersionId: requestedLabel,
            targetModVersionId: null,
            message: `No compatible versions found for ${requestedLabel} in ${args.loader}/${args.minecraftVersion}.`
          }
        );
        continue;
      }

      const firstCandidate = sortedCandidates[0];

      if (!firstCandidate) {
        continue;
      }

      const resolvedModId = firstCandidate.modId;

      if (seenResolvedModIds.has(resolvedModId)) {
        continue;
      }

      seenResolvedModIds.add(resolvedModId);
      groups.push({
        requestedMod,
        candidates: sortedCandidates
      });
    }

    if (groups.length === 0) {
      return {
        status: "incompatible",
        loader: args.loader,
        minecraftVersion: args.minecraftVersion,
        requestedMods: args.selectedMods,
        requestedModVersionIds: [],
        resolvedSelections: [],
        resolvedDependencies: [],
        missingDependencies: [],
        issues
      };
    }

    const combinations = this.generateCandidateCombinations(groups, MAX_CANDIDATE_COMBINATIONS);

    if (combinations.length === 0) {
      this.addIssue(
        issues,
        issueKeys,
        {
          kind: "explicit",
          severity: "error",
          modVersionId: "selection",
          targetModVersionId: null,
          message: "No conflict-free candidate combination was found for selected mods."
        }
      );

      return {
        status: "incompatible",
        loader: args.loader,
        minecraftVersion: args.minecraftVersion,
        requestedMods: args.selectedMods,
        requestedModVersionIds: [],
        resolvedSelections: [],
        resolvedDependencies: [],
        missingDependencies: [],
        issues
      };
    }

    let bestResult: CompatibilityAnalysisResult | null = null;

    for (const combination of combinations) {
      const currentResult = await this.analyzeFromVersionIds({
        loader: args.loader,
        minecraftVersion: args.minecraftVersion,
        requestedIds: combination,
        requestedMods: args.selectedMods
      });

      const finalizedResult = this.finalizeRequestedModsCoverage(currentResult, args.selectedMods, issues);

      if (finalizedResult.status === "compatible") {
        return finalizedResult;
      }

      if (!bestResult || resultScore(finalizedResult) < resultScore(bestResult)) {
        bestResult = finalizedResult;
      }
    }

    if (bestResult) {
      return bestResult;
    }

    return {
      status: "incompatible",
      loader: args.loader,
      minecraftVersion: args.minecraftVersion,
      requestedMods: args.selectedMods,
      requestedModVersionIds: [],
      resolvedSelections: [],
      resolvedDependencies: [],
      missingDependencies: [],
      issues
    };
  }

  private generateCandidateCombinations(groups: CandidateGroup[], limit: number): string[][] {
    const sortedGroups = [...groups].sort((left, right) => left.candidates.length - right.candidates.length);
    const combinations: string[][] = [];
    const selectedCandidates: AnalyzableModVersion[] = [];

    const dfs = (depth: number): void => {
      if (combinations.length >= limit) {
        return;
      }

      if (depth === sortedGroups.length) {
        combinations.push(selectedCandidates.map((candidate) => candidate.id));
        return;
      }

      const group = sortedGroups[depth];

      if (!group) {
        return;
      }

      for (const candidate of group.candidates) {
        let hasConflict = false;

        for (const selected of selectedCandidates) {
          if (hasConflictBetween(candidate, selected)) {
            hasConflict = true;
            break;
          }
        }

        if (hasConflict) {
          continue;
        }

        selectedCandidates.push(candidate);
        dfs(depth + 1);
        selectedCandidates.pop();

        if (combinations.length >= limit) {
          break;
        }
      }
    };

    dfs(0);

    return combinations;
  }

  private async listCandidatesForSelectedMod(args: {
    requestedMod: SelectedMod;
    loader: string;
    minecraftVersion: string;
  }): Promise<AnalyzableModVersion[]> {
    if (args.requestedMod.modId) {
      return this.repository.listCompatibleVersionsForMod({
        modId: args.requestedMod.modId,
        loader: args.loader,
        minecraftVersion: args.minecraftVersion
      });
    }

    if (args.requestedMod.modSlug) {
      return this.repository.listCompatibleVersionsForModSlug({
        modSlug: args.requestedMod.modSlug,
        loader: args.loader,
        minecraftVersion: args.minecraftVersion
      });
    }

    return [];
  }

  private finalizeRequestedModsCoverage(
    result: CompatibilityAnalysisResult,
    requestedMods: SelectedMod[],
    baseIssues: CompatibilityIssue[]
  ): CompatibilityAnalysisResult {
    const mergedIssues = [...result.issues];
    const issueKeys = new Set(mergedIssues.map((issue) => buildIssueKey(issue)));

    for (const baseIssue of baseIssues) {
      this.addIssue(mergedIssues, issueKeys, baseIssue);
    }

    for (const requestedMod of requestedMods) {
      const isIncluded = result.resolvedSelections.some((selection) =>
        selection.origin === "user" && selectionMatchesRequestedMod(selection, requestedMod)
      );

      if (!isIncluded) {
        const label = requestedModLabel(requestedMod);

        this.addIssue(
          mergedIssues,
          issueKeys,
          {
            kind: "explicit",
            severity: "error",
            modVersionId: label,
            targetModVersionId: null,
            message: `Requested mod ${label} was not included in the resolved selection.`
          }
        );
      }
    }

    const status = mergedIssues.some((issue) => issue.severity === "error")
      || result.missingDependencies.some((dependency) => dependency.severity === "error")
      ? "incompatible"
      : "compatible";

    return {
      ...result,
      status,
      issues: mergedIssues
    };
  }

  private async analyzeFromVersionIds(args: {
    loader: string;
    minecraftVersion: string;
    requestedIds: string[];
    requestedMods: SelectedMod[] | undefined;
  }): Promise<CompatibilityAnalysisResult> {
    const requestedIds = [...new Set(args.requestedIds.filter(Boolean))];
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

      this.evaluateEnvironmentCompatibility(
        currentVersion,
        {
          loader: args.loader,
          minecraftVersion: args.minecraftVersion
        },
        issues,
        issueKeys
      );
      this.evaluateExplicitConflicts(currentVersion, resolvedByVersionId, issues, issueKeys);

      for (const dependency of currentVersion.dependencies) {
        if (dependency.kind === "embedded" || dependency.kind === "tool") {
          continue;
        }

        const dependencySeverity = dependency.kind === "optional" ? "warning" : "error";
        const candidate = await this.resolveDependencyCandidate(
          dependency,
          {
            loader: args.loader,
            minecraftVersion: args.minecraftVersion
          },
          versionCache
        );

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
      loader: args.loader,
      minecraftVersion: args.minecraftVersion,
      ...(args.requestedMods ? { requestedMods: args.requestedMods } : {}),
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
    input: {
      loader: string;
      minecraftVersion: string;
    },
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
    input: {
      loader: string;
      minecraftVersion: string;
    },
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
