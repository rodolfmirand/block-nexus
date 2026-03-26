# Contrato Canonico de Ingestao: BlockNexus

## 1. Objetivo

Este documento define o contrato canônico de ingestao do BlockNexus.

O contrato existe para evitar que o restante do sistema dependa diretamente do payload bruto de uma fonte externa.

## 2. Principio Central

Todo dado vindo de uma fonte externa deve passar por uma camada de normalizacao e ser convertido para entidades internas.

As entidades internas iniciais sao:

- `CatalogProject`
- `CatalogVersion`
- `CatalogFile`
- `CatalogDependency`

## 3. Regras do Contrato

### 3.1 Source agnostic

O contrato nao deve carregar semantica exclusiva de Modrinth ou CurseForge.

### 3.2 Identificadores externos preservados

O sistema deve preservar os identificadores de origem para rastreabilidade.

### 3.3 Dependencias sao por versao

A dependencia deve ser tratada prioritariamente como relacao entre **versoes**, mesmo quando a fonte externa informar apenas o projeto alvo.

### 3.4 Compatibilidade de ambiente e parte da versao

`loaders` e `gameVersions` pertencem principalmente ao nivel de versao, embora possam aparecer tambem no nivel de projeto.

## 4. Entidades Canonicas

### 4.1 CatalogProject

Campos principais:

- `source`
- `sourceProjectId`
- `slug`
- `projectType`
- `title`
- `summary`
- `description`
- `publishedAt`
- `updatedAt`
- `status`
- `clientSupport`
- `serverSupport`
- `categories`
- `loaders`
- `gameVersions`
- `links`

### 4.2 CatalogVersion

Campos principais:

- `source`
- `sourceVersionId`
- `sourceProjectId`
- `versionNumber`
- `displayName`
- `versionType`
- `publishedAt`
- `status`
- `featured`
- `loaders`
- `gameVersions`
- `files`
- `dependencies`
- `changelog`

### 4.3 CatalogFile

Campos principais:

- `source`
- `sourceFileId`
- `filename`
- `url`
- `primary`
- `size`
- `hashes`

### 4.4 CatalogDependency

Campos principais:

- `source`
- `dependencyType`
- `targetProjectId`
- `targetVersionId`
- `targetFileName`

Tipos de dependencia iniciais:

- `required`
- `optional`
- `incompatible`
- `embedded`
- `tool`
- `unknown`

## 5. Mapeamento Inicial do Modrinth

### Projeto

- `id` -> `sourceProjectId`
- `slug` -> `slug`
- `project_type` -> `projectType`
- `title` -> `title`
- `description` -> `summary`
- `body` -> `description`
- `published` -> `publishedAt`
- `updated` -> `updatedAt`
- `status` -> `status`
- `client_side` -> `clientSupport`
- `server_side` -> `serverSupport`
- `categories` + `additional_categories` -> `categories`
- `loaders` -> `loaders`
- `game_versions` -> `gameVersions`

### Versao

- `id` -> `sourceVersionId`
- `project_id` -> `sourceProjectId`
- `version_number` -> `versionNumber`
- `name` -> `displayName`
- `version_type` -> `versionType`
- `date_published` -> `publishedAt`
- `status` -> `status`
- `featured` -> `featured`
- `loaders` -> `loaders`
- `game_versions` -> `gameVersions`
- `changelog` -> `changelog`

### Arquivo

- `id` -> `sourceFileId`
- `filename` -> `filename`
- `url` -> `url`
- `primary` -> `primary`
- `size` -> `size`
- `hashes` -> `hashes`

### Dependencia

- `dependency_type` -> `dependencyType`
- `project_id` -> `targetProjectId`
- `version_id` -> `targetVersionId`
- `file_name` -> `targetFileName`

## 6. Proximo Passo

Com a fonte primaria escolhida e o contrato canônico definido, o proximo passo da Fase 1 e:

1. implementar o adapter inicial do Modrinth;
2. buscar projetos e versoes reais;
3. converter payloads para o formato canônico;
4. preparar a persistencia inicial do catalogo.
