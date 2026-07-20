import { cn } from "@/lib/utils";
import type { PipelinePhase } from "@/lib/constants";

interface AgentNodeProps {
  name: string;
  phase: PipelinePhase;
}

export function AgentNode({ name, phase }: AgentNodeProps) {
  const isProcessing = phase === "processing";
  const isComplete = phase === "complete";

  return (
    <div className="flex flex-col items-center gap-1 shrink-0">
      <div
        className={cn(
          "relative flex items-center justify-center px-4 py-2 min-w-[120px]",
          "border transition-all duration-300",
          isProcessing && "border-accent animate-breathe",
          isComplete && "border-accent bg-accent-dim",
          !isProcessing && !isComplete && "border-border-primary",
        )}
        style={{ borderRadius: 2 }}
      >
        {isComplete ? (
          <span className="font-mono text-xs text-accent">&#10003;</span>
        ) : (
          <span
            className={cn(
              "font-mono text-xs transition-colors duration-300",
              isProcessing ? "text-accent" : "text-text-muted"
            )}
          >
            {name}
          </span>
        )}
      </div>
      <span
        className={cn(
          "font-mono text-[10px] uppercase tracking-wider transition-colors duration-300",
          isProcessing ? "text-accent" : "text-text-muted",
          isComplete && "text-text-muted"
        )}
      >
        {isProcessing ? "processing" : isComplete ? "done" : "idle"}
      </span>
    </div>
  );
}
