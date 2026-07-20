import { runExplainerAgent } from "@/lib/agents/explainer";
import { extractByokKeys } from "@/lib/router";
import { getDb, schema } from "@/db";
import { eq, and } from "drizzle-orm";

async function persistToDb(params: {
  owner: string;
  repo: string;
  prNumber: number;
  commitSha?: string;
  profileResult: Record<string, unknown>;
  explanation?: string;
  providerUsed?: string;
}) {
  try {
    const db = getDb();
    const { owner, repo, prNumber, commitSha, profileResult, explanation } = params;

    // Upsert repo
    let [repoRow] = await db
      .select()
      .from(schema.repos)
      .where(and(eq(schema.repos.owner, owner), eq(schema.repos.name, repo)))
      .limit(1);

    if (!repoRow) {
      [repoRow] = await db.insert(schema.repos).values({ owner, name: repo }).returning();
    }

    // Upsert PR
    let [prRow] = await db
      .select()
      .from(schema.prs)
      .where(and(eq(schema.prs.repoId, repoRow.id), eq(schema.prs.number, prNumber)))
      .limit(1);

    const prData = {
      repoId: repoRow.id,
      number: prNumber,
      title: (profileResult.target as string) ?? `PR #${prNumber}`,
      branch: "main",
      author: "ci-bot",
      commitSha: commitSha ?? null,
      severity: (profileResult.summary as Record<string, unknown>)?.hasRegression ? "high" : "none",
      analyzedAt: new Date(),
      flamegraph: profileResult as unknown as Record<string, unknown>,
      diff: null,
      explanation: explanation ?? null,
    };

    if (prRow) {
      await db.update(schema.prs).set(prData).where(eq(schema.prs.id, prRow.id));
    } else {
      [prRow] = await db.insert(schema.prs).values(prData).returning();
    }

    // Insert regressions from deltas
    const deltas = (profileResult.deltas as Array<Record<string, unknown>>) ?? [];
    for (const delta of deltas) {
      await db.insert(schema.regressions).values({
        prId: prRow.id,
        functionName: String(delta.name),
        beforeMs: Number(delta.beforeMs),
        afterMs: Number(delta.afterMs),
        deltaMs: Number(delta.deltaMs),
        percentageChange: Number(delta.percentageChange),
        regression: Boolean(delta.regression),
      });
    }

    console.log(`[/api/webhook] Persisted PR #${prNumber} and ${deltas.length} regressions to DB`);
  } catch (err) {
    console.error("[/api/webhook] DB persist failed (non-fatal):", err instanceof Error ? err.message : String(err));
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { owner, repo, prNumber, commitSha, profileResult } = body;

    // Allow GITHUB_TOKEN to be passed in payload, header, or fallback to server env
    const githubToken =
      body.githubToken ||
      req.headers.get("x-github-token") ||
      req.headers.get("authorization")?.replace("Bearer ", "") ||
      process.env.GITHUB_TOKEN;

    if (!owner || !repo || !prNumber || !profileResult) {
      return Response.json(
        {
          error:
            "Missing required fields: owner, repo, prNumber, profileResult are required.",
        },
        { status: 400 },
      );
    }

    console.log(
      `[/api/webhook] Received profile data for ${owner}/${repo}#${prNumber} (commit: ${commitSha || "N/A"})`,
    );

    // Extract BYOK keys from headers (client-side localStorage → x-byok-keys header)
    // Also allow env-based keys for the GitHub Action flow (which doesn't have BYOK)
    const byokKeys = extractByokKeys(req);

    // Execute Explainer Agent: calls LLM router & posts GitHub PR comment
    // BYOK keys take precedence over env vars in the router
    const result = await runExplainerAgent({
      owner,
      repo,
      prNumber: Number(prNumber),
      commitSha,
      profileResult,
      githubToken,
      postComment: Boolean(githubToken),
      providerKeys: byokKeys,
    });

    // Persist to Neon DB (non-blocking, best-effort)
    persistToDb({
      owner,
      repo,
      prNumber: Number(prNumber),
      commitSha,
      profileResult,
      explanation: result.commentMarkdown,
      providerUsed: result.providerUsed,
    });

    return Response.json({
      success: true,
      providerUsed: result.providerUsed,
      latencyMs: result.latencyMs,
      commentId: result.githubComment?.id,
      commentUrl: result.githubComment?.html_url,
      reportSummary: {
        totalBeforeMs: profileResult.summary?.totalBeforeMs,
        totalAfterMs: profileResult.summary?.totalAfterMs,
        totalDeltaMs: profileResult.summary?.totalDeltaMs,
        hasRegression: profileResult.summary?.hasRegression,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[/api/webhook] Webhook processing error:", message);
    return Response.json({ error: message }, { status: 500 });
  }
}
