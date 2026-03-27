import type { ConflictSeverity } from "./primitives.js";

export type ConflictRule = {
  id: string;
  modVersionId: string;
  targetModId: string | null;
  targetModVersionId: string | null;
  severity: ConflictSeverity;
  reason: string;
};
