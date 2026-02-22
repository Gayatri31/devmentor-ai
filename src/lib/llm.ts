import {createOpenAI} from "@ai-sdk/openai";

const isLocal = process.env.LLM_PROVIDER == "ollama";

const ollama = createOpenAI({
    baseURL: process.env.OLLAMA_BASE_URL || "http://localhost:11434/v1",
    apiKey: "ollama"
})

const groq = createOpenAI({
    baseURL: "https://api.groq.com/openai/v1",
    apiKey: process.env.GROQ_API_KEY ?? '',
})

const gemini = createOpenAI({
    baseURL: "https://generativelanguage.googleapis.com/v1beta/openai",
    apiKey: process.env.OPENAI_API_KEY ?? "",
})

const providers = {
  ollama: ollama("llama3.2"),
  groq: groq("llama-3.3-70b-versatile"),
  gemini: gemini("gemini-2.0-flash"),
};

export const llm = providers[process.env.LLM_PROVIDER as keyof typeof providers] ?? providers.ollama;

export const provider = process.env.LLLM_PROVIDER || "ollama";