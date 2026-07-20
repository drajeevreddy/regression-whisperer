import { extractByokKeys } from "@/lib/router";
import { callModel } from "@/lib/router";
import { getDb, schema } from "@/db";
import { eq, and } from "drizzle-orm";

interface AnalyzeRequest {
  owner: string;
  repo: string;
  prNumber: number;
  commitSha?: string;
  branch?: string;
  title?: string;
  author?: string;
}

async function fetchPrFiles(
  owner: string,
  repo: string,
  prNumber: number,
  token?: string,
): Promise<{ diff: string; files: Array<{ filename: string; additions: number; deletions: number; patch?: string }> }> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "Regression-Whisperer",
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}/files?per_page=100`,
    { headers },
  );

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`GitHub API ${res.status} fetching PR files: ${text.slice(0, 300)}`);
  }

  const files = (await res.json()) as Array<{
    filename: string;
    additions: number;
    deletions: number;
    patch?: string;
    status: string;
  }>;

  const diffParts = files
    .filter((f) => f.patch)
    .map((f) => `--- a/${f.filename}\n+++ b/${f.filename}\n${f.patch}`);

  return {
    diff: diffParts.join("\n\n"),
    files: files.map((f) => ({
      filename: f.filename,
      additions: f.additions,
      deletions: f.deletions,
      patch: f.patch,
    })),
  };
}

async function persistAnalysis(params: {
  owner: string;
  repo: string;
  prNumber: number;
  commitSha?: string;
  branch?: string;
  title?: string;
  author?: string;
  diffLines: Array<{ lineNumber: number; content: string; type: "add" | "remove" | "context"; annotation?: string }>;
  explanation: string;
  severity: string;
  flamegraph: Record<string, unknown>;
}) {
  const db = getDb();
  const { owner, repo, prNumber, commitSha, branch, title, author, diffLines, explanation, severity, flamegraph } = params;

  let [repoRow] = await db
    .select()
    .from(schema.repos)
    .where(and(eq(schema.repos.owner, owner), eq(schema.repos.name, repo)))
    .limit(1);

  if (!repoRow) {
    [repoRow] = await db.insert(schema.repos).values({ owner, name: repo }).returning();
  }

  let [prRow] = await db
    .select()
    .from(schema.prs)
    .where(and(eq(schema.prs.repoId, repoRow.id), eq(schema.prs.number, prNumber)))
    .limit(1);

  const prData = {
    repoId: repoRow.id,
    number: prNumber,
    title: title ?? `PR #${prNumber}`,
    branch: branch ?? "main",
    author: author ?? "unknown",
    commitSha: commitSha ?? null,
    severity,
    analyzedAt: new Date(),
    flamegraph: JSON.parse(JSON.stringify(flamegraph)),
    diff: JSON.parse(JSON.stringify(diffLines)),
    explanation,
  };

  if (prRow) {
    await db.update(schema.prs).set(prData).where(eq(schema.prs.id, prRow.id));
    return prRow.id;
  }

  const [newPr] = await db.insert(schema.prs).values(prData).returning();
  return newPr.id;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as AnalyzeRequest;
    const { owner, repo, prNumber, commitSha, branch, title, author } = body;

    if (!owner || !repo || !prNumber) {
      return Response.json(
        { error: "Missing required fields: owner, repo, prNumber" },
        { status: 400 },
      );
    }

    const byokKeys = extractByokKeys(req);
    const githubToken = byokKeys?.GITHUB_TOKEN || process.env.GITHUB_TOKEN;

    // Fetch PR files and diff from GitHub
    const { diff, files } = await fetchPrFiles(owner, repo, prNumber, githubToken);

    if (!diff.trim()) {
      return Response.json(
        { error: "No file changes found for this PR" },
        { status: 400 },
      );
    }

    // Parse diff into structured lines
    const diffLines: Array<{ lineNumber: number; content: string; type: "add" | "remove" | "context"; annotation?: string }> = [];
    let lineNum = 0;
    for (const line of diff.split("\n")) {
      lineNum++;
      if (line.startsWith("+++") || line.startsWith("---") || line.startsWith("@@")) {
        continue;
      }
      if (line.startsWith("+")) {
        diffLines.push({ lineNumber: lineNum, content: line, type: "add" });
      } else if (line.startsWith("-")) {
        diffLines.push({ lineNumber: lineNum, content: line, type: "remove" });
      } else if (line.trim()) {
        diffLines.push({ lineNumber: lineNum, content: line, type: "context" });
      }
    }

    // Build a summary of changes for the LLM
    const fileList = files.map((f) => `  ${f.filename} (+${f.additions}/-${f.deletions})`).join("\n");

    // Call LLM to analyze the diff
    const systemPrompt = `You are Regression Whisperer, an expert AI performance engineer reviewing Pull Requests.
Analyze code changes and identify performance regressions: N+1 queries, synchronous blocking in loops, unbatched I/O, memory leaks, connection pool exhaustion, etc.
Be concise, accurate, and actionable. Output a structured JSON analysis.`;

    const prompt = `Analyze this PR for performance regressions:

Repository: ${owner}/${repo}
PR: #${prNumber} — ${title ?? "Untitled"}
Author: ${author ?? "unknown"}
Branch: ${branch ?? "main"}

Changed files (${files.length}):
${fileList}

Diff:
\`\`\`diff
${diff.slice(0, 12000)}
\`\`\`

Respond in JSON with this exact structure:
{
  "severity": "high" | "medium" | "low" | "none",
  "summary": "One-line summary of findings",
  "rootCause": "1-2 sentence root cause explanation",
  "recommendation": "Actionable fix recommendation",
  "regressions": [
    {
      "functionName": "name of affected function/component",
      "description": "what's wrong",
      "severity": "high" | "medium" | "low"
    }
  ]
}`;

    let analysis: {
      severity: string;
      summary: string;
      rootCause: string;
      recommendation: string;
      regressions: Array<{ functionName: string; description: string; severity: string }>;
    };

    try {
      const aiResult = await callModel(
        { systemPrompt, prompt, temperature: 0.2 },
        undefined,
        byokKeys,
      );

      // Parse JSON from LLM response
      const jsonMatch = aiResult.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON in LLM response");
      }
    } catch {
      // Fallback: structural analysis based on diff patterns
      const hasNPlusOne = diff.includes("for") && diff.includes("query") || diff.includes("SELECT");
      const hasSyncInLoop = diff.includes("for") && (diff.includes("await") || diff.includes("exec"));
      const hasBlockingIO = diff.includes("readFileSync") || diff.includes("execSync");

      let severity = "none";
      if (hasNPlusOne || hasBlockingIO) severity = "high";
      else if (hasSyncInLoop) severity = "medium";

      analysis = {
        severity,
        summary: hasNPlusOne
          ? "Potential N+1 query pattern detected in loop"
          : hasBlockingIO
            ? "Synchronous blocking I/O detected"
            : "No obvious performance regressions detected from diff analysis",
        rootCause: hasNPlusOne
          ? "Individual queries inside a loop cause O(n) database round-trips instead of a single batched query."
          : hasBlockingIO
            ? "Synchronous file/system calls block the event loop and stall all concurrent requests."
            : "No critical performance patterns found in the changed code.",
        recommendation: hasNPlusOne
          ? "Replace per-iteration queries with a single batched query using IN clause or JOIN."
          : hasBlockingIO
            ? "Replace sync calls with async alternatives (fs.promises, child_process.spawn)."
            : "No changes recommended based on diff analysis alone.",
        regressions: [],
      };
    }

    // Build explanation text
    const explanation = `## Analysis of PR #${prNumber}

**${analysis.summary}**

${analysis.rootCause}

**Recommendation:** ${analysis.recommendation}

${analysis.regressions.length > 0 ? `\n### Flagged Issues\n${analysis.regressions.map((r) => `- **${r.functionName}** (${r.severity}): ${r.description}`).join("\n")}` : ""}
`;

    // Build a minimal flamegraph structure from file changes
    const flamegraph = {
      totalSamples: files.reduce((sum, f) => sum + f.additions + f.deletions, 0),
      functions: files.slice(0, 10).map((f) => ({
        name: f.filename,
        beforePct: 0,
        afterPct: Math.round((f.additions / Math.max(f.additions + f.deletions, 1)) * 100),
        deltaPct: f.additions - f.deletions,
        severity: "none" as const,
      })),
    };

    // Persist to DB
    let dbPrId: number | null = null;
    try {
      dbPrId = await persistAnalysis({
        owner,
        repo,
        prNumber,
        commitSha,
        branch,
        title,
        author,
        diffLines,
        explanation,
        severity: analysis.severity,
        flamegraph: flamegraph as unknown as Record<string, unknown>,
      });
    } catch (err) {
      console.error("[/api/github/analyze] DB persist failed:", err instanceof Error ? err.message : String(err));
    }

    return Response.json({
      success: true,
      severity: analysis.severity,
      summary: analysis.summary,
      rootCause: analysis.rootCause,
      recommendation: analysis.recommendation,
      regressions: analysis.regressions,
      prDbId: dbPrId,
      filesAnalyzed: files.length,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[/api/github/analyze] Error:", message);
    return Response.json({ error: message }, { status: 500 });
  }
}
