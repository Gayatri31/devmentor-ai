import { Index } from "@upstash/vector";

const index = new Index({
  url: process.env.UPSTASH_VECTOR_REST_URL!,
  token: process.env.UPSTASH_VECTOR_REST_TOKEN!,
});

// ─── Voyage AI REST API ──────────────────────────────────
// No package needed — direct HTTP call
// Works identically local + production (Vercel)
// voyage-3-lite → 512 dimensions

async function getEmbedding(text: string): Promise<number[]> {
  const response = await fetch("https://api.voyageai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.VOYAGE_API_KEY}`,
    },
    body: JSON.stringify({
      input: text,
      model: "voyage-3-lite",
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Voyage API error: ${response.status} ${error}`);
  }

  const data = await response.json();
  return data.data[0].embedding;
}

async function getEmbeddings(texts: string[]): Promise<number[][]> {
  // Voyage supports batch input natively
  // Send all chunks in one API call — much faster
  const response = await fetch("https://api.voyageai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.VOYAGE_API_KEY}`,
    },
    body: JSON.stringify({
      input: texts,
      model: "voyage-3-lite",
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Voyage batch API error: ${response.status} ${error}`);
  }

  const data = await response.json();
  return data.data.map((d: { embedding: number[] }) => d.embedding);
}

// ─── Text Chunking ───────────────────────────────────────

export function chunkText(text: string, chunkSize = 500): string[] {
  const sentences = text.split(/[.!?]+/);
  const chunks: string[] = [];
  let current = "";

  for (const sentence of sentences) {
    if ((current + sentence).length > chunkSize) {
      if (current) chunks.push(current.trim());
      current = sentence;
    } else {
      current += " " + sentence;
    }
  }

  if (current) chunks.push(current.trim());
  return chunks.filter((c) => c.length > 50);
}

// ─── Store Resume ────────────────────────────────────────

export async function storeResume(
  resumeText: string,
  userId: string
): Promise<void> {
  console.log("storeResume called for userId:", userId);

  const chunks = chunkText(resumeText);
  console.log(`Chunked into ${chunks.length} pieces`);

  if (chunks.length === 0) {
    throw new Error("Resume text produced no chunks — check parsing");
  }

  // Batch embed all chunks in one API call
  const embeddings = await getEmbeddings(chunks);
  console.log(`Generated ${embeddings.length} embeddings`);
  console.log(`Embedding dimensions: ${embeddings[0]?.length}`);

  // Delete old vectors — prevents stale data after re-upload
  const oldIds = Array.from(
    { length: 50 },
    (_, i) => `resume-${userId}-${i}`
  );
  await index.delete(oldIds);
  console.log("Deleted old vectors");

  // Build and upsert new vectors
  const vectors = chunks.map((chunk, i) => ({
    id: `resume-${userId}-${i}`,
    vector: embeddings[i],
    metadata: {
      text: chunk,
      docType: "resume",
      userId,
      chunkIndex: i,
      uploadedAt: new Date().toISOString(),
    },
  }));

  await index.upsert(vectors);
  console.log(`✅ Stored ${vectors.length} vectors for user ${userId}`);
}

// ─── Retrieve Resume Context ─────────────────────────────

export async function retrieveResumeContext(
  query: string,
  userId: string,
  topK = 5
): Promise<string> {
  try {
    const embedding = await getEmbedding(query);

    const results = await index.query({
      vector: embedding,
      topK,
      includeMetadata: true,
      filter: `docType = 'resume' and userId = '${userId}'`,
    });

    if (results.length === 0) {
      console.log("No resume vectors found for userId:", userId);
      return "";
    }

    const context = results
      .map((r) => r.metadata?.text as string)
      .filter(Boolean)
      .join("\n\n");

    console.log(`Retrieved ${results.length} chunks for query`);
    return context;

  } catch (e: any) {
    console.error("retrieveResumeContext error:", e.message);
    return "";
  }
}