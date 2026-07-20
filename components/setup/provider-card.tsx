"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { StatusDot } from "@/components/shared/badge";

interface ProviderConfig {
  name: string;
  status: "connected" | "failed" | "pending" | "unconfigured";
  apiKey: string;
  errorMessage?: string;
  lastChecked?: string;
}

interface ProviderCardProps {
  config: ProviderConfig;
  onSave: (name: string, apiKey: string) => void;
}

const statusLabels: Record<string, string> = {
  connected: "Connected",
  failed: "Failed",
  pending: "Checking...",
  unconfigured: "Not configured",
};

export function ProviderCard({ config, onSave }: ProviderCardProps) {
  const [key, setKey] = useState(config.apiKey);
  const [editing, setEditing] = useState(false);

  const handleSave = () => {
    onSave(config.name, key);
    setEditing(false);
  };

  return (
    <div
      className={cn(
        "border border-border-primary bg-bg-surface p-4",
        config.status === "connected" && "border-l-green border-l-2",
        config.status === "failed" && "border-l-red border-l-2"
      )}
      style={{ borderRadius: 4 }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <StatusDot status={config.status} />
          <span className="text-sm font-semibold text-text-primary">
            {config.name}
          </span>
        </div>
        <span
          className={cn(
            "text-[10px] font-mono uppercase tracking-wider",
            config.status === "connected"
              ? "text-green"
              : config.status === "failed"
                ? "text-red"
                : config.status === "pending"
                  ? "text-accent"
                  : "text-text-muted"
          )}
        >
          {statusLabels[config.status]}
        </span>
      </div>

      <div className="flex items-center gap-2">
        {editing ? (
          <>
            <input
              type="password"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="Enter API key..."
              className={cn(
                "flex-1 px-3 py-1.5 text-xs font-mono bg-bg-primary border border-border-primary",
                "text-text-primary placeholder:text-text-muted",
                "focus:outline-none focus:border-accent/50 transition-colors"
              )}
              style={{ borderRadius: 2 }}
              autoFocus
            />
            <button
              onClick={handleSave}
              className="px-3 py-1.5 text-xs font-mono text-accent border border-accent/20 bg-transparent hover:bg-accent-dim cursor-pointer transition-colors"
              style={{ borderRadius: 2 }}
            >
              Save
            </button>
            <button
              onClick={() => {
                setKey(config.apiKey);
                setEditing(false);
              }}
              className="px-3 py-1.5 text-xs font-mono text-text-muted border border-border-primary bg-transparent hover:border-border-hover cursor-pointer transition-colors"
              style={{ borderRadius: 2 }}
            >
              Cancel
            </button>
          </>
        ) : (
          <>
            <div className="flex-1 px-3 py-1.5 text-xs font-mono bg-bg-primary text-text-muted truncate" style={{ borderRadius: 2 }}>
              {config.apiKey
                ? "•".repeat(28)
                : "—"}
            </div>
            <button
              onClick={() => {
                setKey("");
                setEditing(true);
              }}
              className="px-3 py-1.5 text-xs font-mono text-text-secondary border border-border-primary bg-transparent hover:border-border-hover cursor-pointer transition-colors"
              style={{ borderRadius: 2 }}
            >
              {config.apiKey ? "Edit" : "Configure"}
            </button>
          </>
        )}
      </div>

      {config.status === "failed" && config.errorMessage && (
        <div className="mt-2 pt-2 border-t border-border-primary">
          <span className="text-[10px] text-red font-mono">
            {config.errorMessage}
          </span>
        </div>
      )}

      {config.lastChecked && (
        <div className="mt-2 text-[10px] text-text-muted font-mono">
          Last checked:{" "}
          {new Date(config.lastChecked).toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      )}
    </div>
  );
}
