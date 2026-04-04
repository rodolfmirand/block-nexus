import type { Hono } from "hono";

import { CompatibilityService } from "../modules/compatibility/engine/index.js";
import { PostgresCompatibilityRepository } from "../modules/compatibility/infrastructure/postgres-compatibility-repository.js";

type AnalyzePayload = {
  loader: string;
  minecraftVersion: string;
  selectedModVersionIds: string[];
};

type ValidationResult =
  | {
      valid: true;
      payload: AnalyzePayload;
    }
  | {
      valid: false;
      errors: string[];
    };

type ErrorWithMetadata = {
  message?: string;
  code?: string;
  errno?: string | number;
  syscall?: string;
};

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isNumericId(value: string): boolean {
  return /^\d+$/.test(value);
}

function formatError(error: unknown): string {
  if (error instanceof Error) {
    return error.message.length > 0 ? error.message : error.name;
  }

  if (typeof error === "string" && error.length > 0) {
    return error;
  }

  if (error && typeof error === "object") {
    const metadata = error as ErrorWithMetadata;
    const parts: string[] = [];

    if (typeof metadata.message === "string" && metadata.message.length > 0) {
      parts.push(metadata.message);
    }

    if (typeof metadata.code === "string" && metadata.code.length > 0) {
      parts.push(`code=${metadata.code}`);
    }

    if (metadata.errno !== undefined) {
      parts.push(`errno=${String(metadata.errno)}`);
    }

    if (typeof metadata.syscall === "string" && metadata.syscall.length > 0) {
      parts.push(`syscall=${metadata.syscall}`);
    }

    if (parts.length > 0) {
      return parts.join(" | ");
    }
  }

  return "Unknown analysis error.";
}

function isDatabaseUnavailable(errorMessage: string): boolean {
  const lowered = errorMessage.toLowerCase();

  return (
    lowered.includes("econnrefused")
    || lowered.includes("connection terminated")
    || lowered.includes("timeout")
    || lowered.includes("connect")
  );
}

function validateAnalyzePayload(body: unknown): ValidationResult {
  if (!body || typeof body !== "object") {
    return {
      valid: false,
      errors: ["Request body must be a JSON object."]
    };
  }

  const payloadCandidate = body as Record<string, unknown>;
  const errors: string[] = [];

  if (!isNonEmptyString(payloadCandidate.loader)) {
    errors.push("'loader' must be a non-empty string.");
  }

  if (!isNonEmptyString(payloadCandidate.minecraftVersion)) {
    errors.push("'minecraftVersion' must be a non-empty string.");
  }

  if (!Array.isArray(payloadCandidate.selectedModVersionIds)) {
    errors.push("'selectedModVersionIds' must be an array of IDs.");
  }

  const selectedModVersionIds = Array.isArray(payloadCandidate.selectedModVersionIds)
    ? payloadCandidate.selectedModVersionIds.filter((value): value is string => isNonEmptyString(value))
    : [];

  if (selectedModVersionIds.length === 0) {
    errors.push("'selectedModVersionIds' must include at least one non-empty ID.");
  }

  const nonNumericIds = selectedModVersionIds.filter((id) => !isNumericId(id));

  if (nonNumericIds.length > 0) {
    errors.push("'selectedModVersionIds' must contain numeric IDs from mod_versions.");
  }

  if (errors.length > 0) {
    return {
      valid: false,
      errors
    };
  }

  return {
    valid: true,
    payload: {
      loader: payloadCandidate.loader as string,
      minecraftVersion: payloadCandidate.minecraftVersion as string,
      selectedModVersionIds: [...new Set(selectedModVersionIds)]
    }
  };
}

export function registerAnalyzeRoutes(app: Hono): void {
  app.post("/analyze", async (context) => {
    let body: unknown;

    try {
      body = await context.req.json();
    } catch {
      return context.json(
        {
          error: "Invalid JSON body."
        },
        400
      );
    }

    const validation = validateAnalyzePayload(body);

    if (!validation.valid) {
      return context.json(
        {
          error: "Invalid request payload.",
          details: validation.errors
        },
        400
      );
    }

    const compatibilityService = new CompatibilityService(new PostgresCompatibilityRepository());

    try {
      const result = await compatibilityService.analyze(validation.payload);

      return context.json(result, 200);
    } catch (error: unknown) {
      const errorMessage = formatError(error);

      return context.json(
        {
          error: isDatabaseUnavailable(errorMessage)
            ? "Database is unavailable for analysis."
            : "Compatibility analysis failed.",
          details: errorMessage
        },
        isDatabaseUnavailable(errorMessage) ? 503 : 500
      );
    }
  });
}
