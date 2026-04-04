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
- endpoints atuais: `GET /health`, `GET /mods/search`, `POST /analyze`, `GET /docs`

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

### Fase 4 em andamento

- contrato HTTP de `POST /analyze`
- validacao de payload
- integracao da rota com o motor
- documentacao Swagger inicial
- pendencia: fluxo do MVP ainda precisa ser orientado a `selectedMods` (nao apenas `selectedModVersionIds`)

## 6. Relacao com o TCC

O TCC continua como etapa posterior, baseada no produto funcional, para comparar abordagem relacional e orientada a grafos com semantica equivalente.

## 7. Proximo Passo Imediato

Antes da Fase 5, o proximo passo e concluir a **Fase 4** no contrato correto do MVP, com foco em:

1. buscar versoes candidatas por mod para `loader` e `minecraftVersion`;
2. selecionar combinacao compativel entre os mods escolhidos;
3. retornar versoes resolvidas + dependencias na resposta do `POST /analyze`;
4. atualizar Swagger com exemplos desse fluxo.

Em resumo: a infraestrutura base esta pronta; agora a prioridade e fechar o fluxo funcional minimo do produto.
