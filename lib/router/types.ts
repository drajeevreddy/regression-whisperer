export interface ProviderConfig {
  /** Provider identifier — used in logs and CallResult.provider */
  name: string;
  /** Base URL for the provider's chat completions endpoint */
  baseUrl: string;
  /** Environment variable name that holds the API key (never the key itself) */
  apiKeyEnv: string;
  /** Model identifier sent in the request body */
  model: string;
}

export interface CallOptions {
  prompt: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  /** Per-provider attempt timeout in ms (default: 30_000) */
  timeout?: number;
}

export interface CallResult {
  text: string;
  /** Which provider actually served the response */
  provider: string;
  latencyMs: number;
}

export interface ProviderAdapter {
  /** Provider name for logging and CallResult */
  readonly name: string;
  /** Send a request to this provider. Throws on error/rate-limit. */
  call(options: CallOptions, apiKey: string, modelOverride?: string): Promise<CallResult>;
}
