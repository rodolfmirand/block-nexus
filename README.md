# BlockNexus

BlockNexus e uma API para analise de compatibilidade de mods e montagem de modpacks no ecossistema de Minecraft.

Neste momento, a base da **Fase 0** foi estruturada e o projeto ja possui um backend inicial executavel para servir de fundacao ao MVP.

## Estado atual

O repositório ja possui:

- estrutura de projeto organizada;
- configuracao de desenvolvimento;
- endpoint `GET /health`;
- base pronta para evoluir para `POST /analyze`.

O proximo foco e a **Fase 1**, dedicada a fonte de dados dos mods e ao modelo de dominio.

## Stack inicial

- Node.js
- TypeScript
- Hono
- PostgreSQL como direcao inicial de persistencia

## Estrutura do projeto

```text
docs/
src/
  app.ts
  index.ts
  routes/
    health.ts
  lib/
    config.ts
  modules/
  types/
```

## Scripts

- `npm run dev`: inicia o servidor em modo de desenvolvimento
- `npm run build`: compila o projeto para `dist/`
- `npm run start`: executa a versao compilada
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

## Documentacao

- [Contexto do projeto](./docs/blocknexus.context.md)
- [Roadmap](./docs/blocknexus.roadmap.md)
- [Tarefas tecnicas](./docs/blocknexus.tasks.md)
- [Arquitetura inicial](./docs/blocknexus.architecture.md)

## Proximo passo

O trabalho segue para:

- definir a fonte primaria de dados dos mods;
- normalizar as entidades centrais do dominio;
- preparar a persistencia inicial do catalogo;
- iniciar o desenho do fluxo de analise de compatibilidade.
