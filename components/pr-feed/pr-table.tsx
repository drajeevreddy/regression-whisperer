"use client";

import { Badge } from "@/components/shared/badge";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useState } from "react";
import { EmptyState } from "@/components/shared/empty-state";

interface PRRow {
  id: number;
  number: number;
  title: string;
  repo: string;
  branch: string;
  author: string;
  severity: string;
  analyzedAt: Date | string | null;
  flamegraph?: unknown;
}

interface PRTableProps {
  prs: PRRow[];
}

const severityLabels: Record<string, { label: string; variant: "accent" | "red" | "green" | "muted" }> = {
  high: { label: "HIGH", variant: "red" },
  medium: { label: "MED", variant: "accent" },
  low: { label: "LOW", variant: "muted" },
  none: { label: "—", variant: "muted" },
};

function PRRow({ pr }: { pr: PRRow }) {
  const s = severityLabels[pr.severity] ?? severityLabels.none;

  return (
    <Link
      href={`/prs/${pr.id}`}
      className={cn(
        "grid grid-cols-[40px_1fr_120px_80px_80px_140px] gap-4 px-4 py-3",
        "border-b border-border-primary hover:bg-bg-surface transition-colors",
        "no-underline text-inherit items-center"
      )}
    >
      <span className="font-mono text-xs text-text-muted">#{pr.number}</span>
      <span className="text-sm text-text-primary truncate">{pr.title}</span>
      <span className="text-xs text-text-secondary font-mono">{pr.repo}</span>
      <span className="text-xs text-text-secondary truncate">{pr.branch}</span>
      <Badge variant={s.variant}>{s.label}</Badge>
      <span className="text-xs text-text-muted font-mono text-right">
        {pr.analyzedAt
          ? new Date(pr.analyzedAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })
          : "—"}
      </span>
    </Link>
  );
}

export function PRTable({ prs }: PRTableProps) {
  const [filter, setFilter] = useState<"all" | "regression" | "clean">("all");

  const filtered =
    filter === "all"
      ? prs
      : filter === "regression"
        ? prs.filter((p) => p.severity !== "none")
        : prs.filter((p) => p.severity === "none");

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-sm font-semibold text-text-primary">PR Feed</h2>
        <div className="flex items-center gap-1 border border-border-primary" style={{ borderRadius: 2 }}>
          {(["all", "regression", "clean"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-3 py-1 text-xs font-mono cursor-pointer transition-colors bg-transparent border-none",
                filter === f
                  ? "text-text-primary bg-bg-surface"
                  : "text-text-muted hover:text-text-secondary"
              )}
              style={{ borderRadius: 0 }}
            >
              {f === "all" ? "All" : f === "regression" ? "Regressions" : "Clean"}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="No PRs match this filter"
          description="Try a different filter or trigger a pipeline run."
          action={{ label: "Go to Setup", onClick: () => { window.location.href = "/setup"; } }}
        />
      ) : (
        <div className="border border-border-primary" style={{ borderRadius: 4 }}>
          <div className="grid grid-cols-[40px_1fr_120px_80px_80px_140px] gap-4 px-4 py-2 border-b border-border-primary">
            <span className="text-[10px] font-mono uppercase tracking-wider text-text-muted">
              #
            </span>
            <span className="text-[10px] font-mono uppercase tracking-wider text-text-muted">
              Title
            </span>
            <span className="text-[10px] font-mono uppercase tracking-wider text-text-muted">
              Repo
            </span>
            <span className="text-[10px] font-mono uppercase tracking-wider text-text-muted">
              Branch
            </span>
            <span className="text-[10px] font-mono uppercase tracking-wider text-text-muted">
              Regression
            </span>
            <span className="text-[10px] font-mono uppercase tracking-wider text-text-muted text-right">
              Analyzed
            </span>
          </div>
          {filtered.map((pr) => (
            <PRRow key={pr.id} pr={pr} />
          ))}
        </div>
      )}
    </div>
  );
}
