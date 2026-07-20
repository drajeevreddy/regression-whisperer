"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-[calc(100vh-3rem)] flex flex-col items-center justify-center px-6">
      <div className="max-w-md text-center">
        <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-red mb-4">
          System Error
        </div>
        <h2 className="text-lg font-semibold text-text-primary mb-2">
          Something went wrong
        </h2>
        <p className="text-sm text-text-secondary mb-6">
          {error.message || "An unexpected error occurred."}
        </p>
        <button
          onClick={reset}
          type="button"
          className="px-4 py-2 text-xs font-mono text-bg-primary bg-accent hover:bg-accent/90 transition-colors cursor-pointer border-none"
          style={{ borderRadius: 2 }}
        >
          Try again
        </button>
      </div>
    </div>
  );
}
