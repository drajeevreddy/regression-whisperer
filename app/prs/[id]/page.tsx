import { notFound } from "next/navigation";
import { PRHeader } from "@/components/pr-detail/pr-header";
import { FlameGraph } from "@/components/pr-detail/flame-graph";
import { DiffSnippet } from "@/components/pr-detail/diff-snippet";
import { ExplanationCard } from "@/components/pr-detail/explanation-card";
import { HistoricalMatch } from "@/components/pr-detail/historical-match";
import { getDb, schema } from "@/db";
import { eq } from "drizzle-orm";
import type { Metadata } from "next";
import type { FlameGraphData, DiffLine } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const prId = Number(id);
  if (isNaN(prId)) return { title: "PR Not Found" };

  try {
    const db = getDb();
    const [pr] = await db
      .select({ number: schema.prs.number, title: schema.prs.title })
      .from(schema.prs)
      .where(eq(schema.prs.id, prId))
      .limit(1);

    if (!pr) return { title: "PR Not Found" };
    return {
      title: `PR #${pr.number} — ${pr.title} — Regression Whisperer`,
      description: `Performance regression analysis for PR #${pr.number}: ${pr.title}`,
    };
  } catch {
    return { title: "PR Detail — Regression Whisperer" };
  }
}

export default async function PRDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const prId = Number(id);

  if (isNaN(prId)) {
    notFound();
  }

  try {
    const db = getDb();

    const [prRow] = await db
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

    if (!prRow) {
      notFound();
    }

    let historicalMatch = null;
    const regressionRows = await db
      .select({ regressionId: schema.regressions.id })
      .from(schema.regressions)
      .where(eq(schema.regressions.prId, prId));

    if (regressionRows.length > 0) {
      const [match] = await db
        .select()
        .from(schema.matches)
        .where(eq(schema.matches.regressionId, regressionRows[0].regressionId))
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

    const pr = {
      id: prRow.id,
      number: prRow.number,
      title: prRow.title,
      repo: `${prRow.repoOwner}/${prRow.repoName}`,
      branch: prRow.branch,
      author: prRow.author,
      severity: prRow.severity,
      analyzedAt: String(prRow.analyzedAt),
      flamegraph: (prRow.flamegraph ?? { functions: [], totalSamples: 0 }) as FlameGraphData,
      diff: (prRow.diff ?? []) as DiffLine[],
      explanation: prRow.explanation ?? "",
      historicalMatch,
    };

    const diffLines = pr.diff;
    const firstAdd = diffLines.find((l) => l.type === "add" || l.type === "remove");
    const inferredFile = pr.explanation?.match(/[\w/]+\.\w+/)?.[0] ?? null;

    return (
      <div className="max-w-4xl mx-auto px-6 py-8">
        <PRHeader pr={pr as never} />

        <div className="flex flex-col gap-4">
          <FlameGraph data={pr.flamegraph} />
          <DiffSnippet lines={pr.diff} fileName={inferredFile ?? undefined} />
          <ExplanationCard explanation={pr.explanation} />
          {pr.historicalMatch !== null && (
            <HistoricalMatch match={pr.historicalMatch as never} />
          )}
        </div>
      </div>
    );
  } catch {
    notFound();
  }
}
