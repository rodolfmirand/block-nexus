# BlockNexus

BlockNexus e uma API para analise de compatibilidade de mods e montagem de modpacks no ecossistema de Minecraft.

Neste momento, o projeto ja possui base funcional para ingestao de catalogo, importacao automatica para PostgreSQL, modelagem de dominio, schema relacional, motor interno de compatibilidade, busca de mods e endpoint de analise.

## Estado atual

O repositório ja possui:

- estrutura de projeto organizada;
- configuracao de desenvolvimento;
- endpoint `GET /health`, `GET /mods/search`, `POST /analyze`, `GET /metrics` e Swagger em `/docs`;
- pipeline inicial de ingestao de catalogo via Modrinth;
- importador automatico de snapshot para PostgreSQL;
- modelo de dominio source-agnostic;
- schema inicial em PostgreSQL;
- conexao real da aplicacao com `DATABASE_URL`;
- motor interno de analise de compatibilidade.

## Stack inicial

- Node.js
- TypeScript
- Hono
- PostgreSQL como direcao inicial de persistencia
- Docker Compose para ambiente local do banco

## Scripts

- `npm run dev`: inicia o servidor em modo de desenvolvimento
- `npm run build`: compila o projeto para `dist/`
- `npm run start`: executa a versao compilada
- `npm run catalog:ingest:modrinth -- <slug...>`: busca projetos do Modrinth e grava snapshot local
- `npm run catalog:import:snapshot -- [caminho-do-snapshot]`: importa snapshot para PostgreSQL
- `npm run compatibility:smoke`: executa um cenario em memoria para validar o motor de compatibilidade
- `npm run db:up`: sobe o PostgreSQL no Docker
- `npm run db:down`: derruba os containers do compose
- `npm run db:logs`: acompanha os logs do PostgreSQL
- `npm run db:schema:apply`: aplica `db/schema.sql` no container do PostgreSQL
- `npm run typecheck`: valida tipos sem gerar build
- `npm run lint`: executa o lint
- `npm run format`: formata os arquivos
- `npm run format:check`: verifica formatacao

## Como executar

1. Instale as dependencias:

```bash
npm install
```

2. Crie o arquivo de ambiente local:

```bash
cp .env.example .env
```

No Windows PowerShell, voce pode usar:

```powershell
Copy-Item .env.example .env
```

3. Suba o banco local e aplique o schema:

```bash
npm run db:up
npm run db:schema:apply
```

4. Gere snapshot e importe para o banco:

```bash
npm run catalog:ingest:modrinth -- sodium modmenu
npm run catalog:import:snapshot
```

Opcionalmente, informe um arquivo especifico:

```bash
npm run catalog:import:snapshot -- storage/catalog/modrinth/phase1-smoke.json
```

5. Inicie o servidor:

```bash
npm run dev
```

6. Teste os endpoints:

```bash
curl http://localhost:3000/health
curl "http://localhost:3000/mods/search?q=sodium&limit=10"
curl -X POST http://localhost:3000/analyze \
  -H "Content-Type: application/json" \
  -d '{"loader":"fabric","minecraftVersion":"1.21.1","selectedModVersionIds":["101"]}'
```

7. Abra o Swagger para testar no navegador:

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
- [API do MVP](./docs/blocknexus.api.md)`r`n- [Limitacoes conhecidas](./docs/blocknexus.limitations.md)

## Proximo passo

O trabalho segue para:

- adicionar logs estruturados no fluxo de analise;
- medir latencia e taxa de erro do endpoint;
- criar testes automatizados para cenarios principais;
- documentar limitacoes conhecidas do MVP.

