"use client";

import { useState, useRef, useEffect } from "react";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  parts: { type: "text"; text: string }[];
  createdAt: Date;
}

type AgentKey = "idle" | "orchestrator" |
  "resume" | "interview" | "offer" | "rag";

interface DashboardChatProps {
  onAgentChange: (agent: AgentKey) => void;
  isLoadingChange: (loading: boolean) => void;
}

const AGENT_ENDPOINTS: Record<string, string> = {
  resume: "/api/agents/resume",
  interview: "/api/agents/interview",
  offer: "/api/agents/offer",
  rag: "/api/agents/rag",
};

export default function DashboardChat({
  onAgentChange,
  isLoadingChange,
}: DashboardChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userMessage = inputValue.trim();
    setInputValue("");

    const newUserMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      parts: [{ type: "text", text: userMessage }],
      createdAt: new Date(),
    };

    setMessages((prev) => [...prev, newUserMessage]);
    setIsLoading(true);
    isLoadingChange(true);

    try {
      // ── STEP 1 — Orchestrator decides which agent ──
      onAgentChange("orchestrator");

      const orchResponse = await fetch("/api/agents/orchestrator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, newUserMessage],
        }),
      });

      // Read orchestrator stream — returns one word
      const orchReader = orchResponse.body?.getReader();
      const decoder = new TextDecoder();
      let agentKey = "";

      if (orchReader) {
        while (true) {
          const { done, value } = await orchReader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (!line.startsWith("data:")) continue;
            const jsonStr = line.slice(5).trim();
            if (!jsonStr || jsonStr === "[DONE]") continue;

            try {
              const parsed = JSON.parse(jsonStr);
              if (parsed.type === "text-delta" && parsed.delta) {
                agentKey += parsed.delta;
              }
            } catch {
              // Skip malformed lines
            }
          }
        }
      }

      // Clean — extract just the agent name
      agentKey = agentKey.trim().toLowerCase().replace(/[^a-z]/g, "");

      // Validate — fallback to rag if unknown
      const validAgents = ["resume", "interview", "offer", "rag"];
      if (!validAgents.includes(agentKey)) agentKey = "rag";

      // ── STEP 2 — Call correct specialist agent ──
      onAgentChange(agentKey as AgentKey);

      const endpoint = AGENT_ENDPOINTS[agentKey];

      const agentResponse = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, newUserMessage],
          userId: "dev-user-1",
        }),
      });

      // Add empty AI message — fill as stream arrives
      const aiMessageId = (Date.now() + 1).toString();
      setMessages((prev) => [
        ...prev,
        {
          id: aiMessageId,
          role: "assistant",
          parts: [{ type: "text", text: "" }],
          createdAt: new Date(),
        },
      ]);

      // Read agent stream token by token
      const agentReader = agentResponse.body?.getReader();

      if (agentReader) {
        let fullText = "";

        while (true) {
          const { done, value } = await agentReader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");

          for (const line of lines) {
            // Format: data: {"type":"text-delta","delta":"token"}
            if (!line.startsWith("data:")) continue;

            const jsonStr = line.slice(5).trim();
            if (!jsonStr || jsonStr === "[DONE]") continue;

            try {
              const parsed = JSON.parse(jsonStr);

              // Only care about text-delta events
              if (parsed.type === "text-delta" && parsed.delta) {
                fullText += parsed.delta;

                // Update message in real time
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === aiMessageId
                      ? {
                          ...msg,
                          parts: [{ type: "text", text: fullText }],
                        }
                      : msg
                  )
                );
              }
            } catch {
              // Skip malformed lines
            }
          }
        }
      }
    } catch (error) {
      console.error("Dashboard error:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 2).toString(),
          role: "assistant",
          parts: [{
            type: "text",
            text: "Something went wrong. Please try again.",
          }],
          createdAt: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
      isLoadingChange(false);
      onAgentChange("idle");
    }
  }

  return (
    <div className="flex flex-col rounded-2xl border border-zinc-800 bg-zinc-900">

      {/* Messages */}
      <div className="flex-1 space-y-4 overflow-y-auto p-4 min-h-[400px] max-h-[600px]">

        {messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center text-center gap-3">
            <p className="text-2xl">✨</p>
            <p className="text-sm font-medium text-zinc-300">
              What can I help you with today?
            </p>
            <div className="grid grid-cols-1 gap-2 mt-2 w-full max-w-sm">
              {[
                "Analyse my resume for a Berlin startup role",
                "I got an offer — should I take it?",
                "Start a mock interview session",
                "What skills should I learn next?",
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => setInputValue(suggestion)}
                  className="rounded-xl border border-zinc-700 px-3 py-2 text-xs text-zinc-400 text-left transition hover:border-zinc-500 hover:text-zinc-300"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {message.role === "assistant" && (
              <div className="mr-2 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-zinc-700 text-xs text-zinc-300">
                AI
              </div>
            )}
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
                message.role === "user"
                  ? "bg-zinc-700 text-white"
                  : "bg-zinc-800 text-zinc-300"
              }`}
            >
              {message.parts.map((part, i) =>
                part.text.split("\n").map((line, j) => (
                  <p key={`${i}-${j}`} className={line === "" ? "mt-2" : ""}>
                    {line}
                  </p>
                ))
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="mr-2 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-zinc-700 text-xs text-zinc-300">
              AI
            </div>
            <div className="rounded-2xl bg-zinc-800 px-4 py-3">
              <div className="flex gap-1">
                <span className="h-2 w-2 animate-bounce rounded-full bg-zinc-500 [animation-delay:0ms]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-zinc-500 [animation-delay:150ms]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-zinc-500 [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="border-t border-zinc-800 p-4">
        <div className="flex gap-2">
          <input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask anything about your career..."
            disabled={isLoading}
            className="flex-1 rounded-xl bg-zinc-800 px-4 py-3 text-sm text-zinc-300 placeholder-zinc-600 outline-none focus:ring-1 focus:ring-zinc-600 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isLoading || !inputValue.trim()}
            className="rounded-xl bg-zinc-700 px-4 py-3 text-sm font-medium text-white transition hover:bg-zinc-600 disabled:opacity-40"
          >
            {isLoading ? "Thinking..." : "Send"}
          </button>
        </div>
      </form>
    </div>
  );
}