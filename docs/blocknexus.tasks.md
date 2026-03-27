# Tarefas Técnicas: BlockNexus

Este documento transforma o roadmap do projeto em um backlog técnico executável.

## Convenções

- **Tipo:** Epic, Story, Task ou Spike
- **Status:** Todo, Doing, Done, Blocked
- **Dependência:** item que precisa existir antes

---

## Epic 0. Fundação do Projeto

### BNX-000

- **Tipo:** Epic
- **Título:** Estruturar a base técnica do backend
- **Status:** Done
- **Objetivo:** preparar o repositório para desenvolvimento incremental do produto

### BNX-001

- **Tipo:** Task
- **Título:** Criar `package.json` com scripts de desenvolvimento
- **Status:** Done
- **Dependência:** BNX-000
- **Critério de aceite:** o projeto possui scripts para `dev`, `build`, `start`, `lint`, `typecheck` e `format`

### BNX-002

- **Tipo:** Task
- **Título:** Configurar TypeScript para desenvolvimento backend
- **Status:** Done
- **Dependência:** BNX-001
- **Critério de aceite:** o projeto compila para `dist/` e possui verificação de tipos isolada

### BNX-003

- **Tipo:** Task
- **Título:** Configurar Hono como servidor HTTP inicial
- **Status:** Done
- **Dependência:** BNX-001
- **Critério de aceite:** existe uma aplicação Hono executável localmente

### BNX-004

- **Tipo:** Task
- **Título:** Definir estrutura inicial de pastas do backend
- **Status:** Done
- **Dependência:** BNX-001
- **Critério de aceite:** diretórios base criados para `src`, `routes`, `lib`, `modules` e `types`

### BNX-005

- **Tipo:** Task
- **Título:** Criar endpoint `GET /health`
- **Status:** Done
- **Dependência:** BNX-003
- **Critério de aceite:** a API responde status `200` com payload simples e previsível

### BNX-006

- **Tipo:** Task
- **Título:** Configurar lint e formatação
- **Status:** Done
- **Dependência:** BNX-001
- **Critério de aceite:** o repositório possui configuração funcional de ESLint e Prettier

### BNX-007

- **Tipo:** Task
- **Título:** Criar `.env.example` e convenções de ambiente
- **Status:** Done
- **Dependência:** BNX-001
- **Critério de aceite:** variáveis essenciais estão documentadas e o projeto possui defaults seguros para desenvolvimento

### BNX-008

- **Tipo:** Task
- **Título:** Atualizar `README.md` com instruções operacionais
- **Status:** Done
- **Dependência:** BNX-001
- **Critério de aceite:** um novo colaborador consegue instalar, rodar e entender a estrutura inicial do projeto

### BNX-009

- **Tipo:** Task
- **Título:** Criar documento de arquitetura inicial
- **Status:** Done
- **Dependência:** BNX-000
- **Critério de aceite:** a arquitetura inicial descreve responsabilidade das camadas, direção técnica e próximos módulos

### BNX-010

- **Tipo:** Task
- **Título:** Validar bootstrap local do projeto
- **Status:** Done
- **Dependência:** BNX-002
- **Critério de aceite:** `build`, `lint` e `typecheck` executam com sucesso

---

## Epic 1. Descoberta e Ingestão de Dados

### BNX-100

- **Tipo:** Epic
- **Título:** Definir a base de dados de mods do produto
- **Status:** Done
- **Objetivo:** garantir uma fonte de dados utilizável para o domínio de compatibilidade

### BNX-101

- **Tipo:** Spike
- **Título:** Avaliar fontes de dados para mods e metadados
- **Status:** Done
- **Dependência:** BNX-000
- **Critério de aceite:** documento comparando fontes, cobertura de dados, limitações e recomendação final

### BNX-102

- **Tipo:** Task
- **Título:** Definir o contrato canônico de ingestão
- **Status:** Done
- **Dependência:** BNX-101
- **Critério de aceite:** existe um esquema interno para normalizar dados externos

### BNX-103

