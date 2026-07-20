import { describe, expect, it, vi } from "vitest";
import { callModel, DEFAULT_PROVIDERS } from "../lib/router/index";

describe("LLM Router", () => {
  it("should have Gemini (AI Studio) as the first/primary provider", () => {
    expect(DEFAULT_PROVIDERS[0].name).toBe("gemini");
    expect(DEFAULT_PROVIDERS[0].model).toBe("gemini-2.0-flash");
    expect(DEFAULT_PROVIDERS[0].apiKeyEnv).toBe("GEMINI_API_KEY");
  });

  it("should attempt providers in order and throw if all fail", async () => {
    delete process.env.GEMINI_API_KEY;
    delete process.env.GROQ_API_KEY;
    delete process.env.NVIDIA_NIM_API_KEY;
    delete process.env.CEREBRAS_API_KEY;

    await expect(
      callModel({ prompt: "Test prompt" }),
    ).rejects.toThrow("All AI providers failed");
  });

  it("should call Gemini adapter when GEMINI_API_KEY is present", async () => {
    process.env.GEMINI_API_KEY = "mock-gemini-key";

    // Mock fetch for Gemini AI Studio API
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        candidates: [
          {
            content: {
              parts: [{ text: "Gemini performance analysis response" }],
            },
          },
        ],
      }),
    } as Response);

    const result = await callModel({ prompt: "Analyze PR" });

    expect(result.provider).toBe("gemini");
    expect(result.text).toBe("Gemini performance analysis response");
    expect(fetchSpy).toHaveBeenCalled();

    fetchSpy.mockRestore();
    delete process.env.GEMINI_API_KEY;
  });
});
