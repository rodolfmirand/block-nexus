export type CatalogSource = "modrinth" | "curseforge";

export type CatalogProjectType =
  | "mod"
  | "modpack"
  | "plugin"
  | "shader"
  | "resourcepack"
  | "datapack"
  | "unknown";

export type CatalogSupportLevel = "required" | "optional" | "unsupported" | "unknown";

export type CatalogVersionType = "release" | "beta" | "alpha" | "snapshot" | "unknown";

export type CatalogDependencyType =
  | "required"
  | "optional"
  | "incompatible"
  | "embedded"
  | "tool"
  | "unknown";

export type CatalogFileHashes = Partial<Record<"sha1" | "sha512" | "md5", string>>;

export type CatalogProjectLinks = Partial<
  Record<"issues" | "source" | "wiki" | "discord" | "homepage", string>
>;

export type CatalogProject = {
  source: CatalogSource;
  sourceProjectId: string;
  slug: string | null;
  projectType: CatalogProjectType;
  title: string;
  summary: string | null;
  description: string | null;
  publishedAt: string | null;
  updatedAt: string | null;
  status: string | null;
  clientSupport: CatalogSupportLevel;
  serverSupport: CatalogSupportLevel;
  categories: string[];
  loaders: string[];
  gameVersions: string[];
  links: CatalogProjectLinks;
};

export type CatalogFile = {
  source: CatalogSource;
  sourceFileId: string;
  filename: string;
  url: string;
  primary: boolean;
  size: number | null;
  hashes: CatalogFileHashes;
};

export type CatalogDependency = {
  source: CatalogSource;
  dependencyType: CatalogDependencyType;
  targetProjectId: string | null;
  targetVersionId: string | null;
  targetFileName: string | null;
};

export type CatalogVersion = {
  source: CatalogSource;
  sourceVersionId: string;
  sourceProjectId: string;
  versionNumber: string;
  displayName: string | null;
  versionType: CatalogVersionType;
  publishedAt: string | null;
  status: string | null;
  featured: boolean;
  loaders: string[];
  gameVersions: string[];
  files: CatalogFile[];
  dependencies: CatalogDependency[];
  changelog: string | null;
};

export type CatalogProjectRecord = {
  project: CatalogProject;
  versions: CatalogVersion[];
};
