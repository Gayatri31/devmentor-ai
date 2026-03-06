import { streamText, convertToModelMessages, UIMessage } from "ai";
import { llm } from "@/lib/llm";
import { retrieveResumeContext } from "@/lib/rag";
import { NextRequest } from "next/server";
import { auth } from "@/auth";

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return new Response("Unauthorised", { status: 401 });
    }
    const userId = session.user.id;
    const { messages, jobDescription }: { messages: UIMessage[]; jobDescription?: string } = await req.json();

    const latestMessage = messages[messages.length - 1];
    const query = latestMessage?.parts?.find((p) => p.type === "text") as { type: "text"; text: string } | undefined;
    const queryText = query?.text || "";

    const ragQuery = jobDescription
        ? `${queryText} ${jobDescription}`.slice(0, 500)
        : queryText;

    const resumeContext = await retrieveResumeContext(ragQuery, userId);

    const resumeSection = resumeContext
        ? `CANDIDATE RESUME CONTEXT:\n       ${resumeContext}`
        : `RESUME STATUS: No resume uploaded yet.\n       Politely ask the user to upload their resume first.\n       Do not guess or fabricate their experience.`;

    const jdSection = jobDescription
        ? `JOB DESCRIPTION TO MATCH AGAINST:\n       ${jobDescription}`
        : `JOB DESCRIPTION STATUS: Not provided yet.\n       Analyse the resume generally.\n       Focus on overall strengths and common senior frontend gaps.\n       Remind user that adding a JD will give more targeted analysis.`;

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

    try {
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
    } catch (error: any) {
        console.error("Resume agent error:", error);
        if (error?.status === 429) {
            return new Response(
                "I'm receiving a lot of requests right now — please try again in a minute.",
                { status: 429 }
            );
        }
        return new Response("Something went wrong. Please try again.", { status: 500 });
    }
}