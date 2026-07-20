import type { PipelinePhase } from "@/lib/constants";

export interface AgentState {
  name: string;
  phase: PipelinePhase;
  output: string | null;
}

export interface PipelineRun {
  id: string;
  prNumber: number;
  prTitle: string;
  repo: string;
  branch: string;
  agentStates: AgentState[];
  startedAt: string;
}

const agentOutputs: Record<string, string> = {
  Profiler: `## Profiler Analysis
sampling 847 stack frames across 12 goroutines (pid=28491)

TOP FUNCTIONS BY CPU:
  84.2%  runtime.mallocgc         [self: 12.4%]
  67.1%  encoding/json.Marshal    [self:  8.7%]
  52.3%  db.Query                 [self: 14.1%]
  41.8%  auth.ValidateToken       [self: 11.2%]

ALLOCATION HOTSPOTS:
  218 MB  db.Query (previously: 142 MB)
   96 MB  auth.ValidateToken (previously: 88 MB)
   43 MB  encoding/json.Marshal (unchanged)`,
  Router: `## Router Decision
matched 3/4 profiling signals to known optimization paths

PATH 1 [db.Query +137% alloc]: 
  → route to DIFF REASONING (high confidence)
  
PATH 2 [auth.ValidateToken +9% alloc]:
  → route to HISTORIAN for pattern matching

PATH 3 [runtime.mallocgc steady]:
  → skip — GC pressure within baseline

AGENT ASSIGNMENT:
  Diff Reasoning ← PATH 1 (primary)
  Historian     ← PATH 2 (corroborating)`,
  "Diff Reasoning": `## Diff Reasoning — v2.4.1 vs v2.4.0

FILE: internal/db/query.go:142-187

  - func (q *QueryBuilder) Execute(ctx context.Context) ([]Row, error) {
  + func (q *QueryBuilder) Execute(ctx context.Context) ([]Row, error) {
      // added eager preload for relations
  +   if err := q.preloadRelations(ctx); err != nil {
  +     return nil, fmt.Errorf("preload: %w", err)
  +   }
      rows, err := q.conn.Query(ctx, q.buildSQL())
      ...
    }

SIGNAL: preloadRelations issues N+1 subqueries per row.
Each Execute call now performs avg 47 additional queries.
Impact: +137% allocation, +82% query latency (p99).`,
  Historian: `## Historical Match

SIMILAR REGRESSION FOUND:
  PR #2381 — "add user role preload" (2024-11-14)
  Same N+1 pattern in internal/db/query.go
  Root cause: eager relation loading without batch Join
  Fixed by: batching relation queries with IN clause

SIMILARITY SCORE: 0.87 (function signature + call pattern)

RECOMMENDATION:
  Apply same batch-Join pattern from PR #2382.
  Expected recovery: -65% allocation, -41% p99 latency.`,
  Explainer: `## Explainer

WHAT HAPPENED:
  PR #421 introduced eager relation preloading in 
  internal/db/query.go via q.preloadRelations(). 
  This function issues a separate query per relation 
  per row, causing a 2.4x increase in heap allocation 
  and pushing p99 query latency from 18ms to 33ms.

WHY IT MATTERS:
  db.Query.Execute is on the critical path for every 
  API request. The 137% allocation increase triggers 
  more frequent GC pauses, compounding latency at p99.

WHAT TO DO:
  Replace per-row preloading with a single batched JOIN 
  query. See PR #2382 for the reference implementation. 
  Estimated effort: <1 day. No schema changes needed.`,
};

export function createPipelineRun(
  prNumber: number,
  prTitle: string,
  repo: string,
  branch: string
): PipelineRun {
  const id = `run-${Date.now()}`;
  return {
    id,
    prNumber,
    prTitle,
    repo,
    branch,
    agentStates: [
      { name: "Profiler", phase: "idle", output: null },
      { name: "Router", phase: "idle", output: null },
      { name: "Diff Reasoning", phase: "idle", output: null },
      { name: "Historian", phase: "idle", output: null },
      { name: "Explainer", phase: "idle", output: null },
    ],
    startedAt: new Date().toISOString(),
  };
}

export function getAgentOutput(agentName: string): string {
  return agentOutputs[agentName] ?? "No output available.";
}

export const AGENT_DURATIONS: Record<string, number> = {
  Profiler: 2000,
  Router: 1500,
  "Diff Reasoning": 2000,
  Historian: 1500,
  Explainer: 2000,
};
