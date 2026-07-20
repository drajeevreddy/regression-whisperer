import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-24 px-6 text-center",
        className
      )}
    >
      {icon && (
        <div className="text-2xl text-text-muted mb-4 font-mono">{icon}</div>
      )}
      <p className="text-sm font-medium text-text-primary mb-1">{title}</p>
      {description && (
        <p className="text-xs text-text-muted max-w-xs">{description}</p>
      )}
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className={cn(
            "mt-4 px-4 py-1.5 text-xs font-mono border border-border-primary",
            "text-text-secondary hover:text-text-primary hover:border-border-hover",
            "bg-transparent cursor-pointer transition-colors",
            "focus:outline-none focus:border-accent/50"
          )}
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
