# BlockNexus

BlockNexus e uma API para analise de compatibilidade de mods e montagem de modpacks no ecossistema de Minecraft.

Neste momento, o projeto ja possui base funcional para ingestao de catalogo, modelagem de dominio, schema relacional e motor interno de compatibilidade.

## Estado atual

O repositório ja possui:

- estrutura de projeto organizada;
- configuracao de desenvolvimento;
- endpoint `GET /health`;
- pipeline inicial de ingestao de catalogo via Modrinth;
- modelo de dominio source-agnostic;
- schema inicial em PostgreSQL;
- conexao real da aplicacao com `DATABASE_URL`;
- motor interno de analise de compatibilidade.

As Fases 1, 2 e 3 agora estao fechadas. O proximo foco e a **Fase 4**, dedicada a expor o fluxo por API.

## Fonte de dados inicial

O projeto adotou o **Modrinth** como fonte primaria inicial do catalogo.

Motivos principais:

- menor atrito de acesso para o MVP;
- API publica para a maioria das leituras;
- dados de projeto, versao, loaders, game versions e dependencias;
- melhor velocidade para sair do bootstrap e entrar na construcao do produto.

O repositório tambem ja possui um comando inicial de ingestao para buscar projetos reais do Modrinth e persistir um snapshot local normalizado.

## Stack inicial

- Node.js
- TypeScript
- Hono
- PostgreSQL como direcao inicial de persistencia
- Docker Compose para ambiente local do banco

## Estrutura do projeto

```text
compose.yaml
db/
docs/
scripts/
src/
  app.ts
  index.ts
  routes/
    health.ts
  lib/
    config.ts
    db.ts
  modules/
    catalog/
    compatibility/
      domain/
      engine/
      infrastructure/
  scripts/
  types/
```

## Scripts

- `npm run dev`: inicia o servidor em modo de desenvolvimento
- `npm run build`: compila o projeto para `dist/`
- `npm run start`: executa a versao compilada
- `npm run catalog:ingest:modrinth -- <slug...>`: busca projetos do Modrinth e grava snapshot local
- `npm run compatibility:smoke`: executa um cenário em memória para validar o motor de compatibilidade
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

A aplicacao carrega automaticamente o arquivo `.env` ao iniciar.

3. Suba o banco local no Docker:

```bash
npm run db:up
```

4. Aplique o schema inicial no container:

```bash
npm run db:schema:apply
```

5. Inicie o servidor:

```bash
npm run dev
```

6. Teste o health check:

```bash
curl http://localhost:3000/health
```

Quando o banco estiver acessivel, o endpoint retorna `200` e inclui o status real da conexao PostgreSQL.

7. Execute o smoke do motor de compatibilidade:

```bash
npm run compatibility:smoke
```

8. Gere um snapshot inicial do catalogo:

```bash
npm run catalog:ingest:modrinth -- fabric-api modmenu sodium
```

Por padrao, o snapshot e salvo em `storage/catalog/modrinth/bootstrap.json`.

## Banco local com Docker

O ambiente local usa um unico servico `postgres` definido em [compose.yaml](./compose.yaml).

Configuracao padrao do banco:

- host: `localhost`
- porta: `5432`
- database: `blocknexus`
- user: `blocknexus`
- password: `blocknexus`

A `DATABASE_URL` de desenvolvimento em [.env.example](./.env.example) aponta para esse ambiente:

```env
DATABASE_URL=postgresql://blocknexus:blocknexus@localhost:5432/blocknexus
```

O script de aplicacao do schema fica em [scripts/apply-db-schema.mjs](./scripts/apply-db-schema.mjs) e executa `psql` dentro do proprio container.

Pre-requisitos:

- Docker Desktop ou Docker Engine com Compose habilitado
- porta `5432` livre na maquina local

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

## Proximo passo

O trabalho segue para:

- criar o contrato HTTP do `POST /analyze`;
- validar payload de entrada;
- integrar a rota ao motor de compatibilidade;
- documentar requests e responses do MVP.
