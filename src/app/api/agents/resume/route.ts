import { streamText, convertToModelMessages, UIMessage } from "ai";
import { llm } from "@/lib/llm";
import { retrieveResumeContext } from "@/lib/rag";
import { storeGapAnalysis } from "@/lib/redis";
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
    ? `CANDIDATE RESUME CONTEXT:\n${resumeContext}`
    : `RESUME STATUS: No resume uploaded yet. Ask user to upload first.`;

  const jdSection = jobDescription
    ? `JOB DESCRIPTION:\n${jobDescription}`
    : `JOB DESCRIPTION: Not provided. Analyse resume generally.`;

  const taskSection = jobDescription
    ? `YOUR TASKS:
    1. ONLY flag gaps EXPLICITLY required in JD and missing from resume
    2. Never suggest skills not mentioned in the JD
    3. If resume shows a skill — do NOT flag it as a gap
    4. Cite evidence from resume or JD for every statement

    FORMAT:
    ✅ Strengths Match (cite resume evidence)
    ❌ Gaps Found (cite exact JD requirement)
    📚 Learning Roadmap (max 3 items, JD-specific only)
    🎯 Match Score: X/10

    IMPORTANT — At the very end, add this section EXACTLY:
    ---GAP_SUMMARY---
    GAPS: [list the specific skill gaps as comma separated values]
    STRENGTHS: [list top 3 strengths as comma separated values]
    SCORE: [X/10]
    ---END_GAP_SUMMARY---`
    : `YOUR TASKS:
    1. Summarise candidate strengths from resume
    2. Identify generally expected senior frontend skills
    3. Suggest 2-3 areas to strengthen for senior roles broadly

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

  STRICT RULES:
  - Base every statement on evidence from resume or JD
  - Never hallucinate skills or experiences
  - Be specific, honest, and actionable

  ${resumeSection}
  ${jdSection}
  ${taskSection}`,
      messages: modelMessages,
      // After stream completes — extract and store gap analysis
      onFinish: async ({ text }) => {
        try {
          // Extract the structured gap summary from response
          const match = text.match(
            /---GAP_SUMMARY---([\s\S]*?)---END_GAP_SUMMARY---/
          );
          if (match) {
            // Store clean summary for other agents
            await storeGapAnalysis(userId, match[1].trim());
          }
        } catch (err) {
          // Non-critical — don't break the response
          console.error("Failed to store gap analysis:", err);
        }
      },
    });

    return result.toUIMessageStreamResponse();
  } catch (error: any) {
    console.error("Resume agent error:", error);
    if (error?.status === 429) {
      return new Response(
        "Too many requests — please try again in a minute.",
        { status: 429 }
      );
    }
    return new Response("Something went wrong. Please try again.", { status: 500 });
  }
}