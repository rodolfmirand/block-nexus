# Arquitetura Inicial: BlockNexus

## 1. Objetivo

Este documento descreve a arquitetura inicial do BlockNexus para a Fase 0 e prepara a base para o MVP do produto.

O foco desta arquitetura é:

- simplicidade de desenvolvimento;
- clareza de domínio;
- separação básica de responsabilidades;
- evolução segura para as próximas fases.

---

## 2. Direção Arquitetural

Na fase inicial, o BlockNexus será um backend em `TypeScript` com `Hono`, executando localmente em `Node.js`.

O projeto não será estruturado desde o início como uma plataforma AWS completa. A arquitetura local será simples e orientada a camadas, permitindo posterior adaptação para ambiente serverless.

### Direção atual

- runtime local: Node.js
- framework HTTP: Hono
- persistência inicial planejada: PostgreSQL
- prioridade funcional: `GET /health` e base para `POST /analyze`

### Direção futura

- adaptação para AWS Lambda e API Gateway
- uso de PostgreSQL gerenciado
- eventual variante em banco de grafos para o TCC
- possíveis componentes de cache e sessão depois do MVP

---

## 3. Estrutura Inicial de Pastas

```text
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

### Responsabilidades

- `src/index.ts`
  ponto de entrada do servidor local

- `src/app.ts`
  composição principal da aplicação Hono e registro de rotas

- `src/routes/`
  rotas HTTP agrupadas por responsabilidade

- `src/lib/`
  utilitários compartilhados e leitura de configuração

- `src/modules/`
  módulos de domínio e aplicação que surgirão nas próximas fases

- `src/types/`
  tipos compartilhados do projeto quando necessários

---

## 4. Princípios de Organização do Código

As próximas implementações devem seguir estes princípios:

- regra de domínio fora da camada HTTP;
- validação de entrada próxima da borda da aplicação;
- dependências de infraestrutura isoladas do núcleo de análise;
- contratos de resposta estáveis e explícitos;
- evolução incremental por módulos.

---

## 5. Sequência de Evolução

### Fase 0

- bootstrap do projeto
- `GET /health`
- configuração de ambiente
- documentação operacional

### Fase 1

- definição da fonte de dados
- ingestão inicial
- normalização do catálogo de mods

### Fase 2

- modelagem do domínio
- esquema relacional inicial

### Fase 3

- implementação do motor de análise

### Fase 4

- criação do endpoint `POST /analyze`

---

## 6. Observações Importantes

- o projeto ainda não deve assumir Redis como dependência obrigatória;
- o projeto ainda não deve assumir autenticação como eixo principal;
- o projeto ainda não deve ser desenhado em função do experimento acadêmico;
- a primeira meta concreta é tornar o backend executável, organizado e pronto para crescer.
