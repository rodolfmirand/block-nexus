# Contexto do Projeto: BlockNexus

## 1. Visão Geral

**BlockNexus** é uma API voltada ao ecossistema de mods do Minecraft, com foco inicial em análise de compatibilidade para modpacks.

O objetivo do produto é receber uma seleção de mods, considerar a versão do Minecraft e o loader utilizado, e retornar uma análise estruturada com:

- dependências faltantes;
- dependências resolvidas;
- conflitos conhecidos;
- incompatibilidades de versão;
- avisos relevantes para montagem do modpack.

Nesta fase inicial, o BlockNexus deve ser tratado primeiro como **produto utilizável**. A exploração acadêmica para o TCC virá depois, apoiada sobre uma base funcional real.

---

## 2. Estratégia do Projeto

O projeto seguirá duas etapas principais:

1. **Construção do produto**
2. **Evolução para base experimental do TCC**

Isso significa que as decisões técnicas do início devem priorizar:

- velocidade de execução;
- clareza de domínio;
- simplicidade operacional;
- capacidade de validar o caso de uso central.

Por esse motivo, o projeto não começa por autenticação, recomendação avançada, Redis ou banco de grafos. Ele começa por **dados confiáveis, modelo de domínio e análise de compatibilidade**.

---

## 3. Escopo do MVP

O primeiro produto utilizável do BlockNexus deve resolver um caso central:

**analisar a compatibilidade de uma seleção de mods para um modpack específico**.

### Entrada esperada no MVP

- versão do Minecraft;
- loader;
- lista de mods ou versões de mods.

### Saída esperada no MVP

- dependências faltantes;
- dependências resolvidas;
- conflitos identificados;
- incompatibilidades de versão;
- resumo final da análise.

### Fora do escopo inicial

Os itens abaixo são importantes, mas não pertencem à primeira entrega do produto:

- sistema de contas;
- autenticação avançada;
- sessões persistentes de usuário;
- cache distribuído;
- recomendação sofisticada de mods;
- comparação entre bancos para fins acadêmicos;
- infraestrutura AWS completa desde o primeiro ciclo.

---

## 4. Direção Técnica Inicial

Para a primeira versão, o projeto seguirá esta direção:

- **Linguagem:** TypeScript
- **Runtime:** Node.js
- **Framework HTTP:** Hono
- **Banco inicial:** PostgreSQL
- **Objetivo da API inicial:** expor um backend simples e testável com `GET /health` e, depois, `POST /analyze`

### Motivo da escolha

O PostgreSQL será usado como base inicial porque reduz a complexidade da primeira implementação, acelera a entrega do MVP e permite que o domínio amadureça antes da criação da variante em banco de grafos.

O uso de Amazon Neptune, Redis, API Gateway e Lambda continua relevante como direção futura, mas não é a prioridade da primeira fase do produto.

---

## 5. Eixos Técnicos Prioritários

As próximas decisões do projeto devem se concentrar em quatro eixos:

### 5.1 Fonte de Dados

O primeiro problema real do produto é definir de onde virão os dados dos mods.

Sem uma fonte de dados confiável para dependências, conflitos, loaders e compatibilidade por versão, não existe análise consistente.

### 5.2 Modelo de Domínio

O domínio mínimo esperado para o produto inclui:

- `Mod`
- `ModVersion`
- `Dependency`
- `Conflict`
- `LoaderSupport`
- `MinecraftVersionSupport`

Essas entidades devem ser definidas de forma independente da tecnologia de persistência.

### 5.3 Motor de Análise

O núcleo do produto será um serviço responsável por:

- resolver dependências transitivas;
- detectar conflitos explícitos;
- apontar incompatibilidades por loader e versão;
- produzir uma resposta explicável e utilizável.

### 5.4 API do Produto

Depois da base de dados e do domínio, a prioridade é expor o fluxo principal do produto:

- `GET /health`
- `POST /analyze`

Esse fluxo tem prioridade maior do que endpoints de sessão ou persistência do usuário.

---

## 6. Relação com o TCC

O BlockNexus também servirá como base empírica para um TCC em Sistemas de Informação.

O uso acadêmico previsto é uma **comparação entre abordagem relacional e abordagem orientada a grafos** para operações centrais do domínio, principalmente:

- resolução de dependências profundas;
- detecção de conflitos;
- consultas com filtros por versão e loader.

### Importante

O TCC não deve dirigir as primeiras decisões do produto.

A ordem correta é:

1. construir o produto;
2. estabilizar o domínio e a regra de negócio;
3. instrumentar e formalizar o experimento;
4. implementar a variante em banco de grafos para comparação.

---

## 7. Estado Atual do Repositório

Neste momento, o repositório está em fase inicial de estruturação.

O que já existe:

- licença MIT;
- `.gitignore`;
- documentação de contexto e roadmap.

O que foi estruturado na Fase 0:

- `package.json`;
- estrutura inicial do backend;
- configuração de TypeScript;
- configuração de lint e formatação;
- `README.md` operacional;
- endpoint `GET /health`.

---

## 8. Próximo Passo Imediato

Com a **Fase 0** implementada, o próximo passo de desenvolvimento é iniciar a **Fase 1**, com foco em:

1. escolher a fonte primária de dados dos mods;
2. definir o contrato canônico de ingestão;
3. mapear dependências, conflitos, loaders e compatibilidade por versão;
4. preparar a persistência inicial do catálogo;
5. abrir caminho para a modelagem formal do domínio.

Em resumo:

**o BlockNexus já saiu do estado puramente conceitual; a prioridade agora é transformar dados de mods em um modelo confiável para sustentar o futuro `POST /analyze`**.
