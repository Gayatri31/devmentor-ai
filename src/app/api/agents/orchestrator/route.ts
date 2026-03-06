import { streamText, convertToModelMessages, UIMessage } from "ai";
import { llm } from "@/lib/llm";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
    const { messages }: { messages: UIMessage[] } = await req.json();

    const modelMessages = await convertToModelMessages(messages);

    const result = streamText({
        model: llm,
        system: `You are a routing agent for DevMentor AI.
                    Read the user's message and return ONLY one word.

                    ROUTING RULES:

                    Return "resume" when user wants:
                    - Resume analysis, review, or feedback
                    - Gap analysis between resume and a job
                    - Resume improvements or suggestions
                    - "analyse my resume", "review my CV", "what are my gaps"

                    Return "interview" when user wants:
                    - Mock interview or practice
                    - Interview questions or preparation
                    - "start interview", "practice questions", "interview me"

                    Return "offer" when user wants:
                    - Job offer evaluation or analysis
                    - Salary comparison or negotiation advice
                    - Visa or relocation support check
                    - "evaluate this offer", "should I take this offer", "is this salary good"

                    Return "rag" when user wants:
                    - General career or tech advice
                    - Learning recommendations
                    - Industry knowledge questions
                    - Anything not clearly resume, interview, or offer

                    EXAMPLES:
                    "Analyse my resume for a Berlin role"     → resume
                    "Review my CV for a frontend position"    → resume
                    "What gaps do I have for this JD?"        → resume
                    "Start a mock interview"                  → interview
                    "Practice React interview questions"      → interview
                    "I got an offer from Berlin startup"      → offer
                    "Should I accept this £70k offer?"        → offer
                    "What skills should I learn next?"        → rag
                    "Is TypeScript worth learning?"           → rag

                    CRITICAL:
                    - Return ONLY the single word — nothing else
                    - No punctuation, no explanation, no quotes
                    - Just: resume OR interview OR offer OR rag`,
        messages: modelMessages,
    });

    return result.toUIMessageStreamResponse();
}