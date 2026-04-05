import type {
  AnalyzeRequest,
  AnalyzeResponse,
  ErrorResponse,
  HealthResponse,
  ModSearchResponse,
  RecommendationRequest,
  RecommendationResponse,
  SessionAnalyzeResponse,
  SessionCreatedResponse,
  SessionResponse,
  SessionSelectionPayload
} from "./contracts";

type ApiConfig = {
  baseUrl: string;
};

const apiConfig: ApiConfig = {
  baseUrl: (import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000").replace(/\/$/, "")
};

export class ApiError extends Error {
  public readonly status: number;

  public readonly payload: ErrorResponse | null;

  public constructor(args: {
    message: string;
    status: number;
    payload: ErrorResponse | null;
  }) {
    super(args.message);
    this.name = "ApiError";
    this.status = args.status;
    this.payload = args.payload;
  }
}

export function getApiBaseUrl(): string {
  return apiConfig.baseUrl;
}

function normalizeErrorMessage(status: number, payload: ErrorResponse | null): string {
  if (status === 400) {
    return payload?.error ?? "Invalid request payload.";
  }

  if (status === 503) {
    return payload?.error ?? "Service is temporarily unavailable.";
  }

  if (status >= 500) {
    return payload?.error ?? "Internal server error.";
  }

  return payload?.error ?? `Request failed with status ${status}.`;
}

function parseErrorPayload(data: unknown): ErrorResponse | null {
  if (!data || typeof data !== "object") {
    return null;
  }

  const candidate = data as Record<string, unknown>;

  if (typeof candidate.error !== "string") {
    return null;
  }

  const detailsValue = candidate.details;

  if (
    detailsValue !== undefined
    && typeof detailsValue !== "string"
    && !Array.isArray(detailsValue)
  ) {
    return {
      error: candidate.error
    };
  }

  return {
    error: candidate.error,
    ...(detailsValue !== undefined ? { details: detailsValue as string | string[] } : {})
  };
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${apiConfig.baseUrl}${path}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(init?.headers ?? {})
    }
  });

  const hasBody = response.status !== 204;
  const data = hasBody ? await response.json().catch(() => null) : null;

  if (!response.ok) {
    const payload = parseErrorPayload(data);

    throw new ApiError({
      status: response.status,
      payload,
      message: normalizeErrorMessage(response.status, payload)
    });
  }

  return data as T;
}

export function toDisplayError(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Unknown error while contacting API.";
}

export function getHealth(): Promise<HealthResponse> {
  return requestJson<HealthResponse>("/health", {
    method: "GET"
  });
}

export function searchMods(args: {
  q?: string;
  name?: string;
  slug?: string;
  limit?: number;
}): Promise<ModSearchResponse> {
  const params = new URLSearchParams();

  if (args.q) {
    params.set("q", args.q);
  }

  if (args.name) {
    params.set("name", args.name);
  }

  if (args.slug) {
    params.set("slug", args.slug);
  }

  if (args.limit !== undefined) {
    params.set("limit", String(args.limit));
  }

  const query = params.toString();

  return requestJson<ModSearchResponse>(`/mods/search${query.length > 0 ? `?${query}` : ""}`, {
    method: "GET"
  });
}

export function analyze(payload: AnalyzeRequest): Promise<AnalyzeResponse> {
  return requestJson<AnalyzeResponse>("/analyze", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function recommend(payload: RecommendationRequest): Promise<RecommendationResponse> {
  return requestJson<RecommendationResponse>("/recommendations", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function createSession(): Promise<SessionCreatedResponse> {
  return requestJson<SessionCreatedResponse>("/sessions", {
    method: "POST"
  });
}

export function getSession(sessionId: string): Promise<SessionResponse> {
  return requestJson<SessionResponse>(`/sessions/${sessionId}`, {
    method: "GET"
  });
}

export function updateSessionSelection(args: {
  sessionId: string;
  selection: SessionSelectionPayload;
}): Promise<SessionResponse> {
  return requestJson<SessionResponse>(`/sessions/${args.sessionId}/selection`, {
    method: "PUT",
    body: JSON.stringify(args.selection)
  });
}

export function analyzeSession(sessionId: string): Promise<SessionAnalyzeResponse> {
  return requestJson<SessionAnalyzeResponse>(`/sessions/${sessionId}/analyze`, {
    method: "POST"
  });
}
