import { test } from "node:test";
import assert from "node:assert/strict";

import { createApp } from "../app.js";
import { resetMetrics } from "../lib/metrics.js";

test("returns 400 for invalid analyze payload", async () => {
  const app = createApp();

  const response = await app.request("http://localhost/analyze", {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify({ loader: "forge" })
  });

  assert.equal(response.status, 400);
  const body = await response.json();
  assert.equal(body.error, "Invalid request payload.");
});

test("collects basic metrics by route", async () => {
  resetMetrics();

  const app = createApp();

  await app.request("http://localhost/health");
  await app.request("http://localhost/analyze", {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify({ loader: "forge" })
  });

  const metricsResponse = await app.request("http://localhost/metrics");

  assert.equal(metricsResponse.status, 200);
  const metricsBody = await metricsResponse.json();

  assert.ok(metricsBody.totals.requests >= 2);
  assert.ok(metricsBody.routes.some((route: { route: string }) => route.route === "GET /health"));
  assert.ok(metricsBody.cache);
  assert.ok(metricsBody.sessions);
  assert.ok(metricsBody.analyze);
  assert.ok(metricsBody.sessionAnalyze);

  assert.equal(typeof metricsBody.cache.size, "number");
  assert.equal(typeof metricsBody.sessions.size, "number");

  assert.equal(typeof metricsBody.analyze.requests, "number");
  assert.equal(typeof metricsBody.analyze.validationErrors, "number");
  assert.equal(typeof metricsBody.analyze.cacheHits, "number");
  assert.equal(typeof metricsBody.analyze.cacheMisses, "number");
  assert.equal(typeof metricsBody.analyze.dbUnavailableErrors, "number");
  assert.equal(typeof metricsBody.analyze.internalErrors, "number");
  assert.equal(typeof metricsBody.sessionAnalyze.requests, "number");
  assert.equal(typeof metricsBody.sessionAnalyze.sessionNotFound, "number");
  assert.equal(typeof metricsBody.sessionAnalyze.missingSelection, "number");
});

test("returns 400 when inputMode conflicts with payload strategy", async () => {
  const app = createApp();

  const response = await app.request("http://localhost/analyze", {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify({
      loader: "forge",
      minecraftVersion: "1.21.1",
      inputMode: "version_ids",
      selectedMods: [{ modSlug: "create" }]
    })
  });

  assert.equal(response.status, 400);
  const body = await response.json();
  assert.equal(body.error, "Invalid request payload.");
  assert.ok(
    body.details.some((detail: string) => detail.includes("inputMode=version_ids"))
  );
});


test("returns 400 for invalid recommendation payload", async () => {
  const app = createApp();

  const response = await app.request("http://localhost/recommendations", {
    method: "POST",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify({ loader: "forge", minecraftVersion: "1.21.1" })
  });

  assert.equal(response.status, 400);
  const body = await response.json();
  assert.equal(body.error, "Invalid request payload.");
});
