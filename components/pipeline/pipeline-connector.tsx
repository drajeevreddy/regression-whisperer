import { cn } from "@/lib/utils";

interface PipelineConnectorProps {
  active?: boolean;
  completed?: boolean;
}

export function PipelineConnector({
  active = false,
  completed = false,
}: PipelineConnectorProps) {
  return (
    <div className="flex items-center shrink-0 mx-1">
      <svg width="24" height="12" viewBox="0 0 24 12">
        <line
          x1="0"
          y1="6"
          x2="18"
          y2="6"
          stroke="currentColor"
          strokeWidth="1"
          className={cn(
            "transition-colors duration-500",
            completed ? "text-accent" : active ? "text-accent/50" : "text-text-muted"
          )}
        />
        <polygon
          points="18,3 24,6 18,9"
          fill="currentColor"
          className={cn(
            "transition-colors duration-500",
            completed ? "text-accent" : active ? "text-accent/50" : "text-text-muted"
          )}
        />
      </svg>
    </div>
  );
}
