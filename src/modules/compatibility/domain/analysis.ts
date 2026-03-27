import type { ConflictKind, ConflictSeverity, SelectionOrigin } from "./primitives.js";

export type CompatibilitySelection = {
  modId: string;
  requestedModVersionId: string | null;
  origin: SelectionOrigin;
  requiredByModVersionId: string | null;
  depth: number;
};

export type CompatibilityIssue = {
  kind: ConflictKind;
  severity: ConflictSeverity;
  modVersionId: string;
  targetModVersionId: string | null;
  message: string;
};
