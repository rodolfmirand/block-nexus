export type ModrinthProject = {
  id: string;
  slug: string;
  project_type: string;
  title: string;
  description: string;
  body: string | null;
  published: string;
  updated: string;
  status: string;
  client_side: string;
  server_side: string;
  categories: string[];
  additional_categories: string[];
  loaders: string[];
  game_versions: string[];
  issues_url: string | null;
  source_url: string | null;
  wiki_url: string | null;
  discord_url: string | null;
};

export type ModrinthVersionDependency = {
  version_id: string | null;
  project_id: string | null;
  file_name: string | null;
  dependency_type: string;
};

export type ModrinthVersionFile = {
  id: string;
  hashes: Partial<Record<"sha1" | "sha512", string>>;
  url: string;
  filename: string;
  primary: boolean;
  size: number;
  file_type: string | null;
};

export type ModrinthVersion = {
  id: string;
  project_id: string;
  featured: boolean;
  name: string;
  version_number: string;
  changelog: string | null;
  date_published: string;
  version_type: string;
  status: string;
  game_versions: string[];
  loaders: string[];
  files: ModrinthVersionFile[];
  dependencies: ModrinthVersionDependency[];
};

export type ModrinthLoaderTag = {
  name: string;
  supported_project_types: string[];
};

export type ModrinthGameVersionTag = {
  version: string;
  version_type: string;
  date: string;
  major: boolean;
};
