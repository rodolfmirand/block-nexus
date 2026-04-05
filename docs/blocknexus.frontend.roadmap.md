# Roadmap Frontend: BlockNexus

## 1. Objetivo

Este plano cobre a construcao do frontend como trilha separada, alinhada ao backend ja implementado.

Estado atual da trilha frontend:

- FE-0 concluida (bootstrap + layout base + tokens Tech Minimal).
- FE-1 concluida (cliente API tipado + contratos + tratamento padrao de erro).
- FE-2 concluida (busca real + selecao + sessao + analise com exibicao de resultado).
- FE-3 concluida (recomendacoes + historico de sessao).

Referencia visual oficial:

- `docs/blocknexus.frontend.design.md`

Fluxo alvo do MVP frontend:

1. usuario define `loader` e `minecraftVersion`;
2. pesquisa mods por nome/slug;
3. adiciona mods na selecao;
4. executa analise de compatibilidade;
5. visualiza versoes selecionadas, dependencias, conflitos e issues;
6. consulta recomendacoes de mods.

## 2. Escopo Alinhado ao Backend Atual

Endpoints ja disponiveis para consumo:

- `GET /health`
- `GET /mods/search`
- `POST /analyze`
- `POST /recommendations`
- `POST /sessions`
- `GET /sessions/:sessionId`
- `PUT /sessions/:sessionId/selection`
- `POST /sessions/:sessionId/analyze`
- `GET /metrics`

Contrato de entrada recomendado no frontend:

- sempre enviar `inputMode: "mods"` no fluxo principal;
- enviar `selectedMods` por `modSlug` e/ou `modId`;
- manter `loader` e `minecraftVersion` como estado global da sessao.

## 3. Arquitetura Recomendada

- stack: `React + TypeScript + Vite`
- UI: componentes proprios simples (sem design system pesado no inicio)
- data fetching: `TanStack Query`
- validacao de payload: `zod`
- roteamento: `react-router`
- estado local: `useState` + contexto leve (sem Redux no MVP)

Estrutura sugerida:

- `src/app` (boot, providers, router)
- `src/features/mod-search`
- `src/features/selection`
- `src/features/analysis`
- `src/features/recommendations`
- `src/features/session`
- `src/shared/api`
- `src/shared/ui`
- `src/shared/types`

## 4. Fases de Implementacao

### FE-0. Setup do Projeto

Entregaveis:

- bootstrap React + TS + Vite;
- lint/format/test basicos;
- `.env.example` com `VITE_API_BASE_URL`;
- layout base (header, area de selecao, area de resultado).

### FE-1. Cliente HTTP e Contratos

Entregaveis:

- cliente API tipado para todos os endpoints necessarios;
- tipos de request/response alinhados ao backend;
- mapeamento de erros (`400`, `503`, `500`) com mensagens amigaveis.

### FE-2. Fluxo de Busca e Selecao

Entregaveis:

- tela de busca com `GET /mods/search`;
- adicionar/remover mod na lista local;
- formulario de ambiente (`loader`, `minecraftVersion`);
- persistencia de selecao via sessao (`POST /sessions` + `PUT /sessions/:id/selection`).

### FE-3. Fluxo de Analise

Entregaveis:

- botao "Analisar compatibilidade";
- execucao por sessao (`POST /sessions/:id/analyze`) como fluxo principal;
- fallback por `POST /analyze` em caso de necessidade;
- exibicao estruturada de:
  - status final (`compatible`/`incompatible`);
  - `resolvedSelections`;
  - `resolvedDependencies`;
  - `missingDependencies`;
  - `issues`.

### FE-4. Recomendacoes e Historico

Entregaveis:

- chamada de `POST /recommendations`;
- lista de recomendacoes com razoes;
- visualizacao do historico basico da sessao (`GET /sessions/:id`).

### FE-5. Qualidade de Produto

Entregaveis:

- estados de loading/erro/vazio;
- testes de fluxo critico (busca -> selecao -> analise);
- acessibilidade basica (labels, foco, contraste);
- monitoramento frontend minimo (log de erro no cliente).

### FE-6. Preparacao para AWS (baixo custo)

Entregaveis:

- build de producao;
- deploy de frontend estatico em arquitetura economica;
- configuracao de variaveis por ambiente;
- checklist de operacao alinhado ao teto de credito AWS.

## 5. Critério de Saida do Frontend MVP

Frontend e considerado pronto quando:

- usuario consegue montar selecao de mods ponta a ponta;
- analise de compatibilidade e recomendacoes sao exibidas com clareza;
- erros de backend sao tratados sem quebrar fluxo;
- sessao anonima permite retomar estado.

## 6. Riscos e Mitigacoes

- divergencia de contrato frontend/backend:
  - mitigar com tipos compartilhados e testes de contrato.
- acoplamento prematuro a UI complexa:
  - mitigar com componentes simples no MVP.
- perda de estado da selecao:
  - mitigar persistindo `sessionId` em `localStorage`.
