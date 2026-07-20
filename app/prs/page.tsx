import { PRTable } from "@/components/pr-feed/pr-table";
import { getDb, schema } from "@/db";
import { eq } from "drizzle-orm";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "PR Feed",
  description: "Browse all analyzed pull requests and their regression severity.",
};

export default async function PRsPage() {
  let prs: Array<{
    id: number;
    number: number;
    title: string;
    repo: string;
    branch: string;
    author: string;
    severity: string;
    analyzedAt: Date | null;
    flamegraph: unknown;
  }> = [];

  try {
    const db = getDb();
    const results = await db
      .select({
        id: schema.prs.id,
        number: schema.prs.number,
        title: schema.prs.title,
        branch: schema.prs.branch,
        author: schema.prs.author,
        severity: schema.prs.severity,
        analyzedAt: schema.prs.analyzedAt,
        flamegraph: schema.prs.flamegraph,
        repoOwner: schema.repos.owner,
        repoName: schema.repos.name,
      })
      .from(schema.prs)
      .innerJoin(schema.repos, eq(schema.prs.repoId, schema.repos.id));

    prs = results.map((r) => ({
      id: r.id,
      number: r.number,
      title: r.title,
      repo: `${r.repoOwner}/${r.repoName}`,
      branch: r.branch,
      author: r.author,
      severity: r.severity,
      analyzedAt: r.analyzedAt,
      flamegraph: r.flamegraph,
    }));
  } catch {
    // DB not available — fall back to empty list (UI handles this)
    prs = [];
  }

  return (
    <div className="min-h-[calc(100vh-3rem)]">
      <PRTable prs={prs} />
    </div>
  );
}
