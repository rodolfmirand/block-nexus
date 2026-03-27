# Esquema Relacional Inicial: BlockNexus

## 1. Objetivo

Este documento descreve o esquema relacional inicial que sustentara o catalogo e o futuro motor de analise do BlockNexus.

O foco desta etapa nao e otimizar tudo. O foco e ter uma base relacional clara, normalizada e coerente com o dominio definido na Fase 2.

## 2. Principios do Schema

O schema inicial segue estes principios:

- separar identidade interna de identidade externa;
- tratar `ModVersion` como unidade principal de compatibilidade;
- preservar rastreabilidade com a fonte original;
- permitir dependencias e conflitos em nivel de mod ou versao;
- manter o banco preparado para consultas de resolucao transitiva.

## 3. Tabelas Principais

### 3.1 `mods`

Representa o projeto logico do mod.

### 3.2 `mod_external_refs`

Relaciona cada `Mod` com seus identificadores externos por fonte.

### 3.3 `mod_versions`

Representa as versoes instalaveis do mod.

### 3.4 `mod_version_external_refs`

Relaciona cada `ModVersion` com seus identificadores externos por fonte.

### 3.5 `loaders`

Catalogo de loaders suportados.

### 3.6 `minecraft_versions`

Catalogo de versoes de Minecraft conhecidas.

### 3.7 `mod_version_loaders`

Relacionamento N:N entre versoes de mod e loaders suportados.

### 3.8 `mod_version_minecraft_versions`

Relacionamento N:N entre versoes de mod e versoes do Minecraft suportadas.

### 3.9 `mod_files`

Arquivos distribuiveis de cada versao do mod.

### 3.10 `mod_dependencies`

Dependencias declaradas pela versao do mod, com suporte a alvo interno ou referencia externa ainda nao reconciliada.

### 3.11 `mod_conflicts`

Conflitos explicitamente declarados ou promovidos a regra de produto.

## 4. Decisoes Importantes

### `ModVersion` e a unidade principal

A maior parte das consultas futuras do motor deve partir de `mod_versions`, porque dependencias, loaders, game versions e conflitos sao avaliados nesse nivel.

### Identidade externa preservada

O schema nao deve assumir que o `id` do Modrinth ou do CurseForge sera o identificador principal do produto.

Por isso, referencias externas ficam em tabelas separadas.

### Dependencias incompletas ainda sao persistidas

A fonte externa pode trazer dependencia sem alvo interno resolvido. O schema precisa guardar isso sem perder a informacao original.

## 5. Consultas Esperadas

Este schema foi pensado para suportar, nas proximas fases:

- buscar versoes de um mod por loader e versao do Minecraft;
- carregar dependencias de uma `ModVersion`;
- detectar conflitos explicitos;
- verificar se dois mods coexistem no mesmo ambiente;
- servir de base para resolucao transitiva.

## 6. Arquivo de Referencia

A definicao SQL inicial esta em [db/schema.sql](../db/schema.sql).
