interface ExplanationCardProps {
  explanation: string;
}

export function ExplanationCard({ explanation }: ExplanationCardProps) {
  return (
    <div
      className="border border-border-primary bg-bg-surface p-4"
      style={{ borderRadius: 4 }}
    >
      <div className="flex items-center gap-2 mb-3">
        <span className="font-mono text-[10px] uppercase tracking-wider text-text-muted">
          Explainer
        </span>
        <span className="text-xs text-text-muted">— AI analysis</span>
      </div>
      <pre className="font-mono text-xs text-text-secondary leading-relaxed whitespace-pre-wrap m-0">
        {explanation}
      </pre>
    </div>
  );
}
