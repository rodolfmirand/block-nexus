# Design System Frontend: BlockNexus (Tech Minimal)

## 1. Direção Visual

Objetivo: interface técnica, limpa e objetiva, com foco em leitura de dados de compatibilidade.

Princípios:

- pouca cor, cor com significado;
- baixa distração visual;
- hierarquia forte por tipografia e espaçamento;
- estados de compatibilidade sempre evidentes.

## 2. Tokens de Design

### 2.1 Cores

Base:

- `--bg`: `#F8FAFC`
- `--surface`: `#FFFFFF`
- `--surface-muted`: `#F1F5F9`
- `--border`: `#E2E8F0`
- `--text`: `#0F172A`
- `--text-muted`: `#475569`

Estados:

- `--success`: `#16A34A` (compatible)
- `--danger`: `#DC2626` (incompatible)
- `--warning`: `#F59E0B` (warnings/dependências opcionais faltantes)
- `--info`: `#0EA5E9` (informação técnica)

Ação:

- `--primary`: `#1D4ED8`
- `--primary-hover`: `#1E40AF`

### 2.2 Tipografia

- Títulos: `Space Grotesk`, fallback `system-ui`
- Texto/UI: `IBM Plex Sans`, fallback `system-ui`
- Dados técnicos (IDs, slugs): `JetBrains Mono`, fallback `monospace`

Escala:

- `--fs-xs`: `12px`
- `--fs-sm`: `14px`
- `--fs-md`: `16px`
- `--fs-lg`: `20px`
- `--fs-xl`: `28px`

### 2.3 Espaçamento e Raio

- escala: `4, 8, 12, 16, 24, 32`
- `--radius-sm`: `8px`
- `--radius-md`: `12px`
- `--radius-lg`: `16px`

### 2.4 Sombra

- `--shadow-sm`: `0 1px 2px rgba(15, 23, 42, 0.06)`
- `--shadow-md`: `0 6px 18px rgba(15, 23, 42, 0.08)`

Uso recomendado: sombra apenas em cards de resultado e dropdown de busca.

## 3. Componentes Base

## 3.1 `AppShell`

- header simples com nome do produto e status da API;
- conteúdo em grid responsivo;
- largura máxima: `1200px`.

## 3.2 `EnvironmentForm`

Campos:

- `loader` (select)
- `minecraftVersion` (input/select)
- botão principal: `Analisar compatibilidade`

## 3.3 `ModSearch`

- campo de busca;
- lista de resultados com `title`, `slug`, botão `Adicionar`;
- feedback de vazio/erro.

## 3.4 `SelectionList`

- lista dos mods selecionados;
- remoção por item;
- contador total;
- persistência de sessão indicada visualmente.

## 3.5 `AnalysisSummary`

- badge de status (`compatible`/`incompatible`);
- cards de resumo:
  - versões resolvidas;
  - dependências resolvidas;
  - dependências faltantes;
  - issues.

## 3.6 `AnalysisDetails`

Seções:

- `Resolved Selections`
- `Resolved Dependencies`
- `Missing Dependencies`
- `Issues`

Cada seção em tabela/lista com tipografia monoespaçada para IDs.

## 3.7 `RecommendationsPanel`

- botão `Buscar recomendações`;
- cards com `modSlug`, `versionNumber`, `score`;
- bloco `Razões` por recomendação.

## 4. Layout do MVP

Desktop:

- coluna esquerda (35%): ambiente, busca, seleção;
- coluna direita (65%): resultado da análise + recomendações.

Mobile:

- fluxo vertical;
- ordem: ambiente -> busca -> seleção -> analisar -> resultado -> recomendações.

Wireframe (desktop):

```text
+--------------------------------------------------------------+
| BlockNexus                                      API: healthy |
+------------------------------+-------------------------------+
| Ambiente                     | Resultado da Análise          |
| [loader] [version] [Analisar]| [Status Badge] [Resumo]       |
|                              |                               |
| Buscar Mods                  | Resolved Selections           |
| [input....................]  | [tabela]                      |
| [resultados + adicionar]     |                               |
|                              | Dependencies / Missing /Issues|
| Seleção Atual                | [listas/tabelas]              |
| [mods escolhidos]            |                               |
|                              | Recomendacoes                 |
|                              | [cards + razoes]              |
+------------------------------+-------------------------------+
```

## 5. Motion

- transição curta (`120ms` a `180ms`);
- entrada de card: `fade + translateY(4px)`;
- sem animações contínuas/decorativas.

## 6. Acessibilidade

- contraste mínimo WCAG AA;
- foco visível em todos os campos e botões;
- labels explícitas para `loader` e `minecraftVersion`;
- mensagens de erro claras e acionáveis.

## 7. Checklist de Implementação

- definir tokens CSS em `:root`;
- implementar componentes base primeiro;
- aplicar estados de status de forma consistente;
- validar responsividade em `360px`, `768px`, `1280px`.
