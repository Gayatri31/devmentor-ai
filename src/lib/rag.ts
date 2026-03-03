import { Index } from "@upstash/vector";

// Upstash Vector client
const index = new Index({
    url: process.env.UPSTASH_VECTOR_REST_URL!,
    token: process.env.UPSTASH_VECTOR_REST_TOKEN!
})

// Split resume text into smaller chunks
// Why? LLMs work better with focused small pieces
// than one giant wall of text
export function chunkText(text: string, chuckSize = 500): string[] {
    const sentences = text.split(/[.!?]+/);
    const chunks: string[] = [];
    let current = "";

    for (const sentence of sentences) {
        if ((current + sentence).length > chuckSize) {
            if (current) {
                chunks.push(current.trim())
            }
            current = sentence;
        } else {
            current += " " + sentence;
        }
    }

    if (current) {
        chunks.push(current.trim())
    }
    return chunks.filter((c) => c.length > 50);
}

// Ollama embeddings — local, fast, free
// nomic-embed-text outputs 768 dimensions
async function getEmbedding(text: string): Promise<number[]> {
  const response = await fetch(
    `${process.env.OLLAMA_BASE_URL?.replace("/v1", "") || "http://localhost:11434"}/api/embeddings`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "nomic-embed-text",
        prompt: text,
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Ollama embedding failed: ${response.statusText}`);
  }

  const data = await response.json();
    
  return data.embedding;
}

async function getEmbeddings(texts: string[]): Promise<number[][]> {
  const embeddings = await Promise.all(
    texts.map((text) => getEmbedding(text))
  );
  return embeddings;
}


// Store resume in vector DB
// userId makes it personal — each user has their own vectors
export async function storeResume(resumeText: string, userId: string): Promise<void> {
    const chunks = chunkText(resumeText);

    // Convert each chunk to a vector (array of numbers)
    // This is what makes semantic search possible
    const embeddings = await getEmbeddings(chunks);

    // Delete old resume vectors first — solves stale data problem
    await index.delete(
        chunks.map((_, i) => `resume-${userId}-${i}`)
    )

    // Store new vectors
    const vectors = chunks.map((chunk, i) => ({
        id: `resume-${userId}-${i}`,
        vector: embeddings[i],
        metadata: {
            text: chunk,
            docType: "resume",
            userId,
            uploadedAt: new Date().toISOString()
        }
    }))

    await index.upsert(vectors)
}

// Fetch relevant resume chunks for a query
// Not the whole resume — just the most relevant parts
export async function retrieveResumeContext(
  query: string,
  userId: string,
  topK = 5
): Promise<string> {
  const embedding = await getEmbedding(query);

  const results = await index.query({
    vector: embedding,
    topK,
    includeMetadata: true,
    filter: `docType = 'resume' and userId = '${userId}'`,
  });

  return results
    .map((r) => r.metadata?.text as string)
    .filter(Boolean)
    .join("\n\n");
}

