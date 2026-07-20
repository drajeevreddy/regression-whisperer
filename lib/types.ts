import type { Severity } from "@/lib/constants";

export interface PRSummary {
  id: number;
  number: number;
  title: string;
  repo: string;
  branch: string;
  author: string;
  severity: Severity;
  analyzedAt: string;
  flamegraph: FlameGraphData | null;
}

export interface FlameGraphData {
  functions: FlameFrame[];
  totalSamples: number;
}

export interface FlameFrame {
  name: string;
  beforePct: number;
  afterPct: number;
  deltaPct: number;
  severity: Severity;
}

export interface DiffLine {
  lineNumber: number;
  content: string;
  type: "add" | "remove" | "context";
  annotation?: string;
}

export interface PRDetail {
  id: number;
  number: number;
  title: string;
  repo: string;
  branch: string;
  author: string;
  severity: Severity;
  analyzedAt: string;
  flamegraph: FlameGraphData;
  diff: DiffLine[];
  explanation: string;
  historicalMatch: {
    prNumber: number;
    prTitle: string;
    description: string;
    similarityScore: number;
  } | null;
}
