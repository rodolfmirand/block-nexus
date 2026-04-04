# Contexto do Projeto: BlockNexus

## 1. Visao Geral

**BlockNexus** e uma API para analise de compatibilidade de mods no ecossistema de Minecraft, com foco em montagem de modpacks.

A proposta do MVP e receber uma selecao de mods, considerar versao do Minecraft e loader, e retornar uma analise estruturada com:

- versoes compativeis selecionadas para cada mod;
- dependencias necessarias e suas versoes;
- conflitos e incompatibilidades.

## 2. Estrategia do Projeto

A ordem de execucao do projeto continua:

1. construir produto utilizavel;
2. evoluir para base experimental do TCC.

As decisoes tecnicas priorizam clareza de dominio, simplicidade operacional e velocidade de entrega.

## 3. Escopo do MVP

Entrada principal:

- `minecraftVersion`
- `loader`
- `selectedMods` (por `modId` e/ou `modSlug`)

Saida principal:

- versoes selecionadas por mod
- dependencias resolvidas
- dependencias faltantes
- conflitos
- incompatibilidades por ambiente
- status final (`compatible` ou `incompatible`)

## 4. Direcao Tecnica

- linguagem: TypeScript
- runtime: Node.js
- framework HTTP: Hono
- persistencia baseline: PostgreSQL
- endpoints atuais: `GET /health`, `GET /mods/search`, `GET /metrics`, `POST /analyze`, `GET /docs`

## 5. Estado Atual por Fase

### Fase 0 concluida

- bootstrap do backend
- configuracao de lint, build e typecheck
- health check inicial

### Fase 1 concluida

- fonte primaria definida (Modrinth)
- contrato canonico de ingestao
- pipeline inicial de snapshot

### Fase 2 concluida

- modelo de dominio formalizado
- regras de compatibilidade documentadas
- schema relacional inicial em PostgreSQL

### Fase 3 concluida

- contrato interno do motor de analise
- resolucao transitiva de dependencias
- deteccao de conflitos e incompatibilidades
- repositorio PostgreSQL para leitura do catalogo

### Fase 4 concluida

- contrato HTTP de `POST /analyze`
- validacao de payload
- integracao da rota com o motor
- documentacao Swagger inicial
- fluxo MVP orientado a `selectedMods` com fallback legado por `selectedModVersionIds`
- sinalizacao explicita quando mod solicitado nao entra na selecao final

### Fase 5 concluida

- logs estruturados de requisicao e analise
- metricas basicas em memoria (`GET /metrics`)
- testes automatizados iniciais para rota e motor
- documentacao de limitacoes conhecidas do MVP


### Fase 6 concluida

- sessao anonima em memoria com endpoints `/sessions`
- persistencia temporaria da selecao do modpack por sessao
- cache basico de analise por chave de entrada (TTL em memoria)
- recomendacao inicial por regras via `POST /recommendations` com explicacao objetiva por item

## 6. Relacao com o TCC

O TCC continua como etapa posterior, baseada no produto funcional, para comparar abordagem relacional e orientada a grafos com semantica equivalente.

## 7. Proximo Passo Imediato

Com a Fase 6 concluida, o proximo passo e iniciar a Fase 7 (base experimental do TCC) com foco em:

1. formalizar operacoes equivalentes de benchmark (BNX-701);
2. definir dataset experimental e criterio de amostragem (BNX-702);
3. abrir spike tecnico para variante em banco de grafos (BNX-703).

Em resumo: o produto ja cobre fluxo MVP, sessao, cache, observabilidade e recomendacao inicial; agora a prioridade e preparar metodologia experimental reproduzivel.

