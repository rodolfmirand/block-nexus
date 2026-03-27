# Modelo de Dominio: BlockNexus

## 1. Objetivo

Este documento formaliza o dominio principal do BlockNexus para o MVP do produto.

A intencao desta fase e sair da ingestao de catalogo e estabelecer uma linguagem de negocio clara para compatibilidade de modpacks.

## 2. Escopo do Dominio

O dominio cobre o problema de responder se um conjunto de mods pode coexistir em um modpack para uma combinacao especifica de:

- versao do Minecraft;
- loader;
- versoes de mods.

A unidade principal de analise nao e o projeto do mod em abstrato. A unidade principal de analise e a **versao do mod**.

## 3. Entidades Centrais

### 3.1 Mod

Representa o projeto de mod em nivel logico.

Responsabilidades:

- identificar o mod de forma estavel no catalogo interno;
- agrupar multiplas versoes do mesmo projeto;
- expor metadados descritivos do projeto;
- preservar referencias externas para reconciliacao entre fontes.

Atributos essenciais:

- `id`
- `slug`
- `title`
- `summary`
- `description`
- `clientSupport`
- `serverSupport`
- `externalReferences`

### 3.2 ModVersion

Representa uma versao instalavel de um mod.

Responsabilidades:

- registrar compatibilidade com loader;
- registrar compatibilidade com versao do Minecraft;
- concentrar dependencias e conflitos aplicaveis;
- servir como unidade concreta de selecao e resolucao.

Atributos essenciais:

- `id`
- `modId`
- `versionNumber`
- `displayName`
- `releaseChannel`
- `loaders`
- `minecraftVersions`
- `publishedAt`
- `status`
- `isFeatured`
- `files`

### 3.3 ModFile

Representa um arquivo distribuivel associado a uma versao do mod.

Responsabilidades:

- preservar identificadores tecnicos do artefato;
- fornecer hashes para rastreabilidade;
- marcar o arquivo principal quando isso existir.

Atributos essenciais:

- `id`
- `modVersionId`
- `filename`
- `url`
- `isPrimary`
- `sizeBytes`
- `hashes`

### 3.4 DependencyRule

Representa uma dependencia declarada por uma versao do mod.

Responsabilidades:

- indicar dependencia obrigatoria ou opcional;
- apontar alvo por `Mod` ou `ModVersion`;
- preservar referencias externas quando o alvo ainda nao foi resolvido internamente.

Atributos essenciais:

- `id`
- `modVersionId`
- `kind`
- `targetModId`
- `targetModVersionId`
- `targetExternalProjectId`
- `targetExternalVersionId`
- `targetFileName`
- `reason`

### 3.5 ConflictRule

Representa uma incompatibilidade explicita declarada pelo catalogo ou promovida a regra de produto.

Responsabilidades:

- sinalizar combinacoes invalidas;
- apontar alvo no nivel de mod ou versao;
- diferenciar severidade de erro e aviso.

Atributos essenciais:

- `id`
- `modVersionId`
- `targetModId`
- `targetModVersionId`
- `severity`
- `reason`

### 3.6 CompatibilitySelection

Representa um item ativo dentro de uma analise de compatibilidade.

Responsabilidades:

- distinguir selecao feita pelo usuario de selecao induzida por dependencia;
- registrar profundidade de resolucao;
- preservar a origem da dependencia que introduziu a versao.

Atributos essenciais:

- `modId`
- `requestedModVersionId`
- `origin`
- `requiredByModVersionId`
- `depth`

### 3.7 CompatibilityIssue

Representa um problema encontrado durante a analise.

Tipos iniciais:

- `explicit`
- `missing_dependency`
- `loader_incompatibility`
- `minecraft_version_incompatibility`
- `cycle`
- `ambiguous_version`

## 4. Invariantes do Dominio

As seguintes regras estruturais devem permanecer verdadeiras:

1. A compatibilidade e decidida no nivel de `ModVersion`, nao no nivel de `Mod`.
2. Toda `ModVersion` deve pertencer exatamente a um `Mod`.
3. Toda `DependencyRule` pertence exatamente a uma `ModVersion` de origem.
4. `DependencyRule` pode apontar para um mod inteiro ou para uma versao especifica, mas nao deve ficar sem alvo conhecido e sem referencia externa ao mesmo tempo.
5. `ConflictRule` pode apontar para `Mod` ou `ModVersion`, mas deve indicar ao menos um alvo.
6. Loader e versao do Minecraft sao propriedades de `ModVersion`.
7. A ausencia de metadados nao implica compatibilidade automatica; implica incerteza e deve ser tratada explicitamente pelo motor.

## 5. Identidade e Normalizacao

O catalogo interno precisa separar duas identidades:

- **identidade interna**, usada pela aplicacao e pelo banco;
- **identidade externa**, usada para rastreabilidade com a fonte original.

Por isso, `Mod` e `ModVersion` devem manter referencias externas em paralelo ao identificador interno.

## 6. Resultado Esperado da Fase 2

Com este modelo, o proximo passo tecnico pode implementar o motor de analise sem depender do shape bruto do Modrinth.

Em outras palavras: a fonte externa alimenta o catalogo, mas a regra de negocio passa a operar sobre `Mod`, `ModVersion`, `DependencyRule` e `ConflictRule`.
