import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

async function testOpenAI() {
  console.log("Testing OpenAI connection...");
  console.log("API Key exists:", !!process.env.OPENAI_API_KEY);
  console.log("API Key prefix:", process.env.OPENAI_API_KEY?.slice(0, 7));

  try {
    // Test 1 — Chat completion (LLM)
    console.log("\n--- Test 1: Chat Completion ---");
    const chat = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: "Say hello in one word" }],
      max_tokens: 10,
    });
    console.log("✅ Chat works:", chat.choices[0].message.content);

    // Test 2 — Embeddings (what we actually use)
    console.log("\n--- Test 2: Embeddings ---");
    const embedding = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: "test embedding for DevMentor AI",
    });
    console.log("✅ Embedding works");
    console.log("Dimensions:", embedding.data[0].embedding.length);
    console.log("Expected:  ", 1536);
    console.log(
      "Match:",
      embedding.data[0].embedding.length === 1536 ? "✅ Yes" : "❌ No"
    );

    // Test 3 — Check credits/billing
    console.log("\n--- Test 3: Usage ---");
    console.log("✅ Prompt tokens used:", embedding.usage.prompt_tokens);
    console.log("✅ Total tokens used:", embedding.usage.total_tokens);

  } catch (error: any) {
    console.error("\n❌ OpenAI Error:");
    console.error("Status:", error.status);
    console.error("Message:", error.message);

    if (error.status === 401) {
      console.error("→ Invalid API key — check OPENAI_API_KEY in .env.local");
    }
    if (error.status === 429) {
      console.error("→ Rate limit or no credits — check platform.openai.com/usage");
    }
    if (error.status === 404) {
      console.error("→ Model not found — check model name");
    }
  }
}

testOpenAI();