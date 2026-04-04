import type {
  CompatibilityAnalysisInput,
  CompatibilityAnalysisResult,
  SelectedMod
} from "../modules/compatibility/engine/contracts.js";

type CachedAnalysis = {
  key: string;
  createdAt: number;
  expiresAt: number;
  result: CompatibilityAnalysisResult;
};

type CacheOptions = {
  ttlMs: number;
  maxEntries: number;
};

const cache = new Map<string, CachedAnalysis>();

let options: CacheOptions = {
  ttlMs: 5 * 60 * 1000,
  maxEntries: 1000
};

export function configureAnalysisCache(nextOptions: Partial<CacheOptions>): void {
  options = {
    ...options,
    ...nextOptions
  };
}

function normalizeSelectedMods(selectedMods: SelectedMod[] | undefined): string[] {
  if (!selectedMods || selectedMods.length === 0) {
    return [];
  }

  return selectedMods
    .map((mod) => `${mod.modId ?? ""}:${(mod.modSlug ?? "").toLowerCase()}`)
    .sort();
}

function normalizeVersionIds(selectedModVersionIds: string[] | undefined): string[] {
  if (!selectedModVersionIds || selectedModVersionIds.length === 0) {
    return [];
  }

  return [...selectedModVersionIds].sort();
}

function evictOldestCacheEntry(): void {
  const firstKey = cache.keys().next().value as string | undefined;

  if (!firstKey) {
    return;
  }

  cache.delete(firstKey);
}

export function buildAnalysisCacheKey(input: CompatibilityAnalysisInput): string {
  return JSON.stringify({
    loader: input.loader,
    inputMode: input.inputMode ?? null,
    minecraftVersion: input.minecraftVersion,
    selectedMods: normalizeSelectedMods(input.selectedMods),
    selectedModVersionIds: normalizeVersionIds(input.selectedModVersionIds)
  });
}

export function getCachedAnalysis(input: CompatibilityAnalysisInput): CompatibilityAnalysisResult | null {
  const key = buildAnalysisCacheKey(input);
  const cached = cache.get(key);

  if (!cached) {
    return null;
  }

  if (Date.now() > cached.expiresAt) {
    cache.delete(key);
    return null;
  }

  cache.delete(key);
  cache.set(key, cached);

  return cached.result;
}

export function setCachedAnalysis(args: {
  input: CompatibilityAnalysisInput;
  result: CompatibilityAnalysisResult;
  ttlMs?: number;
}): void {
  const ttlMs = args.ttlMs ?? options.ttlMs;
  const key = buildAnalysisCacheKey(args.input);
  const now = Date.now();

  cache.delete(key);
  cache.set(key, {
    key,
    createdAt: now,
    expiresAt: now + ttlMs,
    result: args.result
  });

  while (cache.size > options.maxEntries) {
    evictOldestCacheEntry();
  }
}

export function cleanupExpiredCache(nowMs = Date.now()): number {
  let removed = 0;

  for (const [key, value] of cache.entries()) {
    if (nowMs > value.expiresAt) {
      cache.delete(key);
      removed += 1;
    }
  }

  return removed;
}

export function clearAnalysisCache(): void {
  cache.clear();
}

export function getAnalysisCacheSize(): number {
  return cache.size;
}
