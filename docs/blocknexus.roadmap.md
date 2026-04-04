# Roadmap do Projeto: BlockNexus

## 1. Objetivo do Roadmap

Este roadmap organiza o desenvolvimento do **BlockNexus** em duas grandes etapas:

1. **Construir um produto utilizável**, com valor real para usuários que montam modpacks de Minecraft.
2. **Usar o produto como base para o TCC**, com instrumentação, modelagem comparativa e metodologia experimental sólida.

A decisão central deste roadmap é simples:

**o projeto deve começar como produto e só depois evoluir para experimento acadêmico**.

Isso evita antecipar complexidade de infraestrutura, reduz risco de arquitetura prematura e cria uma base funcional real para o TCC.

---

## 2. Princípios de Execução

Durante o desenvolvimento, as decisões devem seguir estes princípios:

- **Produto antes de pesquisa**: primeiro resolver um problema real de usuário.
- **Vertical slice antes de plataforma**: entregar uma funcionalidade ponta a ponta antes de expandir arquitetura.
- **Simplicidade antes de escala**: começar com menos componentes e só adicionar complexidade quando houver necessidade comprovada.
- **SQL antes de grafo**: usar PostgreSQL na primeira versão para acelerar entrega e reduzir custo cognitivo.
- **Medição desde cedo**: mesmo antes do TCC, estruturar logs, métricas e dados que depois possam apoiar a pesquisa.
- **Fonte de dados é prioridade**: sem dados confiáveis sobre mods, não existe produto utilizável nem experimento válido.

---

## 3. Visão de Produto

O primeiro objetivo do BlockNexus é ser uma API capaz de:

- receber uma lista de mods selecionados pelo usuario;
- considerar versão do Minecraft e loader;
- encontrar versoes compativeis entre os mods selecionados;
- resolver dependencias faltantes;
- apontar conflitos conhecidos;
- identificar incompatibilidades de versao;
- retornar uma análise clara e utilizável.

### Fluxo minimo do MVP (alvo de produto)

1. usuario define `loader` e `minecraftVersion`;
2. usuario pesquisa mod por nome/slug;
3. usuario adiciona mods em uma lista de selecao;
4. API resolve quais versoes de cada mod sao compativeis com o ambiente definido;
5. API retorna dependencias necessarias e versoes selecionadas;
6. API retorna incompatibilidades quando nao houver conjunto viavel.

### Escopo do primeiro produto utilizável

O MVP não precisa resolver todos os problemas do ecossistema de mods. Ele precisa resolver bem um caso central:

**analisar a compatibilidade de uma seleção de mods para um modpack específico**.

### Fora do escopo do MVP

Estes itens são importantes, mas não devem vir antes da validação do núcleo do produto:

- autenticação sofisticada;
- contas de usuário;
- sistema completo de recomendação;
- comparação entre bancos para fins acadêmicos;
- infraestrutura multi-ambiente complexa;
- uso de Neptune logo no início;
- dashboards analíticos avançados.

---

## 4. Sequência Estratégica de Desenvolvimento

O desenvolvimento deve seguir esta ordem:

1. **Descobrir e estruturar os dados**
2. **Modelar o domínio**
3. **Construir o motor básico de análise**
4. **Expor a API do MVP**
5. **Validar o produto com casos reais**
6. **Evoluir observabilidade, performance e UX de integração**
7. **Preparar a base experimental para o TCC**
8. **Executar a comparação entre SQL e grafo**

Essa ordem é importante porque:

- o dado vem antes da regra;
- a regra vem antes da API;
- a API vem antes da otimização;
- o produto vem antes do experimento.

---

## 5. Roadmap por Fases

### Fase 0. Alinhamento e Setup Inicial

### Objetivo

Criar a base mínima do repositório e registrar decisões iniciais para permitir execução contínua.

### Entregáveis

- bootstrap do projeto com `TypeScript` e `Hono`;
- estrutura inicial de pastas;
- `package.json`;
- configuração de lint e formatação;
- configuração básica de ambiente;
- `README.md` inicial com visão do projeto e instruções de execução;
- documento de arquitetura inicial;
- definição dos ambientes locais e variáveis essenciais.

### Decisões recomendadas

- linguagem: `TypeScript`;
- framework: `Hono`;
- banco inicial: `PostgreSQL`;
- ORM ou query builder: escolher um e manter consistência;
- execução local simples, sem dependências excessivas.

### Critério de saída

A fase termina quando o projeto roda localmente com um endpoint de health check e o repositório já suporta desenvolvimento incremental.

