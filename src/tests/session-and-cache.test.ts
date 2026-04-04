import { test } from "node:test";
import assert from "node:assert/strict";

import {
  buildAnalysisCacheKey,
  cleanupExpiredCache,
  clearAnalysisCache,
  configureAnalysisCache,
  getAnalysisCacheSize,
  getCachedAnalysis,
  setCachedAnalysis
} from "../lib/analysis-cache.js";
import {
  clearSessions,
  cleanupExpiredSessions,
  configureSessionStore,
  createAnonymousSession,
  getAnonymousSession,
  getSessionStoreSize
} from "../lib/session-store.js";
import { createApp } from "../app.js";

test("analysis cache key is order-independent for selected mods", () => {
  const first = buildAnalysisCacheKey({
    loader: "forge",
    minecraftVersion: "1.21.1",
    inputMode: "mods",
    selectedMods: [
      { modSlug: "create" },
      { modSlug: "travelersbackpack" }
    ]
  });

  const second = buildAnalysisCacheKey({
    loader: "forge",
    minecraftVersion: "1.21.1",
    inputMode: "mods",
    selectedMods: [
      { modSlug: "travelersbackpack" },
      { modSlug: "create" }
    ]
  });

  assert.equal(first, second);
});

test("stores and reads cached analysis", () => {
  clearAnalysisCache();
  configureAnalysisCache({ ttlMs: 300000, maxEntries: 1000 });

  const input = {
    loader: "forge",
    minecraftVersion: "1.21.1",
    inputMode: "mods" as const,
    selectedMods: [{ modSlug: "create" }]
  };

  setCachedAnalysis({
    input,
    result: {
      status: "compatible",
      loader: "forge",
      minecraftVersion: "1.21.1",
      requestedModVersionIds: ["1"],
      resolvedSelections: [],
      resolvedDependencies: [],
      missingDependencies: [],
      issues: []
    }
  });

  const cached = getCachedAnalysis(input);

  assert.ok(cached);
  assert.equal(cached.status, "compatible");
});

test("cleans expired cache entries", () => {
  clearAnalysisCache();
  configureAnalysisCache({ ttlMs: 1, maxEntries: 1000 });

  const input = {
    loader: "forge",
    minecraftVersion: "1.21.1",
    inputMode: "mods" as const,
    selectedMods: [{ modSlug: "create" }]
  };

  setCachedAnalysis({
    input,
    result: {
      status: "compatible",
      loader: "forge",
      minecraftVersion: "1.21.1",
      requestedModVersionIds: ["1"],
      resolvedSelections: [],
      resolvedDependencies: [],
      missingDependencies: [],
      issues: []
    }
  });

  const removed = cleanupExpiredCache(Date.now() + 10);

  assert.equal(removed, 1);
  assert.equal(getCachedAnalysis(input), null);
});

test("evicts oldest cache entry when max entries is reached", () => {
  clearAnalysisCache();
  configureAnalysisCache({ ttlMs: 300000, maxEntries: 2 });

  const makeInput = (slug: string) => ({
    loader: "forge",
    minecraftVersion: "1.21.1",
    inputMode: "mods" as const,
    selectedMods: [{ modSlug: slug }]
  });

  const i1 = makeInput("a");
  const i2 = makeInput("b");
  const i3 = makeInput("c");

  setCachedAnalysis({ input: i1, result: { status: "compatible", loader: "forge", minecraftVersion: "1.21.1", requestedModVersionIds: ["1"], resolvedSelections: [], resolvedDependencies: [], missingDependencies: [], issues: [] } });
  setCachedAnalysis({ input: i2, result: { status: "compatible", loader: "forge", minecraftVersion: "1.21.1", requestedModVersionIds: ["2"], resolvedSelections: [], resolvedDependencies: [], missingDependencies: [], issues: [] } });
  setCachedAnalysis({ input: i3, result: { status: "compatible", loader: "forge", minecraftVersion: "1.21.1", requestedModVersionIds: ["3"], resolvedSelections: [], resolvedDependencies: [], missingDependencies: [], issues: [] } });

  assert.equal(getAnalysisCacheSize(), 2);
  assert.equal(getCachedAnalysis(i1), null);
  assert.ok(getCachedAnalysis(i2));
  assert.ok(getCachedAnalysis(i3));
});

test("creates session and requires selection before session analyze", async () => {
  clearSessions();
  configureSessionStore({ ttlMs: 3600000, maxEntries: 1000 });

  const app = createApp();

  const createResponse = await app.request("http://localhost/sessions", {
    method: "POST"
  });

  assert.equal(createResponse.status, 201);
  const createBody = await createResponse.json();
  assert.ok(createBody.id);

  const analyzeResponse = await app.request(`http://localhost/sessions/${createBody.id}/analyze`, {
    method: "POST"
  });

  assert.equal(analyzeResponse.status, 400);
  const analyzeBody = await analyzeResponse.json();
  assert.equal(analyzeBody.error, "Session has no selection.");

  const getResponse = await app.request(`http://localhost/sessions/${createBody.id}`);
  assert.equal(getResponse.status, 200);
});

test("session store creates session with empty selection", () => {
  clearSessions();
  configureSessionStore({ ttlMs: 3600000, maxEntries: 1000 });

  const session = createAnonymousSession();

  assert.ok(session.id);
  assert.equal(session.selection, null);
});

test("rejects session selection when inputMode conflicts with fields", async () => {
  clearSessions();
  const app = createApp();

  const createResponse = await app.request("http://localhost/sessions", { method: "POST" });
  const createBody = await createResponse.json();

  const putResponse = await app.request(
    `http://localhost/sessions/${createBody.id}/selection`,
    {
      method: "PUT",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        loader: "forge",
        minecraftVersion: "1.21.1",
        inputMode: "mods",
        selectedModVersionIds: ["123"]
      })
    }
  );

  assert.equal(putResponse.status, 400);
  const body = await putResponse.json();
  assert.equal(body.error, "Invalid request payload.");
});

test("cleans expired sessions", () => {
  clearSessions();
  configureSessionStore({ ttlMs: 1, maxEntries: 1000 });

  const session = createAnonymousSession();

  const removed = cleanupExpiredSessions(Date.now() + 10);

  assert.equal(removed, 1);
  assert.equal(getAnonymousSession(session.id), null);
});

test("evicts oldest session when max entries is reached", () => {
  clearSessions();
  configureSessionStore({ ttlMs: 3600000, maxEntries: 2 });

  const first = createAnonymousSession();
  createAnonymousSession();
  createAnonymousSession();

  assert.equal(getSessionStoreSize(), 2);
  assert.equal(getAnonymousSession(first.id), null);
});
