import { describe, expect, it, vi } from "vitest";
import { mcpGithubPostComment } from "../lib/github/commenter";

describe("GitHub Commenter (mcpGithubPostComment)", () => {
  it("throws error if GITHUB_TOKEN is missing", async () => {
    delete process.env.GITHUB_TOKEN;

    await expect(
      mcpGithubPostComment({
        owner: "owner",
        repo: "repo",
        prNumber: 1,
        body: "Test comment",
      }),
    ).rejects.toThrow("Missing GitHub token");
  });

  it("posts PR comment using GitHub REST API endpoint", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: 12345,
        html_url: "https://github.com/owner/repo/pull/1#issuecomment-12345",
        created_at: "2026-07-20T18:00:00Z",
      }),
    } as Response);

    const res = await mcpGithubPostComment({
      owner: "test-owner",
      repo: "test-repo",
      prNumber: 42,
      body: "## Performance Report\nNo regressions.",
      token: "mock-gh-token",
    });

    expect(fetchSpy).toHaveBeenCalledWith(
      "https://api.github.com/repos/test-owner/test-repo/issues/42/comments",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer mock-gh-token",
          Accept: "application/vnd.github.v3+json",
        }),
        body: JSON.stringify({ body: "## Performance Report\nNo regressions." }),
      }),
    );

    expect(res.id).toBe(12345);
    expect(res.html_url).toContain("issuecomment-12345");

    fetchSpy.mockRestore();
  });
});
