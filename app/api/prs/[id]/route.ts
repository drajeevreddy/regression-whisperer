import { eq } from "drizzle-orm";
import { getDb, schema } from "@/db";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const db = getDb();
    const prId = Number(id);

    if (isNaN(prId)) {
      return Response.json({ error: "Invalid PR id" }, { status: 400 });
    }

    // Fetch PR with repo info
    const [pr] = await db
      .select({
        id: schema.prs.id,
        number: schema.prs.number,
        title: schema.prs.title,
        branch: schema.prs.branch,
        author: schema.prs.author,
        severity: schema.prs.severity,
        analyzedAt: schema.prs.analyzedAt,
        flamegraph: schema.prs.flamegraph,
        diff: schema.prs.diff,
        explanation: schema.prs.explanation,
        repoOwner: schema.repos.owner,
        repoName: schema.repos.name,
      })
      .from(schema.prs)
      .innerJoin(schema.repos, eq(schema.prs.repoId, schema.repos.id))
      .where(eq(schema.prs.id, prId))
      .limit(1);

    if (!pr) {
      return Response.json({ error: "PR not found" }, { status: 404 });
    }

    // Fetch historical matches via regressions
    const regressionRows = await db
      .select({
        regressionId: schema.regressions.id,
      })
      .from(schema.regressions)
      .where(eq(schema.regressions.prId, prId));

    let historicalMatch = null;
    if (regressionRows.length > 0) {
      const regIds = regressionRows.map((r) => r.regressionId);
      const [match] = await db
        .select()
        .from(schema.matches)
        .where(eq(schema.matches.regressionId, regIds[0]))
        .limit(1);

      if (match) {
        historicalMatch = {
          prNumber: match.matchedPrNumber,
          prTitle: match.matchedPrTitle,
          description: match.description ?? "",
          similarityScore: match.similarityScore,
        };
      }
    }

    return Response.json({
      id: pr.id,
      number: pr.number,
      title: pr.title,
      repo: `${pr.repoOwner}/${pr.repoName}`,
      branch: pr.branch,
      author: pr.author,
      severity: pr.severity,
      analyzedAt: pr.analyzedAt,
      flamegraph: pr.flamegraph,
      diff: pr.diff,
      explanation: pr.explanation,
      historicalMatch,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[/api/prs/[id]] Error:", message);
    return Response.json({ error: message }, { status: 500 });
  }
}
