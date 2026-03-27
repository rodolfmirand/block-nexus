import type { LoaderCode, MinecraftVersionCode, ReleaseChannel } from "./primitives.js";

export type ModFile = {
  id: string;
  modVersionId: string;
  filename: string;
  url: string;
  isPrimary: boolean;
  sizeBytes: number | null;
  hashes: Partial<Record<"sha1" | "sha512" | "md5", string>>;
};

export type ModVersion = {
  id: string;
  modId: string;
  versionNumber: string;
  displayName: string | null;
  releaseChannel: ReleaseChannel;
  loaders: LoaderCode[];
  minecraftVersions: MinecraftVersionCode[];
  publishedAt: string | null;
  isFeatured: boolean;
  status: string | null;
  changelog: string | null;
  files: ModFile[];
};
