import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { createOpenAI } from "@ai-sdk/openai";

// Ollama — local development
const ollama = createOpenAICompatible({
  name: "ollama",
  baseURL: process.env.OLLAMA_BASE_URL ?? "http://localhost:11434/v1",
  apiKey: "ollama",
});

// Groq — cloud, free tier
const groq = createOpenAICompatible({
  name: "groq",
  baseURL: "https://api.groq.com/openai/v1",
  apiKey: process.env.GROQ_API_KEY ?? "",
});

// OpenAI — real OpenAI, paid
const openaiReal = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY ?? "",
});

const providers = {
  ollama: ollama.chatModel("llama3.2"),
  groq: groq.chatModel("llama-3.3-70b-versatile"),
  openai: openaiReal("gpt-4o"),
};

export const llm =
  providers[process.env.LLM_PROVIDER as keyof typeof providers] ??
  providers.ollama;

export const provider = process.env.LLM_PROVIDER || "ollama";