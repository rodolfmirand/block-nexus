# API do MVP

## 1. Objetivo

Este documento define o contrato HTTP inicial da API do BlockNexus para busca e analise de compatibilidade.

## 2. Endpoints

- `GET /health`
- `GET /mods/search`
- `GET /metrics`
- `POST /sessions`
- `GET /sessions/:sessionId`
- `PUT /sessions/:sessionId/selection`
- `POST /sessions/:sessionId/analyze`
- `POST /analyze`
- `POST /recommendations`

## 3. GET /mods/search

### Query params

- `q` (opcional): termo geral para slug ou nome
- `name` (opcional): filtro por nome
- `slug` (opcional): filtro por slug
- `limit` (opcional): limite de resultados (1-100, default 20)

Regra: deve existir ao menos um filtro entre `q`, `name` ou `slug`.

### Exemplo

```bash
curl "http://localhost:3000/mods/search?q=sodium&limit=10"
```

### Response 200

```json
{
  "total": 1,
  "items": [
    {
      "id": "42",
      "slug": "sodium",
      "title": "Sodium",
      "summary": "..."
    }
  ]
}
```

### Response 400

```json
{
  "error": "Invalid query.",
  "details": ["At least one filter is required: q, name or slug."]
}
```

## 4. GET /metrics

Retorna metricas basicas por rota (latencia media, maximo e taxa de erro) na instancia atual.

## 5. Sessao anonima

Fluxo minimo de sessao (com `inputMode` explicito):
1. `POST /sessions` cria sessao anonima.
2. `PUT /sessions/:sessionId/selection` salva loader, versao e selecao.
3. `POST /sessions/:sessionId/analyze` executa analise usando selecao salva.
4. `GET /sessions/:sessionId` consulta estado e ultimo resultado.

## 6. POST /analyze

### Request (fluxo MVP recomendado)

```json
{
  "loader": "forge",
  "minecraftVersion": "1.20.1",
  "selectedMods": [
    { "modSlug": "create" },
    { "modSlug": "travelersbackpack" }
  ]
}
```

### Request (modo legado/debug)

```json
{
  "loader": "fabric",
  "minecraftVersion": "1.21.1",
  "selectedModVersionIds": ["101", "103"]
}
```

### Regras de validacao

- `loader`: string obrigatoria e nao vazia.
- `minecraftVersion`: string obrigatoria e nao vazia.
- `inputMode` e obrigatorio: `mods` ou `version_ids`.
- quando `inputMode = mods`: envie apenas `selectedMods`.
- quando `inputMode = version_ids`: envie apenas `selectedModVersionIds`.
  - `selectedMods`: array com itens contendo `modId` numerico e/ou `modSlug`
  - `selectedModVersionIds`: array com IDs numericos de `mod_versions`

### Response 200

Retorna `compatible` ou `incompatible` com detalhes da analise.

### Response 400

Payload invalido ou JSON invalido.

### Response 503

Banco indisponivel.

### Response 500

Falha interna do motor.


## 7. POST /recommendations

Gera recomendacoes iniciais por regra explicita do catalogo:

- prioriza dependencias `optional` declaradas pelos mods selecionados;
- se nao houver opcionais, faz fallback para dependencias `required`;
- exclui mods ja selecionados pelo usuario;
- retorna motivo de cada recomendacao.

### Request

```json
{
  "loader": "forge",
  "minecraftVersion": "1.21.1",
  "selectedMods": [
    { "modSlug": "create" },
    { "modSlug": "travelersbackpack" }
  ],
  "limit": 10
}
```

### Response 200

```json
{
  "status": "compatible",
  "loader": "forge",
  "minecraftVersion": "1.21.1",
  "requestedMods": [
    { "modSlug": "create" },
    { "modSlug": "travelersbackpack" }
  ],
  "recommendations": [
    {
      "modId": "27",
      "modSlug": "jei",
      "modVersionId": "9808",
      "versionNumber": "19.27.0.340",
      "score": 1,
      "reasons": [
        {
          "dependencyId": "37803",
          "dependencyKind": "optional",
          "sourceModSlug": "travelersbackpack",
          "sourceModVersionId": "41613",
          "message": "jei is a optional dependency declared by travelersbackpack."
        }
      ]
    }
  ],
  "issues": [],
  "missingDependencies": [],
  "meta": {
    "strategy": "optional_first_then_required",
    "usedDependencyKind": "optional",
    "totalRecommendations": 1,
    "limitApplied": 10
  }
}
```
## 8. Swagger / OpenAPI

- UI: `/docs`
- Documento OpenAPI JSON: `/openapi.json`

## 9. Observacoes

- `POST /analyze` e `POST /recommendations` retornam `200` quando a analise e executada, mesmo se o resultado de negocio for `incompatible`.
- Incompatibilidade e resultado de dominio, nao erro de infraestrutura.
- No fluxo MVP, as versoes sao resolvidas automaticamente a partir de `selectedMods`, `loader` e `minecraftVersion`.




## 10. TTL e limpeza

- `ANALYSIS_CACHE_TTL_MS`: tempo de vida do cache de analise (ms).
- `ANALYSIS_CACHE_MAX_ENTRIES`: limite maximo de entradas em cache.
- `SESSION_TTL_MS`: tempo de vida da sessao anonima (ms).
- `SESSION_MAX_ENTRIES`: limite maximo de sessoes em memoria.
- `CLEANUP_INTERVAL_MS`: intervalo de limpeza periodica de sessoes/cache (ms).



- O endpoint `/metrics` inclui bloco `analyze` com contadores de requests, cache hit/miss e falhas por motivo (validacao, banco, interno).