- **Tipo:** Task
- **Título:** Implementar pipeline inicial de ingestão
- **Status:** Done
- **Dependência:** BNX-102
- **Critério de aceite:** o projeto consegue importar um conjunto inicial de mods para persistência local

### BNX-104

- **Tipo:** Task
- **Título:** Definir estratégia de atualização do catálogo
- **Status:** Done
- **Dependência:** BNX-103
- **Critério de aceite:** o projeto possui política documentada de refresh, versionamento ou snapshot

---

## Epic 2. Modelagem do Domínio

### BNX-200

- **Tipo:** Epic
- **Título:** Formalizar o domínio de compatibilidade de mods
- **Status:** Done
- **Objetivo:** traduzir o problema do produto em entidades e regras explícitas

### BNX-201

- **Tipo:** Task
- **Título:** Definir entidades centrais do domínio
- **Status:** Done
- **Dependência:** BNX-101
- **Critério de aceite:** `Mod`, `ModVersion`, `Dependency`, `Conflict`, `LoaderSupport` e `MinecraftVersionSupport` estão documentados

### BNX-202

- **Tipo:** Task
- **Título:** Definir regras de resolução de dependências
- **Status:** Done
- **Dependência:** BNX-201
- **Critério de aceite:** regras para dependência obrigatória, opcional, transitiva e ciclos estão descritas

### BNX-203

- **Tipo:** Task
- **Título:** Definir regras de conflito e incompatibilidade
- **Status:** Done
- **Dependência:** BNX-201
- **Critério de aceite:** conflitos explícitos, incompatibilidades por loader e por versão têm semântica clara

### BNX-204

- **Tipo:** Task
- **Título:** Modelar esquema relacional inicial em PostgreSQL
- **Status:** Done
- **Dependência:** BNX-201
- **Critério de aceite:** existe um esquema inicial coerente com o domínio definido

---

## Epic 3. Motor de Análise

### BNX-300

- **Tipo:** Epic
- **Título:** Implementar o núcleo de análise de compatibilidade
- **Status:** Done
- **Objetivo:** produzir resultados confiáveis a partir de uma seleção de mods

### BNX-301

- **Tipo:** Task
- **Título:** Implementar resolução de dependências transitivas
- **Status:** Done
- **Dependência:** BNX-202
- **Critério de aceite:** o serviço resolve dependências a partir de uma entrada mínima e registra justificativas básicas

### BNX-302

- **Tipo:** Task
- **Título:** Implementar detecção de conflitos
- **Status:** Done
- **Dependência:** BNX-203
- **Critério de aceite:** o serviço identifica conflitos explícitos no conjunto analisado

### BNX-303

- **Tipo:** Task
- **Título:** Implementar validação por versão do Minecraft e loader
- **Status:** Done
- **Dependência:** BNX-203
- **Critério de aceite:** a análise sinaliza incompatibilidades de ambiente com mensagens compreensíveis

### BNX-304

- **Tipo:** Task
- **Título:** Definir contrato de resposta do motor de análise
- **Status:** Done
- **Dependência:** BNX-301
- **Critério de aceite:** a saída do motor possui estrutura estável para dependências, conflitos e avisos

---

## Epic 4. API do MVP

### BNX-400

- **Tipo:** Epic
- **Título:** Expor o fluxo principal do produto via API
- **Status:** Todo
- **Objetivo:** tornar o motor de análise consumível por clientes externos

### BNX-401

- **Tipo:** Task
- **Título:** Criar contrato HTTP do endpoint `POST /analyze`
- **Status:** Todo
- **Dependência:** BNX-304
- **Critério de aceite:** payload de entrada e resposta estão definidos e documentados

### BNX-402

- **Tipo:** Task
- **Título:** Implementar validação de entrada do endpoint `POST /analyze`
- **Status:** Todo
- **Dependência:** BNX-401
- **Critério de aceite:** requisições inválidas recebem erro consistente e previsível

### BNX-403

- **Tipo:** Task
- **Título:** Integrar endpoint `POST /analyze` ao motor de análise
- **Status:** Todo
- **Dependência:** BNX-401
- **Critério de aceite:** a API executa análise ponta a ponta com resultado serializável

