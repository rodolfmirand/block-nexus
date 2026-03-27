import type { DependencyKind } from "./primitives.js";

export type DependencyRule = {
  id: string;
  modVersionId: string;
  kind: DependencyKind;
  targetModId: string | null;
  targetModVersionId: string | null;
  targetExternalProjectId: string | null;
  targetExternalVersionId: string | null;
  targetFileName: string | null;
  reason: string | null;
};