### Riscos

- gastar tempo demais em tooling;
- antecipar IaC e AWS antes de existir uma feature central.

---

### Fase 1. Descoberta e Ingestão de Dados

### Objetivo

Definir de onde vêm os dados dos mods e como eles serão transformados em um modelo canônico interno.

### Perguntas que precisam ser respondidas

- Qual será a fonte primária de dados?
- Existe API pública confiável?
- Os dados incluem dependências, conflitos, loaders e versões de Minecraft?
- Como lidar com dados incompletos ou inconsistentes?
- Como versionar snapshots do catálogo de mods?

### Entregáveis

- escolha da fonte de dados principal;
- documento de contrato dos dados recebidos;
- script ou pipeline de ingestão inicial;
- processo de normalização dos dados;
- definição de identificadores internos estáveis;
- dataset inicial persistido no banco;
- estratégia para atualização periódica do catálogo.

### Modelo mínimo esperado dos dados

- `Mod`
- `ModVersion`
- `Dependency`
- `Conflict`
- `LoaderSupport`
- `MinecraftVersionSupport`

### Critério de saída

A fase termina quando existe um conjunto inicial de mods e versões persistido localmente com qualidade suficiente para alimentar o motor de análise.

### Riscos

- descobrir tarde que a fonte de dados não entrega conflitos;
- depender de scraping frágil;
- misturar identificadores externos sem normalização.

---

### Fase 2. Modelagem do Domínio

### Objetivo

Transformar o problema do produto em entidades e regras claras, independentes do banco e da interface.

### Entregáveis

- modelo de domínio documentado;
- esquema relacional inicial;
- definição das regras de compatibilidade;
- definição de semântica para dependência obrigatória;
- definição de semântica para dependência opcional;
- definição de semântica para conflito explícito;
- definição de semântica para incompatibilidade por versão;
- definição de semântica para compatibilidade por loader;
- definição de semântica para compatibilidade por versão do Minecraft;
- definição de semântica para detecção de ciclos.

### Regras que devem ser documentadas

- o que significa “mod compatível”;
- quando uma dependência é considerada resolvida;
- como escolher uma versão quando há múltiplas possibilidades;
- como tratar ambiguidades ou ausência de metadados;
- como o sistema responde a ciclos e grafos inconsistentes.

### Critério de saída

A fase termina quando qualquer pessoa consegue entender e implementar a regra de negócio sem depender de interpretação informal.

### Riscos

- começar a programar sem fechar semântica;
- misturar regra de domínio com detalhe de banco;
- acoplar a API cedo demais ao formato da fonte externa.

---

### Fase 3. Motor de Análise do MVP

### Objetivo

Construir o núcleo do produto: um serviço capaz de analisar uma seleção de mods e produzir um resultado confiável.

### Escopo funcional

Entrada esperada:

- `minecraftVersion`
- `loader`
- lista de mods (ids internos ou slugs)

Saída esperada:

- versoes selecionadas por mod com justificativa basica;
- dependências faltantes;
- dependências resolvidas;
- conflitos encontrados;
- incompatibilidades de versão;
- avisos relevantes;
- resumo final do status da análise.

### Entregáveis

- algoritmo de selecao de versao por mod, restrito a loader e minecraftVersion;
- serviço de resolução de dependências;
- serviço de verificação de conflitos;
- algoritmo de detecção de inconsistências;
- estrutura padronizada de resposta;
- testes unitários e testes de integração do motor.

### Critério de saída

A fase termina quando o sistema consegue processar casos reais e retornar resultados consistentes para um conjunto inicial de cenários de teste.

### Riscos

- tentar resolver recomendação junto com compatibilidade;
- criar um algoritmo difícil de testar;
- não registrar claramente por que cada conflito foi sinalizado.

---

### Fase 4. API do MVP

### Objetivo

Expor o motor de análise por meio de uma API simples, estável e utilizável.

### Endpoint inicial recomendado

`POST /analyze`

### Exemplo de responsabilidades do endpoint

- validar payload;
- normalizar entrada;
- chamar o motor de análise;
- retornar resposta estruturada;
- registrar métricas básicas;
- tratar erros previsíveis com contrato consistente.

### Endpoints adicionais opcionais

- `GET /health`
- `GET /mods/search`
- `GET /mods/:id`

### Contrato alvo do endpoint de analise

Entrada recomendada:

- `minecraftVersion`
- `loader`
- `selectedMods` (lista por `modId` e/ou `modSlug`)

Comportamento esperado:

