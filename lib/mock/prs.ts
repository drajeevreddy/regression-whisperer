import type { Severity } from "@/lib/constants";
import type { PRSummary, FlameGraphData, DiffLine, PRDetail } from "@/lib/types";

export type { PRSummary, FlameGraphData, DiffLine, PRDetail };

const flameGraphData: FlameGraphData = {
  totalSamples: 847,
  functions: [
    { name: "runtime.mallocgc", beforePct: 84.2, afterPct: 84.2, deltaPct: 0, severity: "none" },
    { name: "encoding/json.Marshal", beforePct: 67.1, afterPct: 67.1, deltaPct: 0, severity: "none" },
    { name: "db.Query.Execute", beforePct: 38.2, afterPct: 52.3, deltaPct: 14.1, severity: "high" },
    { name: "db.preloadRelations", beforePct: 0, afterPct: 41.8, deltaPct: 41.8, severity: "high" },
    { name: "auth.ValidateToken", beforePct: 11.2, afterPct: 11.2, deltaPct: 0, severity: "none" },
    { name: "net/http.(*conn).serve", beforePct: 8.9, afterPct: 9.1, deltaPct: 0.2, severity: "none" },
    { name: "sync.(*Mutex).Lock", beforePct: 6.3, afterPct: 6.5, deltaPct: 0.2, severity: "none" },
    { name: "log.Printf", beforePct: 4.1, afterPct: 4.1, deltaPct: 0, severity: "none" },
    { name: "compress/gzip.(*Writer).Write", beforePct: 3.8, afterPct: 3.7, deltaPct: -0.1, severity: "none" },
    { name: "crypto/sha256.Sum256", beforePct: 3.1, afterPct: 3.1, deltaPct: 0, severity: "none" },
  ],
};

const diffLines: DiffLine[] = [
  {
    lineNumber: 139,
    content: " func (q *QueryBuilder) Execute(ctx context.Context) ([]Row, error) {",
    type: "context",
  },
  {
    lineNumber: 140,
    content: " 	rows, err := q.conn.Query(ctx, q.buildSQL())",
    type: "remove",
  },
  {
    lineNumber: 141,
    content: " 	if err != nil {",
    type: "remove",
  },
  {
    lineNumber: 142,
    content: " 		return nil, fmt.Errorf(\"query: %w\", err)",
    type: "remove",
  },
  {
    lineNumber: 143,
    content: " 	}",
    type: "remove",
  },
  {
    lineNumber: 140,
    content: "+ 	if err := q.preloadRelations(ctx); err != nil {",
    type: "add",
    annotation: "N+1 queries per row",
  },
  {
    lineNumber: 141,
    content: "+ 		return nil, fmt.Errorf(\"preload: %w\", err)",
    type: "add",
  },
  {
    lineNumber: 142,
    content: "+ 	}",
    type: "add",
  },
  {
    lineNumber: 143,
    content: "+ 	rows, err := q.conn.Query(ctx, q.buildSQL())",
    type: "add",
  },
  {
    lineNumber: 144,
    content: "+ 	if err != nil {",
    type: "add",
  },
  {
    lineNumber: 145,
    content: "+ 		return nil, fmt.Errorf(\"query: %w\", err)",
    type: "add",
  },
  {
    lineNumber: 146,
    content: "+ 	}",
    type: "add",
  },
  {
    lineNumber: 147,
    content: " 	return rows, nil",
    type: "context",
  },
  {
    lineNumber: 148,
    content: " }",
    type: "context",
  },
];

const explanation = `PR #421 introduced eager relation preloading in 
internal/db/query.go via q.preloadRelations(). 
This function issues a separate query per relation 
per row, causing a 2.4x increase in heap allocation 
and pushing p99 query latency from 18ms to 33ms.

db.Query.Execute is on the critical path for every 
API request. The 137% allocation increase triggers 
more frequent GC pauses, compounding latency at p99.

To fix: Replace per-row preloading with a single 
batched JOIN query. See PR #2382 for reference. 
Estimated effort: <1 day. No schema changes needed.`;

