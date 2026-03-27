import type { ExternalReference, SupportLevel } from "./primitives.js";

export type Mod = {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  description: string | null;
  clientSupport: SupportLevel;
  serverSupport: SupportLevel;
  externalReferences: ExternalReference[];
};