- buscar versoes candidatas de cada mod no catalogo;
- cruzar compatibilidade entre os mods selecionados;
- escolher um conjunto viavel de versoes quando existir;
- retornar falha explicita quando nao existir conjunto viavel.

### Entregáveis

- contrato OpenAPI ou documentação equivalente;
- validação de payload;
- tratamento de erros;
- padronização de respostas;
- testes de contrato;
- exemplos de requisição e resposta.

### Critério de saída

A fase termina quando um consumidor externo consegue integrar com a API e obter análise funcional ponta a ponta.

### Riscos

- começar por sessão/autenticação antes de entregar análise real;
- expor contratos instáveis cedo demais;
- devolver respostas difíceis de consumir.

---

### Fase 5. Qualidade, Observabilidade e Casos Reais

### Objetivo

Preparar o MVP para uso prático e avaliar se ele resolve o problema com qualidade suficiente.

### Entregáveis

- logs estruturados;
- métricas básicas de latência e erro;
- rastreio mínimo das etapas da análise;
- conjunto de cenários reais de validação;
- massa de testes mais rica;
- documentação de limitações conhecidas;
- estratégia de versionamento da API.

### Métricas de produto recomendadas

- tempo médio da análise;
- percentual de análises bem-sucedidas;
- número médio de dependências resolvidas por requisição;
- número de falsos positivos e falsos negativos encontrados nos testes manuais;
- qualidade percebida da resposta.

### Critério de saída

A fase termina quando o MVP já é tecnicamente utilizável e os principais erros de domínio estão sob controle.

### Riscos

- focar só em código e ignorar qualidade da resposta;
- não registrar evidências para refinamento posterior;
- não capturar causas de falha do algoritmo.

---

### Fase 6. Sessões, Persistência de Uso e Evoluções de Produto

### Objetivo

Adicionar recursos que melhoram a experiência do usuário sem desviar do núcleo do sistema.

### Itens possíveis nesta fase

- sessão anônima;
- persistência temporária do modpack em construção;
- cache de resultados frequentes;
- histórico de análises;
- favoritos ou listas salvas;
- resposta incremental ou assíncrona para análises longas.

### Observação importante

Esta fase só deve começar depois que o endpoint de análise central estiver funcionando bem. Sessão não é a primeira feature de valor do BlockNexus.

### Critério de saída

A fase termina quando a experiência de uso melhora sem aumentar desnecessariamente a complexidade operacional.

---

### Fase 7. Recomendação de Mods

### Objetivo

Expandir o produto além da análise de compatibilidade, adicionando sugestão de mods complementares.

### Estratégia recomendada

Começar por recomendação simples baseada em regras, não por algoritmos sofisticados.

### Exemplos de heurísticas iniciais

- mods frequentemente usados juntos;
- complementos por categoria;
- melhorias coerentes com loader e versão;
- sugestões seguras a partir do contexto do modpack;
- exclusão automática de mods conflitantes.

### Entregáveis

- serviço de recomendação inicial;
- critérios explícitos de ranking;
- explicação do motivo de cada sugestão;
- testes com cenários controlados.

### Riscos

- transformar recomendação em caixa-preta cedo demais;
- sugerir mods sem transparência;
- contaminar o eixo do TCC com heurísticas subjetivas.

---

### Fase 8. Preparação da Base para o TCC

### Objetivo

Aproveitar o produto já funcional para estruturar o experimento acadêmico com menor risco e maior validade.

### O que deve ser preparado nesta fase

- identificação das operações centrais a comparar;
- definição formal do modelo canônico do domínio;
- definição do dataset experimental;
- instrumentação para latência, consumo e throughput;
- separação entre código de produto e código de benchmark;
- documentação das hipóteses e perguntas de pesquisa.

### Operações prioritárias para comparação

- resolução de dependências transitivas;
- detecção de conflitos;
- consultas com profundidade alta;
- consultas com filtros por loader e versão.

### Critério de saída

A fase termina quando o produto já oferece um caso real e o experimento pode ser desenhado sem depender de suposições artificiais.

---

### Fase 9. Implementação Comparativa para o TCC

### Objetivo

Criar a segunda implementação de persistência e consulta, agora com foco experimental.

### Estratégia recomendada

Usar o PostgreSQL como baseline do produto e implementar depois a variante em banco de grafos para o experimento.

### Entregáveis

- modelo em banco de grafos;
- carga equivalente de dados nos dois bancos;
- consultas semanticamente equivalentes;
- suíte de benchmark;
- automação de execução dos testes;
- relatório técnico dos resultados.

### Cuidados metodológicos

