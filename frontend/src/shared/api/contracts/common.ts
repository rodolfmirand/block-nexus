export type SelectedMod = {
  modId?: string;
  modSlug?: string;
};

export type ErrorResponse = {
  error: string;
  details?: string | string[];
};

export type AnalyzeStatus = "compatible" | "incompatible";
