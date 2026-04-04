import type {
  CompatibilityIssue,
  DependencyKind
} from "../../compatibility/domain/index.js";
import type {
  MissingDependency,
  SelectedMod
} from "../../compatibility/engine/contracts.js";

export type RecommendationInput = {
  loader: string;
  minecraftVersion: string;
  selectedMods: SelectedMod[];
  limit?: number;
};

export type RecommendationReason = {
  dependencyId: string;
  dependencyKind: DependencyKind;
  sourceModSlug: string;
  sourceModVersionId: string;
  message: string;
};

export type RecommendedMod = {
  modId: string;
  modSlug: string;
  modVersionId: string;
  versionNumber: string;
  score: number;
  reasons: RecommendationReason[];
};

export type RecommendationResult = {
  status: "compatible" | "incompatible";
  loader: string;
  minecraftVersion: string;
  requestedMods: SelectedMod[];
  recommendations: RecommendedMod[];
  issues: CompatibilityIssue[];
  missingDependencies: MissingDependency[];
  meta: {
    strategy: "optional_first_then_required";
    usedDependencyKind: "optional" | "required" | "none";
    totalRecommendations: number;
    limitApplied: number;
  };
};
