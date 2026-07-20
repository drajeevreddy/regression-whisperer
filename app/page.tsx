import { getDb, schema } from "@/db";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function LandingPage() {
  const agents = ["Profiler", "Router", "Diff Reasoning", "Historian", "Explainer"];

  let prCount = 0;
  let regressionCount = 0;
  try {
    const db = getDb();
    const [counts] = await db
      .select({ prCount: sql<number>`count(*)::int` })
      .from(schema.prs);
    prCount = counts?.prCount ?? 0;

    const [regCounts] = await db
      .select({ regCount: sql<number>`count(*)::int` })
      .from(schema.regressions)
      .where(sql`${schema.regressions.regression} = true`);
    regressionCount = regCounts?.regCount ?? 0;
  } catch {
    prCount = 0;
    regressionCount = 0;
  }

  return (
    <div className="min-h-[calc(100vh-3rem)] flex flex-col">
      <section className="flex flex-col items-center justify-center flex-1 px-6 pt-24 pb-16">
        <div className="max-w-2xl w-full flex flex-col items-center text-center">
          <div className="mb-2">
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-accent">
              detect regressions before they ship
            </span>
          </div>

          <h1 className="text-4xl font-bold text-text-primary leading-tight tracking-tight mb-4 max-w-xl">
            Every PR gets a
            <span className="text-accent"> performance autopsy</span>{" "}
            before it lands.
          </h1>

          <p className="text-sm text-text-secondary leading-relaxed max-w-md mb-12">
            Paste a GitHub repo link. Five AI agents profile, route, diff, recall,
            and explain every code change — catching the N+1 queries, memory leaks,
            and latency spikes your CI never will.
          </p>

          <div className="w-full mb-12">
            <div className="flex items-center justify-center gap-0">
              {agents.map((name, i) => (
                <div key={name} className="flex items-center">
                  <div
                    className="border border-border-primary px-3 py-1.5"
                    style={{ borderRadius: 2 }}
                  >
                    <span className="font-mono text-xs text-text-secondary">
                      {name}
                    </span>
                  </div>
                  {i < agents.length - 1 && (
                    <svg
                      width="20"
                      height="12"
                      viewBox="0 0 20 12"
                      className="mx-0.5 shrink-0"
                    >
                      <line
                        x1="0"
                        y1="6"
                        x2="14"
                        y2="6"
                        stroke="currentColor"
                        strokeWidth="1"
                        className="text-text-muted"
                      />
                      <polygon
                        points="14,3 20,6 14,9"
                        fill="currentColor"
                        className="text-text-muted"
                      />
                    </svg>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="/analyze"
              className="inline-flex items-center px-5 py-2 text-sm font-mono text-bg-primary bg-accent hover:bg-accent/90 no-underline transition-colors"
              style={{ borderRadius: 2 }}
            >
              Analyze a repo
            </a>
            <a
              href="/pipeline"
              className="inline-flex items-center px-5 py-2 text-sm font-mono text-text-secondary border border-border-primary hover:text-text-primary hover:border-border-hover no-underline transition-colors"
              style={{ borderRadius: 2 }}
            >
              Watch it run
            </a>
          </div>
        </div>
      </section>

      <footer className="border-t border-border-primary px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-6">
          {prCount > 0 && (
            <span className="font-mono text-[10px] text-text-muted ml-auto">
              {prCount} PRs analyzed — {regressionCount} regressions caught
            </span>
          )}
        </div>
      </footer>
    </div>
  );
}
