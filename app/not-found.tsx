import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-[calc(100vh-3rem)] flex flex-col items-center justify-center px-6">
      <div className="max-w-md text-center">
        <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-accent mb-4">
          404
        </div>
        <h2 className="text-lg font-semibold text-text-primary mb-2">
          Page not found
        </h2>
        <p className="text-sm text-text-secondary mb-6">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link
          href="/"
          className="inline-flex items-center px-4 py-2 text-xs font-mono text-text-secondary border border-border-primary hover:text-text-primary hover:border-border-hover no-underline transition-colors"
          style={{ borderRadius: 2 }}
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}
