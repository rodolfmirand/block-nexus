type RouteStats = {
  requests: number;
  errors: number;
  totalLatencyMs: number;
  maxLatencyMs: number;
};

type AnalyzeStats = {
  requests: number;
  cacheHits: number;
  cacheMisses: number;
  compatibleResults: number;
  incompatibleResults: number;
  validationErrors: number;
  dbUnavailableErrors: number;
  internalErrors: number;
};

type SessionAnalyzeStats = {
  requests: number;
  cacheHits: number;
  cacheMisses: number;
  compatibleResults: number;
  incompatibleResults: number;
  sessionNotFound: number;
  missingSelection: number;
  dbUnavailableErrors: number;
  internalErrors: number;
};

const routeStats = new Map<string, RouteStats>();

let analyzeStats: AnalyzeStats = {
  requests: 0,
  cacheHits: 0,
  cacheMisses: 0,
  compatibleResults: 0,
  incompatibleResults: 0,
  validationErrors: 0,
  dbUnavailableErrors: 0,
  internalErrors: 0
};

let sessionAnalyzeStats: SessionAnalyzeStats = {
  requests: 0,
  cacheHits: 0,
  cacheMisses: 0,
  compatibleResults: 0,
  incompatibleResults: 0,
  sessionNotFound: 0,
  missingSelection: 0,
  dbUnavailableErrors: 0,
  internalErrors: 0
};

export function recordRequestMetric(routeKey: string, latencyMs: number, statusCode: number): void {
  const current = routeStats.get(routeKey) ?? {
    requests: 0,
    errors: 0,
    totalLatencyMs: 0,
    maxLatencyMs: 0
  };

  current.requests += 1;
  current.totalLatencyMs += latencyMs;
  current.maxLatencyMs = Math.max(current.maxLatencyMs, latencyMs);

  if (statusCode >= 500) {
    current.errors += 1;
  }

  routeStats.set(routeKey, current);
}

export function recordAnalyzeRequest(): void {
  analyzeStats.requests += 1;
}

export function recordAnalyzeCacheHit(): void {
  analyzeStats.cacheHits += 1;
}

export function recordAnalyzeCacheMiss(): void {
  analyzeStats.cacheMisses += 1;
}

export function recordAnalyzeCompleted(status: "compatible" | "incompatible"): void {
  if (status === "compatible") {
    analyzeStats.compatibleResults += 1;
    return;
  }

  analyzeStats.incompatibleResults += 1;
}

export function recordAnalyzeValidationError(): void {
  analyzeStats.validationErrors += 1;
}

export function recordAnalyzeFailed(reason: "db_unavailable" | "internal"): void {
  if (reason === "db_unavailable") {
    analyzeStats.dbUnavailableErrors += 1;
    return;
  }

  analyzeStats.internalErrors += 1;
}

export function recordSessionAnalyzeRequest(): void {
  sessionAnalyzeStats.requests += 1;
}

export function recordSessionAnalyzeCacheHit(): void {
  sessionAnalyzeStats.cacheHits += 1;
}

export function recordSessionAnalyzeCacheMiss(): void {
  sessionAnalyzeStats.cacheMisses += 1;
}

export function recordSessionAnalyzeCompleted(status: "compatible" | "incompatible"): void {
  if (status === "compatible") {
    sessionAnalyzeStats.compatibleResults += 1;
    return;
  }

  sessionAnalyzeStats.incompatibleResults += 1;
}

export function recordSessionAnalyzeSessionNotFound(): void {
  sessionAnalyzeStats.sessionNotFound += 1;
}

export function recordSessionAnalyzeMissingSelection(): void {
  sessionAnalyzeStats.missingSelection += 1;
}

export function recordSessionAnalyzeFailed(reason: "db_unavailable" | "internal"): void {
  if (reason === "db_unavailable") {
    sessionAnalyzeStats.dbUnavailableErrors += 1;
    return;
  }

  sessionAnalyzeStats.internalErrors += 1;
}

export function getMetricsSnapshot(): {
  totals: {
    routes: number;
    requests: number;
    errors: number;
  };
  routes: Array<{
    route: string;
    requests: number;
    errors: number;
    errorRate: number;
    avgLatencyMs: number;
    maxLatencyMs: number;
  }>;
  analyze: AnalyzeStats;
  sessionAnalyze: SessionAnalyzeStats;
} {
  const routes = [...routeStats.entries()].map(([route, stats]) => ({
    route,
    requests: stats.requests,
    errors: stats.errors,
    errorRate: stats.requests > 0 ? Number((stats.errors / stats.requests).toFixed(4)) : 0,
    avgLatencyMs: stats.requests > 0 ? Number((stats.totalLatencyMs / stats.requests).toFixed(2)) : 0,
    maxLatencyMs: Number(stats.maxLatencyMs.toFixed(2))
  }));

  const totals = routes.reduce(
    (accumulator, route) => ({
      routes: accumulator.routes + 1,
      requests: accumulator.requests + route.requests,
      errors: accumulator.errors + route.errors
    }),
    {
      routes: 0,
      requests: 0,
      errors: 0
    }
  );

  return {
    totals,
    routes,
    analyze: { ...analyzeStats },
    sessionAnalyze: { ...sessionAnalyzeStats }
  };
}

export function resetMetrics(): void {
  routeStats.clear();
  analyzeStats = {
    requests: 0,
    cacheHits: 0,
    cacheMisses: 0,
    compatibleResults: 0,
    incompatibleResults: 0,
    validationErrors: 0,
    dbUnavailableErrors: 0,
    internalErrors: 0
  };
  sessionAnalyzeStats = {
    requests: 0,
    cacheHits: 0,
    cacheMisses: 0,
    compatibleResults: 0,
    incompatibleResults: 0,
    sessionNotFound: 0,
    missingSelection: 0,
    dbUnavailableErrors: 0,
    internalErrors: 0
  };
}
