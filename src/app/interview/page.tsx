"use client";
import InterviewChat from "@/components/agents/InterviewChat";

export default function InterviewPage() {
  return (
    <div className="mx-auto max-w-3xl p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">
          Mock Interview
        </h1>
        <p className="mt-2 text-zinc-400">
          AI-powered technical interview tailored to your
          resume and target role
        </p>
      </div>
      <InterviewChat />
    </div>
  );
}