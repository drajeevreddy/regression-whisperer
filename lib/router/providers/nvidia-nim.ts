import type { CallOptions, CallResult, ProviderAdapter } from "../types";

export const NvidiaNimAdapter: ProviderAdapter = {
  name: "nvidia-nim",

  async call(options: CallOptions, apiKey: string, modelOverride?: string): Promise<CallResult> {
    const model = modelOverride || "meta/llama-3.1-70b-instruct";
    const url = "https://integrate.api.nvidia.com/v1/chat/completions";

    const messages = [];
    if (options.systemPrompt) {
      messages.push({ role: "system", content: options.systemPrompt });
    }
    messages.push({ role: "user", content: options.prompt });

    const start = Date.now();
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: options.temperature ?? 0.2,
        max_tokens: options.maxTokens ?? 4096,
      }),
      signal: AbortSignal.timeout(options.timeout ?? 30_000),
    });

    if (!res.ok) {
      const status = res.status;
      const text = await res.text().catch(() => "");
      throw new Error(`NVIDIA NIM ${status}: ${text.slice(0, 200)}`);
    }

    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };

    const text = data.choices?.[0]?.message?.content ?? "";
    return { text, provider: this.name, latencyMs: Date.now() - start };
  },
};
