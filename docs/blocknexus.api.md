# API do MVP

## 1. Objetivo

Este documento define o contrato HTTP inicial da API do BlockNexus para busca e analise de compatibilidade.

## 2. Endpoints

- `GET /health`
- `GET /mods/search`
- `POST /analyze`

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

## 4. POST /analyze

### Request

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
- `selectedModVersionIds`: array obrigatoria com ao menos um ID nao vazio.
- `selectedModVersionIds`: todos os IDs devem ser numericos (`mod_versions.id`).

### Response 200

Retorna `compatible` ou `incompatible` com detalhes da analise.

### Response 400

Payload invalido ou JSON invalido.

### Response 503

Banco indisponivel.

### Response 500

Falha interna do motor.

## 5. Swagger / OpenAPI

- UI: `/docs`
- Documento OpenAPI JSON: `/openapi.json`

## 6. Observacoes

- `POST /analyze` retorna `200` quando a analise e executada, mesmo se o resultado de negocio for `incompatible`.
- Incompatibilidade e resultado de dominio, nao erro de infraestrutura.
- O contrato atual usa IDs de `mod_versions` como entrada principal.
