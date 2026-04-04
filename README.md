# BlockNexus

BlockNexus e uma API para analise de compatibilidade de mods e montagem de modpacks no ecossistema de Minecraft.

## Estado atual

O repositorio ja possui:

- endpoint `GET /health`, `GET /mods/search`, `GET /metrics`, `POST /analyze`, `POST /recommendations`;
- endpoints de sessao anonima: `POST /sessions`, `GET /sessions/:sessionId`, `PUT /sessions/:sessionId/selection`, `POST /sessions/:sessionId/analyze`;
- Swagger em `/docs`;
- ingestao/importacao de catalogo para PostgreSQL;
- motor de compatibilidade com selecao por `selectedMods`;
- cache basico de analise em memoria;
- logs estruturados e metricas basicas por rota.

## Stack inicial

- Node.js
- TypeScript
- Hono
- PostgreSQL
- Docker Compose para banco local

## Scripts

- `npm run dev`: inicia o servidor em modo desenvolvimento
- `npm run build`: compila para `dist/`
- `npm run start`: executa build
- `npm run catalog:ingest:modrinth -- <slug...>`: gera snapshot local
- `npm run catalog:import:snapshot -- [arquivo]`: importa snapshot no PostgreSQL
- `npm run compatibility:smoke`: cenario em memoria do motor
- `npm run db:up`: sobe PostgreSQL no Docker
- `npm run db:down`: derruba compose
- `npm run db:logs`: logs do PostgreSQL
- `npm run db:schema:apply`: aplica `db/schema.sql`
- `npm run typecheck`: validacao de tipos
- `npm run test`: testes automatizados
- `npm run lint`: lint
- `npm run format`: formatacao

## Como executar

1. Instale dependencias:

```bash
npm install
```

2. Crie ambiente local:

```powershell
Copy-Item .env.example .env
```

3. Suba banco e aplique schema:

```bash
npm run db:up
npm run db:schema:apply
```

4. Importe catalogo:

```bash
npm run catalog:ingest:modrinth -- sodium modmenu
npm run catalog:import:snapshot
```

5. Suba API:

```bash
npm run dev
```

6. Testes rapidos:

```bash
curl http://localhost:3000/health
curl http://localhost:3000/metrics
curl "http://localhost:3000/mods/search?q=sodium&limit=10"
curl -X POST http://localhost:3000/sessions
curl -X POST http://localhost:3000/recommendations -H "content-type: application/json" -d "{\"loader\":\"forge\",\"minecraftVersion\":\"1.21.1\",\"selectedMods\":[{\"modSlug\":\"create\"}],\"limit\":5}"
```

## Swagger

- UI: `http://localhost:3000/docs`
- OpenAPI JSON: `http://localhost:3000/openapi.json`

## Documentacao

- [Contexto do projeto](./docs/blocknexus.context.md)
- [Roadmap](./docs/blocknexus.roadmap.md)
- [Tarefas tecnicas](./docs/blocknexus.tasks.md)
- [Arquitetura inicial](./docs/blocknexus.architecture.md)
- [Decisao de fonte de dados](./docs/blocknexus.data-source.md)
- [Contrato canonico de ingestao](./docs/blocknexus.ingestion-contract.md)
- [Estrategia de atualizacao do catalogo](./docs/blocknexus.catalog-refresh.md)
- [Modelo de dominio](./docs/blocknexus.domain-model.md)
- [Regras de compatibilidade](./docs/blocknexus.compatibility-rules.md)
- [Schema relacional inicial](./docs/blocknexus.postgres-schema.md)
- [API do MVP](./docs/blocknexus.api.md)
- [Limitacoes conhecidas](./docs/blocknexus.limitations.md)

## Configuracoes de expiracao

- `ANALYSIS_CACHE_TTL_MS` (default: `300000`)
- `ANALYSIS_CACHE_MAX_ENTRIES` (default: `1000`)
- `SESSION_TTL_MS` (default: `3600000`)
- `SESSION_MAX_ENTRIES` (default: `1000`)
- `CLEANUP_INTERVAL_MS` (default: `60000`)



