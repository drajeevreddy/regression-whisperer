# Regression Whisperer

AI-powered performance regression detection for pull requests. Paste a GitHub repo link, select a PR, and five AI agents analyze it for N+1 queries, memory leaks, latency spikes, and more.

**Cost: $0** — Free-tier LLM providers (Gemini, Groq, NVIDIA NIM, Cerebras) + Neon Postgres free tier.

**Live:** [regression-whisperer.localbrain.in](https://regression-whisperer.localbrain.in)

---

## How It Works

1. **Paste a GitHub repo URL** on the `/analyze` page
2. **Select an open PR** from the list fetched via GitHub API
3. **Click Analyze** — the app fetches the diff and runs LLM-powered analysis
4. **Get results** — severity rating, root cause, fix recommendation, and detailed explanation
5. **Results persist** to Neon Postgres and appear on the PR detail page

### The Five-Agent Pipeline

```
Profiler → Router → Diff Reasoning → Historian → Explainer
```

| Agent | Role |
|---|---|
| **Profiler** | Benchmarks before/after performance, computes timing deltas |
| **Router** | Routes requests across 4 LLM providers with failover (Gemini → Groq → NVIDIA → Cerebras) |
| **Diff Reasoning** | Analyzes code diffs for regression patterns (N+1, sync blocking, unbatched I/O) |
| **Historian** | Searches past regressions for similar patterns and matches |
| **Explainer** | Synthesizes findings into actionable PR comments with root cause and fix recommendations |

---

## Features

- **GitHub Integration** — Fetch open PRs from any public repo, analyze on demand
- **BYOK (Bring Your Own Key)** — API keys stay in your browser's `localStorage`, never sent to our servers
- **4-Provider Failover** — Gemini primary, Groq/NVIDIA/Cerebras automatic fallback
- **Live Pipeline Visualization** — Watch the 5-agent pipeline run in real time at `/pipeline`
- **Dark, Minimal UI** — Custom design system with Geist font, no frameworks
- **PR Detail Pages** — Flame graph visualization, diff viewer, AI explanation, historical matches
- **Zero Cost** — Free-tier APIs, free Neon Postgres, Vercel hobby deployment

---

## Tech Stack

- **Framework:** Next.js 16 (App Router, Turbopack)
- **Language:** TypeScript 5.9
- **UI:** React 19, Tailwind CSS v4, custom components (no UI library)
- **Database:** Neon Postgres (serverless) + Drizzle ORM
- **LLM:** Gemini, Groq, NVIDIA NIM, Cerebras (free tiers)
- **Auth:** GitHub REST API for PR fetching and commenting
- **Deployment:** Vercel

---

## Getting Started

```bash
# Clone
git clone https://github.com/drajeevreddy/regression-whisperer.git
cd regression-whisperer

# Install
npm install

# Set up database
cp .env.example .env
# Edit .env with your Neon DATABASE_URL
npm run db:push        # Create tables
npm run db:seed        # Clear tables

# Run
npm run dev            # http://localhost:3000
```

### Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | Neon Postgres connection string |
| `GEMINI_API_KEY` | No | Google AI Studio key (free tier) |
| `GROQ_API_KEY` | No | Groq API key (free tier) |
| `NVIDIA_NIM_API_KEY` | No | NVIDIA NIM key (free tier) |
| `CEREBRAS_API_KEY` | No | Cerebras API key (free tier) |
| `GITHUB_TOKEN` | No | GitHub PAT for private repos and PR commenting |

API keys are optional — the app works without any server-side keys using the BYOK flow (enter keys in the Setup page, stored in your browser).

---

## Routes

| Route | Description |
|---|---|
| `/` | Landing page |
| `/analyze` | Paste a GitHub repo URL, select and analyze PRs |
| `/prs` | Browse all analyzed PRs |
| `/prs/[id]` | PR detail — flame graph, diff, explanation, historical match |
| `/pipeline` | Live animated 5-agent pipeline demo |
| `/setup` | BYOK provider configuration |

---

## Project Structure

```
app/
  api/
    github/analyze/   POST — fetch PR diff + run LLM analysis
    github/repos/     GET  — fetch open PRs from GitHub API
    prs/              GET  — list analyzed PRs from DB
    providers/        GET/POST — provider status + key validation
    webhook/          POST — GitHub Actions webhook endpoint
  analyze/            Client page — repo URL input, PR list, analysis
  prs/                Server page — PR feed from DB
  prs/[id]/           Server page — PR detail with full analysis
  pipeline/           Client page — animated pipeline demo
  setup/              Client page — BYOK provider config
lib/
  router/             LLM router with 4-provider failover + BYOK
  agents/             Profiler, Explainer agents
  github/             GitHub PR commenter
  mock/               Mock data for pipeline demo
  types.ts            Shared TypeScript types
db/
  schema.ts           Drizzle schema (repos, prs, regressions, matches)
  index.ts            Neon serverless client singleton
  seed.ts             DB seed/clear script
components/           15 React components across 5 feature groups
```

---

## License

MIT
