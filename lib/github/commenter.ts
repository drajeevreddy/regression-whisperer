export interface PostPRCommentOptions {
  owner: string;
  repo: string;
  prNumber: number;
  body: string;
  token?: string;
}

export interface PostPRCommentResult {
  id: number;
  html_url: string;
  created_at: string;
}

/**
 * mcpGithubPostComment — Interface for posting PR comments.
 *
 * Uses the standard GitHub REST API with GITHUB_TOKEN.
 * Structured cleanly as an abstracted interface so swapping to an MCP tool server
 * (e.g., calling an external Model Context Protocol server endpoint) is a trivial drop-in replacement.
 */
export async function mcpGithubPostComment(
  options: PostPRCommentOptions,
): Promise<PostPRCommentResult> {
  const token = options.token || process.env.GITHUB_TOKEN;
  if (!token) {
    throw new Error(
      "Missing GitHub token for posting PR comment. Please set GITHUB_TOKEN in environment or pass token in options.",
    );
  }

  const { owner, repo, prNumber, body } = options;
  const url = `https://api.github.com/repos/${owner}/${repo}/issues/${prNumber}/comments`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "Regression-Whisperer",
    },
    body: JSON.stringify({ body }),
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => "");
    throw new Error(
      `GitHub REST API error ${res.status} posting comment to ${owner}/${repo}#${prNumber}: ${errorText.slice(0, 300)}`,
    );
  }

  const data = (await res.json()) as PostPRCommentResult;
  return data;
}