export const prDetails: PRDetail[] = [
  {
    id: 1,
    number: 421,
    title: "Add eager relation preloading to query builder",
    repo: "backend/api",
    branch: "feat/eager-preload",
    author: "alexchen",
    severity: "high",
    analyzedAt: "2026-07-20T08:42:11Z",
    flamegraph: flameGraphData,
    diff: diffLines,
    explanation,
    historicalMatch: {
      prNumber: 2381,
      prTitle: "Add user role preload",
      description:
        "Same N+1 pattern in internal/db/query.go. Root cause: eager relation loading without batch Join. Fixed by batching relation queries with IN clause.",
      similarityScore: 0.87,
    },
  },
  {
    id: 2,
    number: 419,
    title: "Refactor auth middleware to use context propagation",
    repo: "backend/auth",
    branch: "refactor/auth-context",
    author: "jordanliu",
    severity: "medium",
    analyzedAt: "2026-07-20T07:15:33Z",
    flamegraph: {
      totalSamples: 412,
      functions: [
        {
          name: "auth.ValidateToken",
          beforePct: 22.4,
          afterPct: 31.8,
          deltaPct: 9.4,
          severity: "medium",
        },
        {
          name: "context.WithValue",
          beforePct: 4.2,
          afterPct: 6.1,
          deltaPct: 1.9,
          severity: "low",
        },
        { name: "net/http.HandlerFunc.ServeHTTP", beforePct: 8.1, afterPct: 8.1, deltaPct: 0, severity: "none" },
        { name: "runtime.mallocgc", beforePct: 6.3, afterPct: 6.5, deltaPct: 0.2, severity: "none" },
        { name: "encoding/json.Unmarshal", beforePct: 5.1, afterPct: 5.0, deltaPct: -0.1, severity: "none" },
      ],
    },
    diff: [
      { lineNumber: 24, content: " func ValidateToken(ctx context.Context, token string) (*Claims, error) {", type: "context" },
      { lineNumber: 25, content: "-	claims, err := parseToken(token)", type: "remove" },
      { lineNumber: 25, content: "+	claims, err := parseToken(ctx, token)", type: "add", annotation: "Added ctx propagation" },
      { lineNumber: 26, content: " 	if err != nil {", type: "context" },
      { lineNumber: 27, content: " 		return nil, err", type: "context" },
    ],
    explanation:
      "PR #419 refactors auth.ValidateToken to propagate context through token parsing. This adds ~9% allocation increase due to additional context values stored per call. Medium severity — acceptable trade-off for better tracing.",
    historicalMatch: null,
  },
  {
    id: 3,
    number: 418,
    title: "Optimize JSON serialization path for /api/events",
    repo: "backend/api",
    branch: "perf/json-optimize",
    author: "priyashah",
    severity: "low",
    analyzedAt: "2026-07-19T22:01:44Z",
    flamegraph: {
      totalSamples: 621,
      functions: [
        { name: "encoding/json.Marshal", beforePct: 67.1, afterPct: 62.3, deltaPct: -4.8, severity: "low" },
        { name: "runtime.mallocgc", beforePct: 84.2, afterPct: 80.1, deltaPct: -4.1, severity: "low" },
        { name: "net/http.(*conn).serve", beforePct: 8.9, afterPct: 8.8, deltaPct: -0.1, severity: "none" },
      ],
    },
    diff: [
      { lineNumber: 88, content: " func marshalEvents(events []Event) ([]byte, error) {", type: "context" },
      { lineNumber: 89, content: "-	return json.Marshal(events)", type: "remove" },
      { lineNumber: 89, content: "+	return json.Marshal(streamEvents(events))", type: "add", annotation: "Streaming encoder" },
      { lineNumber: 90, content: " }", type: "context" },
    ],
    explanation:
      "PR #418 switches from json.Marshal to a streaming encoder for /api/events. No regression detected — slight improvement in allocation. Low-severity observation only.",
    historicalMatch: null,
  },
  {
    id: 4,
    number: 415,
    title: "Add rate limiter to public endpoints",
    repo: "backend/middleware",
    branch: "feat/rate-limiter",
    author: "taylorwong",
    severity: "none",
    analyzedAt: "2026-07-19T18:30:00Z",
    flamegraph: {
      totalSamples: 389,
      functions: [
        { name: "net/http.HandlerFunc.ServeHTTP", beforePct: 8.1, afterPct: 8.3, deltaPct: 0.2, severity: "none" },
        { name: "runtime.mallocgc", beforePct: 6.3, afterPct: 6.2, deltaPct: -0.1, severity: "none" },
        { name: "sync.(*Mutex).Lock", beforePct: 2.1, afterPct: 2.8, deltaPct: 0.7, severity: "none" },
      ],
    },
    diff: [
      { lineNumber: 12, content: "+	limiter := rate.NewLimiter(100, 200)", type: "add" },
      { lineNumber: 13, content: "+	if !limiter.Allow() {", type: "add" },
      { lineNumber: 14, content: "+		http.Error(w, \"rate limited\", 429)", type: "add" },
      { lineNumber: 15, content: "+		return", type: "add" },
      { lineNumber: 16, content: "+	}", type: "add" },
    ],
    explanation:
      "PR #415 adds rate limiting. No performance regression detected. All flame graph deltas within normal variance.",
    historicalMatch: null,
  },
];

export const prFeed: PRSummary[] = prDetails.map(
  ({ id, number, title, repo, branch, author, severity, analyzedAt, flamegraph }) => ({
    id,
    number,
    title,
    repo,
    branch,
    author,
    severity,
    analyzedAt,
    flamegraph,
  })
);
