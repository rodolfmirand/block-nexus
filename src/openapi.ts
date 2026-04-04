export const openApiDocument = {
  openapi: "3.0.3",
  info: {
    title: "BlockNexus API",
    version: "0.1.0",
    description: "API para analise de compatibilidade de mods e montagem de modpacks."
  },
  servers: [
    {
      url: "http://localhost:3000"
    }
  ],
  tags: [
    {
      name: "Health"
    },
    {
      name: "Catalog"
    },
    {
      name: "Compatibility"
    }
  ],
  paths: {
    "/health": {
      get: {
        tags: ["Health"],
        summary: "Verifica saude da API e conexao com banco",
        responses: {
          "200": {
            description: "Servico saudavel",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/HealthResponse"
                }
              }
            }
          },
          "503": {
            description: "Servico degradado",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/HealthResponse"
                }
              }
            }
          }
        }
      }
    },
    "/metrics": {
      get: {
        tags: ["Health"],
        summary: "Retorna metricas basicas de latencia e erro por rota",
        responses: {
          "200": {
            description: "Metricas em memoria da instancia atual",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/MetricsResponse"
                }
              }
            }
          }
        }
      }
    },    "/mods/search": {
      get: {
        tags: ["Catalog"],
        summary: "Busca mods por nome e/ou slug",
        parameters: [
          {
            name: "q",
            in: "query",
            required: false,
            schema: {
              type: "string"
            },
            description: "Termo geral aplicado em nome ou slug"
          },
          {
            name: "name",
            in: "query",
            required: false,
            schema: {
              type: "string"
            },
            description: "Filtro por nome do mod"
          },
          {
            name: "slug",
            in: "query",
            required: false,
            schema: {
              type: "string"
            },
            description: "Filtro por slug do mod"
          },
          {
            name: "limit",
            in: "query",
            required: false,
            schema: {
              type: "integer",
              minimum: 1,
              maximum: 100,
              default: 20
            },
            description: "Limite de resultados"
          }
        ],
        responses: {
          "200": {
            description: "Busca executada",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ModSearchResponse"
                }
              }
            }
          },
          "400": {
            description: "Query invalida",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ErrorResponse"
                }
              }
            }
          },
          "503": {
            description: "Banco indisponivel",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ErrorResponse"
                }
              }
            }
          },
          "500": {
            description: "Falha interna da busca",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ErrorResponse"
                }
              }
            }
          }
        }
      }
    },
    "/analyze": {
      post: {
        tags: ["Compatibility"],
        summary: "Executa analise de compatibilidade",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                $ref: "#/components/schemas/AnalyzeRequest"
              },
              examples: {
                byMods: {
                  summary: "Fluxo MVP por lista de mods",
                  value: {
                    loader: "forge",
                    minecraftVersion: "1.20.1",
                    selectedMods: [
                      {
                        modSlug: "create"
                      },
                      {
                        modSlug: "travelersbackpack"
                      }
                    ]
                  }
                },
                byVersionIds: {
                  summary: "Fluxo legado por IDs de mod_version",
                  value: {
                    loader: "fabric",
                    minecraftVersion: "1.21.1",
                    selectedModVersionIds: ["101", "103"]
                  }
                }
              }
            }
          }
        },
        responses: {
          "200": {
            description: "Analise executada",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/AnalyzeResponse"
                }
              }
            }
          },
          "400": {
            description: "Payload invalido",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ErrorResponse"
                }
              }
            }
          },
          "503": {
            description: "Banco indisponivel",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ErrorResponse"
                }
              }
            }
          },
          "500": {
            description: "Falha interna da analise",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/ErrorResponse"
                }
              }
            }
          }
        }
      }
    }
  },
  components: {
    schemas: {
      SessionCreatedResponse: {
        type: "object",
        properties: {
          id: { type: "string" },
          createdAt: { type: "string" },
          updatedAt: { type: "string" }
        }
      },      SelectedMod: {
        type: "object",
        properties: {
          modId: {
            type: "string",
            pattern: "^\\d+$",
            example: "42"
          },
          modSlug: {
            type: "string",
            example: "sodium"
          }
        }
      },
      AnalyzeRequest: {
        type: "object",
        required: ["loader", "minecraftVersion", "inputMode"],
        properties: {
          loader: {
            type: "string",
            example: "fabric"
          },
          minecraftVersion: {
            type: "string",
            example: "1.21.1"
          },
          selectedMods: {
            type: "array",
            minItems: 1,
            items: {
              $ref: "#/components/schemas/SelectedMod"
            }
          },
          selectedModVersionIds: {
            type: "array",
            items: {
              type: "string",
              pattern: "^\\d+$"
            },
            minItems: 1,
            example: ["101", "103"]
          }
        }
      },
      AnalyzeResponse: {
        type: "object",
        properties: {
          status: {
            type: "string",
            enum: ["compatible", "incompatible"]
          },
          loader: {
            type: "string"
          },
          minecraftVersion: {
            type: "string"
          },
          requestedMods: {
            type: "array",
            items: {
              $ref: "#/components/schemas/SelectedMod"
            }
          },
          requestedModVersionIds: {
            type: "array",
            items: {
              type: "string"
            }
          },
          resolvedSelections: {
            type: "array",
            items: {
              type: "object"
            }
          },
          resolvedDependencies: {
            type: "array",
            items: {
              type: "object"
            }
          },
          missingDependencies: {
            type: "array",
            items: {
              type: "object"
            }
          },
          issues: {
            type: "array",
            items: {
              type: "object"
            }
          }
        }
      },
      MetricsResponse: {
        type: "object",
        properties: {
          totals: {
            type: "object",
            properties: {
              routes: { type: "integer" },
              requests: { type: "integer" },
              errors: { type: "integer" }
            }
          },
          routes: {
            type: "array",
            items: {
              type: "object",
              properties: {
                route: { type: "string" },
                requests: { type: "integer" },
                errors: { type: "integer" },
                errorRate: { type: "number" },
                avgLatencyMs: { type: "number" },
                maxLatencyMs: { type: "number" }
              }
            }
          }
        }
      },      ModSearchItem: {
        type: "object",
        properties: {
          id: {
            type: "string",
            example: "42"
          },
          slug: {
            type: "string",
            example: "sodium"
          },
          title: {
            type: "string",
            example: "Sodium"
          },
          summary: {
            type: ["string", "null"]
          }
        }
      },
      ModSearchResponse: {
        type: "object",
        properties: {
          total: {
            type: "integer",
            example: 2
          },
          items: {
            type: "array",
            items: {
              $ref: "#/components/schemas/ModSearchItem"
            }
          }
        }
      },
      HealthResponse: {
        type: "object",
        properties: {
          status: {
            type: "string",
            enum: ["ok", "degraded"]
          },
          service: {
            type: "string"
          },
          environment: {
            type: "string"
          },
          database: {
            type: "object",
            properties: {
              status: {
                type: "string",
                enum: ["up", "down"]
              },
              database: {
                type: ["string", "null"]
              },
              latencyMs: {
                type: ["number", "null"]
              },
              error: {
                type: ["string", "null"]
              }
            }
          }
        }
      },
      ErrorResponse: {
        type: "object",
        properties: {
          error: {
            type: "string"
          },
          details: {
            oneOf: [
              {
                type: "string"
              },
              {
                type: "array",
                items: {
                  type: "string"
                }
              }
            ]
          }
        }
      }
    }
  }
};





