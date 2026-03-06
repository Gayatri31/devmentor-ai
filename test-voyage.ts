import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

async function test() {
  console.log("Testing Voyage AI REST API...");
  console.log("Key exists:", !!process.env.VOYAGE_API_KEY);
  console.log("Key prefix:", process.env.VOYAGE_API_KEY?.slice(0, 6));

  try {
    const response = await fetch("https://api.voyageai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.VOYAGE_API_KEY}`,
      },
      body: JSON.stringify({
        input: "test embedding for DevMentor AI",
        model: "voyage-3-lite",
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`${response.status}: ${error}`);
    }

    const data = await response.json();
    const embedding = data.data[0].embedding;

    console.log("✅ Works!");
    console.log("Dimensions:", embedding.length);
    console.log("Expected:   512");
    console.log("Match:", embedding.length === 512 ? "✅ Yes" : "❌ No");
    console.log("Tokens used:", data.usage?.total_tokens);

  } catch (e: any) {
    console.error("❌ Error:", e.message);
  }
}

test();