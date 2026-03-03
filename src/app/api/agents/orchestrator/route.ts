import { streamText, convertToModelMessages, UIMessage } from "ai";
import { llm } from "@/lib/llm";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
    const { messages }: { messages: UIMessage[] } = await req.json();

    const modelMessages = await convertToModelMessages(messages);

    const result = streamText({
        model: llm,
        system: `You are an intelligent orchestrator for DevMentor AI — 
    a career intelligence platform for developers.
    
    Your ONLY job is to read the user's message and return 
    which agent should handle it.
    
    Return ONLY one of these exact values — nothing else:
    - "resume"    → user wants resume review, gap analysis, JD comparison
    - "interview" → user wants mock interview, practice questions, grilling
    - "offer"     → user wants offer evaluation, salary check, abroad advice
    - "rag"       → user asks general tech/career knowledge questions
    
    Examples:
    "review my resume for this job" → resume
    "start a mock interview"        → interview  
    "I got an offer from Berlin"    → offer
    "what is system design?"        → rag
    "grill me on React hooks"       → interview
    "is my CV good for this role?"  → resume`,
        messages: modelMessages,
    });

    return result.toUIMessageStreamResponse();
}