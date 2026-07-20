import { cn } from "@/lib/utils";
import type { FlameGraphData } from "@/lib/types";

interface FlameGraphProps {
  data: FlameGraphData;
}

function FlameBar({
  name,
  pct,
  severity,
  maxPct,
}: {
  name: string;
  pct: number;
  severity: string;
  maxPct: number;
}) {
  const widthPct = (pct / maxPct) * 100;
  const isRegression = severity === "high";

  return (
    <div className="flex items-center gap-2 h-6">
      <span
        className="font-mono text-[10px] text-text-secondary w-36 truncate text-right shrink-0"
        title={name}
      >
        {name}
      </span>
      <div className="flex-1 h-4 relative bg-bg-surface" style={{ borderRadius: 2 }}>
        <div
          className={cn(
            "absolute inset-y-0 left-0 transition-all",
            isRegression ? "bg-red" : "bg-text-muted"
          )}
          style={{
            width: `${Math.max(widthPct, 1)}%`,
            opacity: isRegression ? 0.9 : 0.4,
            borderRadius: 2,
          }}
        />
      </div>
      <span
        className={cn(
          "font-mono text-[10px] w-14 text-right shrink-0",
          isRegression ? "text-red" : "text-text-secondary"
        )}
      >
        {pct.toFixed(1)}%
      </span>
    </div>
  );
}

export function FlameGraph({ data }: FlameGraphProps) {
  const maxPct = Math.max(
    ...data.functions.map((f) => Math.max(f.beforePct, f.afterPct)),
    1
  );

  return (
    <div className="border border-border-primary bg-bg-surface p-4" style={{ borderRadius: 4 }}>
      <div className="flex items-center gap-2 mb-4">
        <span className="font-mono text-[10px] uppercase tracking-wider text-text-muted">
          Flame Graph
        </span>
        <span className="text-xs text-text-muted">
          {data.totalSamples} samples
        </span>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-wider text-text-muted mb-3">
            Before
          </div>
          {data.functions.map((f) => (
            <FlameBar
              key={`before-${f.name}`}
              name={f.name}
              pct={f.beforePct}
              severity={f.severity}
              maxPct={maxPct}
            />
          ))}
        </div>
        <div>
          <div className="text-[10px] font-mono uppercase tracking-wider text-text-muted mb-3">
            After
          </div>
          {data.functions.map((f) => {
            const severity =
              f.deltaPct > 5 ? "high" : f.deltaPct > 2 ? "medium" : "none";
            return (
              <div key={`after-${f.name}`} className="flex items-center gap-2 h-6">
                <span
                  className="font-mono text-[10px] text-text-secondary w-36 truncate text-right shrink-0"
                  title={f.name}
                >
                  {f.name}
                </span>
                <div className="flex-1 h-4 relative bg-bg-surface" style={{ borderRadius: 2 }}>
                  <div
                    className={cn(
                      "absolute inset-y-0 left-0 transition-all",
                      severity === "high"
                        ? "bg-red"
                        : severity === "medium"
                          ? "bg-accent"
                          : "bg-text-muted"
                    )}
                    style={{
                      width: `${Math.max((f.afterPct / maxPct) * 100, 1)}%`,
                      opacity: severity === "high" ? 0.9 : severity === "medium" ? 0.7 : 0.4,
                      borderRadius: 2,
                    }}
                  />
                </div>
                <span
                  className={cn(
                    "font-mono text-[10px] w-14 text-right shrink-0",
                    severity === "high"
                      ? "text-red"
                      : severity === "medium"
                        ? "text-accent"
                        : "text-text-secondary"
                  )}
                >
                  {f.deltaPct > 0 ? "+" : ""}
                  {f.deltaPct.toFixed(1)}%
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
