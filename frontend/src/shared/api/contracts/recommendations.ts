import type { AnalyzeStatus, SelectedMod } from "./common";

export type RecommendationRequest = {
  loader: string;
  minecraftVersion: string;
  selectedMods: SelectedMod[];
  limit?: number;
};

export type RecommendationReason = {
  dependencyId: string;
  dependencyKind: "optional" | "required";
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

export type RecommendationResponse = {
  status: AnalyzeStatus;
  loader: string;
  minecraftVersion: string;
  requestedMods: SelectedMod[];
  recommendations: RecommendedMod[];
  issues: Array<Record<string, unknown>>;
  missingDependencies: Array<Record<string, unknown>>;
  meta: {
    strategy: string;
    usedDependencyKind: "optional" | "required" | "none";
    totalRecommendations: number;
    limitApplied: number;
  };
};
