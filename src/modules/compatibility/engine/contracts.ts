import type {
  CompatibilityIssue,
  CompatibilitySelection,
  ConflictRule,
  DependencyKind,
  DependencyRule,
  LoaderCode,
  MinecraftVersionCode,
  Mod,
  ModVersion
} from "../domain/index.js";

export type AnalyzableModVersion = ModVersion & {
  mod: Mod;
  dependencies: DependencyRule[];
  conflicts: ConflictRule[];
};

export type SelectedMod = {
  modId?: string;
  modSlug?: string;
};

export type CompatibilityInputMode = "mods" | "version_ids";

export type CompatibilityAnalysisInput = {
  loader: LoaderCode;
  minecraftVersion: MinecraftVersionCode;
  inputMode?: CompatibilityInputMode;
  selectedModVersionIds?: string[];
  selectedMods?: SelectedMod[];
};

export type ResolvedSelection = CompatibilitySelection & {
  modVersionId: string;
  modSlug: string;
  versionNumber: string;
};

export type ResolvedDependency = {
  sourceModVersionId: string;
  dependencyId: string;
  dependencyKind: DependencyKind;
  targetModVersionId: string;
  depth: number;
};

export type MissingDependency = {
  sourceModVersionId: string;
  dependencyId: string;
  dependencyKind: DependencyKind;
  targetModId: string | null;
  targetExternalProjectId: string | null;
  severity: "error" | "warning";
  message: string;
};

export type CompatibilityAnalysisResult = {
  status: "compatible" | "incompatible";
  loader: LoaderCode;
  minecraftVersion: MinecraftVersionCode;
  requestedMods?: SelectedMod[];
  requestedModVersionIds: string[];
  resolvedSelections: ResolvedSelection[];
  resolvedDependencies: ResolvedDependency[];
  missingDependencies: MissingDependency[];
  issues: CompatibilityIssue[];
};
