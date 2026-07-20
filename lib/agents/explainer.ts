import { callModel } from "../router/index";
import { mcpGithubPostComment, type PostPRCommentResult } from "../github/commenter";
import type { ProfileResult } from "./profiler";

export interface ExplainerOptions {
  owner: string;
  repo: string;
  prNumber: number;
  commitSha?: string;
  profileResult: ProfileResult;
  githubToken?: string;
  postComment?: boolean; // Defaults to true
  /** BYOK keys from the client — provider name → API key. Never persisted server-side. */
  providerKeys?: Record<string, string>;
}

export interface ExplainerResult {
  commentMarkdown: string;
  providerUsed: string;
  latencyMs: number;
  githubComment?: PostPRCommentResult;
}

/**
 * Explainer Agent — synthesizes profiler data, requests LLM analysis via Gemini primary router,
 * formats GitHub PR comment, and posts it using mcpGithubPostComment.
 */
export async function runExplainerAgent(
  options: ExplainerOptions,
): Promise<ExplainerResult> {
  const { owner, repo, prNumber, profileResult, githubToken, postComment = true, providerKeys } = options;

  const regressions = profileResult.deltas.filter((d) => d.regression);
  const hasRegressions = regressions.length > 0 || profileResult.summary.hasRegression;

  const systemPrompt = `You are Regression Whisperer, an expert AI performance engineer reviewing Pull Requests.
Analyze performance profile benchmarks (before vs after PR changes) and deliver concise, action-oriented feedback.
Highlight performance regressions such as N+1 queries, synchronous blocking calls in loops, or unindexed database queries.
Be clear, accurate, and professional.`;

  const prompt = `Analyze this PR performance profile:
Repository: ${owner}/${repo}
PR Number: #${prNumber}
Target: ${profileResult.target}
Total Runtime Before: ${profileResult.summary.totalBeforeMs}ms
Total Runtime After: ${profileResult.summary.totalAfterMs}ms
Net Impact: ${profileResult.summary.totalDeltaMs >= 0 ? "+" : ""}${profileResult.summary.totalDeltaMs}ms

Function timing deltas:
${JSON.stringify(profileResult.deltas, null, 2)}

Provide:
1. Brief Root Cause Diagnosis (1-2 sentences explaining why the performance regressed, e.g. N+1 queries or sync loop blocking).
2. Actionable Optimization Recommendation (how to rewrite the code to fix the regression).`;

  let aiAnalysis = "";
  let providerUsed = "fallback-template";
  let latencyMs = 0;

  try {
    const aiResult = await callModel(
      {
        systemPrompt,
        prompt,
        temperature: 0.2,
      },
      undefined, // use default providers
      providerKeys,
    );
    aiAnalysis = aiResult.text;
    providerUsed = aiResult.provider;
    latencyMs = aiResult.latencyMs;
  } catch (err) {
    console.warn(`[Explainer Agent] AI Router call failed: ${err instanceof Error ? err.message : String(err)}`);
    aiAnalysis = "⚠️ *AI analysis unavailable. Using structural performance report below.*";
  }

  // Construct Markdown PR comment
  const commentMarkdown = constructCommentMarkdown({
    owner,
    repo,
    prNumber,
    commitSha: options.commitSha,
    profileResult,
    hasRegressions,
    regressions,
    aiAnalysis,
    providerUsed,
    latencyMs,
  });

  let githubComment: PostPRCommentResult | undefined;

  if (postComment) {
    try {
      githubComment = await mcpGithubPostComment({
        owner,
        repo,
        prNumber,
        body: commentMarkdown,
        token: githubToken,
      });
    } catch (err) {
      console.error(`[Explainer Agent] Failed to post PR comment to GitHub: ${err instanceof Error ? err.message : String(err)}`);
      throw err;
    }
  }

  return {
    commentMarkdown,
    providerUsed,
    latencyMs,
    githubComment,
  };
}

function constructCommentMarkdown(params: {
  owner: string;
  repo: string;
  prNumber: number;
  commitSha?: string;
  profileResult: ProfileResult;
  hasRegressions: boolean;
  regressions: ProfileResult["deltas"];
  aiAnalysis: string;
  providerUsed: string;
  latencyMs: number;
}): string {
  const { profileResult, hasRegressions, regressions, aiAnalysis, providerUsed, latencyMs, commitSha } = params;

  const statusBadge = hasRegressions
    ? "🚨 **PERFORMANCE REGRESSION DETECTED**"
    : "✅ **NO PERFORMANCE REGRESSION DETECTED**";

  let markdown = `## 🔍 Regression Whisperer Report

${statusBadge}

### ⏱️ Summary Metrics
- **Target Script**: \`${profileResult.target}\`
- **Before PR**: \`${profileResult.summary.totalBeforeMs} ms\`
- **After PR**: \`${profileResult.summary.totalAfterMs} ms\`
- **Net Delta**: \`${profileResult.summary.totalDeltaMs >= 0 ? "+" : ""}${profileResult.summary.totalDeltaMs} ms\`
${commitSha ? `- **Commit SHA**: \`${commitSha.slice(0, 7)}\`` : ""}

---

### 📊 Function Timing Deltas
| Function / Component | Before (ms) | After (ms) | Delta (ms) | Change (%) | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
`;

  for (const delta of profileResult.deltas) {
    const status = delta.regression ? "❌ Regression" : delta.deltaMs < 0 ? "⚡ Faster" : "➖ Unchanged";
    const deltaSign = delta.deltaMs >= 0 ? `+${delta.deltaMs}` : `${delta.deltaMs}`;
    const percentSign = delta.percentageChange >= 0 ? `+${delta.percentageChange}%` : `${delta.percentageChange}%`;
    markdown += `| \`${delta.name}\` | ${delta.beforeMs} | ${delta.afterMs} | ${deltaSign} | ${percentSign} | ${status} |\n`;
  }

  markdown += `

---

### 🤖 AI Diagnosis & Optimization Path
*(Analyzed by **${providerUsed.toUpperCase()}** ${latencyMs ? `in ${latencyMs}ms` : ""})*

${aiAnalysis}

---
*Generated automatically by [Regression Whisperer](https://github.com).*`;

  return markdown;
}
