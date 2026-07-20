import { PipelineView } from "@/components/pipeline/pipeline-view";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pipeline",
  description: "Watch the five-agent regression detection pipeline analyze code in real time.",
};

export default function PipelinePage() {
  return (
    <div className="min-h-[calc(100vh-3rem)]">
      <PipelineView />
    </div>
  );
}
