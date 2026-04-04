import assert from "node:assert/strict";
import test from "node:test";

import type { CompatibilityAnalysisResult } from "../modules/compatibility/engine/contracts.js";
import { collectCandidatesByDependencyKind, RecommendationService } from "../modules/recommendation/engine/recommendation-service.js";

function buildBaseAnalysis(): CompatibilityAnalysisResult {
  return {
    status: "compatible",
    loader: "forge",
    minecraftVersion: "1.21.1",
    requestedMods: [{ modSlug: "create" }, { modSlug: "travelersbackpack" }],
    requestedModVersionIds: ["100", "200"],
    resolvedSelections: [
      {
        modId: "1",
        modVersionId: "100",
        requestedModVersionId: "100",
        origin: "user",
        requiredByModVersionId: null,
        depth: 0,
        modSlug: "create",
        versionNumber: "6.0.9"
      },
      {
        modId: "2",
        modVersionId: "200",
        requestedModVersionId: "200",
        origin: "user",
        requiredByModVersionId: null,
        depth: 0,
        modSlug: "travelersbackpack",
        versionNumber: "10.1.34"
      },
      {
        modId: "3",
        modVersionId: "300",
        requestedModVersionId: "300",
        origin: "dependency",
        requiredByModVersionId: "100",
        depth: 1,
        modSlug: "jei",
        versionNumber: "19.27.0.340"
      },
      {
        modId: "4",
        modVersionId: "400",
        requestedModVersionId: "400",
        origin: "dependency",
        requiredByModVersionId: "100",
        depth: 1,
        modSlug: "flywheel",
        versionNumber: "1.0.0"
      }
    ],
    resolvedDependencies: [
      {
        sourceModVersionId: "100",
        dependencyId: "d-1",
        dependencyKind: "optional",
        targetModVersionId: "300",
        depth: 1
      },
      {
        sourceModVersionId: "200",
        dependencyId: "d-2",
        dependencyKind: "optional",
        targetModVersionId: "300",
        depth: 1
      },
      {
        sourceModVersionId: "100",
        dependencyId: "d-3",
        dependencyKind: "required",
        targetModVersionId: "400",
        depth: 1
      }
    ],
    missingDependencies: [],
    issues: []
  };
}

test("collects optional recommendations and aggregates score", () => {
  const analysis = buildBaseAnalysis();

  const recommendations = collectCandidatesByDependencyKind(analysis, "optional");

  assert.equal(recommendations.length, 1);
  assert.equal(recommendations[0]?.modSlug, "jei");
  assert.equal(recommendations[0]?.score, 2);
  assert.equal(recommendations[0]?.reasons.length, 2);
});

test("falls back to required dependencies when optional is empty", async () => {
  const analysis = buildBaseAnalysis();
  const noOptional: CompatibilityAnalysisResult = {
    ...analysis,
    resolvedDependencies: analysis.resolvedDependencies.filter((dependency) => dependency.dependencyKind !== "optional")
  };

  const service = new RecommendationService({
    analyze: async () => noOptional
  });

  const result = await service.recommend({
    loader: "forge",
    minecraftVersion: "1.21.1",
    selectedMods: [{ modSlug: "create" }]
  });

  assert.equal(result.meta.usedDependencyKind, "required");
  assert.equal(result.recommendations.length, 1);
  assert.equal(result.recommendations[0]?.modSlug, "flywheel");
});
