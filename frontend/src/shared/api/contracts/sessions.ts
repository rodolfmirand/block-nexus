import type { AnalyzeResponse } from "./analyze";
import type { SelectedMod } from "./common";

export type SessionSelectionPayload = {
  loader: string;
  minecraftVersion: string;
  inputMode: "mods" | "version_ids";
  selectedMods?: SelectedMod[];
  selectedModVersionIds?: string[];
};

export type SessionHistoryEntry = {
  analyzedAt: string;
  status: "compatible" | "incompatible";
  cacheHit: boolean;
};

export type SessionCreatedResponse = {
  id: string;
  createdAt: string;
  updatedAt: string;
};

export type SessionResponse = {
  id: string;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
  selection: SessionSelectionPayload | null;
  lastResult: AnalyzeResponse | null;
  history: SessionHistoryEntry[];
};

export type SessionAnalyzeResponse = AnalyzeResponse & {
  meta?: AnalyzeResponse["meta"] & {
    sessionId?: string;
  };
};
