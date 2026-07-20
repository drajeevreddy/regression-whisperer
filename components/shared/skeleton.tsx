import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
  lines?: number;
}

export function Skeleton({ className, lines = 1 }: SkeletonProps) {
  if (lines > 1) {
    return (
      <div className="flex flex-col gap-2">
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "h-3 bg-bg-surface animate-pulse-dim",
              i === lines - 1 ? "w-3/4" : "w-full",
              className
            )}
            style={{ borderRadius: 2 }}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn("h-3 bg-bg-surface animate-pulse-dim w-full", className)}
      style={{ borderRadius: 2 }}
    />
  );
}

export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "border border-border-primary bg-bg-surface p-4",
        className
      )}
      style={{ borderRadius: 4 }}
    >
      <Skeleton className="w-1/3 mb-3" />
      <Skeleton lines={4} />
    </div>
  );
}

export function FlameGraphSkeleton() {
  return (
    <div className="border border-border-primary bg-bg-surface p-4" style={{ borderRadius: 4 }}>
      <Skeleton className="w-1/4 mb-4" />
      <div className="grid grid-cols-2 gap-6">
        <div className="flex flex-col gap-1">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="h-4 bg-bg-surface animate-pulse-dim"
              style={{ width: `${85 - i * 8}%`, borderRadius: 2 }}
            />
          ))}
        </div>
        <div className="flex flex-col gap-1">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="h-4 bg-bg-surface animate-pulse-dim"
              style={{ width: `${85 - i * 8}%`, borderRadius: 2 }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export function PipelineSkeleton() {
  return (
    <div className="flex items-center justify-center gap-4 py-32">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          <div className="flex flex-col items-center gap-2">
            <div className="w-32 h-8 bg-bg-surface animate-pulse-dim" style={{ borderRadius: 2 }} />
          </div>
          {i < 4 && <Skeleton className="w-8 h-px" />}
        </div>
      ))}
    </div>
  );
}
