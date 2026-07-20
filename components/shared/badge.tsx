import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "accent" | "red" | "green" | "muted";
  className?: string;
}

export function Badge({
  children,
  variant = "default",
  className,
}: BadgeProps) {
  const variants: Record<string, string> = {
    default: "bg-bg-surface text-text-secondary border-border-primary",
    accent: "bg-accent-dim text-accent border-accent/20",
    red: "bg-red-dim text-red border-red/20",
    green: "bg-green-dim text-green border-green/20",
    muted: "bg-transparent text-text-muted border-text-muted/20",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 text-xs font-mono border",
        variants[variant],
        className
      )}
      style={{ borderRadius: 2 }}
    >
      {children}
    </span>
  );
}

interface StatusDotProps {
  status: "connected" | "failed" | "pending" | "unconfigured";
  className?: string;
}

export function StatusDot({ status, className }: StatusDotProps) {
  const colors: Record<string, string> = {
    connected: "bg-green",
    failed: "bg-red",
    pending: "bg-accent",
    unconfigured: "bg-text-muted",
  };

  return (
    <span
      className={cn(
        "inline-block w-2 h-2 shrink-0",
        colors[status],
        status === "pending" && "animate-breathe",
        className
      )}
      style={{ borderRadius: "50%" }}
    />
  );
}
