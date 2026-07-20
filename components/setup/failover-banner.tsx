"use client";

import { cn } from "@/lib/utils";
import { StatusDot } from "@/components/shared/badge";
import { useState, useEffect } from "react";

interface ProviderConfig {
  name: string;
  status: "connected" | "failed" | "pending" | "unconfigured";
  apiKey: string;
}

interface FailoverBannerProps {
  providers: ProviderConfig[];
}

interface ProviderOrder {
  active: string;
  fallback: string;
}

const DEFAULT_ORDER: ProviderOrder = { active: "Gemini", fallback: "Groq" };

export function FailoverBanner({ providers }: FailoverBannerProps) {
  const [order, setOrder] = useState<ProviderOrder>(DEFAULT_ORDER);

  useEffect(() => {
    const connected = providers.filter((p) => p.status === "connected");
    if (connected.length >= 2) {
      setOrder({ active: connected[0].name, fallback: connected[1].name });
    } else if (connected.length === 1) {
      const firstAvailable = providers.find((p) => p.status !== "connected" && p.status !== "unconfigured");
      setOrder({ active: connected[0].name, fallback: firstAvailable?.name ?? providers.find((p) => p.name !== connected[0].name)?.name ?? "Groq" });
    }
  }, [providers]);

  const active = providers.find((p) => p.name === order.active);
  const fallback = providers.find((p) => p.name === order.fallback);

  return (
    <div
      className="border border-border-primary bg-bg-surface p-4"
      style={{ borderRadius: 4 }}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="font-mono text-[10px] uppercase tracking-wider text-text-muted">
          Failover Status
        </span>
      </div>
      <div className="flex items-center gap-4 text-xs">
        <div className="flex items-center gap-2">
          <StatusDot status={active?.status ?? "unconfigured"} />
          <span className="text-text-primary">{order.active}</span>
          <span className="text-green font-mono text-[10px]">ACTIVE</span>
        </div>
        <span className="text-text-muted">&rarr;</span>
        <div className="flex items-center gap-2">
          <StatusDot status={fallback?.status ?? "unconfigured"} />
          <span className="text-text-secondary">{order.fallback}</span>
          <span
            className={cn(
              "font-mono text-[10px]",
              fallback?.status === "connected"
                ? "text-text-muted"
                : "text-red"
            )}
          >
            {fallback?.status === "connected" ? "STANDBY" : "UNAVAILABLE"}
          </span>
        </div>
      </div>
    </div>
  );
}
