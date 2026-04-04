type RouteStats = {
  requests: number;
  errors: number;
  totalLatencyMs: number;
  maxLatencyMs: number;
};

const routeStats = new Map<string, RouteStats>();

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
    routes
  };
}

export function resetMetrics(): void {
  routeStats.clear();
}
