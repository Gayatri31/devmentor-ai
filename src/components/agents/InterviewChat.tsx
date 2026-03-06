"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { UIMessage } from "@ai-sdk/react";
import { useState } from "react";
import { useSession } from "next-auth/react";

export default function InterviewChat() {
  const { data: session } = useSession();
  const [jobDescription, setJobDescription] = useState("");
  const [showJD, setShowJD] = useState(true);
  const [inputValue, setInputValue] = useState("");
  const [interviewStarted, setInterviewStarted] = useState(false);

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/agents/interview",
    }),
  });

  const isLoading = status === "streaming" || status === "submitted";

  async function handleStart() {
    setInterviewStarted(true);
    setShowJD(false);
    sendMessage(
      { text: "start" },
      {
        body: {
          userId: session?.user?.id || "",
          jobDescription,
          isStart: true,
        },
      }
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    sendMessage(
      { text: inputValue },
      {
        body: {
          userId: session?.user?.id || "",
          jobDescription,
          isStart: false,
        },
      }
    );
    setInputValue("");
  }

  return (
    <div className="flex flex-col rounded-2xl border border-zinc-800 bg-zinc-900">
      <div className="flex items-center justify-between border-b border-zinc-800 p-4">
        <div>
          <h2 className="text-lg font-semibold text-white">Mock Interview</h2>
          {interviewStarted && (
            <p className="text-xs text-zinc-500 mt-0.5">Interview in progress</p>
          )}
        </div>
        {!interviewStarted && (
          <button
            onClick={() => setShowJD(!showJD)}
            className="rounded-lg bg-zinc-800 px-3 py-1.5 text-xs text-zinc-400 transition hover:bg-zinc-700"
          >
            {showJD ? "Hide JD" : "Add Target Role"}
          </button>
        )}
      </div>

      {showJD && !interviewStarted && (
        <div className="border-b border-zinc-800 p-4">
          <textarea
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            placeholder="Paste the job description you're interviewing for..."
            rows={4}
            className="w-full resize-none rounded-xl bg-zinc-800 p-3 text-sm text-zinc-300 placeholder-zinc-600 outline-none focus:ring-1 focus:ring-zinc-600"
          />
        </div>
      )}

      {!interviewStarted && (
        <div className="flex flex-col items-center justify-center p-12 gap-4">
          <p className="text-zinc-300 text-sm font-medium">Ready to practice?</p>
          <p className="text-zinc-500 text-xs">
            Make sure your resume is uploaded first.
          </p>
          <button
            onClick={handleStart}
            disabled={isLoading}
            className="rounded-xl bg-violet-600 px-8 py-4 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:opacity-40"
          >
            Start Interview
          </button>
        </div>
      )}

      {interviewStarted && (
        <div className="flex-1 space-y-4 overflow-y-auto p-4 min-h-[400px] max-h-[600px]">
          {messages.map((message: UIMessage) => (
            <div
              key={message.id}
              className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {message.role === "assistant" && (
                <div className="mr-2 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-500/20 text-xs text-violet-400">
                  AI
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
                  message.role === "user"
                    ? "bg-violet-600 text-white"
                    : "bg-zinc-800 text-zinc-300"
                }`}
              >
                {message.parts.map((part, i: number) => {
                  if (part.type === "text") {
                    return part.text.split("\n").map((line: string, j: number) => (
                      <p key={`${i}-${j}`} className={line === "" ? "mt-2" : ""}>{line}</p>
                    ));
                  }
                  return null;
                })}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="mr-2 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-500/20 text-xs text-violet-400">
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
      )}

      {interviewStarted && (
        <form onSubmit={handleSubmit} className="border-t border-zinc-800 p-4">
          <div className="flex gap-2">
            <input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Type your answer..."
              disabled={isLoading}
              className="flex-1 rounded-xl bg-zinc-800 px-4 py-3 text-sm text-zinc-300 placeholder-zinc-600 outline-none focus:ring-1 focus:ring-zinc-600 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={isLoading || !inputValue.trim()}
              className="rounded-xl bg-violet-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-violet-500 disabled:opacity-40"
            >
              Answer
            </button>
          </div>
        </form>
      )}
    </div>
  );
}