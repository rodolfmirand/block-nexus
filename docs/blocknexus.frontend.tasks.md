# Tarefas Técnicas Frontend: BlockNexus

## Convenções

- **Tipo:** Epic, Story, Task
- **Status:** Todo, Doing, Done, Blocked
- **Dependência:** item anterior necessário

---

## Epic FE-0. Fundação Frontend

### FE-000

- **Tipo:** Epic
- **Título:** Estruturar frontend web do BlockNexus
- **Status:** Done
- **Objetivo:** criar base técnica para evolução incremental da UI

### FE-001

- **Tipo:** Task
- **Título:** Bootstrap React + TypeScript + Vite
- **Status:** Done
- **Dependência:** FE-000
- **Critério de aceite:** app roda localmente com `npm run dev`

### FE-002

- **Tipo:** Task
- **Título:** Configurar lint, format e testes base
- **Status:** Done
- **Dependência:** FE-001
- **Critério de aceite:** scripts de qualidade executam sem erro

### FE-003

- **Tipo:** Task
- **Título:** Definir estrutura de pastas por feature
- **Status:** Done
- **Dependência:** FE-001
- **Critério de aceite:** estrutura separa `features`, `shared` e `app`

---

## Epic FE-1. Integração com API

### FE-100

- **Tipo:** Epic
- **Título:** Criar camada de integração frontend-backend
- **Status:** Done
- **Objetivo:** consumir API com contratos tipados e erro previsível

### FE-101

- **Tipo:** Task
- **Título:** Implementar cliente HTTP tipado e config de ambiente
- **Status:** Done
- **Dependência:** FE-003
- **Critério de aceite:** `VITE_API_BASE_URL` configurado e cliente reutilizável pronto

### FE-102

- **Tipo:** Task
- **Título:** Modelar tipos de contrato para `/mods/search`, `/analyze`, `/recommendations`, `/sessions`
- **Status:** Done
- **Dependência:** FE-101
- **Critério de aceite:** tipos cobrem request/response e erros previstos

### FE-103

- **Tipo:** Task
- **Título:** Implementar tratamento padrão de erros de API
- **Status:** Done
- **Dependência:** FE-102
- **Critério de aceite:** erros `400/503/500` exibidos de forma consistente

---

## Epic FE-2. Fluxo Principal do MVP

### FE-200

- **Tipo:** Epic
- **Título:** Implementar fluxo de selecao e analise de compatibilidade
- **Status:** Done
- **Objetivo:** entregar jornada ponta a ponta para o usuario

### FE-201

- **Tipo:** Task
- **Título:** Criar tela de busca e adicao de mods na selecao
- **Status:** Done
- **Dependência:** FE-103
- **Critério de aceite:** usuario pesquisa mod e adiciona/remove itens da lista

### FE-202

- **Tipo:** Task
- **Título:** Implementar estado de ambiente (`loader`, `minecraftVersion`) e validacao local
- **Status:** Done
- **Dependência:** FE-201
- **Critério de aceite:** formulario impede envio com campos invalidos

### FE-203

- **Tipo:** Task
- **Título:** Integrar sessao anonima (`POST /sessions`, `PUT /sessions/:id/selection`)
- **Status:** Done
- **Dependência:** FE-202
- **Critério de aceite:** selecao fica persistida por `sessionId` no cliente

### FE-204

- **Tipo:** Task
- **Título:** Integrar analise por sessao (`POST /sessions/:id/analyze`)
- **Status:** Done
- **Dependência:** FE-203
- **Critério de aceite:** usuario executa analise e recebe resultado completo

### FE-205

- **Tipo:** Task
- **Título:** Renderizar resultado de analise com secoes claras
- **Status:** Done
- **Dependência:** FE-204
- **Critério de aceite:** UI exibe `resolvedSelections`, dependencias, faltas e `issues`

---

## Epic FE-3. Recomendação e UX

### FE-300

- **Tipo:** Epic
- **Título:** Evoluir experiência com recomendacoes e historico
- **Status:** Done
- **Objetivo:** aumentar valor de uso do frontend

### FE-301

- **Tipo:** Task
- **Título:** Integrar `POST /recommendations` e exibir motivos por sugestao
- **Status:** Done
- **Dependência:** FE-205
- **Critério de aceite:** usuario visualiza sugestoes com justificativa objetiva

### FE-302

- **Tipo:** Task
- **Título:** Exibir historico basico da sessao (`GET /sessions/:id`)
- **Status:** Done
- **Dependência:** FE-204
- **Critério de aceite:** ultima analise e selecao podem ser revisitadas

---

## Epic FE-4. Qualidade e Deploy

### FE-400

- **Tipo:** Epic
- **Título:** Estabilizar frontend para uso e estudos em AWS
- **Status:** Todo
- **Objetivo:** garantir qualidade minima e preparo para deploy economico

### FE-401

- **Tipo:** Task
- **Título:** Implementar testes de fluxo critico frontend
- **Status:** Todo
- **Dependência:** FE-301
- **Critério de aceite:** fluxo busca->selecao->analise passa em testes automatizados

### FE-402

- **Tipo:** Task
- **Título:** Revisar acessibilidade basica e estados de carregamento/erro
- **Status:** Todo
- **Dependência:** FE-301
- **Critério de aceite:** UI possui feedback claro em sucesso, erro e vazio

### FE-403

- **Tipo:** Task
- **Título:** Preparar build e checklist de deploy frontend em AWS com baixo custo
- **Status:** Todo
- **Dependência:** FE-402
- **Critério de aceite:** build de producao validado e checklist de deploy concluido
