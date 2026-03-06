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
        jobDescription,
    }: {
        messages: UIMessage[];
        jobDescription?: string; // ← optional — no crash if missing
    } = await req.json();

    const latestMessage = messages[messages.length - 1];
    const query =
        latestMessage?.parts?.find(
            (p) => p.type === "text"
        ) as { type: "text"; text: string } | undefined;

    const queryText = query?.text || "";

    // Combine question + JD for richer RAG retrieval
    // If JD missing — just use the question alone
    const ragQuery = jobDescription
        ? `${queryText} ${jobDescription}`.slice(0, 500)
        : queryText;

    const resumeContext = await retrieveResumeContext(
        ragQuery,
        userId || "dev-user-1"
    );

    // Build system prompt sections dynamically
    // Each section degrades gracefully if data missing
    const resumeSection = resumeContext
        ? `CANDIDATE RESUME CONTEXT:
       ${resumeContext}`
        : `RESUME STATUS: No resume uploaded yet.
       Politely ask the user to upload their resume first.
       Do not guess or fabricate their experience.`;

    const jdSection = jobDescription
        ? `JOB DESCRIPTION TO MATCH AGAINST:
       ${jobDescription}`
        : `JOB DESCRIPTION STATUS: Not provided yet.
       Analyse the resume generally.
       Focus on overall strengths and common senior frontend gaps.
       Remind user that adding a JD will give more targeted analysis.`;

    const taskSection = jobDescription
        ? `YOUR TASKS WITH JD PROVIDED:
       1. ONLY flag gaps EXPLICITLY required in JD and missing from resume
       2. NEVER suggest skills not mentioned in the JD
       3. If resume shows a skill — do NOT flag it as a gap
       4. If unsure — say "unclear from resume" — never assume missing
       5. Cite evidence from resume or JD for every statement

       FORMAT:
       ✅ Strengths Match  (cite resume evidence)
       ❌ Gaps Found       (cite exact JD requirement)
       📚 Learning Roadmap (max 3 items, JD-specific only)
       🎯 Match Score: X/10`
        : `YOUR TASKS WITHOUT JD:
       1. Summarise candidate strengths from resume
       2. Identify generally expected senior frontend skills
       3. Suggest 2-3 areas to strengthen for senior roles broadly
       4. Remind user to add JD for targeted gap analysis

       FORMAT:
       ✅ Your Strengths
       💡 General Recommendations
       📌 Add a Job Description for targeted gap analysis`;

    const modelMessages = await convertToModelMessages(messages);

    const result = streamText({
        model: llm,
        system: `You are an expert resume analyst specialising in
    tech roles and international job markets.

    STRICT RULES — Always follow:
    - Base every statement on evidence from resume or JD
    - Never hallucinate skills or experiences
    - Never give generic advice not grounded in provided data
    - Be specific, honest, and actionable

    ${resumeSection}

    ${jdSection}

    ${taskSection}`,
        messages: modelMessages,
    });

    return result.toUIMessageStreamResponse();
}