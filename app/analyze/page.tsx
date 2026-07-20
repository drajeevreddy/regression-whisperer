"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "rw-provider-keys";

function loadKeys(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

interface PR {
  number: number;
  title: string;
  author: string;
  branch: string;
  commitSha: string;
  createdAt: string;
  updatedAt: string;
  changedFiles: number;
  additions: number;
  deletions: number;
  labels: string[];
}

interface AnalyzeResult {
  severity: string;
  summary: string;
  rootCause: string;
  recommendation: string;
  regressions: Array<{ functionName: string; description: string; severity: string }>;
  prDbId: number | null;
}

export default function AnalyzePage() {
  const router = useRouter();
  const [repoUrl, setRepoUrl] = useState("");
  const [owner, setOwner] = useState("");
  const [repo, setRepo] = useState("");
  const [prs, setPrs] = useState<PR[]>([]);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState<number | null>(null);
  const [result, setResult] = useState<AnalyzeResult | null>(null);
  const [error, setError] = useState("");

  const parseUrl = useCallback((url: string) => {
    const cleaned = url.trim().replace(/\/+$/, "");
    const match = cleaned.match(/github\.com\/([^/]+)\/([^/]+)/);
    if (match) {
      return { owner: match[1], repo: match[2] };
    }
    // Try owner/repo format
    const parts = cleaned.split("/");
    if (parts.length === 2 && parts[0] && parts[1]) {
      return { owner: parts[0], repo: parts[1] };
    }
    return null;
  }, []);

  const handleFetchPrs = useCallback(async () => {
    setError("");
    setResult(null);
    setPrs([]);

    const parsed = parseUrl(repoUrl);
    if (!parsed) {
      setError("Invalid GitHub URL. Use format: https://github.com/owner/repo or owner/repo");
      return;
    }

    setOwner(parsed.owner);
    setRepo(parsed.repo);
    setLoading(true);

    try {
      const keys = loadKeys();
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (Object.keys(keys).length > 0) {
        headers["x-byok-keys"] = btoa(JSON.stringify(keys));
      }

      const res = await fetch(`/api/github/repos?owner=${parsed.owner}&repo=${parsed.repo}`, { headers });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to fetch PRs");
        return;
      }

      setPrs(data.prs ?? []);
      if ((data.prs ?? []).length === 0) {
        setError("No open pull requests found for this repository.");
      }
    } catch {
      setError("Failed to connect to GitHub API. Check the repo URL and try again.");
    } finally {
      setLoading(false);
    }
  }, [repoUrl, parseUrl]);

  const handleAnalyze = useCallback(
    async (pr: PR) => {
      setError("");
      setResult(null);
      setAnalyzing(pr.number);

      try {
        const keys = loadKeys();
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (Object.keys(keys).length > 0) {
          headers["x-byok-keys"] = btoa(JSON.stringify(keys));
        }

        const res = await fetch("/api/github/analyze", {
          method: "POST",
          headers,
          body: JSON.stringify({
            owner,
            repo,
            prNumber: pr.number,
            commitSha: pr.commitSha,
            branch: pr.branch,
            title: pr.title,
            author: pr.author,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "Analysis failed");
          return;
        }

        setResult(data);

        // If DB persisted, we can navigate to detail after a moment
        if (data.prDbId) {
          setTimeout(() => {
            router.push(`/prs/${data.prDbId}`);
          }, 2000);
        }
      } catch {
        setError("Analysis request failed. Check your API keys in Setup.");
      } finally {
        setAnalyzing(null);
      }
    },
    [owner, repo, router],
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleFetchPrs();
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <div className="mb-8">
        <h2 className="text-sm font-semibold text-text-primary mb-2">
          Analyze a Repository
        </h2>
        <p className="text-xs text-text-muted mb-4">
          Enter a GitHub repository URL to fetch open pull requests and analyze them for performance regressions.
        </p>

        <div className="flex gap-2">
          <input
            type="text"
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="github.com/owner/repo or owner/repo"
            className="flex-1 px-3 py-2 text-sm font-mono bg-bg-surface border border-border-primary text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent/50"
            style={{ borderRadius: 2 }}
          />
          <button
            type="button"
            onClick={handleFetchPrs}
            disabled={loading || !repoUrl.trim()}
            className={cn(
              "px-4 py-2 text-xs font-mono border transition-colors cursor-pointer",
              loading || !repoUrl.trim()
                ? "bg-bg-surface border-border-primary text-text-muted cursor-not-allowed"
                : "bg-accent border-accent text-bg-primary hover:bg-accent/90"
            )}
            style={{ borderRadius: 2 }}
          >
            {loading ? "Fetching..." : "Fetch PRs"}
          </button>
        </div>
      </div>

      {error && (
        <div className="border border-red/30 bg-red-dim/20 p-3 mb-6 text-xs text-red font-mono" style={{ borderRadius: 4 }}>
          {error}
        </div>
      )}

      {result && (
        <div
          className={cn(
            "border p-4 mb-6 animate-slide-up",
            result.severity === "high"
              ? "border-red/40 bg-red-dim/10"
              : result.severity === "medium"
                ? "border-accent/40 bg-accent-dim/10"
                : "border-green/40 bg-green-dim/10"
          )}
          style={{ borderRadius: 4 }}
        >
          <div className="flex items-center gap-2 mb-3">
            <span
              className={cn(
                "font-mono text-[10px] uppercase tracking-wider",
                result.severity === "high" ? "text-red" : result.severity === "medium" ? "text-accent" : "text-green"
              )}
            >
              {result.severity === "high" ? "Regression Detected" : result.severity === "medium" ? "Potential Issue" : "No Regressions"}
            </span>
            {result.prDbId && (
              <span className="text-[10px] text-text-muted font-mono">
                Saved to DB &mdash; redirecting...
              </span>
            )}
          </div>
          <p className="text-sm text-text-primary mb-2">{result.summary}</p>
          <p className="text-xs text-text-secondary mb-2">{result.rootCause}</p>
          <p className="text-xs text-text-muted">
            <span className="text-text-secondary">Fix:</span> {result.recommendation}
          </p>
          {result.regressions.length > 0 && (
            <div className="mt-3 pt-3 border-t border-border-primary">
              {result.regressions.map((r, i) => (
                <div key={i} className="flex items-start gap-2 mb-1">
                  <span
                    className={cn(
                      "font-mono text-[10px] uppercase shrink-0 mt-0.5",
                      r.severity === "high" ? "text-red" : "text-accent"
                    )}
                  >
                    {r.severity}
                  </span>
                  <span className="text-xs text-text-secondary">
                    <span className="text-text-primary font-mono">{r.functionName}</span>: {r.description}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {prs.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-mono uppercase tracking-wider text-text-muted">
              Open PRs in {owner}/{repo}
            </h3>
            <span className="text-[10px] font-mono text-text-muted">{prs.length} PRs</span>
          </div>

          <div className="border border-border-primary" style={{ borderRadius: 4 }}>
            {prs.map((pr) => (
              <div
                key={pr.number}
                className="flex items-center gap-4 px-4 py-3 border-b border-border-primary last:border-b-0 hover:bg-bg-surface transition-colors"
              >
                <span className="font-mono text-xs text-text-muted shrink-0">#{pr.number}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-text-primary truncate">{pr.title}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-[10px] font-mono text-text-muted">{pr.author}</span>
                    <span className="text-[10px] font-mono text-text-muted">{pr.branch}</span>
                    <span className="text-[10px] font-mono text-text-muted">
                      +{pr.additions}/-{pr.deletions} in {pr.changedFiles} files
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleAnalyze(pr)}
                  disabled={analyzing !== null}
                  className={cn(
                    "px-3 py-1.5 text-[10px] font-mono border transition-colors cursor-pointer shrink-0",
                    analyzing === pr.number
                      ? "bg-accent/20 border-accent/40 text-accent animate-breathe"
                      : analyzing !== null
                        ? "bg-bg-surface border-border-primary text-text-muted cursor-not-allowed"
                        : "bg-transparent border-border-primary text-text-secondary hover:text-accent hover:border-accent/40"
                  )}
                  style={{ borderRadius: 2 }}
                >
                  {analyzing === pr.number ? "Analyzing..." : "Analyze"}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && prs.length === 0 && !error && !result && (
        <div className="text-center py-24">
          <p className="text-xs text-text-muted font-mono">
            Enter a GitHub repository URL above to get started.
          </p>
        </div>
      )}
    </div>
  );
}
