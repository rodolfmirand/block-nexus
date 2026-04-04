import type { CompatibilityAnalysisResult } from "../../compatibility/engine/contracts.js";
import type { CompatibilityService } from "../../compatibility/engine/index.js";
import type {
  RecommendationInput,
  RecommendationReason,
  RecommendationResult,
  RecommendedMod
} from "./contracts.js";

type CandidateAggregation = {
  modId: string;
  modSlug: string;
  modVersionId: string;
  versionNumber: string;
  reasons: RecommendationReason[];
};

function buildRecommendationMessage(args: {
  sourceModSlug: string;
  targetModSlug: string;
  dependencyKind: "optional" | "required";
}): string {
  const dependencyLabel = args.dependencyKind === "optional"
    ? "optional dependency"
    : "required dependency";

  return `${args.targetModSlug} is a ${dependencyLabel} declared by ${args.sourceModSlug}.`;
}

function collectCandidatesByDependencyKind(
  analysis: CompatibilityAnalysisResult,
  dependencyKind: "optional" | "required"
): RecommendedMod[] {
  const selectionByVersionId = new Map(
    analysis.resolvedSelections.map((selection) => [selection.modVersionId, selection])
  );
  const userSelections = analysis.resolvedSelections.filter((selection) => selection.origin === "user");
  const userModIds = new Set(userSelections.map((selection) => selection.modId));
  const byTargetVersionId = new Map<string, CandidateAggregation>();

  for (const dependency of analysis.resolvedDependencies) {
    if (dependency.dependencyKind !== dependencyKind) {
      continue;
    }

    const sourceSelection = selectionByVersionId.get(dependency.sourceModVersionId);

    if (!sourceSelection || sourceSelection.origin !== "user") {
      continue;
    }

    const targetSelection = selectionByVersionId.get(dependency.targetModVersionId);

    if (!targetSelection) {
      continue;
    }

    if (userModIds.has(targetSelection.modId)) {
      continue;
    }

    const current = byTargetVersionId.get(targetSelection.modVersionId) ?? {
      modId: targetSelection.modId,
      modSlug: targetSelection.modSlug,
      modVersionId: targetSelection.modVersionId,
      versionNumber: targetSelection.versionNumber,
      reasons: []
    };

    current.reasons.push({
      dependencyId: dependency.dependencyId,
      dependencyKind,
      sourceModSlug: sourceSelection.modSlug,
      sourceModVersionId: sourceSelection.modVersionId,
      message: buildRecommendationMessage({
        sourceModSlug: sourceSelection.modSlug,
        targetModSlug: targetSelection.modSlug,
        dependencyKind
      })
    });

    byTargetVersionId.set(targetSelection.modVersionId, current);
  }

  return [...byTargetVersionId.values()]
    .map((item) => ({
      modId: item.modId,
      modSlug: item.modSlug,
      modVersionId: item.modVersionId,
      versionNumber: item.versionNumber,
      score: item.reasons.length,
      reasons: item.reasons
    }))
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }

      return left.modSlug.localeCompare(right.modSlug);
    });
}

export class RecommendationService {
  public constructor(private readonly compatibilityService: Pick<CompatibilityService, "analyze">) {}

  public async recommend(input: RecommendationInput): Promise<RecommendationResult> {
    const limit = Number.isInteger(input.limit) && (input.limit ?? 0) > 0
      ? Math.min(input.limit ?? 20, 50)
      : 20;
    const analysis = await this.compatibilityService.analyze({
      loader: input.loader,
      minecraftVersion: input.minecraftVersion,
      inputMode: "mods",
      selectedMods: input.selectedMods
    });

    const optionalRecommendations = collectCandidatesByDependencyKind(analysis, "optional");
    const requiredRecommendations = collectCandidatesByDependencyKind(analysis, "required");
    const selected = optionalRecommendations.length > 0
      ? optionalRecommendations
      : requiredRecommendations;
    const usedDependencyKind = optionalRecommendations.length > 0
      ? "optional"
      : requiredRecommendations.length > 0
        ? "required"
        : "none";

    return {
      status: analysis.status,
      loader: input.loader,
      minecraftVersion: input.minecraftVersion,
      requestedMods: input.selectedMods,
      recommendations: selected.slice(0, limit),
      issues: analysis.issues,
      missingDependencies: analysis.missingDependencies,
      meta: {
        strategy: "optional_first_then_required",
        usedDependencyKind,
        totalRecommendations: selected.length,
        limitApplied: limit
      }
    };
  }
}

export { collectCandidatesByDependencyKind };
