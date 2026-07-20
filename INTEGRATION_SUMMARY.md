# 🚀 Regression Whisperer - GitHub + Deployment Integration Layer

This document summarizes the complete setup and architecture implemented for the **GitHub + Deployment Integration Layer** of **Regression Whisperer**.

---

## 📌 Implementation Overview

### 1. GitHub Action Workflow (`.github/workflows/regression-whisperer.yml`)
- **File Path**: [.github/workflows/regression-whisperer.yml](file:///home/painarise/Documents/Projects/Regression-Whisperer/.github/workflows/regression-whisperer.yml)
- **Triggers**: On Pull Request events (`opened`, `synchronize`, `reopened`).
- **Functionality**:
  - Checks out full git commit history to compare `base` vs `head` PR commits.
  - Runs the Profiler Agent locally inside the GitHub Action runner using `node scripts/run-profiler.mjs` (avoiding Vercel serverless function execution timeout limits).
  - Captures function performance metrics and HTTP POSTs the resulting JSON payload to the `/api/webhook` route on the deployed Vercel application.

---

### 2. GitHub REST API PR Commenter (`lib/github/commenter.ts`)
- **File Path**: [lib/github/commenter.ts](file:///home/painarise/Documents/Projects/Regression-Whisperer/lib/github/commenter.ts)
- **Functionality**:
  - Implemented `mcpGithubPostComment()` using standard GitHub REST API (`POST /repos/{owner}/{repo}/issues/{prNumber}/comments`) with `GITHUB_TOKEN`.
  - Structured as a clean adapter so it can easily swap to a real Model Context Protocol (MCP) tool server in the future.

---

### 3. Live On-Stage Demo Fixture (`/sample-repo/`)
- **Directory Path**: [sample-repo/](file:///home/painarise/Documents/Projects/Regression-Whisperer/sample-repo/)
- **Files**:
  - `index.js`: Regressed PR commit state introducing an N+1 query loop regression (~245ms execution).
  - `index.clean.js`: Clean base commit state using efficient batch fetching (~27ms execution).
  - `README.md`: Explains the live on-stage demo trigger process.

---

### 4. Primary Provider & LLM Router (`lib/router/`)
- **File Paths**:
  - [lib/router/index.ts](file:///home/painarise/Documents/Projects/Regression-Whisperer/lib/router/index.ts)
  - [lib/router/providers/gemini.ts](file:///home/painarise/Documents/Projects/Regression-Whisperer/lib/router/providers/gemini.ts)
- **Configuration**:
  - **Google Gemini 2.0 Flash (`gemini`)** is explicitly wired as the **primary headline provider** at index 0 of `DEFAULT_PROVIDERS`.
  - **Groq**, **NVIDIA NIM**, and **Cerebras** serve as failover providers if Gemini rate limits or errors out.

---

### 5. Webhook API Route & Explainer Agent (`app/api/webhook/route.ts` & `lib/agents/explainer.ts`)
- **File Paths**:
  - [app/api/webhook/route.ts](file:///home/painarise/Documents/Projects/Regression-Whisperer/app/api/webhook/route.ts)
  - [lib/agents/explainer.ts](file:///home/painarise/Documents/Projects/Regression-Whisperer/lib/agents/explainer.ts)
- **Functionality**:
  - Webhook route receives profiler JSON from GitHub Actions.
  - Passes timing deltas to the Explainer Agent.
  - Explainer Agent invokes Gemini AI Studio to diagnose the root cause (e.g. N+1 query pattern) and recommend fix paths.
  - Formats markdown report and posts it directly to the PR via `mcpGithubPostComment()`.

---

## 🧪 Verification & Testing

1. **End-to-End Script (`scripts/verify-e2e.mjs`)**: Verified complete Action → Profiler → Gemini Router → Markdown Explainer → GitHub Commenter loop.
2. **Vitest Unit Test Suite (`__tests__/`)**: All 25 tests passed across 4 test suites.
3. **Typecheck (`npm run typecheck`)**: Clean pass with 0 TypeScript compilation errors.
