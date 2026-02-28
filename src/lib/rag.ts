import { Index } from "@upstash/vector";
import { openai } from "@ai-sdk/openai";
import { embedMany, embed } from "ai";

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

    for(const sentence of sentences) {
        if((current + sentence).length > chuckSize){
            if(current) {
                chunks.push(current.trim())
            }
            current = sentence;
        } else {
            current += " " + sentence;
        }
    }

    if(current) {
        chunks.push(current.trim())
    }
    return chunks.filter((c) => c.length > 50);
}

// Store resume in vector DB
// userId makes it personal — each user has their own vectors
export async function storeResume(resumeText: string, userId: string): Promise<void> {
    const chunks = chunkText(resumeText);

    // Convert each chunk to a vector (array of numbers)
    // This is what makes semantic search possible
    const { embeddings } = await embedMany({
        model: openai.embedding("text-embedding-3-small"),
        values: chunks
    })

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
            type: "resume",
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

    const { embedding } = await embed({
        model: openai.embedding("text-embedding-3-small"),
        value: query
    });

    const results = await index.query({
        vector: embedding,
        topK,
        includeMetadata: true,
        filter: `type = resume AND userId = '${userId}'`,
    });

    // Return just the text — agent reads this as context
    return results.map((r) => r.metadata?.text as string).filter(Boolean).join("\n\n");
}

