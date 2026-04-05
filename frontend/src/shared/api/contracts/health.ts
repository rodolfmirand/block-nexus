export type HealthResponse = {
  status: "ok" | "degraded";
  service: string;
  environment: string;
  database: {
    status: "up" | "down";
    database: string | null;
    latencyMs: number | null;
    error: string | null;
  };
};
