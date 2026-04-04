# Arquitetura Inicial: BlockNexus

## 1. Objetivo

Este documento descreve a arquitetura inicial do BlockNexus para as fases iniciais do MVP.

O foco desta arquitetura e:

- simplicidade de desenvolvimento;
- clareza de dominio;
- separacao basica de responsabilidades;
- evolucao segura para as proximas fases.

---

## 2. Direcao Arquitetural

Nesta fase, o BlockNexus e um backend em `TypeScript` com `Hono`, executando localmente em `Node.js`.

O projeto nao foi estruturado desde o inicio como uma plataforma AWS completa. A arquitetura local permanece simples e orientada a camadas, permitindo posterior adaptacao para ambiente serverless.

### Direcao atual

- runtime local: Node.js
- framework HTTP: Hono
- persistencia atual do catalogo: PostgreSQL (com ingestao via snapshots JSON)
- prioridade funcional atual: fechamento do fluxo MVP por selecao de mods

### Direcao futura

- consolidacao do endpoint `POST /analyze` para entrada por mod (`selectedMods`)
- selecao automatica de versoes compativeis por loader e versao do Minecraft
- eventual variante em banco de grafos para o TCC
- componentes de cache e sessao apenas depois do nucleo funcional

---

## 3. Estrutura Atual de Pastas

```text
db/
  schema.sql
docs/
src/
  app.ts
  index.ts
  routes/
    health.ts
  lib/
    config.ts
  modules/
    catalog/
      ingestion/
    compatibility/
      domain/
  scripts/
    ingest-modrinth.ts
  types/
```

### Responsabilidades

- `src/index.ts`
  ponto de entrada do servidor local

- `src/app.ts`
  composicao principal da aplicacao Hono e registro de rotas

- `src/routes/`
  rotas HTTP agrupadas por responsabilidade

- `src/lib/`
  utilitarios compartilhados e leitura de configuracao

- `src/modules/catalog/ingestion/`
  ingestao, normalizacao e persistencia local do catalogo externo

- `src/modules/compatibility/domain/`
  modelo de dominio source-agnostic do produto

- `src/scripts/`
  comandos operacionais e scripts de suporte ao desenvolvimento

- `db/`
  schema relacional inicial e futuros artefatos de banco

---

## 4. Principios de Organizacao do Codigo

As proximas implementacoes devem seguir estes principios:

- regra de dominio fora da camada HTTP;
- validacao de entrada proxima da borda da aplicacao;
- dependencias de infraestrutura isoladas do nucleo de analise;
- contratos de resposta estaveis e explicitos;
- evolucao incremental por modulos.

---

## 5. Sequencia de Evolucao

### Fase 0

- bootstrap do projeto
- `GET /health`
- configuracao de ambiente
- documentacao operacional

### Fase 1

- definicao da fonte de dados
- ingestao inicial
- normalizacao do catalogo de mods

### Fase 2

- modelagem do dominio
- regras de compatibilidade
- esquema relacional inicial

### Fase 3

- implementacao do motor de analise

### Fase 4

- consolidacao do endpoint `POST /analyze` no fluxo MVP por mod

---

## 6. Observacoes Importantes

- o projeto ainda nao deve assumir Redis como dependencia obrigatoria;
- o projeto ainda nao deve assumir autenticacao como eixo principal;
- o projeto ainda nao deve ser desenhado em funcao do experimento academico;
- a proxima meta concreta e transformar o modelo de dominio em um motor de compatibilidade executavel.
