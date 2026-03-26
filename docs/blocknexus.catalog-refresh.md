# Estrategia de Atualizacao do Catalogo: BlockNexus

## 1. Objetivo

Este documento define como o catalogo inicial do BlockNexus deve ser atualizado durante o MVP.

O objetivo nesta etapa nao e construir sincronizacao total do ecossistema. O objetivo e ter uma politica previsivel, simples e segura para manter o catalogo utilizavel.

## 2. Principios

A estrategia de atualizacao do catalogo deve seguir estes principios:

- simplicidade operacional primeiro;
- reproducibilidade dos snapshots;
- rastreabilidade por fonte externa;
- baixo acoplamento entre ingestao e motor de analise;
- caminho claro para evolucao futura.

## 3. Estrategia Inicial do MVP

Durante o MVP, o BlockNexus adotara uma estrategia de **snapshot controlado**.

Isso significa que:

- a ingestao e executada sob demanda;
- o resultado e persistido localmente como snapshot JSON;
- o snapshot passa a ser a base de referencia para o catalogo interno;
- o refresh nao depende ainda de jobs agendados nem de sincronizacao continua.

## 4. Modos de Atualizacao

### 4.1 Bootstrap inicial

Objetivo:

- criar o primeiro conjunto de dados utilizavel para o produto.

Caracteristicas:

- executado manualmente;
- recebe uma lista explicita de slugs ou IDs do Modrinth;
- grava um snapshot local em `storage/catalog/modrinth/`;
- produz um artefato reproduzivel para inspeção e validacao.

Comando atual:

```bash
npm run catalog:ingest:modrinth -- fabric-api modmenu sodium
```

### 4.2 Refresh direcionado

Objetivo:

- atualizar um subconjunto do catalogo ja conhecido.

Caracteristicas:

- executado manualmente no MVP;
- reusa o mesmo pipeline de ingestao;
- substitui o snapshot de referencia ou gera um novo arquivo nomeado com `--output`.

Exemplo:

```bash
npm run catalog:ingest:modrinth -- sodium modmenu --output refresh-2026-03-26.json
```

## 5. Politica de Persistencia

No MVP inicial, a persistencia de catalogo funciona em duas camadas:

1. **Snapshot local JSON**
2. **Persistencia relacional futura em PostgreSQL**

O snapshot local existe para:

- validar o pipeline;
- inspecionar a normalizacao;
- servir como base de desenvolvimento do modelo relacional;
- permitir reprocessamento controlado.

A persistencia em PostgreSQL sera introduzida na fase seguinte, quando o modelo de dominio estiver estabilizado.

## 6. Politica de Versionamento dos Snapshots

Regras iniciais:

- `bootstrap.json` pode ser usado como snapshot canonico de trabalho local;
- snapshots relevantes de experimento ou validacao devem receber nome explicito com `--output`;
- todo snapshot deve conter `source` e `fetchedAt`;
- IDs externos devem ser preservados para reprocessamento e reconciliacao futura.

## 7. Cadencia de Atualizacao

Para o MVP, a cadencia recomendada e:

- refresh manual ao adicionar novos mods prioritarios ao catalogo;
- refresh manual antes de mudancas significativas no motor de analise;
- refresh manual antes de testes de regressao de compatibilidade.

Fora do MVP, a direcao recomendada e:

- refresh agendado diario ou em janelas fixas;
- refresh direcionado por projeto quando houver analise de um mod ainda nao catalogado;
- reconciliacao incremental em vez de snapshot completo sempre que o volume justificar.

## 8. Regras de Confiabilidade

A politica inicial deve obedecer estas regras:

- falha de ingestao interrompe a execucao;
- um snapshot parcial nao deve substituir silenciosamente o snapshot de referencia;
- cada projeto ingerido deve preservar `sourceProjectId`, `sourceVersionId` e metadados de ambiente;
- a normalizacao deve permanecer source-agnostic.

## 9. Riscos Assumidos

A estrategia de snapshot controlado assume alguns tradeoffs:

- o catalogo pode ficar desatualizado entre execucoes;
- ainda nao existe reconciliacao incremental automatica;
- a cobertura continua limitada ao conjunto ingerido.

Esses tradeoffs sao aceitaveis nesta etapa porque o objetivo principal ainda e amadurecer o dominio e o motor de analise.

## 10. Proximo Passo

Com a estrategia de atualizacao definida, o proximo passo tecnico e sair da ingestao e entrar na **Fase 2**, com foco em:

1. formalizar entidades centrais do dominio;
2. definir regras de dependencias e conflitos;
3. modelar o esquema relacional inicial em PostgreSQL.
