import { describe, expect, it } from "vitest";
import { runExplainerAgent } from "../lib/agents/explainer";
import { computeDeltas } from "../lib/agents/profiler";

describe("Profiler Agent computeDeltas", () => {
  it("correctly computes performance deltas and flags regressions", () => {
    const before = [
      { name: "getUser", calls: 1, totalTimeMs: 10, selfTimeMs: 10 },
      { name: "fetchData", calls: 1, totalTimeMs: 20, selfTimeMs: 20 },
    ];

    const after = [
      { name: "getUser", calls: 1, totalTimeMs: 12, selfTimeMs: 12 },
      { name: "fetchData", calls: 10, totalTimeMs: 250, selfTimeMs: 250 },
    ];

    const deltas = computeDeltas(before, after);

    expect(deltas).toHaveLength(2);
    const fetchDataDelta = deltas.find((d) => d.name === "fetchData");
    expect(fetchDataDelta).toBeDefined();
    expect(fetchDataDelta?.deltaMs).toBe(230);
    expect(fetchDataDelta?.regression).toBe(true);

    const getUserDelta = deltas.find((d) => d.name === "getUser");
    expect(getUserDelta?.regression).toBe(false);
  });
});

describe("Explainer Agent", () => {
  it("formats markdown PR comment with profiler result and badge", async () => {
    const profileResult = {
      target: "sample-repo/index.js",
      language: "node" as const,
      before: [{ name: "fn", calls: 1, totalTimeMs: 20, selfTimeMs: 20 }],
      after: [{ name: "fn", calls: 1, totalTimeMs: 250, selfTimeMs: 250 }],
      deltas: [
        {
          name: "fn",
          beforeMs: 20,
          afterMs: 250,
          deltaMs: 230,
          percentageChange: 1150,
          regression: true,
        },
      ],
      summary: {
        totalBeforeMs: 20,
        totalAfterMs: 250,
        totalDeltaMs: 230,
        hasRegression: true,
      },
    };

    const res = await runExplainerAgent({
      owner: "test-owner",
      repo: "test-repo",
      prNumber: 1,
      profileResult,
      postComment: false,
    });

    expect(res.commentMarkdown).toContain("PERFORMANCE REGRESSION DETECTED");
    expect(res.commentMarkdown).toContain("`+230 ms`");
    expect(res.commentMarkdown).toContain("❌ Regression");
  });
});
