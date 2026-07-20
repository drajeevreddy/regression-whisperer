"use client";

import { useState, useEffect } from "react";
import { ProviderCard } from "@/components/setup/provider-card";
import { FailoverBanner } from "@/components/setup/failover-banner";
import { EmptyState } from "@/components/shared/empty-state";

interface ProviderConfig {
  name: string;
  status: "connected" | "failed" | "pending" | "unconfigured";
  apiKey: string;
  errorMessage?: string;
  lastChecked?: string;
}

const STORAGE_KEY = "rw-provider-keys";

function loadKeys(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

function saveKey(name: string, apiKey: string) {
  const keys = loadKeys();
  if (apiKey) {
    keys[name] = apiKey;
  } else {
    delete keys[name];
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(keys));
}

export default function SetupPage() {
  const [providers, setProviders] = useState<ProviderConfig[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedKeys = loadKeys();

    fetch("/api/providers")
      .then((r) => r.json())
      .then((data: Array<{ name: string; status: "connected" | "failed" | "pending" | "unconfigured"; apiKey: string; lastChecked?: string; errorMessage?: string }>) => {
        const merged = data.map((p) => {
          const stored = storedKeys[p.name];
          if (stored) {
            return {
              ...p,
              status: "connected" as const,
              apiKey: stored,
              lastChecked: p.lastChecked,
            };
          }
          return p;
        });
        setProviders(merged);
        setLoading(false);
      })
      .catch(() => {
        setProviders([
          { name: "Gemini", status: "unconfigured", apiKey: "" },
          { name: "Groq", status: "unconfigured", apiKey: "" },
          { name: "NVIDIA", status: "unconfigured", apiKey: "" },
          { name: "Cerebras", status: "unconfigured", apiKey: "" },
        ]);
        setLoading(false);
      });
  }, []);

  const handleSave = async (name: string, apiKey: string) => {
    setProviders((prev) =>
      prev.map((p) =>
        p.name === name ? { ...p, status: "pending" as const } : p,
      ),
    );

    try {
      const res = await fetch("/api/providers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, apiKey }),
      });
      const result = await res.json();

      if (result.status === "connected") {
        saveKey(name, apiKey);
      }

      setProviders((prev) =>
        prev.map((p) =>
          p.name === name
            ? { ...p, ...result, apiKey: result.status === "connected" ? apiKey : "" }
            : p,
        ),
      );
    } catch {
      setProviders((prev) =>
        prev.map((p) =>
          p.name === name
            ? {
                ...p,
                status: "failed" as const,
                errorMessage: "Validation request failed",
                lastChecked: new Date().toISOString(),
              }
            : p,
        ),
      );
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-8">
        <div className="text-xs text-text-muted font-mono">Loading providers...</div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      <div className="mb-6">
        <h2 className="text-sm font-semibold text-text-primary mb-2">
          Provider Configuration
        </h2>
        <p className="text-xs text-text-muted">
          Bring your own keys. Keys are stored in your browser&apos;s localStorage
          and never sent to our servers — only to the LLM provider you configure.
          Configure at least one provider to start analyzing PRs.
        </p>
      </div>

      {providers.length === 0 ? (
        <EmptyState
          title="No providers configured"
          description="Add API keys for Gemini, Groq, NVIDIA, or Cerebras to enable PR analysis."
        />
      ) : (
        <>
          <div className="mb-4">
            <FailoverBanner providers={providers} />
          </div>
          <div className="flex flex-col gap-3">
            {providers.map((provider) => (
              <ProviderCard
                key={provider.name}
                config={provider}
                onSave={handleSave}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
