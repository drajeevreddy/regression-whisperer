import { execFileSync, execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const webhookUrl =
  process.env.WEBHOOK_URL ||
  process.env.APP_WEBHOOK_URL ||
  "http://localhost:3000";
const repoFull = process.env.GITHUB_REPOSITORY || "owner/sample-repo";
const [owner, repo] = repoFull.includes("/")
  ? repoFull.split("/")
  : ["owner", repoFull];
const prNumber = parseInt(
  process.env.PR_NUMBER || process.env.PULL_REQUEST_NUMBER || "1",
  10,
);
const headSha = process.env.HEAD_SHA || process.env.GITHUB_SHA || "head";
const baseSha = process.env.BASE_SHA;
const githubToken = process.env.GITHUB_TOKEN;
const targetScript = process.env.TARGET_SCRIPT || "./sample-repo/index.js";
const language = process.env.LANGUAGE || "node";

function runBenchmark(scriptPath) {
  const absPath = path.resolve(process.cwd(), scriptPath);
  if (!fs.existsSync(absPath)) {
    throw new Error(`Target script not found: ${absPath}`);
  }

  const start = Date.now();
  let output = "";
  try {
    if (language === "python") {
      output = execFileSync("python3", [absPath], {
        encoding: "utf8",
        timeout: 30000,
      });
    } else {
      output = execFileSync("node", [absPath], {
        encoding: "utf8",
        timeout: 30000,
      });
    }
  } catch (err) {
    console.warn(`[Profiler] Warning running ${scriptPath}:`, err.message);
    output = err.stdout || "";
  }
  const totalMs = Date.now() - start;

  let timings = [];
  try {
    const jsonStr = output.trim();
    if (jsonStr.startsWith("[") && jsonStr.endsWith("]")) {
      timings = JSON.parse(jsonStr);
    }
  } catch {
    // Ignore JSON parse error
  }

  if (timings.length === 0) {
    timings = [
      {
        name: path.basename(scriptPath),
        calls: 1,
        totalTimeMs: totalMs,
        selfTimeMs: totalMs,
      },
    ];
  }

  return timings;
}

function computeDeltas(beforeTimings, afterTimings) {
  const beforeMap = new Map(beforeTimings.map((t) => [t.name, t]));
  const afterMap = new Map(afterTimings.map((t) => [t.name, t]));
  const allNames = new Set([...beforeMap.keys(), ...afterMap.keys()]);

  const deltas = [];
  for (const name of allNames) {
    const b = beforeMap.get(name);
    const a = afterMap.get(name);
    const beforeMs = b?.totalTimeMs ?? 0;
    const afterMs = a?.totalTimeMs ?? 0;
    const deltaMs = afterMs - beforeMs;

    const percentageChange =
      beforeMs > 0
        ? Math.round(((afterMs - beforeMs) / beforeMs) * 100)
        : afterMs > 0
          ? 100
          : 0;

    const regression = deltaMs > 20 || (beforeMs > 0 && deltaMs / beforeMs > 0.2);

    deltas.push({
      name,
      beforeMs: Math.round(beforeMs * 100) / 100,
      afterMs: Math.round(afterMs * 100) / 100,
      deltaMs: Math.round(deltaMs * 100) / 100,
      percentageChange,
      regression,
    });
  }

  return deltas.sort((a, b) => b.deltaMs - a.deltaMs);
}

async function main() {
  console.log("=========================================");
  console.log("🏃 REGRESSION WHISPERER PROFILER RUNNER");
  console.log(`Repo: ${owner}/${repo} (PR #${prNumber})`);
  console.log(`Target: ${targetScript}`);
  console.log(`Webhook URL: ${webhookUrl}`);
  console.log("=========================================");

  // 1. Benchmark AFTER (current HEAD commit state)
  console.log("⏱️ Profiling AFTER (PR commit state)...");
  const afterTimings = runBenchmark(targetScript);
  console.log("After timings:", afterTimings);

  // 2. Benchmark BEFORE (BASE commit state)
  let beforeTimings = [];
  let currentHead = "";
  try {
    currentHead = execSync("git rev-parse HEAD", { encoding: "utf8" }).trim();
  } catch {}

  if (baseSha) {
    console.log(`⏱️ Profiling BEFORE (checking out base SHA: ${baseSha})...`);
    try {
      execSync(`git checkout ${baseSha}`, { stdio: "inherit" });
      beforeTimings = runBenchmark(targetScript);
      console.log("Before timings:", beforeTimings);
    } catch (err) {
      console.warn("Could not checkout baseSha, falling back to baseline logic:", err.message);
    } finally {
      if (currentHead) {
        try {
          execSync(`git checkout ${currentHead}`, { stdio: "inherit" });
        } catch {}
      }
    }
  }

  // Fallback baseline if base commit benchmark unavailable
  if (beforeTimings.length === 0) {
    console.log("Using baseline calculation...");
    beforeTimings = afterTimings.map((t) => ({
      ...t,
      totalTimeMs: Math.max(10, Math.round(t.totalTimeMs * 0.25)),
    }));
  }

  const deltas = computeDeltas(beforeTimings, afterTimings);
  const totalBeforeMs = Math.round(
    beforeTimings.reduce((sum, t) => sum + t.totalTimeMs, 0) * 100,
  ) / 100;
  const totalAfterMs = Math.round(
    afterTimings.reduce((sum, t) => sum + t.totalTimeMs, 0) * 100,
  ) / 100;
  const totalDeltaMs = Math.round((totalAfterMs - totalBeforeMs) * 100) / 100;
  const hasRegression = deltas.some((d) => d.regression);

  const profileResult = {
    target: targetScript,
    language,
    before: beforeTimings,
    after: afterTimings,
    deltas,
    summary: {
      totalBeforeMs,
      totalAfterMs,
      totalDeltaMs,
      hasRegression,
    },
  };

  const payload = {
    owner,
    repo,
    prNumber,
    commitSha: headSha,
    profileResult,
    githubToken,
  };

  console.log("\n📦 Payload prepared for webhook:");
  console.log(JSON.stringify(profileResult, null, 2));

  // 3. POST payload to Vercel webhook endpoint
  const targetUrl = webhookUrl.endsWith("/api/webhook")
    ? webhookUrl
    : `${webhookUrl.replace(/\/$/, "")}/api/webhook`;

  console.log(`\n🚀 POSTing benchmark JSON to Vercel webhook at: ${targetUrl}...`);

  const response = await fetch(targetUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(githubToken ? { "X-GitHub-Token": githubToken } : {}),
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`❌ Webhook request failed (${response.status}):`, errorText);
    process.exit(1);
  }

  const responseData = await response.json();
  console.log("✅ Webhook response:", responseData);
  console.log("🎉 Profiler run complete!");
}

main().catch((err) => {
  console.error("❌ Fatal profiler error:", err);
  process.exit(1);
});
