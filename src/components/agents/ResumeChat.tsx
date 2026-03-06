"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { UIMessage } from "@ai-sdk/react";
import { useState } from "react";
import { useUser } from "@clerk/nextjs";


export default function ResumeChat() {
     const { user } = useUser();

  const [jobDescription, setJobDescription] = useState("");
  const [showJD, setShowJD] = useState(true);
  const [inputValue, setInputValue] = useState("");

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/agents/resume",
      body: {
        userId: user?.id || "",
        jobDescription,
      },
    }),
  });

  const isLoading = status === "streaming" || status === "submitted";

function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    // ✅ jobDescription passed fresh at send time — not static
    sendMessage(
      { text: inputValue },
      {
        body: {
          userId: user?.id || "",
          jobDescription,
        },
      }
    );
    setInputValue("");
  }


  return (
    <div className="flex flex-col rounded-2xl border border-zinc-800 bg-zinc-900">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-800 p-4">
        <h2 className="text-lg font-semibold text-white">
          Resume Analyzer
        </h2>
        <button
          onClick={() => setShowJD(!showJD)}
          className="rounded-lg bg-zinc-800 px-3 py-1.5 text-xs text-zinc-400 transition hover:bg-zinc-700"
        >
          {showJD ? "Hide JD" : "Add Job Description"}
        </button>
      </div>

      {/* Job Description Input */}
      {showJD && (
        <div className="border-b border-zinc-800 p-4">
          <label className="mb-2 block text-xs font-medium text-zinc-400">
            Job Description *(paste the role you are targeting)*
          </label>
          <textarea
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            placeholder="Paste the job description here..."
            rows={4}
            className="w-full resize-none rounded-xl bg-zinc-800 p-3 text-sm text-zinc-300 placeholder-zinc-600 outline-none focus:ring-1 focus:ring-zinc-600"
          />
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 space-y-4 overflow-y-auto p-4 min-h-[300px] max-h-[400px]">
        {messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <p className="text-sm text-zinc-500">
              Upload your resume and paste a job description above
            </p>
            <p className="mt-1 text-xs text-zinc-600">
              Then ask me anything — gaps, strengths, roadmap
            </p>
          </div>
        )}

        {messages.map((message: UIMessage) => (
          <div
            key={message.id}
            className={`flex ${
              message.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            {message.role === "assistant" && (
              <div className="mr-2 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-500/20 text-xs text-blue-400">
                AI
              </div>
            )}

            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
                message.role === "user"
                  ? "bg-blue-600 text-white"
                  : "bg-zinc-800 text-zinc-300"
              }`}
            >
              {message.parts.map((part, i: number) => {
                if (part.type === "text") {
                  return part.text
                    .split("\n")
                    .map((line: string, j: number) => (
                      <p key={`${i}-${j}`} className={line === "" ? "mt-2" : ""}>
                        {line}
                      </p>
                    ));
                }
                return null;
              })}
            </div>
          </div>
        ))}

        {/* Streaming indicator */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="mr-2 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-500/20 text-xs text-blue-400">
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
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="border-t border-zinc-800 p-4">
        <div className="flex gap-2">
          <input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask about your resume..."
            disabled={isLoading}
            className="flex-1 rounded-xl bg-zinc-800 px-4 py-3 text-sm text-zinc-300 placeholder-zinc-600 outline-none focus:ring-1 focus:ring-zinc-600 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isLoading || !inputValue.trim()}
            className="rounded-xl bg-blue-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-blue-500 disabled:opacity-40"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}