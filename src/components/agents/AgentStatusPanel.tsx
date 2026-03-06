"use client";

// Agent metadata — label, color, description
const AGENTS = {
    resume: {
        label: "Resume Agent",
        color: "blue",
        description: "Analysing your resume...",
        icon: "📄",
    },
    interview: {
        label: "Interview Agent",
        color: "violet",
        description: "Preparing your interview...",
        icon: "🎯",
    },
    offer: {
        label: "Offer Agent",
        color: "emerald",
        description: "Evaluating your offer...",
        icon: "💼",
    },
    rag: {
        label: "Knowledge Agent",
        color: "amber",
        description: "Searching knowledge base...",
        icon: "🧠",
    },
    orchestrator: {
        label: "Orchestrator",
        color: "zinc",
        description: "Routing to right agent...",
        icon: "⚡",
    },
    idle: {
        label: "Ready to help",
        color: "zinc",
        description: "Ask me anything about your career",
        icon: "✨",
    },
};

type AgentKey = keyof typeof AGENTS;

interface AgentStatusPanelProps {
    activeAgent: AgentKey,
    isLoading: boolean;
}

export default function AgentStatusPanelProps({ activeAgent, isLoading }: AgentStatusPanelProps) {
    const agent = AGENTS[activeAgent] || AGENTS.idle;
    // Color map — Tailwind needs complete class names
    // Cannot use dynamic string interpolation with Tailwind
    const colorMap: Record<string, string> = {
        blue: "bg-blue-500/20 text-blue-400 border-blue-500/30",
        violet: "bg-violet-500/20 text-violet-400 border-violet-500/30",
        emerald: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
        amber: "bg-amber-500/20 text-amber-400 border-amber-500/30",
        zinc: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30",
    };

    const colorClasses = colorMap[agent.color] || colorMap.zinc;

    return (
        <div className={`rounded-2xl border p-4 transition-all duration-300 ${colorClasses}`}>
            <div className="flex items-center gap-3">

                {/* Agent icon */}
                <span className="text-2xl">{agent.icon}</span>

                <div className="flex-1">
                    {/* Agent name */}
                    <p className="text-sm font-semibold">
                        {agent.label}
                    </p>

                    {/* Status description */}
                    <p className="text-xs opacity-70">
                        {agent.description}
                    </p>
                </div>

                {/* Loading indicator — only when streaming */}
                {isLoading && (
                    <div className="flex gap-1">
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current [animation-delay:0ms]" />
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current [animation-delay:150ms]" />
                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current [animation-delay:300ms]" />
                    </div>
                )}
            </div>
        </div>
    );
}