import { randomUUID } from "node:crypto";

import type { Hono } from "hono";

import { getCachedAnalysis, setCachedAnalysis } from "../lib/analysis-cache.js";
import { logError, logInfo } from "../lib/logger.js";
import {
  appendSessionAnalysisResult,
  createAnonymousSession,
  getAnonymousSession,
  saveSessionSelection
} from "../lib/session-store.js";
import { CompatibilityService } from "../modules/compatibility/engine/compatibility-service.js";
import type {
  CompatibilityAnalysisInput,
  CompatibilityInputMode,
  SelectedMod
} from "../modules/compatibility/engine/contracts.js";
import { PostgresCompatibilityRepository } from "../modules/compatibility/infrastructure/postgres-compatibility-repository.js";

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isNumericId(value: string): boolean {
  return /^\d+$/.test(value);
}

function isInputMode(value: unknown): value is CompatibilityInputMode {
  return value === "mods" || value === "version_ids";
}

function validateSelectedMods(value: unknown): { valid: true; selectedMods: SelectedMod[] } | { valid: false; errors: string[] } {
  if (!Array.isArray(value)) {
    return {
      valid: false,
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

  if (errors.length > 0) {
    return {
      valid: false,
      errors
    };
  }

  return {
    valid: true,
    selectedMods
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

function validateSelectionPayload(body: unknown):
  | { valid: true; payload: CompatibilityAnalysisInput }
  | { valid: false; errors: string[] } {
  if (!body || typeof body !== "object") {
    return {
      valid: false,
      errors: ["Request body must be a JSON object."]
    };
  }

  const candidate = body as Record<string, unknown>;
  const errors: string[] = [];

  if (!isNonEmptyString(candidate.loader)) {
    errors.push("'loader' must be a non-empty string.");
  }

  if (!isNonEmptyString(candidate.minecraftVersion)) {
    errors.push("'minecraftVersion' must be a non-empty string.");
  }

  if (candidate.inputMode !== undefined && !isInputMode(candidate.inputMode)) {
    errors.push("'inputMode' must be 'mods' or 'version_ids'.");
  }

  const hasVersionIds = Array.isArray(candidate.selectedModVersionIds);
  const hasSelectedMods = Array.isArray(candidate.selectedMods);

  const selectedModVersionIds = hasVersionIds
    ? (candidate.selectedModVersionIds as unknown[])
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
    ? validateSelectedMods(candidate.selectedMods)
    : { valid: true as const, selectedMods: [] };

  if (!selectedModsValidation.valid) {
    errors.push(...selectedModsValidation.errors);
  }

  if (hasSelectedMods && selectedModsValidation.valid && selectedModsValidation.selectedMods.length === 0) {
    errors.push("'selectedMods' must include at least one valid mod.");
  }

  const inputMode = resolveInputMode({
    requestedMode: isInputMode(candidate.inputMode) ? candidate.inputMode : undefined,
    hasSelectedMods: selectedModsValidation.valid && selectedModsValidation.selectedMods.length > 0,
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
      loader: String(candidate.loader).trim(),
      minecraftVersion: String(candidate.minecraftVersion).trim(),
      inputMode,
      ...(selectedModsValidation.valid && selectedModsValidation.selectedMods.length > 0
        ? { selectedMods: selectedModsValidation.selectedMods }
        : {}),
      ...(selectedModVersionIds.length > 0
        ? { selectedModVersionIds: [...new Set(selectedModVersionIds)] }
        : {})
    }
  };
}

function formatError(error: unknown): string {
  if (error instanceof Error) {
    return error.message.length > 0 ? error.message : error.name;
  }

  return typeof error === "string" && error.length > 0 ? error : "Unknown session analysis error.";
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

export function registerSessionRoutes(app: Hono): void {
  app.post("/sessions", (context) => {
    const session = createAnonymousSession();

    return context.json(
      {
        id: session.id,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt
      },
      201
    );
  });

  app.get("/sessions/:sessionId", (context) => {
    const sessionId = context.req.param("sessionId");
    const session = getAnonymousSession(sessionId);

    if (!session) {
      return context.json(
        {
          error: "Session not found."
        },
        404
      );
    }

    return context.json(session, 200);
  });

  app.put("/sessions/:sessionId/selection", async (context) => {
    const sessionId = context.req.param("sessionId");
    const session = getAnonymousSession(sessionId);

    if (!session) {
      return context.json(
        {
          error: "Session not found."
        },
        404
      );
    }

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

    const validation = validateSelectionPayload(body);

    if (!validation.valid) {
      return context.json(
        {
          error: "Invalid request payload.",
          details: validation.errors
        },
        400
      );
    }

    const updated = saveSessionSelection(sessionId, validation.payload);

    return context.json(updated, 200);
  });

  app.post("/sessions/:sessionId/analyze", async (context) => {
    const sessionId = context.req.param("sessionId");
    const session = getAnonymousSession(sessionId);

    if (!session) {
      return context.json(
        {
          error: "Session not found."
        },
        404
      );
    }

    if (!session.selection) {
      return context.json(
        {
          error: "Session has no selection.",
          details: ["Use PUT /sessions/:sessionId/selection before analyze."]
        },
        400
      );
    }

    const requestId = randomUUID();
    const cachedResult = getCachedAnalysis(session.selection);

    if (cachedResult) {
      appendSessionAnalysisResult({
        sessionId,
        result: cachedResult,
        cacheHit: true
      });

      logInfo("session.analyze.cache_hit", {
        requestId,
        sessionId,
        inputMode: session.selection.inputMode,
        status: cachedResult.status
      });

      return context.json(
        {
          ...cachedResult,
          meta: {
            cache: {
              hit: true
            },
            sessionId,
            inputMode: session.selection.inputMode
          }
        },
        200
      );
    }

    const compatibilityService = new CompatibilityService(new PostgresCompatibilityRepository());

    try {
      const result = await compatibilityService.analyze(session.selection);

      setCachedAnalysis({
        input: session.selection,
        result
      });

      appendSessionAnalysisResult({
        sessionId,
        result,
        cacheHit: false
      });

      logInfo("session.analyze.completed", {
        requestId,
        sessionId,
        inputMode: session.selection.inputMode,
        status: result.status,
        resolvedSelections: result.resolvedSelections.length
      });

      return context.json(
        {
          ...result,
          meta: {
            cache: {
              hit: false
            },
            sessionId,
            inputMode: session.selection.inputMode
          }
        },
        200
      );
    } catch (error: unknown) {
      const errorMessage = formatError(error);

      logError("session.analyze.failed", {
        requestId,
        sessionId,
        inputMode: session.selection.inputMode,
        message: errorMessage
      });

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
