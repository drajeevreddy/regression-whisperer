import { cn } from "@/lib/utils";
import type { DiffLine } from "@/lib/types";

interface DiffSnippetProps {
  lines: DiffLine[];
  fileName?: string;
}

const lineColors: Record<string, string> = {
  add: "bg-green-dim/30 border-l-2 border-l-green",
  remove: "bg-red-dim/30 border-l-2 border-l-red",
  context: "",
};

const lineIndicators: Record<string, string> = {
  add: "+",
  remove: "-",
  context: " ",
};

export function DiffSnippet({ lines, fileName }: DiffSnippetProps) {
  return (
    <div className="border border-border-primary bg-bg-surface" style={{ borderRadius: 4 }}>
      <div className="flex items-center gap-2 px-4 pt-4 pb-3 border-b border-border-primary">
        <span className="font-mono text-[10px] uppercase tracking-wider text-text-muted">
          Diff
        </span>
        {fileName && (
          <span className="text-xs text-text-muted font-mono">
            {fileName}
          </span>
        )}
      </div>
      <div className="font-mono text-xs leading-relaxed">
        {lines.map((line, i) => (
          <div
            key={i}
            className={cn(
              "flex px-4 py-1",
              lineColors[line.type]
            )}
          >
            <span
              className={cn(
                "w-8 text-right mr-3 shrink-0 select-none",
                line.type === "add"
                  ? "text-green"
                  : line.type === "remove"
                    ? "text-red"
                    : "text-text-muted"
              )}
            >
              {lineIndicators[line.type]}
            </span>
            <span
              className={cn(
                line.type === "add"
                  ? "text-text-primary"
                  : line.type === "remove"
                    ? "text-text-secondary"
                    : "text-text-secondary"
              )}
            >
              {line.content}
            </span>
            {line.annotation && (
              <span className="ml-auto text-[10px] text-red pl-4 shrink-0">
                {line.annotation}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
