export type LoaderCode = string;

export type MinecraftVersionCode = string;

export type SupportLevel = "required" | "optional" | "unsupported" | "unknown";

export type ReleaseChannel = "release" | "beta" | "alpha" | "snapshot" | "unknown";

export type DependencyKind = "required" | "optional" | "embedded" | "tool";

export type ConflictSeverity = "error" | "warning";

export type SelectionOrigin = "user" | "dependency";

export type ConflictKind =
  | "explicit"
  | "missing_dependency"
  | "loader_incompatibility"
  | "minecraft_version_incompatibility"
  | "cycle"
  | "ambiguous_version";

export type ExternalReference = {
  source: "modrinth" | "curseforge";
  externalId: string;
  slug: string | null;
};
