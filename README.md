# BlockNexus

BlockNexus e uma API para analise de compatibilidade de mods e montagem de modpacks no ecossistema de Minecraft.

Neste momento, o projeto ja possui base funcional para ingestao de catalogo, modelagem de dominio e preparacao do schema relacional do MVP.

## Estado atual

O repositório ja possui:

- estrutura de projeto organizada;
- configuracao de desenvolvimento;
- endpoint `GET /health`;
- pipeline inicial de ingestao de catalogo via Modrinth;
- modelo de dominio source-agnostic;
- schema inicial em PostgreSQL.

As Fases 1 e 2 agora estao fechadas. O proximo foco e a **Fase 3**, dedicada ao motor de analise de compatibilidade.

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

## Estrutura do projeto

```text
db/
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
    compatibility/
  scripts/
  types/
```

## Scripts

- `npm run dev`: inicia o servidor em modo de desenvolvimento
- `npm run build`: compila o projeto para `dist/`
- `npm run start`: executa a versao compilada
- `npm run catalog:ingest:modrinth -- <slug...>`: busca projetos do Modrinth e grava snapshot local
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

3. Inicie o servidor:

```bash
npm run dev
```

4. Teste o health check:

```bash
curl http://localhost:3000/health
```

5. Gere um snapshot inicial do catalogo:

```bash
npm run catalog:ingest:modrinth -- fabric-api modmenu sodium
```

Por padrao, o snapshot e salvo em `storage/catalog/modrinth/bootstrap.json`.

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

- implementar a resolucao de dependencias transitivas;
- implementar a deteccao de conflitos;
- validar compatibilidade por loader e versao do Minecraft;
- definir o contrato de resposta do motor de analise.
