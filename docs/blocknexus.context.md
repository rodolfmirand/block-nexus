# Contexto do Projeto: BlockNexus

## 1. Visão Geral do Projeto
**BlockNexus** é uma API serverless projetada para o ecossistema de modificações (mods) do Minecraft. A aplicação atua como um analisador de compatibilidade e um motor de recomendação para modpacks.
O objetivo é receber uma lista de mods escolhida pelo usuário, resolver a árvore de dependências, identificar conflitos conhecidos e sugerir mods complementares baseados no contexto do pacote.

## 2. Foco Acadêmico (TCC em Sistemas de Informação)
O projeto servirá como base empírica para um Trabalho de Conclusão de Curso (TCC).
* **Tema da Pesquisa:** Análise comparativa de desempenho e complexidade entre Bancos de Dados Relacionais (SQL) e Bancos de Dados Orientados a Grafos (NoSQL) para resolução de dependências profundas e sistemas de recomendação.
* **Experimento:** A API testará o tempo de resposta e o custo computacional ao resolver conflitos de mods usando *JOINs recursivos* no PostgreSQL versus *Navegação de Arestas* no Amazon Neptune.

## 3. Stack de Tecnologias e Infraestrutura (AWS)
A stack foi escolhida com foco em arquitetura Cloud-Native, Serverless e mitigação de *Cold Starts*.

* **Linguagem:** TypeScript (Node.js).
* **Framework Web:** Hono (otimizado para Edge e AWS Lambda).
* **Infraestrutura como Código (IaC):** AWS CDK (Cloud Development Kit).
* **Computação e Roteamento:** AWS Lambda + Amazon API Gateway.
* **Banco de Dados (Sessão/Cache):** Redis (Upstash para dev local / Amazon ElastiCache para produção).
* **Banco de Dados (Motor de Grafos):** Amazon Neptune (consultado via Apache TinkerPop / linguagem Gremlin).
* **Banco de Dados (Baseline Relacional para o TCC):** Amazon RDS (PostgreSQL).
* **Monitoramento e Métricas:** Amazon CloudWatch (para extrair os dados de latência para o TCC).

## 4. Arquitetura de Autenticação (Stateless / Frictionless)
Para reduzir a barreira de entrada e simplificar a conformidade com a LGPD, a API não possui sistema tradicional de criação de contas de usuário.
* O fluxo é baseado em sessões temporárias e anônimas.
* **Mecanismo:** O usuário inicia a sessão, a API gera um `UUID` e assina um JWT (JSON Web Token) anônimo. O front-end armazena esse token.
* **Estado:** O "carrinho" de mods do usuário é salvo no Redis utilizando o UUID como chave, configurado com um TTL (Time-To-Live) de 24 horas para autodestruição.

## 5. Estrutura e Configuração do Repositório
* **Licença:** MIT License (permissiva, ideal para portfólio open-source).
* **Controle de Versão:** `.gitignore` configurado estritamente para ignorar `node_modules`, builds do TypeScript (`dist/`), arquivos gerados pelo AWS CDK (`cdk.out/`) e, fundamentalmente, variáveis de ambiente secretas (`.env`).

## 6. Próximo Passo de Desenvolvimento
A infraestrutura base do Hono (`npm create hono@latest` usando o template `aws-lambda`) já foi inicializada. O próximo passo de código é definir a arquitetura de pastas e criar o endpoint `POST /session/start` para gerar o UUID da sessão e interagir com o Redis.