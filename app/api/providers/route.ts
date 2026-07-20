import { callModel, DEFAULT_PROVIDERS } from "@/lib/router";

/**
 * GET /api/providers — return current provider status.
 * Checks env vars for server-side keys (set by the repo owner for the GitHub Action flow).
 */
export async function GET() {
  const results = DEFAULT_PROVIDERS.map((p) => {
    const hasKey = Boolean(process.env[p.apiKeyEnv]);
    const displayName =
      p.name === "gemini"
        ? "Gemini"
        : p.name === "groq"
          ? "Groq"
          : p.name === "nvidia-nim"
            ? "NVIDIA"
            : p.name === "cerebras"
              ? "Cerebras"
              : p.name;

    return {
      name: displayName,
      status: hasKey ? "connected" : "unconfigured",
      apiKey: hasKey ? "set" : "",
      lastChecked: new Date().toISOString(),
    };
  });

  return Response.json(results);
}

/**
 * POST /api/providers — validate a BYOK API key.
 *
 * This ONLY validates the key by making a lightweight test call.
 * It does NOT persist the key to env or any server-side storage.
 * The key lives in the client's localStorage and is sent as a
 * header (x-byok-keys) when triggering analysis.
 */
export async function POST(req: Request) {
  try {
    const { name, apiKey } = await req.json();

    if (!name || typeof name !== "string") {
      return Response.json({ error: "Invalid provider name" }, { status: 400 });
    }
    if (!apiKey || typeof apiKey !== "string") {
      return Response.json({ error: "Invalid API key" }, { status: 400 });
    }

    const internalName =
      name === "Gemini"
        ? "gemini"
        : name === "Groq"
          ? "groq"
          : name === "NVIDIA"
            ? "nvidia-nim"
            : name === "Cerebras"
              ? "cerebras"
              : null;

    if (!internalName) {
      return Response.json({ error: `Unknown provider: ${name}` }, { status: 400 });
    }

    const providerConfig = DEFAULT_PROVIDERS.find((p) => p.name === internalName);
    if (!providerConfig) {
      return Response.json({ error: `No adapter for ${name}` }, { status: 500 });
    }

    // Validate by making a test call with just this provider
    try {
      await callModel(
        { prompt: "Say OK", maxTokens: 5, timeout: 10_000 },
        [providerConfig],
        { [internalName]: apiKey },
      );

      return Response.json({
        name,
        status: "connected",
        apiKey: "set",
        lastChecked: new Date().toISOString(),
      });
    } catch {
      return Response.json({
        name,
        status: "failed",
        apiKey: "",
        errorMessage: `Invalid API key — re-enter from ${name}`,
        lastChecked: new Date().toISOString(),
      });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return Response.json({ error: message }, { status: 500 });
  }
}
