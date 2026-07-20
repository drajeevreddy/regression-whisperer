interface HistoricalMatchProps {
  match: {
    prNumber: number;
    prTitle: string;
    description: string;
    similarityScore: number;
  };
}

export function HistoricalMatch({ match }: HistoricalMatchProps) {
  return (
    <div
      className="border border-border-primary bg-bg-surface p-4"
      style={{ borderRadius: 4 }}
    >
      <div className="flex items-center gap-2 mb-3">
        <span className="font-mono text-[10px] uppercase tracking-wider text-text-muted">
          Historian
        </span>
        <span className="text-xs text-text-muted">— historical match</span>
        <span className="ml-auto font-mono text-[10px] text-accent">
          {(match.similarityScore * 100).toFixed(0)}% match
        </span>
      </div>
      <div className="flex items-center gap-2 mb-2">
        <span className="font-mono text-xs text-text-secondary">
          #{match.prNumber}
        </span>
        <span className="text-xs text-text-primary">{match.prTitle}</span>
      </div>
      <pre className="font-mono text-xs text-text-secondary leading-relaxed whitespace-pre-wrap m-0">
        {match.description}
      </pre>
    </div>
  );
}
