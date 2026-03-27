create table if not exists loaders (
  code text primary key,
  display_name text not null
);

create table if not exists minecraft_versions (
  code text primary key,
  is_major boolean not null default false
);

create table if not exists mods (
  id bigint generated always as identity primary key,
  slug text not null,
  title text not null,
  summary text,
  description text,
  client_support text not null default 'unknown' check (client_support in ('required', 'optional', 'unsupported', 'unknown')),
  server_support text not null default 'unknown' check (server_support in ('required', 'optional', 'unsupported', 'unknown')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint uq_mods_slug unique (slug)
);

create table if not exists mod_external_refs (
  mod_id bigint not null references mods(id) on delete cascade,
  source text not null check (source in ('modrinth', 'curseforge')),
  source_project_id text not null,
  source_slug text,
  primary key (source, source_project_id),
  constraint uq_mod_external_refs_mod_source unique (mod_id, source)
);

create table if not exists mod_versions (
  id bigint generated always as identity primary key,
  mod_id bigint not null references mods(id) on delete cascade,
  version_number text not null,
  display_name text,
  release_channel text not null default 'unknown' check (release_channel in ('release', 'beta', 'alpha', 'snapshot', 'unknown')),
  status text,
  featured boolean not null default false,
  changelog text,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_mod_versions_mod_id on mod_versions (mod_id);
create index if not exists idx_mod_versions_published_at on mod_versions (published_at desc);

create table if not exists mod_version_external_refs (
  mod_version_id bigint not null references mod_versions(id) on delete cascade,
  source text not null check (source in ('modrinth', 'curseforge')),
  source_version_id text not null,
  primary key (source, source_version_id),
  constraint uq_mod_version_external_refs_version_source unique (mod_version_id, source)
);

create table if not exists mod_version_loaders (
  mod_version_id bigint not null references mod_versions(id) on delete cascade,
  loader_code text not null references loaders(code) on delete restrict,
  primary key (mod_version_id, loader_code)
);

create index if not exists idx_mod_version_loaders_loader_code on mod_version_loaders (loader_code);

create table if not exists mod_version_minecraft_versions (
  mod_version_id bigint not null references mod_versions(id) on delete cascade,
  minecraft_version_code text not null references minecraft_versions(code) on delete restrict,
  primary key (mod_version_id, minecraft_version_code)
);

create index if not exists idx_mod_version_mc_versions_code
  on mod_version_minecraft_versions (minecraft_version_code);

create table if not exists mod_files (
  id bigint generated always as identity primary key,
  mod_version_id bigint not null references mod_versions(id) on delete cascade,
  source_file_id text,
  filename text not null,
  file_url text not null,
  is_primary boolean not null default false,
  size_bytes bigint,
  sha1 text,
  sha512 text,
  md5 text
);

create index if not exists idx_mod_files_mod_version_id on mod_files (mod_version_id);

create table if not exists mod_dependencies (
  id bigint generated always as identity primary key,
  mod_version_id bigint not null references mod_versions(id) on delete cascade,
  dependency_kind text not null check (dependency_kind in ('required', 'optional', 'embedded', 'tool')),
  target_mod_id bigint references mods(id) on delete restrict,
  target_mod_version_id bigint references mod_versions(id) on delete restrict,
  target_external_project_id text,
  target_external_version_id text,
  target_file_name text,
  reason text,
  constraint ck_mod_dependencies_target_present check (
    target_mod_id is not null
    or target_mod_version_id is not null
    or target_external_project_id is not null
    or target_external_version_id is not null
    or target_file_name is not null
  )
);

create index if not exists idx_mod_dependencies_mod_version_id on mod_dependencies (mod_version_id);
create index if not exists idx_mod_dependencies_target_mod_id on mod_dependencies (target_mod_id);
create index if not exists idx_mod_dependencies_target_mod_version_id on mod_dependencies (target_mod_version_id);

create table if not exists mod_conflicts (
  id bigint generated always as identity primary key,
  mod_version_id bigint not null references mod_versions(id) on delete cascade,
  target_mod_id bigint references mods(id) on delete restrict,
  target_mod_version_id bigint references mod_versions(id) on delete restrict,
  severity text not null default 'error' check (severity in ('error', 'warning')),
  reason text not null,
  constraint ck_mod_conflicts_target_present check (
    target_mod_id is not null
    or target_mod_version_id is not null
  )
);

create index if not exists idx_mod_conflicts_mod_version_id on mod_conflicts (mod_version_id);
create index if not exists idx_mod_conflicts_target_mod_id on mod_conflicts (target_mod_id);
create index if not exists idx_mod_conflicts_target_mod_version_id on mod_conflicts (target_mod_version_id);
