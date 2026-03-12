import { streamText, convertToModelMessages, UIMessage } from "ai";
import { llm } from "@/lib/llm";
import { retrieveResumeContext } from "@/lib/rag";
import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { getGapAnalysis } from "@/lib/redis";

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return new Response("Unauthorised", { status: 401 });
    }
    const userId = session.user.id;
    const {
        messages,
    }: {
        messages: UIMessage[];
    } = await req.json();

    // Get latest message
    const latestMessage = messages[messages.length - 1];
    const query =
        latestMessage?.parts?.find(
            (p) => p.type === "text"
        ) as { type: "text"; text: string } | undefined;
    const queryText = query?.text || "";

    // Fetch relevant resume context for general questions
    const [resumeContext, gapAnalysis] = await Promise.all([
        retrieveResumeContext(queryText, userId),
        getGapAnalysis(userId),
    ]);

    const resumeSection = resumeContext
        ? `CANDIDATE CONTEXT FROM RESUME:
       ${resumeContext}`
        : `RESUME: No resume uploaded yet.
       Answer generally without personal context.`;

    const gapSection = gapAnalysis
        ? `RESUME GAP ANALYSIS (from Resume Agent):
        ${gapAnalysis}
        Use this to:
        - Prioritise advice around the candidate's known gaps
        - Reference specific gaps when giving learning recommendations
        - Avoid recommending skills they already have (listed as strengths)`
        : `GAP ANALYSIS: Not available yet.`;

    const modelMessages = await convertToModelMessages(messages);

    try {
        const result = streamText({
            model: llm,
            system: `You are a knowledgeable career and tech advisor
        specialising in frontend engineering, AI development,
        and international job markets.
    
        You answer general career and technical questions with
        specific, actionable advice.
    
        Use the candidate's resume context below to personalise
        your answers where relevant. If the question is purely
        technical — answer it directly without forcing resume context.
    
        STRICT RULES:
        - Be specific and actionable — no generic advice
        - If you reference the resume — cite specific details
        - For technical questions — give concrete examples
        - For career questions — give honest, direct advice
    
        ${resumeSection}
        ${gapSection}`,
            messages: modelMessages,
        });

        return result.toUIMessageStreamResponse();
    } catch (error: any) {
        console.error("RAG agent error:", error);
        if (error?.status === 429) {
            return new Response(
                "Too many requests — please try again in a minute.",
                { status: 429 }
            );
        }
        return new Response("Something went wrong. Please try again.", { status: 500 });
    }
}