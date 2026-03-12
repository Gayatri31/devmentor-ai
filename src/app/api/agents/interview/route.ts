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
    const { messages, jobDescription, isStart }: { messages: UIMessage[], jobDescription?: string, isStart?: boolean } = await req.json();

    // Get latest message text
    const latestMessage = messages[messages.length - 1];
    const query =
        latestMessage?.parts?.find(
            (p) => p.type === "text"
        ) as { type: "text"; text: string } | undefined;
    const queryText = query?.text || "";

    // Fetch resume context
    // For interview — we want broad context
    // not just relevant to latest message
    // because agent needs full picture of candidate
    const ragQuery = jobDescription
        ? `technical skills experience ${jobDescription}`.slice(0, 500)
        : `technical skills experience ${queryText}`.slice(0, 500);

    // Fetch both resume context AND gap analysis in parallel
    const [resumeContext, gapAnalysis] = await Promise.all([
        retrieveResumeContext(ragQuery, userId),
        getGapAnalysis(userId),
    ]);

    //Build resume section
    const resumeSection = resumeContext ? `CANDIDATE RESUME CONTEXT ${resumeContext}` : `RESUME: No resume uploaded. Ask candidate to upload resume first. Do not fabricate any experience.`;

    const jdSection = jobDescription ? `TARGET ROLE / JOB DESCRIPTION ${jobDescription} Use this to prioritise which technologies
       to focus interview questions on.` : `TARGET ROLE: Not provided.
       Conduct a general senior frontend
       engineering interview based on resume.`;

    // ← This is the agent-to-agent communication
    const gapSection = gapAnalysis
        ? `RESUME GAP ANALYSIS (from Resume Agent):
            ${gapAnalysis}
            CRITICAL INSTRUCTIONS BASED ON GAP ANALYSIS:
            - Spend 60% of technical questions on the GAPS listed above
            - These are the candidate's weak areas — probe them thoroughly
            - If a gap is confirmed weak during interview → note it in closing feedback
            - For STRENGTHS listed → start with these for warm-up questions
            - Reference the gap analysis in your closing summary`
        : `GAP ANALYSIS: Not available yet.
            The candidate has not run a resume gap analysis.
            Conduct interview based on resume context only.
            Suggest they use the Resume Analyzer after the interview.`;

    // Build conversation history summary
    // This is how agent tracks STATE
    const conversationHistory = messages.length > 1 ? `CONVERSTATION SO FAR: Read the message history carefully. 
    Identify: 
    1. Which topics you have already asked about
    2. Which answers were strong vs weak
    3. Which topics still need to be covered
    Use this to decide your next question` : `CONVERSTATION: this is the start of the interview`

    // Interview phases definition
    const interviewPhases = `
            INTERVIEW STRUCTURE — Follow this arc:

            PHASE 1 — WARM UP (first 2 questions)
            → Start with broad, confidence-building questions
            → Based directly on candidate's strongest resume points
            → Goal: make candidate comfortable
            → Example: "Walk me through your experience with React"

            PHASE 2 — TECHNICAL DEPTH (next 4-5 questions)
            → Go deep on technologies matching JD requirements
            → If answer is weak → probe deeper on same topic
            → If answer is strong → increase difficulty or move on
            → Mix conceptual + practical + scenario questions

            PHASE 3 — SYSTEM DESIGN (1-2 questions)
            → Ask a real-world scenario relevant to role
            → Example: "How would you architect a real-time
                        dashboard with live data updates?"
            → Evaluate thinking process not just answer

            PHASE 4 — CLOSING (final message)
            → Summarise candidate performance
            → List strong areas with evidence
            → List areas to improve with specific advice
            → Give overall interview score out of 10
            → Be honest and constructive`;

    // Answer evaluation rules
    const evaluationRules = `
            ANSWER EVALUATION — After every candidate answer:

            1. Give a brief reaction (1 line):
                Strong: "Good answer — you clearly understand X"
                Weak:   "That's partially right — let me probe further"
                Wrong:  "Not quite — I'll come back to this later"

            2. Decide next action:
                Strong answer  → move to next topic or increase difficulty
                Weak answer    → ask follow-up on SAME topic
                                "Can you go deeper on X specifically?"
                Wrong answer   → note it, move on, revisit in closing

            3. Never give the correct answer during interview
                Save feedback for the closing summary only

            4. Keep reactions short — this is an interview
                not a tutoring session
            5. Questions must be technically accurate
                Never compare tools that serve different purposes
                Never ask about technologies not in the resume or JD
                If unsure what to ask next — return to JD requirements
                and pick the next uncovered technology`;

    // Start vs continue logic
    const taskSection = isStart
        ? `THIS IS THE START OF THE INTERVIEW.

       Your opening message must:
       1. Greet warmly and professionally
       2. Mention you've reviewed their resume
          Reference 1-2 specific things you noticed
       3. Set expectations:
          - How many questions roughly
          - What topics you'll cover
          - That they should take their time
       4. Ask your FIRST question
          Start with Phase 1 — warm up question
          Make it broad and confidence-building

       Example opening tone:
       "Hi! Thanks for joining today's session.
        I've had a chance to review your resume and
        I can see you have strong experience with [X].
        We'll spend about 20-30 minutes covering [topics].
        Take your time with each answer — ready to begin?
        
        Let's start: [first question]"`
        : `CONTINUE THE INTERVIEW.

       Read the conversation history carefully.
       Apply evaluation rules to the last answer.
       Then ask your next question following the
       interview structure and phases above.

       Remember:
       - Track which topics are covered
       - Adapt difficulty based on answer quality
       - Follow the 4-phase interview arc
       - Never repeat a question already asked`;

    const modelMessages = await convertToModelMessages(messages);
    try {
        const result = streamText({
            model: llm,
            system: `You are an expert technical interviewer
                    specialising in frontend and full-stack engineering roles.
                    You conduct realistic, professional interviews that
                    accurately assess a candidate's true skill level.
                    CORE RULES:
                    - Base ALL questions on resume context and JD
                    - Never ask about technologies not in resume or JD
                    - Be professional but warm — reduce candidate anxiety
                    - Adapt difficulty based on answer quality
                    - Never reveal answers during the interview
                    - Be honest in evaluation — candidate growth depends on it
                    ${resumeSection}
                    ${jdSection}
                    ${gapSection}
                    ${conversationHistory}
                    ${interviewPhases}
                    ${evaluationRules}
                    ${taskSection}`,
            messages: modelMessages,
        });

        return result.toUIMessageStreamResponse();
    } catch (error: any) {
        console.error("Interview agent error:", error);
        if (error?.status === 429) {
            return new Response(
                "Too many requests — please try again in a minute.",
                { status: 429 }
            );
        }
        return new Response("Something went wrong. Please try again.", { status: 500 });
    }
}