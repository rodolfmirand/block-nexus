# Regras de Compatibilidade: BlockNexus

## 1. Objetivo

Este documento define a semantica inicial das regras de dependencias, conflitos e incompatibilidades do BlockNexus.

O objetivo e reduzir ambiguidade antes da implementacao do motor de analise.

## 2. Unidade de Analise

A analise sempre considera:

- uma versao de Minecraft;
- um loader;
- um conjunto de `ModVersion` selecionadas direta ou indiretamente.

Se a entrada do usuario vier apenas com o mod em nivel de projeto, o sistema deve primeiro escolher uma `ModVersion` candidata antes de avaliar compatibilidade completa.

## 3. Regras de Dependencia

### 3.1 Dependencia obrigatoria

Uma dependencia `required` e considerada resolvida quando existe uma `ModVersion` alvo que:

- pertence ao mod exigido;
- e compativel com o mesmo loader da analise;
- e compativel com a versao de Minecraft da analise;
- nao entra em conflito com o conjunto ja resolvido.

Se nenhuma versao candidata satisfizer esses criterios, a analise deve registrar `missing_dependency` com severidade `error`.

### 3.2 Dependencia opcional

Uma dependencia `optional` nao invalida sozinha a analise.

Se houver uma versao compativel disponivel, ela pode ser sugerida como dependencia opcional resolvivel. Se nao houver, o resultado deve registrar no maximo um aviso, nunca um erro bloqueante.

### 3.3 Dependencia embedded

Uma dependencia `embedded` significa que a funcionalidade ja esta empacotada junto do mod de origem.

Ela nao deve gerar nova selecao de `ModVersion`, mas deve continuar registrada para rastreabilidade e para evitar duplicacao indevida quando houver um mod standalone equivalente.

### 3.4 Dependencia tool

Uma dependencia `tool` nao participa da compatibilidade do modpack em runtime por padrao.

Ela deve ser preservada no catalogo, mas o motor do MVP pode ignora-la no resultado principal da analise, a menos que futuramente exista suporte explicito para ferramentas de build ou setup.

### 3.5 Resolucao transitiva

Quando uma dependencia obrigatoria e resolvida, as dependencias da versao escolhida entram na fila de resolucao.

A resolucao deve continuar ate:

- todas as dependencias obrigatorias estarem resolvidas;
- um erro bloqueante ocorrer;
- um ciclo ser detectado.

### 3.6 Escolha de versao quando o alvo nao e especifico

Se a fonte externa nao indicar uma `targetModVersionId`, o sistema deve escolher uma candidata usando esta ordem:

1. versoes compativeis com o loader da analise;
2. versoes compativeis com a versao do Minecraft da analise;
3. versoes em canal `release` antes de `beta`, `alpha` e `snapshot`;
4. versao mais recente por `publishedAt`;
5. em caso de empate sem criterio suficiente, registrar `ambiguous_version`.

## 4. Regras de Conflito e Incompatibilidade

### 4.1 Conflito explicito

Um conflito explicito ocorre quando uma `ConflictRule` ou dependencia marcada como `incompatible` atinge um mod ou versao presente no conjunto resolvido.

Esse caso deve gerar `error` por padrao.

### 4.2 Incompatibilidade por loader

Uma `ModVersion` e incompativel por loader quando o loader da analise nao esta presente na lista de loaders suportados da versao.

Esse caso deve gerar `loader_incompatibility` com severidade `error`.

### 4.3 Incompatibilidade por versao do Minecraft

Uma `ModVersion` e incompativel por versao do Minecraft quando a versao da analise nao esta presente no conjunto de versoes suportadas da versao do mod.

Esse caso deve gerar `minecraft_version_incompatibility` com severidade `error`.

### 4.4 Ciclos

Um ciclo existe quando o grafo de dependencias retorna a uma `ModVersion` ja visitada no mesmo caminho de resolucao.

Tratamento inicial do MVP:

- o ciclo deve ser detectado explicitamente;
- o motor deve registrar `cycle`;
- a analise deve ser marcada como invalida quando o ciclo envolver dependencias obrigatorias sem forma clara de satisfacao.

### 4.5 Ambiguidade de metadados

Quando os metadados nao permitem escolher uma versao com seguranca, o sistema nao deve assumir sucesso silencioso.

Ele deve registrar `ambiguous_version` com severidade `warning` ou `error`, dependendo de a dependencia ser opcional ou obrigatoria.

## 5. Resultado da Analise

O motor de compatibilidade deve produzir pelo menos estes grupos de saida:

- selecoes do usuario;
- dependencias resolvidas automaticamente;
- dependencias faltantes;
- conflitos detectados;
- incompatibilidades por ambiente;
- avisos de ambiguidade ou metadado incompleto.

## 6. Prioridades de Semantica

Quando houver tensao entre diferentes sinais, a precedencia inicial do MVP deve ser:

1. incompatibilidade por loader;
2. incompatibilidade por versao do Minecraft;
3. conflito explicito;
4. ausencia de dependencia obrigatoria;
5. ambiguidade de versao;
6. dependencias opcionais nao resolvidas.

## 7. O que Ainda Fica de Fora

Nesta fase, o produto ainda nao resolve:

- estrategia avancada de desempate entre multiplas versoes equivalentes;
- recomendacao inteligente de mods alternativos;
- fusao multi-source entre marketplaces;
- heuristicas de override manual pelo usuario.

Esses pontos podem ser adicionados depois, mas nao devem contaminar a semantica basica do MVP.
