import { streamText, convertToModelMessages, UIMessage } from "ai";
import { llm } from "@/lib/llm";
import { retrieveResumeContext } from "@/lib/rag";
import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";


export async function POST(req: NextRequest) {
    const { userId } = await auth();
    if (!userId) {
        return new Response("Unauthorised", { status: 401 });
    }
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
    const resumeContext = await retrieveResumeContext(
        queryText,
        userId || "dev-user-1"
    );

    const resumeSection = resumeContext
        ? `CANDIDATE CONTEXT FROM RESUME:
       ${resumeContext}`
        : `RESUME: No resume uploaded yet.
       Answer generally without personal context.`;

    const modelMessages = await convertToModelMessages(messages);

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

    ${resumeSection}`,
        messages: modelMessages,
    });

    return result.toUIMessageStreamResponse();
}