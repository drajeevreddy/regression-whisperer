import { cn } from "@/lib/utils";
import type { PRDetail } from "@/lib/types";
import { Badge } from "@/components/shared/badge";

interface PRHeaderProps {
  pr: PRDetail;
}

const severityConfig: Record<
  string,
  { label: string; variant: "accent" | "red" | "green" | "muted" }
> = {
  high: { label: "HIGH REGRESSION", variant: "red" },
  medium: { label: "MED REGRESSION", variant: "accent" },
  low: { label: "LOW REGRESSION", variant: "muted" },
  none: { label: "NO REGRESSION", variant: "green" },
};

export function PRHeader({ pr }: PRHeaderProps) {
  const s = severityConfig[pr.severity] ?? severityConfig.none;

  return (
    <div className="border-b border-border-primary pb-6 mb-6">
      <div className="flex items-center gap-3 mb-2">
        <span className="font-mono text-sm text-text-muted">
          #{pr.number}
        </span>
        <h1 className="text-lg font-semibold text-text-primary">{pr.title}</h1>
        <Badge variant={s.variant}>{s.label}</Badge>
      </div>
      <div className="flex items-center gap-4 text-xs">
        <span className="font-mono text-text-secondary">{pr.repo}</span>
        <span className="text-text-muted">—</span>
        <span className="font-mono text-text-secondary">{pr.branch}</span>
        <span className="text-text-muted">—</span>
        <span className="text-text-muted">{pr.author}</span>
        <span className="text-text-muted">—</span>
        <span className="text-text-muted font-mono">
          {new Date(pr.analyzedAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>
    </div>
  );
}
