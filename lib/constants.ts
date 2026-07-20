export const AGENTS = [
  "Profiler",
  "Router",
  "Diff Reasoning",
  "Historian",
  "Explainer",
] as const;

export type AgentName = (typeof AGENTS)[number];

export const PROVIDERS = ["Gemini", "Groq", "NVIDIA", "Cerebras"] as const;

export type ProviderName = (typeof PROVIDERS)[number];

export const SEVERITY = {
  NONE: "none",
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
} as const;

export type Severity = (typeof SEVERITY)[keyof typeof SEVERITY];

export const PIPELINE_PHASES = ["idle", "processing", "complete"] as const;

export type PipelinePhase = (typeof PIPELINE_PHASES)[number];
