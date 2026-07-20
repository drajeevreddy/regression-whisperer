import { runExplainerAgent } from "../lib/agents/explainer.js";
import { computeDeltas, runScriptBenchmark } from "../lib/agents/profiler.js";
import { DEFAULT_PROVIDERS } from "../lib/router/index.js";

async function main() {
  console.log("=========================================");
  console.log("🧪 REGRESSION WHISPERER END-TO-END VERIFICATION");
  console.log("=========================================");

  // 1. Verify Gemini is Headline Primary Provider in Router
  console.log("\n1️⃣ Checking LLM Router Provider Hierarchy...");
  const headlineProvider = DEFAULT_PROVIDERS[0];
  console.log(`Primary Provider: ${headlineProvider.name} (Model: ${headlineProvider.model})`);
  if (headlineProvider.name !== "gemini") {
    throw new Error(`FAIL: Gemini is not the primary provider! Found: ${headlineProvider.name}`);
  }
  console.log("✅ Provider check PASSED: Gemini (AI Studio) is correctly wired as headline primary provider.");

  // 2. Run Profiler Agent on clean vs regressed target
  console.log("\n2️⃣ Running Profiler Agent on sample repository fixture...");

  const cleanTimings = await runScriptBenchmark({
    language: "node",
    entryPoint: "./sample-repo/index.clean.js",
  });

  const regressedTimings = await runScriptBenchmark({
    language: "node",
    entryPoint: "./sample-repo/index.js",
  });

  console.log("Clean timings:", cleanTimings);
  console.log("Regressed timings:", regressedTimings);

  const deltas = computeDeltas(cleanTimings, regressedTimings);

  const totalBeforeMs = cleanTimings.reduce((sum, t) => sum + t.totalTimeMs, 0);
  const totalAfterMs = regressedTimings.reduce((sum, t) => sum + t.totalTimeMs, 0);
  const totalDeltaMs = totalAfterMs - totalBeforeMs;
  const hasRegression = deltas.some((d) => d.regression);

  const profileResult = {
    target: "./sample-repo/index.js",
    language: "node",
    before: cleanTimings,
    after: regressedTimings,
    deltas,
    summary: {
      totalBeforeMs,
      totalAfterMs,
      totalDeltaMs,
      hasRegression,
    },
  };

  console.log("\n📊 Profile Result Summary:");
  console.log(`- Before: ${totalBeforeMs}ms`);
  console.log(`- After: ${totalAfterMs}ms`);
  console.log(`- Net Delta: +${totalDeltaMs}ms`);
  console.log(`- Regressions Found: ${hasRegression}`);
  console.log("✅ Profiler Agent benchmark capture PASSED.");

  // 3. Run Explainer Agent (triggers Gemini AI Studio & Github PR comment format)
  console.log("\n3️⃣ Testing Explainer Agent + LLM Router + GitHub Commenter...");

  // Mock postComment as false so we don't attempt to post to non-existent real GitHub PR unless token/repo exists
  const mockOptions = {
    owner: "painarise",
    repo: "Regression-Whisperer",
    prNumber: 42,
    commitSha: "e2e-test-sha-12345",
    profileResult,
    postComment: false, // Set to false for local verification
  };

  const explainerResult = await runExplainerAgent(mockOptions);

  console.log(`\n🤖 Explainer Agent Response (Served by '${explainerResult.providerUsed.toUpperCase()}'):`);
  console.log("--------------------------------------------------");
  console.log(explainerResult.commentMarkdown);
  console.log("--------------------------------------------------");

  if (!explainerResult.commentMarkdown.includes("Regression Whisperer Report")) {
    throw new Error("FAIL: Explainer Agent output missing expected Markdown header!");
  }

  console.log("\n✅ ALL END-TO-END VERIFICATION CHECKS PASSED SUCCESSFULLY!");
}

main().catch((err) => {
  console.error("❌ E2E Verification failed:", err);
  process.exit(1);
});
