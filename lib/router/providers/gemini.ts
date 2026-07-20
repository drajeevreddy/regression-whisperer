import type { CallOptions, CallResult, ProviderAdapter } from "../types";

/**
 * Google AI Studio (Gemini) adapter.
 * Primary LLM provider for Regression Whisperer.
 * Endpoint: POST https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={apiKey}
 */
export const GeminiAdapter: ProviderAdapter = {
  name: "gemini",

  async call(options: CallOptions, apiKey: string, modelOverride?: string): Promise<CallResult> {
    const model = modelOverride || "gemini-2.0-flash";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const contents: Array<{ role: string; parts: Array<{ text: string }> }> = [];

    if (options.systemPrompt) {
      contents.push({
        role: "user",
        parts: [{ text: options.systemPrompt }],
      });
      contents.push({
        role: "model",
        parts: [{ text: "Understood." }],
      });
    }

    contents.push({
      role: "user",
      parts: [{ text: options.prompt }],
    });

    const body = {
      contents,
      generationConfig: {
        temperature: options.temperature ?? 0.2,
        maxOutputTokens: options.maxTokens ?? 4096,
      },
    };

    const start = Date.now();
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(options.timeout ?? 30_000),
    });

    if (!res.ok) {
      const status = res.status;
      const text = await res.text().catch(() => "");
      throw new ProviderError(
        `Gemini API Error (${status}): ${text.slice(0, 300)}`,
        status,
      );
    }

    const data = (await res.json()) as {
      candidates?: Array<{
        content?: { parts?: Array<{ text?: string }> };
      }>;
    };

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    return { text, provider: this.name, latencyMs: Date.now() - start };
  },
};

export class ProviderError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = "ProviderError";
  }
}
