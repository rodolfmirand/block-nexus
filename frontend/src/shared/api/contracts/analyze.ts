import type { AnalyzeStatus, SelectedMod } from "./common";

export type AnalyzeRequest = {
  loader: string;
  minecraftVersion: string;
  inputMode: "mods";
  selectedMods: SelectedMod[];
};

export type AnalyzeIssue = {
  kind: string;
  severity: "error" | "warning";
  modVersionId: string;
  targetModVersionId: string | null;
  message: string;
};

export type AnalyzeSelection = {
  modId: string;
  modVersionId: string;
  requestedModVersionId: string;
  origin: "user" | "dependency";
  requiredByModVersionId: string | null;
  depth: number;
  modSlug: string;
  versionNumber: string;
};

export type AnalyzeResponse = {
  status: AnalyzeStatus;
  loader: string;
  minecraftVersion: string;
  requestedMods?: SelectedMod[];
  requestedModVersionIds: string[];
  resolvedSelections: AnalyzeSelection[];
  resolvedDependencies: Array<Record<string, unknown>>;
  missingDependencies: Array<Record<string, unknown>>;
  issues: AnalyzeIssue[];
  meta?: {
    cache: {
      hit: boolean;
    };
    inputMode: "mods" | "version_ids";
  };
};
