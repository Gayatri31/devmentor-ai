"use client";

import { useState } from "react";
import DashboardChat from "@/components/agents/DashboardChat";
import AgentStatusPanel from "@/components/agents/AgentStatusPanel";

type AgentKey = "idle" | "orchestrator" |
  "resume" | "interview" | "offer" | "rag";

export default function DashboardPage() {
  const [activeAgent, setActiveAgent] =
    useState<AgentKey>("idle");
  const [isLoading, setIsLoading] = useState(false);

  return (
    <main className="p-6">
      <div className="mx-auto max-w-5xl">
        {/* POC Banner */}
        <div className="bg-zinc-900 border-b border-zinc-800 text-zinc-500 text-xs text-center py-2 px-4 my-2">
          ⚡ Open-source POC running on free tier APIs — responses may be slow during peak usage.
          &nbsp;·&nbsp;
          <a
            href="https://github.com/Gayatri31/devmentor-ai"
            target="_blank"
            rel="noopener noreferrer"
            className="text-zinc-400 underline hover:text-zinc-300 transition"
          >
            View source on GitHub
          </a>
        </div>
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">
            Welcome back 👋
          </h1>
          <p className="mt-2 text-zinc-400">
            What would you like to work on today?
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">

          {/* Left column — status + quick links */}
          <div className="lg:col-span-1 space-y-4">

            {/* Agent status panel */}
            <AgentStatusPanel
              activeAgent={activeAgent}
              isLoading={isLoading}
            />
          </div>

          {/* Right column — chat */}
          <div className="lg:col-span-2">
            <DashboardChat
              onAgentChange={setActiveAgent}
              isLoadingChange={setIsLoading}
            />
          </div>

        </div>
      </div>
    </main>
  );
}