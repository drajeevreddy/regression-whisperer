import { eq } from "drizzle-orm";
import { getDb, schema } from "@/db";

export async function GET() {
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
      .innerJoin(schema.repos, eq(schema.prs.repoId, schema.repos.id))
      .orderBy(schema.prs.analyzedAt);

    const prs = results.map((r) => ({
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

    return Response.json(prs);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[/api/prs] Error:", message);
    return Response.json({ error: message }, { status: 500 });
  }
}
