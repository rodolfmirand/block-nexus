# Fonte de Dados do Catalogo: BlockNexus

## 1. Objetivo

Este documento registra a decisao da Fase 1 sobre a fonte inicial de dados do BlockNexus.

O objetivo nao e escolher a fonte "mais completa do mercado" de forma abstrata. O objetivo e escolher a fonte que melhor atende ao **MVP do produto** com menor friccao tecnica.

## 2. Candidatas Avaliadas

As duas candidatas principais para o inicio do projeto foram:

- **Modrinth API**
- **CurseForge API**

## 3. Requisitos do MVP

Para o BlockNexus, a fonte inicial precisa atender bem aos seguintes pontos:

- acesso programatico viavel para desenvolvimento rapido;
- metadados de projeto e versao;
- loaders suportados;
- versoes de Minecraft suportadas;
- dependencias por versao;
- identificadores estaveis;
- possibilidade de normalizacao para um modelo canônico interno.

## 4. Comparacao Resumida

### 4.1 Modrinth

Pontos positivos:

- a documentacao oficial informa que a maior parte das requisicoes nao exige token;
- a API e publica e possui CORS liberado;
- a documentacao exige apenas um `User-Agent` identificavel;
- o rate limit documentado e de `300 requests por minuto` por IP;
- os recursos de projeto e versao expõem loaders, game versions, arquivos, hashes e dependencias;
- projetos possuem `id` estavel e `slug` amigavel;
- a API expõe tags de loaders e versoes de jogo de forma direta;
- a estrutura dos payloads e adequada para normalizacao.

Pontos negativos:

- a cobertura do ecossistema nao e total quando comparada ao universo combinado de marketplaces;
- alguns mods relevantes podem existir apenas em outras plataformas;
- o modelo de conflitos explicitos nao resolve sozinho toda a logica de compatibilidade do produto.

### 4.2 CurseForge

Pontos positivos:

- possui ampla relevancia no ecossistema;
- a documentacao oficial mostra dados de dependencias por arquivo;
- oferece filtros por `gameVersion` e por `modLoaderType`;
- tambem expõe loaders e versoes de Minecraft.

Pontos negativos:

- a documentacao oficial exige autenticacao via header `x-api-key`;
- a chave precisa ser gerada no console de desenvolvedor;
- isso aumenta friccao de setup para o desenvolvimento inicial;
- parte do onboarding e do modelo da plataforma e mais orientada a integracao institucional e publicacao.

## 5. Decisao

O **Modrinth** sera a **fonte primaria inicial** do catalogo do BlockNexus.

O **CurseForge** fica registrado como **fonte secundaria futura**, para:

- ampliacao de cobertura;
- enriquecimento de catalogo;
- estrategia multi-source em fases posteriores.

## 6. Justificativa

O Modrinth foi escolhido porque oferece o melhor equilibrio entre:

- velocidade de desenvolvimento;
- simplicidade de acesso;
- qualidade do modelo de dados;
- aderencia ao caso de uso do MVP.

Motivos objetivos da escolha:

1. **Menor atrito de acesso**

A documentacao oficial do Modrinth informa que a maior parte das requisicoes nao requer token. Para o MVP, isso reduz setup, risco operacional e dependencia de credenciais logo no inicio.

2. **Modelo de dados adequado**

Os payloads reais do Modrinth expõem:

- projeto;
- versoes;
- loaders;
- game versions;
- arquivos;
- hashes;
- dependencias por versao.

3. **Boa identificacao para normalizacao**

O Modrinth oferece `id` estavel e `slug`, o que facilita armazenamento interno, deduplicacao e futura correlacao com outras fontes.

4. **Base melhor para produto primeiro**

Como o objetivo atual e tirar o produto do papel, a fonte inicial precisa simplificar a implementacao. O CurseForge pode ser integrado depois, quando o catalogo canônico ja existir.

## 7. Riscos da Decisao

Mesmo sendo a melhor escolha para o inicio, essa decisao tem riscos claros:

- cobertura incompleta do ecossistema total de mods;
- ausencia de alguns dados de compatibilidade mais ricos em determinados casos;
- necessidade futura de conciliacao entre fontes diferentes.

Mitigacao:

- adotar um **modelo canônico source-agnostic**;
- evitar acoplar o dominio diretamente ao shape do Modrinth;
- preparar a arquitetura para um segundo adapter no futuro;
- tratar conflitos conhecidos como uma camada de produto, e nao apenas como reflexo bruto da fonte.

## 8. Estrategia de Implementacao

O uso do Modrinth na Fase 1 deve seguir esta ordem:

1. consumir tags de loaders;
2. consumir tags de game versions;
3. consumir projetos;
4. consumir versoes por projeto;
5. normalizar tudo para o contrato canônico interno.

## 9. Fontes Oficiais Consultadas

- Modrinth API docs: [https://docs.modrinth.com/api/](https://docs.modrinth.com/api/)
- Modrinth public API base: [https://api.modrinth.com/v2/](https://api.modrinth.com/v2/)
- CurseForge API docs: [https://docs.curseforge.com/rest-api/](https://docs.curseforge.com/rest-api/)
