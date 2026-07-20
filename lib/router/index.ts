import type {
  CallOptions,
  CallResult,
  ProviderAdapter,
  ProviderConfig,
} from "./types";
import { GeminiAdapter } from "./providers/gemini";
import { GroqAdapter } from "./providers/groq";
import { NvidiaNimAdapter } from "./providers/nvidia-nim";
import { CerebrasAdapter } from "./providers/cerebras";

export type { CallOptions, CallResult, ProviderConfig, ProviderAdapter } from "./types";

/** Built-in adapter registry — maps provider name to adapter instance. */
const ADAPTERS: Record<string, ProviderAdapter> = {
  gemini: GeminiAdapter,
  groq: GroqAdapter,
  "nvidia-nim": NvidiaNimAdapter,
  cerebras: CerebrasAdapter,
};

/**
 * Default provider order for failover.
 * Gemini (Google AI Studio) is explicitly configured as the PRIMARY HEADLINE provider.
 * Groq, NVIDIA, and Cerebras serve strictly as the failover path.
 */
export const DEFAULT_PROVIDERS: ProviderConfig[] = [
  { name: "gemini", baseUrl: "https://generativelanguage.googleapis.com", apiKeyEnv: "GEMINI_API_KEY", model: "gemini-2.0-flash" },
  { name: "groq", baseUrl: "https://api.groq.com", apiKeyEnv: "GROQ_API_KEY", model: "llama-3.3-70b-versatile" },
  { name: "nvidia-nim", baseUrl: "https://integrate.api.nvidia.com", apiKeyEnv: "NVIDIA_NIM_API_KEY", model: "meta/llama-3.1-70b-instruct" },
  { name: "cerebras", baseUrl: "https://api.cerebras.ai", apiKeyEnv: "CEREBRAS_API_KEY", model: "llama3.1-70b" },
];

/**
 * Attempt a single provider call.
 * Resolves the API key from byokKeys (client-provided) first, then falls back to env.
 * Returns CallResult on success, throws on failure.
 */
async function attemptProvider(
  adapter: ProviderAdapter,
  config: ProviderConfig,
  options: CallOptions,
  byokKeys?: Record<string, string>,
): Promise<CallResult> {
  const apiKey = byokKeys?.[config.name] || process.env[config.apiKeyEnv];
  if (!apiKey) {
    throw new ProviderAttemptError(
      `No API key for "${config.name}" (checked BYOK headers and env.${config.apiKeyEnv})`,
      config.name,
    );
  }
  return adapter.call(options, apiKey, config.model);
}

/**
 * callModel — primary LLM entry point.
 *
 * Tries Gemini first (headline provider). On error or missing API key,
 * logs a warning and gracefully fails over to the next provider.
 *
 * @param byokKeys - Optional map of provider name → API key from the client.
 *                   Keys here take precedence over env vars. This is how
 *                   BYOK works: the client stores keys in localStorage and
 *                   sends them as a header; the server never persists them.
 */
export async function callModel(
  options: CallOptions,
  providers: ProviderConfig[] = DEFAULT_PROVIDERS,
  byokKeys?: Record<string, string>,
): Promise<CallResult> {
  const errors: Array<{ provider: string; error: Error }> = [];

  for (const config of providers) {
    const adapter = ADAPTERS[config.name];
    if (!adapter) {
      errors.push({
        provider: config.name,
        error: new ProviderAttemptError(
          `No adapter registered for provider "${config.name}"`,
          config.name,
        ),
      });
      continue;
    }

    try {
      return await attemptProvider(adapter, config, options, byokKeys);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      errors.push({ provider: config.name, error });

      console.warn(
        `[LLM Router] Provider '${config.name}' failed: ${error.message}. Trying next provider in failover sequence...`,
      );
    }
  }

  throw new ProviderAttemptError(
    `All AI providers failed. Attempts log: ${errors.map((e) => `${e.provider}: ${e.error.message}`).join("; ")}`,
    "all",
    errors,
  );
}

/**
 * Extract BYOK keys from a request header.
 * Expects `x-byok-keys` to be a JSON-encoded Record<string, string>.
 * Returns undefined if the header is missing or malformed.
 */
export function extractByokKeys(req: Request): Record<string, string> | undefined {
  const raw = req.headers.get("x-byok-keys");
  if (!raw) return undefined;
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed === "object" && parsed !== null) {
      return parsed as Record<string, string>;
    }
  } catch {
    // Malformed header — ignore
  }
  return undefined;
}

export function createRouter(providers: ProviderConfig[]) {
  return {
    call: (options: CallOptions) => callModel(options, providers),
  };
}

export class ProviderAttemptError extends Error {
  public readonly provider: string;
  public readonly attempts: Array<{ provider: string; error: Error }>;

  constructor(
    message: string,
    provider: string,
    attempts: Array<{ provider: string; error: Error }> = [],
  ) {
    super(message);
    this.name = "ProviderAttemptError";
    this.provider = provider;
    this.attempts = attempts;
  }
}