### BNX-404

- **Tipo:** Task
- **Título:** Documentar a API inicial
- **Status:** Todo
- **Dependência:** BNX-403
- **Critério de aceite:** o projeto possui exemplos reais de request e response para integração

---

## Epic 5. Qualidade e Observabilidade

### BNX-500

- **Tipo:** Epic
- **Título:** Dar previsibilidade técnica ao MVP
- **Status:** Todo
- **Objetivo:** garantir qualidade mínima antes da evolução do produto

### BNX-501

- **Tipo:** Task
- **Título:** Adicionar logs estruturados ao fluxo da API
- **Status:** Todo
- **Dependência:** BNX-403
- **Critério de aceite:** cada requisição relevante registra informações úteis para diagnóstico

### BNX-502

- **Tipo:** Task
- **Título:** Medir latência e taxa de erro do fluxo de análise
- **Status:** Todo
- **Dependência:** BNX-403
- **Critério de aceite:** o projeto registra pelo menos latência total e falhas por rota

### BNX-503

- **Tipo:** Task
- **Título:** Criar testes para casos principais de análise
- **Status:** Todo
- **Dependência:** BNX-403
- **Critério de aceite:** cenários centrais de sucesso e falha estão cobertos

### BNX-504

- **Tipo:** Task
- **Título:** Documentar limitações conhecidas do MVP
- **Status:** Todo
- **Dependência:** BNX-403
- **Critério de aceite:** o projeto lista lacunas do modelo, limitações da fonte de dados e tradeoffs assumidos

---

## Epic 6. Evolução de Produto

### BNX-600

- **Tipo:** Epic
- **Título:** Melhorar a experiência do usuário após estabilização do núcleo
- **Status:** Todo
- **Objetivo:** adicionar persistência de uso, eficiência e recursos complementares

### BNX-601

- **Tipo:** Story
- **Título:** Adicionar sessão anônima para persistência temporária do modpack
- **Status:** Todo
- **Dependência:** BNX-400
- **Critério de aceite:** o usuário consegue retomar uma análise em andamento sem sistema de contas

### BNX-602

- **Tipo:** Story
- **Título:** Adicionar cache para resultados repetidos
- **Status:** Todo
- **Dependência:** BNX-500
- **Critério de aceite:** consultas idênticas têm estratégia clara de reaproveitamento

### BNX-603

- **Tipo:** Story
- **Título:** Implementar recomendação inicial de mods baseada em regras
- **Status:** Todo
- **Dependência:** BNX-500
- **Critério de aceite:** recomendações simples são retornadas com explicação objetiva

---

## Epic 7. Base Experimental do TCC

### BNX-700

- **Tipo:** Epic
- **Título:** Preparar a comparação acadêmica entre SQL e grafo
- **Status:** Todo
- **Objetivo:** transformar o produto funcional em base empírica para o TCC

### BNX-701

- **Tipo:** Task
- **Título:** Formalizar as operações centrais do benchmark
- **Status:** Todo
- **Dependência:** BNX-500
- **Critério de aceite:** as queries comparadas estão definidas com entrada, saída e semântica equivalentes

### BNX-702

- **Tipo:** Task
- **Título:** Definir dataset experimental
- **Status:** Todo
- **Dependência:** BNX-701
- **Critério de aceite:** volume, profundidade, densidade e critérios de seleção dos dados estão documentados

### BNX-703

- **Tipo:** Task
- **Título:** Implementar variante em banco de grafos para o experimento
- **Status:** Todo
- **Dependência:** BNX-702
- **Critério de aceite:** existe uma segunda implementação semanticamente equivalente à baseline relacional

### BNX-704

- **Tipo:** Task
- **Título:** Criar suíte de benchmark reproduzível
- **Status:** Todo
- **Dependência:** BNX-703
- **Critério de aceite:** benchmarks podem ser executados de forma repetível com coleta de métricas

---

## Sprint Atual Recomendada

Os itens que devem receber foco imediato agora sao:

- BNX-401
- BNX-402
- BNX-403
- BNX-404
- BNX-503
