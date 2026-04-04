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

  const metricsResponse = await app.request("http://localhost/metrics");

  assert.equal(metricsResponse.status, 200);
  const metricsBody = await metricsResponse.json();

  assert.ok(metricsBody.totals.requests >= 1);
  assert.ok(metricsBody.routes.some((route: { route: string }) => route.route === "GET /health"));
});
