"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { AgentNode } from "./agent-node";
import { PipelineConnector } from "./pipeline-connector";
import { AgentOutput } from "./agent-output";
import {
  createPipelineRun,
  getAgentOutput,
  AGENT_DURATIONS,
  type PipelineRun,
} from "@/lib/mock/pipeline";
import { AGENTS, type AgentName } from "@/lib/constants";
import { PipelineSkeleton } from "@/components/shared/skeleton";
import { EmptyState } from "@/components/shared/empty-state";

export function PipelineView() {
  const [run, setRun] = useState<PipelineRun | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [completedOutputs, setCompletedOutputs] = useState<
    { name: string; output: string }[]
  >([]);
  const timersRef = useRef<NodeJS.Timeout[]>([]);

  const startPipeline = useCallback(() => {
    setIsRunning(true);
    const newRun = createPipelineRun(421, "Add eager relation preloading", "backend/api", "feat/eager-preload");
    setRun(newRun);
    setCompletedOutputs([]);

    const timers: NodeJS.Timeout[] = [];
    let cumulativeDelay = 500;

    AGENTS.forEach((agentName, index) => {
      const timer = setTimeout(() => {
        setRun((prev) => {
          if (!prev) return prev;
          const updated = [...prev.agentStates];
          updated[index] = { name: agentName, phase: "processing", output: null };
          return { ...prev, agentStates: updated };
        });

        const duration = AGENT_DURATIONS[agentName] ?? 2000;
        const completeTimer = setTimeout(() => {
          const output = getAgentOutput(agentName);
          setCompletedOutputs((prev) => [...prev, { name: agentName, output }]);

          setRun((prev) => {
            if (!prev) return prev;
            const updated = [...prev.agentStates];
            updated[index] = {
              name: agentName,
              phase: "complete",
              output,
            };
            return { ...prev, agentStates: updated };
          });

          if (index === AGENTS.length - 1) {
            setIsRunning(false);
          }
        }, duration);

        timers.push(completeTimer);
      }, cumulativeDelay);

      timers.push(timer);
      cumulativeDelay += AGENT_DURATIONS[agentName] ?? 2000;
    });

    timersRef.current = timers;
  }, []);

  useEffect(() => {
    startPipeline();

    return () => {
      timersRef.current.forEach(clearTimeout);
    };
  }, [startPipeline]);

  const handleRestart = () => {
    timersRef.current.forEach(clearTimeout);
    startPipeline();
  };

  if (!run) {
    return <PipelineSkeleton />;
  }

  return (
    <div className="flex flex-col items-center h-full px-6">
      <div className="flex flex-col items-center w-full max-w-4xl">
        <div className="flex items-center justify-center gap-0 py-12 w-full">
          {run.agentStates.map((agent, index) => (
            <div key={agent.name} className="flex items-center">
              <AgentNode name={agent.name} phase={agent.phase} />
              {index < run.agentStates.length - 1 && (
                <PipelineConnector
                  active={
                    agent.phase === "processing" ||
                    (agent.phase === "complete" &&
                      (run.agentStates[index + 1]?.phase === "idle" ||
                        run.agentStates[index + 1]?.phase === "processing"))
                  }
                  completed={agent.phase === "complete"}
                />
              )}
            </div>
          ))}
        </div>

        {!isRunning && completedOutputs.length > 0 && (
          <div className="mb-4 flex items-center gap-2">
            <span className="font-mono text-[10px] uppercase tracking-wider text-accent">
              pipeline complete
            </span>
            <span className="text-[10px] text-text-muted">— {run.prTitle}</span>
          </div>
        )}

        <div className="w-full flex flex-col gap-4 pb-12">
          {completedOutputs.length === 0 ? (
            <EmptyState
              title="Awaiting PR analysis..."
              description="The pipeline will process each agent sequentially. Profiler starts first."
            />
          ) : (
            completedOutputs.map((output) => (
              <AgentOutput
                key={output.name}
                name={output.name}
                output={output.output}
              />
            ))
          )}
        </div>

        {!isRunning && completedOutputs.length > 0 && (
          <button
            onClick={handleRestart}
            className="px-4 py-1.5 text-xs font-mono border border-border-primary text-text-secondary hover:text-text-primary hover:border-border-hover bg-transparent cursor-pointer transition-colors mb-12"
            style={{ borderRadius: 2 }}
          >
            Replay Pipeline
          </button>
        )}
      </div>
    </div>
  );
}
