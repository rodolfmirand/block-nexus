import { randomUUID } from "node:crypto";

import type {
  CompatibilityAnalysisInput,
  CompatibilityAnalysisResult
} from "../modules/compatibility/engine/contracts.js";

type SessionAnalysisHistoryEntry = {
  analyzedAt: string;
  status: CompatibilityAnalysisResult["status"];
  cacheHit: boolean;
};

type SessionStoreOptions = {
  ttlMs: number;
  maxEntries: number;
};

type SessionStoreMetrics = {
  size: number;
  created: number;
  hits: number;
  misses: number;
  writes: number;
  evictions: number;
  expirations: number;
};

export type AnonymousSession = {
  id: string;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
  selection: CompatibilityAnalysisInput | null;
  lastResult: CompatibilityAnalysisResult | null;
  history: SessionAnalysisHistoryEntry[];
};

const sessions = new Map<string, AnonymousSession>();

let options: SessionStoreOptions = {
  ttlMs: 60 * 60 * 1000,
  maxEntries: 1000
};

let metrics: SessionStoreMetrics = {
  size: 0,
  created: 0,
  hits: 0,
  misses: 0,
  writes: 0,
  evictions: 0,
  expirations: 0
};

export function configureSessionStore(nextOptions: Partial<SessionStoreOptions>): void {
  options = {
    ...options,
    ...nextOptions
  };
}

function computeExpiresAt(nowMs: number): string {
  return new Date(nowMs + options.ttlMs).toISOString();
}

function isExpired(session: AnonymousSession, nowMs: number): boolean {
  return nowMs > Date.parse(session.expiresAt);
}

function touchSession(session: AnonymousSession, nowMs: number): AnonymousSession {
  return {
    ...session,
    updatedAt: new Date(nowMs).toISOString(),
    expiresAt: computeExpiresAt(nowMs)
  };
}

function evictOldestSession(): void {
  const firstKey = sessions.keys().next().value as string | undefined;

  if (!firstKey) {
    return;
  }

  sessions.delete(firstKey);
  metrics.evictions += 1;
}

function refreshSizeMetric(): void {
  metrics.size = sessions.size;
}

function upsertSession(session: AnonymousSession): AnonymousSession {
  sessions.delete(session.id);
  sessions.set(session.id, session);

  while (sessions.size > options.maxEntries) {
    evictOldestSession();
  }

  refreshSizeMetric();
  return session;
}

export function createAnonymousSession(): AnonymousSession {
  const nowMs = Date.now();
  const session: AnonymousSession = {
    id: randomUUID(),
    createdAt: new Date(nowMs).toISOString(),
    updatedAt: new Date(nowMs).toISOString(),
    expiresAt: computeExpiresAt(nowMs),
    selection: null,
    lastResult: null,
    history: []
  };

  metrics.created += 1;
  metrics.writes += 1;

  return upsertSession(session);
}

export function getAnonymousSession(sessionId: string): AnonymousSession | null {
  const nowMs = Date.now();
  const session = sessions.get(sessionId);

  if (!session) {
    metrics.misses += 1;
    return null;
  }

  if (isExpired(session, nowMs)) {
    sessions.delete(sessionId);
    metrics.expirations += 1;
    metrics.misses += 1;
    refreshSizeMetric();
    return null;
  }

  metrics.hits += 1;

  return upsertSession(touchSession(session, nowMs));
}

export function saveSessionSelection(sessionId: string, selection: CompatibilityAnalysisInput): AnonymousSession | null {
  const current = getAnonymousSession(sessionId);

  if (!current) {
    return null;
  }

  const nowMs = Date.now();
  const next: AnonymousSession = {
    ...current,
    selection,
    updatedAt: new Date(nowMs).toISOString(),
    expiresAt: computeExpiresAt(nowMs)
  };

  metrics.writes += 1;

  return upsertSession(next);
}

export function appendSessionAnalysisResult(args: {
  sessionId: string;
  result: CompatibilityAnalysisResult;
  cacheHit: boolean;
}): AnonymousSession | null {
  const current = getAnonymousSession(args.sessionId);

  if (!current) {
    return null;
  }

  const nowMs = Date.now();
  const history = [
    {
      analyzedAt: new Date(nowMs).toISOString(),
      status: args.result.status,
      cacheHit: args.cacheHit
    },
    ...current.history
  ].slice(0, 20);

  const next: AnonymousSession = {
    ...current,
    lastResult: args.result,
    history,
    updatedAt: new Date(nowMs).toISOString(),
    expiresAt: computeExpiresAt(nowMs)
  };

  metrics.writes += 1;

  return upsertSession(next);
}

export function cleanupExpiredSessions(nowMs = Date.now()): number {
  let removed = 0;

  for (const [sessionId, session] of sessions.entries()) {
    if (isExpired(session, nowMs)) {
      sessions.delete(sessionId);
      removed += 1;
    }
  }

  if (removed > 0) {
    metrics.expirations += removed;
    refreshSizeMetric();
  }

  return removed;
}

export function clearSessions(): void {
  sessions.clear();
  metrics = {
    size: 0,
    created: 0,
    hits: 0,
    misses: 0,
    writes: 0,
    evictions: 0,
    expirations: 0
  };
}

export function getSessionStoreSize(): number {
  return sessions.size;
}

export function getSessionStoreMetrics(): SessionStoreMetrics {
  return {
    ...metrics,
    size: sessions.size
  };
}
