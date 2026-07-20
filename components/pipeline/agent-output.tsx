import { cn } from "@/lib/utils";

interface AgentOutputProps {
  name: string;
  output: string;
}

export function AgentOutput({ name, output }: AgentOutputProps) {
  return (
    <div
      className={cn(
        "border border-border-primary bg-bg-surface p-4 animate-slide-up"
      )}
      style={{ borderRadius: 4 }}
    >
      <div className="flex items-center gap-2 mb-3">
        <span className="font-mono text-[10px] uppercase tracking-wider text-accent">
          {name}
        </span>
        <span className="text-[10px] text-text-muted">— output</span>
      </div>
      <pre className="font-mono text-xs text-text-secondary leading-relaxed whitespace-pre-wrap m-0">
        {output}
      </pre>
    </div>
  );
}
