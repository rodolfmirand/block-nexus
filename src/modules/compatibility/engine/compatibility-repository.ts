import type { LoaderCode, MinecraftVersionCode } from "../domain/index.js";
import type { AnalyzableModVersion } from "./contracts.js";

export type CompatibilityRepository = {
  getModVersionsByIds(ids: string[]): Promise<AnalyzableModVersion[]>;
  listCompatibleVersionsForMod(args: {
    modId: string;
    loader: LoaderCode;
    minecraftVersion: MinecraftVersionCode;
  }): Promise<AnalyzableModVersion[]>;
  listCompatibleVersionsForExternalProjectId(args: {
    externalProjectId: string;
    loader: LoaderCode;
    minecraftVersion: MinecraftVersionCode;
  }): Promise<AnalyzableModVersion[]>;
};