- mesma entrada;
- mesma regra de negócio;
- mesma semântica de saída;
- mesmo ambiente de teste;
- múltiplas rodadas;
- separação entre warm-up e medição;
- registro de ameaças à validade.

### Critério de saída

A fase termina quando a comparação entre os bancos é reproduzível, auditável e defensável academicamente.

---

## 6. Priorização Recomendada

### Ordem de implementação prática

1. Bootstrap do backend
2. Escolha e ingestão da fonte de dados
3. Modelo de domínio
4. PostgreSQL e esquema inicial
5. Motor de resolucao de dependencias
6. Motor de selecao de versoes compativeis entre mods
7. Endpoint `POST /analyze` orientado a selecao por mod
8. Testes e observabilidade
9. Sessão e persistência de uso
10. Recomendação
11. Base experimental do TCC
12. Variante em banco de grafos

### O que não fazer cedo demais

- começar por autenticação;
- começar por Redis sem necessidade clara;
- começar por Neptune antes de validar o núcleo do produto;
- tentar resolver produto e TCC ao mesmo tempo;
- abrir muitas frentes antes da ingestão de dados estar estável.

---

## 7. Entregáveis por Marco

### Marco 1. Projeto executando localmente

Saída mínima:

- aplicação sobe localmente;
- health check responde;
- ambiente de desenvolvimento está documentado.

### Marco 2. Catálogo básico de mods disponível

Saída mínima:

- dados de mods normalizados;
- persistência local funcionando;
- consultas básicas ao catálogo já possíveis.

### Marco 3. Primeira análise funcional

Saída mínima:

- API recebe lista de mods;
- resolve dependências;
- sinaliza conflitos relevantes.

### Marco 4. MVP utilizável

Saída mínima:

- resposta estável;
- testes essenciais cobrindo o núcleo;
- métricas e logs básicos em operação.

### Marco 5. Produto evoluído

Saída mínima:

- sessão e persistência temporária;
- melhorias de performance;
- início de recomendação.

### Marco 6. Base acadêmica pronta

Saída mínima:

- domínio estabilizado;
- queries centrais definidas;
- benchmark desenhado e instrumentado.

---

## 8. Backlog Inicial Recomendado

### Bloco A. Fundação do projeto

- criar `package.json`;
- configurar TypeScript;
- configurar Hono;
- definir estrutura de diretórios;
- criar `GET /health`;
- atualizar `README.md`.

### Bloco B. Dados

- escolher fonte primária de dados;
- mapear campos relevantes;
- criar ingestão inicial;
- normalizar entidades;
- persistir catálogo no banco.

### Bloco C. Domínio

- desenhar entidades;
- modelar dependências;
- modelar conflitos;
- modelar compatibilidade por loader e versão;
- definir regras de resolução.

### Bloco D. MVP funcional

- implementar serviço de análise;
- criar `POST /analyze`;
- padronizar resposta;
- criar testes de fluxo principal.

### Bloco E. Qualidade

- logs estruturados;
- métricas de latência;
- testes com cenários reais;
- documentação de limitações.

---

## 9. Riscos Estratégicos do Projeto

Os maiores riscos hoje são:

- **dados insuficientes**: a fonte escolhida pode não expor conflitos ou dependências com consistência;
- **escopo excessivo**: tentar entregar recomendação, sessão, benchmark e produto ao mesmo tempo;
- **arquitetura prematura**: introduzir AWS complexa antes de validar o domínio;
- **regra ambígua**: falta de definição clara do que é compatibilidade;
- **dependência de banco inadequada cedo demais**: começar pelo banco de grafos sem necessidade de produto;
- **desvio acadêmico precoce**: moldar o produto ao experimento antes de validar valor de uso.

### Estratégia de mitigação

- reduzir escopo do MVP;
- validar dados antes de modelar demais;
- manter o primeiro banco simples;
- documentar regras de domínio;
- separar backlog de produto e backlog do TCC.

---

## 10. Recomendação Final de Início

Se o objetivo é começar imediatamente com a rota mais segura, o trabalho deve iniciar neste ponto:

1. estruturar o backend em `TypeScript + Hono`;
2. escolher a fonte de dados dos mods;
3. modelar o domínio mínimo;
4. implementar `POST /analyze` com PostgreSQL.

Essa é a sequência com melhor equilíbrio entre velocidade, clareza arquitetural e utilidade real do produto.

Em resumo:

**o primeiro problema do BlockNexus não é autenticação, nem Redis, nem Neptune; é transformar dados de mods em análise de compatibilidade utilizável**.
