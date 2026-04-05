import { useEffect, useMemo, useState } from "react";

import {
  analyzeSession,
  createSession,
  getSession,
  recommend,
  searchMods,
  toDisplayError,
  updateSessionSelection
} from "./shared/api";
import type {
  AnalyzeResponse,
  ModSearchItem,
  RecommendationResponse,
  SelectedMod,
  SessionResponse
} from "./shared/api";

type SelectedModView = {
  modId?: string;
  modSlug?: string;
  title: string;
};

const SESSION_STORAGE_KEY = "blocknexus.session_id";

function toSelectionPayload(mods: SelectedModView[]): SelectedMod[] {
  return mods.map((mod) => ({
    ...(mod.modId ? { modId: mod.modId } : {}),
    ...(mod.modSlug ? { modSlug: mod.modSlug } : {})
  }));
}

function modKey(mod: { modId?: string; modSlug?: string }): string {
  return mod.modId ?? mod.modSlug ?? "unknown";
}

function statusChipClass(status: AnalyzeResponse["status"]): string {
  return status === "compatible" ? "chip chip-success" : "chip chip-danger";
}

export function App(): JSX.Element {
  const [loader, setLoader] = useState("forge");
  const [minecraftVersion, setMinecraftVersion] = useState("1.21.1");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<ModSearchItem[]>([]);
  const [selectedMods, setSelectedMods] = useState<SelectedModView[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(() => localStorage.getItem(SESSION_STORAGE_KEY));

  const [analysisResult, setAnalysisResult] = useState<AnalyzeResponse | null>(null);
  const [recommendationResult, setRecommendationResult] = useState<RecommendationResponse | null>(null);
  const [sessionSnapshot, setSessionSnapshot] = useState<SessionResponse | null>(null);

  const [searchLoading, setSearchLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [recommendationLoading, setRecommendationLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [uiMessage, setUiMessage] = useState("Ready");
  const [uiError, setUiError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) {
      return;
    }

    localStorage.setItem(SESSION_STORAGE_KEY, sessionId);
  }, [sessionId]);

  const selectedKeys = useMemo(() => new Set(selectedMods.map((mod) => modKey(mod))), [selectedMods]);

  async function ensureSession(): Promise<string> {
    if (sessionId) {
      return sessionId;
    }

    const created = await createSession();
    setSessionId(created.id);
    return created.id;
  }

  async function refreshSessionSnapshot(id: string): Promise<void> {
    setHistoryLoading(true);

    try {
      const snapshot = await getSession(id);
      setSessionSnapshot(snapshot);
    } finally {
      setHistoryLoading(false);
    }
  }

  async function handleSearch(): Promise<void> {
    const query = searchQuery.trim();

    if (query.length === 0) {
      setUiError("Type a mod name or slug to search.");
      return;
    }

    setSearchLoading(true);
    setUiError(null);

    try {
      const response = await searchMods({ q: query, limit: 20 });
      setSearchResults(response.items);
      setUiMessage(`Found ${response.total} result(s).`);
    } catch (error: unknown) {
      setUiError(toDisplayError(error));
    } finally {
      setSearchLoading(false);
    }
  }

  function handleAddMod(item: ModSearchItem): void {
    const key = modKey({ modId: item.id, modSlug: item.slug });

    if (selectedKeys.has(key)) {
      return;
    }

    setSelectedMods((current) => [
      ...current,
      {
        modId: item.id,
        modSlug: item.slug,
        title: item.title
      }
    ]);
  }

  function handleRemoveMod(mod: SelectedModView): void {
    const key = modKey(mod);
    setSelectedMods((current) => current.filter((item) => modKey(item) !== key));
  }

  async function handleSaveSelection(): Promise<void> {
    if (selectedMods.length === 0) {
      setUiError("Select at least one mod before saving the session selection.");
      return;
    }

    setSaveLoading(true);
    setUiError(null);

    try {
      const id = await ensureSession();

      await updateSessionSelection({
        sessionId: id,
        selection: {
          loader,
          minecraftVersion,
          inputMode: "mods",
          selectedMods: toSelectionPayload(selectedMods)
        }
      });

      await refreshSessionSnapshot(id);
      setUiMessage(`Selection saved in session ${id}.`);
    } catch (error: unknown) {
      setUiError(toDisplayError(error));
    } finally {
      setSaveLoading(false);
    }
  }

  async function handleAnalyze(): Promise<void> {
    if (selectedMods.length === 0) {
      setUiError("Select at least one mod before running analysis.");
      return;
    }

    setAnalysisLoading(true);
    setUiError(null);

    try {
      const id = await ensureSession();

      await updateSessionSelection({
        sessionId: id,
        selection: {
          loader,
          minecraftVersion,
          inputMode: "mods",
          selectedMods: toSelectionPayload(selectedMods)
        }
      });

      const response = await analyzeSession(id);
      setAnalysisResult(response);
      await refreshSessionSnapshot(id);

      setUiMessage(`Analysis completed for session ${id}.`);
    } catch (error: unknown) {
      setUiError(toDisplayError(error));
    } finally {
      setAnalysisLoading(false);
    }
  }

  async function handleRecommendations(): Promise<void> {
    if (selectedMods.length === 0) {
      setUiError("Select at least one mod before requesting recommendations.");
      return;
    }

    setRecommendationLoading(true);
    setUiError(null);

    try {
      const response = await recommend({
        loader,
        minecraftVersion,
        selectedMods: toSelectionPayload(selectedMods),
        limit: 10
      });

      setRecommendationResult(response);
      setUiMessage(`Recommendations loaded: ${response.recommendations.length}.`);
    } catch (error: unknown) {
      setUiError(toDisplayError(error));
    } finally {
      setRecommendationLoading(false);
    }
  }

  async function handleRefreshHistory(): Promise<void> {
    if (!sessionId) {
      setUiError("No active session yet.");
      return;
    }

    setUiError(null);

    try {
      await refreshSessionSnapshot(sessionId);
      setUiMessage(`Session ${sessionId} refreshed.`);
    } catch (error: unknown) {
      setUiError(toDisplayError(error));
    }
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">BlockNexus</p>
          <h1>Compatibility Workbench</h1>
        </div>
        <div className="topbar-meta">
          <span className="chip chip-neutral">Frontend FE-3</span>
          <span className="chip chip-info">Session: {sessionId ?? "not-created"}</span>
        </div>
      </header>

      <main className="layout-grid">
        <section className="card stack-md">
          <h2>Environment</h2>
          <div className="field-grid">
            <label className="field">
              <span>Mod Loader</span>
              <select value={loader} onChange={(event) => setLoader(event.target.value)} aria-label="Mod Loader">
                <option value="forge">Forge</option>
                <option value="fabric">Fabric</option>
                <option value="neoforge">NeoForge</option>
                <option value="quilt">Quilt</option>
              </select>
            </label>
            <label className="field">
              <span>Minecraft Version</span>
              <input
                value={minecraftVersion}
                onChange={(event) => setMinecraftVersion(event.target.value)}
                aria-label="Minecraft Version"
              />
            </label>
          </div>

          <div className="button-row">
            <button type="button" className="button-ghost" onClick={handleSaveSelection} disabled={saveLoading}>
              {saveLoading ? "Saving..." : "Save Selection"}
            </button>
            <button type="button" className="button-primary" onClick={handleAnalyze} disabled={analysisLoading}>
              {analysisLoading ? "Analyzing..." : "Analyze Compatibility"}
            </button>
          </div>

          <p className="hint">{uiMessage}</p>
          {uiError ? <p className="error-text">{uiError}</p> : null}
        </section>

        <section className="card stack-md">
          <h2>Search Mods</h2>
          <label className="field">
            <span>Search by name or slug</span>
            <div className="search-row">
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="create, sodium, travelersbackpack..."
                aria-label="Search mods"
              />
              <button type="button" className="button-ghost" onClick={handleSearch} disabled={searchLoading}>
                {searchLoading ? "Searching..." : "Search"}
              </button>
            </div>
          </label>

          <ul className="list-simple">
            {searchResults.map((item) => (
              <li key={item.id}>
                <div className="list-item-main">
                  <span>{item.title}</span>
                  <code>{item.slug}</code>
                </div>
                <button
                  type="button"
                  className="button-ghost"
                  onClick={() => handleAddMod(item)}
                  disabled={selectedKeys.has(modKey({ modId: item.id, modSlug: item.slug }))}
                >
                  Add
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section className="card stack-md">
          <h2>Selection</h2>
          <ul className="list-tags">
            {selectedMods.map((mod) => (
              <li key={modKey(mod)}>
                <div>
                  <span>{mod.title}</span>
                  <code>{mod.modSlug ?? mod.modId ?? "unknown"}</code>
                </div>
                <button type="button" className="button-ghost" onClick={() => handleRemoveMod(mod)}>
                  Remove
                </button>
              </li>
            ))}
          </ul>

          <button
            type="button"
            className="button-ghost"
            onClick={handleRecommendations}
            disabled={recommendationLoading}
          >
            {recommendationLoading ? "Loading recommendations..." : "Get Recommendations"}
          </button>
        </section>

        <section className="card result-card stack-md">
          <div className="result-header">
            <h2>Analysis</h2>
            {analysisResult ? (
              <span className={statusChipClass(analysisResult.status)}>{analysisResult.status}</span>
            ) : (
              <span className="chip chip-neutral">not-run</span>
            )}
          </div>

          <div className="summary-grid">
            <article>
              <strong>Resolved Versions</strong>
              <p>{analysisResult?.resolvedSelections.length ?? 0}</p>
            </article>
            <article>
              <strong>Dependencies</strong>
              <p>{analysisResult?.resolvedDependencies.length ?? 0}</p>
            </article>
            <article>
              <strong>Missing Dependencies</strong>
              <p>{analysisResult?.missingDependencies.length ?? 0}</p>
            </article>
            <article>
              <strong>Issues</strong>
              <p>{analysisResult?.issues.length ?? 0}</p>
            </article>
          </div>

          <div className="stack-sm">
            <h3>Resolved Selections</h3>
            <ul className="list-issues">
              {(analysisResult?.resolvedSelections ?? []).map((selection) => (
                <li key={`${selection.modVersionId}-${selection.origin}`}>
                  <code>{selection.modSlug}</code>
                  <span>{selection.versionNumber} ({selection.origin})</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="stack-sm">
            <h3>Resolved Dependencies</h3>
            <ul className="list-issues">
              {(analysisResult?.resolvedDependencies ?? []).map((dependency, index) => (
                <li key={`${String(dependency["dependencyId"])}-${index}`}>
                  <code>{String(dependency["dependencyKind"] ?? "unknown")}</code>
                  <span>
                    {`source=${String(dependency["sourceModVersionId"] ?? "-")} -> target=${String(dependency["targetModVersionId"] ?? "-")}`}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="stack-sm">
            <h3>Issues</h3>
            <ul className="list-issues">
              {(analysisResult?.issues ?? []).map((issue) => (
                <li key={issue.message}>
                  <code>{issue.kind}</code>
                  <span>{issue.message}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="stack-sm">
            <h3>Missing Dependencies</h3>
            <ul className="list-issues">
              {(analysisResult?.missingDependencies ?? []).map((dependency, index) => (
                <li key={`${String(dependency["dependencyId"])}-${index}`}>
                  <code>{String(dependency["dependencyKind"] ?? "unknown")}</code>
                  <span>{String(dependency["message"] ?? "Missing dependency")}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="card result-card stack-md">
          <h2>Recommendations</h2>
          <div className="hint">
            {recommendationResult
              ? `Strategy: ${recommendationResult.meta.strategy} (${recommendationResult.meta.usedDependencyKind}).`
              : "No recommendation requested yet."}
          </div>
          <ul className="list-recommendations">
            {(recommendationResult?.recommendations ?? []).map((item) => (
              <li key={item.modVersionId}>
                <div className="recommendation-head">
                  <strong>{item.modSlug}</strong>
                  <span className="chip chip-neutral">score {item.score}</span>
                </div>
                <code>{item.versionNumber}</code>
                <ul className="list-issues">
                  {item.reasons.map((reason) => (
                    <li key={reason.dependencyId}>
                      <code>{reason.dependencyKind}</code>
                      <span>{reason.message}</span>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </section>

        <section className="card result-card stack-md">
          <div className="result-header">
            <h2>Session History</h2>
            <button type="button" className="button-ghost" onClick={handleRefreshHistory} disabled={historyLoading}>
              {historyLoading ? "Refreshing..." : "Refresh"}
            </button>
          </div>
          {sessionSnapshot ? (
            <>
              <div className="summary-grid">
                <article>
                  <strong>Session Id</strong>
                  <p className="mono">{sessionSnapshot.id.slice(0, 8)}</p>
                </article>
                <article>
                  <strong>Updated At</strong>
                  <p className="mono">{new Date(sessionSnapshot.updatedAt).toLocaleString()}</p>
                </article>
                <article>
                  <strong>Expires At</strong>
                  <p className="mono">{new Date(sessionSnapshot.expiresAt).toLocaleString()}</p>
                </article>
                <article>
                  <strong>History Entries</strong>
                  <p>{sessionSnapshot.history.length}</p>
                </article>
              </div>
              <ul className="list-issues">
                {sessionSnapshot.history.map((entry) => (
                  <li key={entry.analyzedAt}>
                    <code>{entry.status}</code>
                    <span>
                      {new Date(entry.analyzedAt).toLocaleString()} | cache {entry.cacheHit ? "hit" : "miss"}
                    </span>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <div className="hint">No session snapshot loaded yet.</div>
          )}
        </section>
      </main>
    </div>
  );
}
