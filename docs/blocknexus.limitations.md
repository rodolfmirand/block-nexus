# Limitacoes Conhecidas do MVP

## 1. Cobertura de dados externos

- A qualidade da analise depende da completude dos metadados importados do Modrinth.
- Conflitos implicitos (nao declarados na fonte) podem nao ser detectados.

## 2. Heuristica de selecao de versoes

- A selecao prioriza canal de release e data de publicacao.
- Nao ha busca exaustiva global por otimo; existe limite de combinacoes para manter latencia previsivel.

## 3. Dependencias opcionais

- Dependencias opcionais nao resolvidas geram `warning` e nao bloqueiam `compatible`.
- A decisao de instalar opcionais ainda depende da politica do consumidor da API.

## 4. Escopo funcional atual

- O MVP e orientado a compatibilidade e nao cobre recomendacao de mods.
- Nao ha persistencia de sessao de modpack nesta fase.

## 5. Observabilidade

- As metricas atuais sao em memoria local e reiniciam com o processo.
- Ainda nao existe exportacao para backend de monitoramento externo.
