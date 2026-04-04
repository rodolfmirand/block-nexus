import { randomUUID } from "node:crypto";

import type { Hono } from "hono";

import { getCachedAnalysis, setCachedAnalysis } from "../lib/analysis-cache.js";
import {
  recordAnalyzeCacheHit,
  recordAnalyzeCacheMiss,
  recordAnalyzeCompleted,
  recordAnalyzeFailed,
  recordAnalyzeRequest,
  recordAnalyzeValidationError
} from "../lib/metrics.js";
import { logError, logInfo } from "../lib/logger.js";
import { CompatibilityService } from "../modules/compatibility/engine/index.js";
import type {
  CompatibilityAnalysisInput,
  CompatibilityInputMode,
  SelectedMod
} from "../modules/compatibility/engine/contracts.js";
import { PostgresCompatibilityRepository } from "../modules/compatibility/infrastructure/postgres-compatibility-repository.js";

type AnalyzePayload = CompatibilityAnalysisInput;

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

function isInputMode(value: unknown): value is CompatibilityInputMode {
  return value === "mods" || value === "version_ids";
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

function validateSelectedMods(value: unknown): {
  selectedMods: SelectedMod[];
  errors: string[];
} {
  if (!Array.isArray(value)) {
    return {
      selectedMods: [],
      errors: ["'selectedMods' must be an array."]
    };
  }

  const errors: string[] = [];
  const selectedMods: SelectedMod[] = [];

  value.forEach((item, index) => {
    if (!item || typeof item !== "object") {
      errors.push(`'selectedMods[${index}]' must be an object.`);
      return;
    }

    const candidate = item as Record<string, unknown>;
    const modId = isNonEmptyString(candidate.modId) ? candidate.modId.trim() : undefined;
    const modSlug = isNonEmptyString(candidate.modSlug) ? candidate.modSlug.trim() : undefined;

    if (!modId && !modSlug) {
      errors.push(`'selectedMods[${index}]' must include 'modId' or 'modSlug'.`);
      return;
    }

    if (modId && !isNumericId(modId)) {
      errors.push(`'selectedMods[${index}].modId' must be numeric.`);
      return;
    }

    selectedMods.push({
      ...(modId ? { modId } : {}),
      ...(modSlug ? { modSlug } : {})
    });
  });

  return {
    selectedMods,
    errors
  };
}

function resolveInputMode(args: {
  requestedMode: CompatibilityInputMode | undefined;
  hasSelectedMods: boolean;
  hasVersionIds: boolean;
  errors: string[];
}): CompatibilityInputMode | null {
  const { requestedMode, hasSelectedMods, hasVersionIds, errors } = args;

  if (requestedMode === "mods") {
    if (!hasSelectedMods) {
      errors.push("'inputMode=mods' requires 'selectedMods'.");
      return null;
    }

    if (hasVersionIds) {
      errors.push("'inputMode=mods' does not allow 'selectedModVersionIds'.");
      return null;
    }

    return "mods";
  }

  if (requestedMode === "version_ids") {
    if (!hasVersionIds) {
      errors.push("'inputMode=version_ids' requires 'selectedModVersionIds'.");
      return null;
    }

    if (hasSelectedMods) {
      errors.push("'inputMode=version_ids' does not allow 'selectedMods'.");
      return null;
    }

    return "version_ids";
  }

  if (hasSelectedMods && hasVersionIds) {
    errors.push("Provide only one input strategy: 'selectedMods' or 'selectedModVersionIds', or set 'inputMode'.");
    return null;
  }

  if (hasSelectedMods) {
    return "mods";
  }

  if (hasVersionIds) {
    return "version_ids";
  }

  errors.push("Provide 'selectedMods' or 'selectedModVersionIds'.");
  return null;
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

  if (payloadCandidate.inputMode !== undefined && !isInputMode(payloadCandidate.inputMode)) {
    errors.push("'inputMode' must be 'mods' or 'version_ids'.");
  }

  const hasVersionIds = Array.isArray(payloadCandidate.selectedModVersionIds);
  const hasSelectedMods = Array.isArray(payloadCandidate.selectedMods);

  const selectedModVersionIds = hasVersionIds
    ? (payloadCandidate.selectedModVersionIds as unknown[])
      .filter((value): value is string => isNonEmptyString(value))
      .map((value) => value.trim())
    : [];

  if (hasVersionIds && selectedModVersionIds.length === 0) {
    errors.push("'selectedModVersionIds' must include at least one non-empty ID.");
  }

  if (selectedModVersionIds.some((id) => !isNumericId(id))) {
    errors.push("'selectedModVersionIds' must contain numeric IDs from mod_versions.");
  }

  const selectedModsValidation = hasSelectedMods
    ? validateSelectedMods(payloadCandidate.selectedMods)
    : { selectedMods: [], errors: [] };

  errors.push(...selectedModsValidation.errors);

  if (hasSelectedMods && selectedModsValidation.selectedMods.length === 0) {
    errors.push("'selectedMods' must include at least one valid mod.");
  }

  const inputMode = resolveInputMode({
    requestedMode: isInputMode(payloadCandidate.inputMode) ? payloadCandidate.inputMode : undefined,
    hasSelectedMods: selectedModsValidation.selectedMods.length > 0,
    hasVersionIds: selectedModVersionIds.length > 0,
    errors
  });

  if (errors.length > 0 || !inputMode) {
    return {
      valid: false,
      errors
    };
  }

  return {
    valid: true,
    payload: {
      loader: (payloadCandidate.loader as string).trim(),
      minecraftVersion: (payloadCandidate.minecraftVersion as string).trim(),
      inputMode,
      ...(selectedModsValidation.selectedMods.length > 0
        ? { selectedMods: selectedModsValidation.selectedMods }
        : {}),
      ...(selectedModVersionIds.length > 0
        ? { selectedModVersionIds: [...new Set(selectedModVersionIds)] }
        : {})
    }
  };
}

export function registerAnalyzeRoutes(app: Hono): void {
  app.post("/analyze", async (context) => {
    const requestId = randomUUID();
    let body: unknown;

    try {
      body = await context.req.json();
    } catch {
      logInfo("compatibility.analyze.invalid_json", { requestId });
      return context.json(
        {
          error: "Invalid JSON body."
        },
        400
      );
    }

    const validation = validateAnalyzePayload(body);

    if (!validation.valid) {
      logInfo("compatibility.analyze.validation_failed", {
        requestId,
        detailsCount: validation.errors.length
      });

      return context.json(
        {
          error: "Invalid request payload.",
          details: validation.errors
        },
        400
      );
    }

    const cachedResult = getCachedAnalysis(validation.payload);

    if (cachedResult) {
      logInfo("compatibility.analyze.cache_hit", {
        requestId,
        inputMode: validation.payload.inputMode,
        status: cachedResult.status
      });

      return context.json(
        {
          ...cachedResult,
          meta: {
            cache: {
              hit: true
            },
            inputMode: validation.payload.inputMode
          }
        },
        200
      );
    }

    recordAnalyzeCacheMiss();

    logInfo("compatibility.analyze.started", {
      requestId,
      inputMode: validation.payload.inputMode,
      loader: validation.payload.loader,
      minecraftVersion: validation.payload.minecraftVersion,
      requestedMods: validation.payload.selectedMods?.length ?? 0,
      requestedModVersionIds: validation.payload.selectedModVersionIds?.length ?? 0
    });

    const compatibilityService = new CompatibilityService(new PostgresCompatibilityRepository());

    try {
      const result = await compatibilityService.analyze(validation.payload);

      setCachedAnalysis({
        input: validation.payload,
        result
      });

      logInfo("compatibility.analyze.completed", {
        requestId,
        inputMode: validation.payload.inputMode,
        status: result.status,
        resolvedSelections: result.resolvedSelections.length,
        issues: result.issues.length,
        missingDependencies: result.missingDependencies.length
      });

      return context.json(
        {
          ...result,
          meta: {
            cache: {
              hit: false
            },
            inputMode: validation.payload.inputMode
          }
        },
        200
      );
    } catch (error: unknown) {
      const errorMessage = formatError(error);
      const databaseUnavailable = isDatabaseUnavailable(errorMessage);

      recordAnalyzeFailed(databaseUnavailable ? "db_unavailable" : "internal");

      logError("compatibility.analyze.failed", {
        requestId,
        inputMode: validation.payload.inputMode,
        databaseUnavailable,
        message: errorMessage
      });

      return context.json(
        {
          error: databaseUnavailable
            ? "Database is unavailable for analysis."
            : "Compatibility analysis failed.",
          details: errorMessage
        },
        databaseUnavailable ? 503 : 500
      );
    }
  });
}

