"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { UIMessage } from "@ai-sdk/react";
import { useState } from "react";
import { useSession } from "next-auth/react";

export default function OfferChat() {
  const { data: session } = useSession();
  const [offerText, setOfferText] = useState("");
  const [inputValue, setInputValue] = useState("");

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/agents/offer",
    }),
  });

  const isLoading = status === "streaming" || status === "submitted";

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    sendMessage(
      { text: inputValue },
      {
        body: {
          userId: session?.user?.id || "",
          offerText,
        },
      }
    );
    setInputValue("");
  }

  return (
    <div className="flex flex-col rounded-2xl border border-zinc-800 bg-zinc-900">
      <div className="border-b border-zinc-800 p-4">
        <h2 className="text-lg font-semibold text-white mb-3">Offer Evaluator</h2>
        <textarea
          value={offerText}
          onChange={(e) => setOfferText(e.target.value)}
          placeholder="Paste your job offer here..."
          rows={6}
          className="w-full resize-none rounded-xl bg-zinc-800 p-3 text-sm text-zinc-300 placeholder-zinc-600 outline-none focus:ring-1 focus:ring-zinc-600"
        />
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-4 min-h-[300px] max-h-[400px]">
        {messages.length === 0 && (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-zinc-500">
              Paste your offer above then ask me to evaluate it
            </p>
          </div>
        )}

        {messages.map((message: UIMessage) => (
          <div
            key={message.id}
            className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {message.role === "assistant" && (
              <div className="mr-2 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-xs text-emerald-400">
                AI
              </div>
            )}
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${
                message.role === "user"
                  ? "bg-emerald-600 text-white"
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
            <div className="mr-2 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-xs text-emerald-400">
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

      <form onSubmit={handleSubmit} className="border-t border-zinc-800 p-4">
        <div className="flex gap-2">
          <input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask about this offer..."
            disabled={isLoading}
            className="flex-1 rounded-xl bg-zinc-800 px-4 py-3 text-sm text-zinc-300 placeholder-zinc-600 outline-none focus:ring-1 focus:ring-zinc-600 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isLoading || !inputValue.trim()}
            className="rounded-xl bg-emerald-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-emerald-500 disabled:opacity-40"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}