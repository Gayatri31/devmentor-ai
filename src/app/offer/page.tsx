"use client";
import OfferChat from "@/components/agents/OfferChat";

export default function OfferPage() {
  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">
          Offer Evaluator
        </h1>
        <p className="mt-2 text-zinc-400">
          Paste your job offer and get an AI-powered evaluation
          across salary, visa, clauses, tech stack, and personal fit
        </p>
      </div>
      <OfferChat />
    </div>
  );
}