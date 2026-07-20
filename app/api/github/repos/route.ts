import { extractByokKeys } from "@/lib/router";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const owner = url.searchParams.get("owner");
    const repo = url.searchParams.get("repo");

    if (!owner || !repo) {
      return Response.json({ error: "Missing owner or repo query params" }, { status: 400 });
    }

    const byokKeys = extractByokKeys(req);
    const token = byokKeys?.GITHUB_TOKEN || process.env.GITHUB_TOKEN;

    const headers: Record<string, string> = {
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "Regression-Whisperer",
    };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const ghRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/pulls?state=open&per_page=30&sort=updated&direction=desc`,
      { headers },
    );

    if (!ghRes.ok) {
      const text = await ghRes.text().catch(() => "");
      return Response.json(
        { error: `GitHub API ${ghRes.status}: ${text.slice(0, 300)}` },
        { status: ghRes.status },
      );
    }

    const prs = (await ghRes.json()) as Array<{
      number: number;
      title: string;
      user: { login: string } | null;
      head: { ref: string; sha: string };
      base: { ref: string };
      created_at: string;
      updated_at: string;
      changed_files: number;
      additions: number;
      deletions: number;
      labels: Array<{ name: string }>;
    }>;

    const mapped = prs.map((pr) => ({
      number: pr.number,
      title: pr.title,
      author: pr.user?.login ?? "unknown",
      branch: pr.head.ref,
      baseBranch: pr.base.ref,
      commitSha: pr.head.sha,
      createdAt: pr.created_at,
      updatedAt: pr.updated_at,
      changedFiles: pr.changed_files,
      additions: pr.additions,
      deletions: pr.deletions,
      labels: pr.labels.map((l) => l.name),
    }));

    return Response.json({ owner, repo, prs: mapped });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[/api/github/repos] Error:", message);
    return Response.json({ error: message }, { status: 500 });
  }
}
