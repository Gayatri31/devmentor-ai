import { streamText, convertToModelMessages, UIMessage } from "ai";
import { llm } from "@/lib/llm";
import { retrieveResumeContext } from "@/lib/rag";
import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { getGapAnalysis } from "@/lib/redis";

export async function POST(request: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return new Response("Unauthorised", { status: 401 });
    }
    const userId = session.user.id;
    const { messages, offerText }: { messages: UIMessage[], offerText?: string } = await request.json();

    // Get latest user message
    const latestMessage = messages[messages.length - 1];
    const query =
        latestMessage?.parts?.find(
            (p) => p.type === "text"
        ) as { type: "text"; text: string } | undefined;
    const queryText = query?.text || "";

    // Source 1 — resume context from Upstash
    // Combine query + offer for richer retrieval
    const ragQuery = offerText
        ? `${queryText} ${offerText}`.slice(0, 500)
        : queryText;

    // Fetch resume context AND gap analysis in parallel
    const [resumeContext, gapAnalysis] = await Promise.all([
        retrieveResumeContext(ragQuery, userId),
        getGapAnalysis(userId),
    ]);

    // Source 2 — offer text injected directly
    const offerSection = offerText
        ? `JOB OFFER DETAILS:
       ${offerText}`
        : `OFFER STATUS: No offer text provided yet.
       Ask the user to paste their offer letter or job offer details.
       Do not fabricate any offer details.`;

    const resumeSection = resumeContext
        ? `CANDIDATE RESUME CONTEXT:
       ${resumeContext}`
        : `RESUME STATUS: No resume uploaded yet.
       Ask the user to upload their resume first for personalised analysis.
       Do not fabricate any experience.`;

    // ← Agent-to-agent: gap analysis enriches dimension 8
    const gapSection = gapAnalysis
        ? `RESUME GAP ANALYSIS (from Resume Agent):
        ${gapAnalysis}
        Use this for Dimension 8 (Personal Fit):
        - Cross-reference offer's tech stack with candidate GAPS
        - If offer requires skills in the GAP list → flag as risk
        - If offer's stack matches candidate STRENGTHS → flag as positive
        - Be specific: "Your gap analysis shows weak Docker skills — this role requires Docker expertise"
        - Give concrete reskilling timeline if gaps are significant`
        : `GAP ANALYSIS: Not available. Assess personal fit from resume context only.`;

    const taskSection = offerText
        ? `YOUR TASKS:
       Evaluate this offer across all 8 dimensions below.
       Base EVERY statement on the offer text or resume context.
       Never fabricate data — if information is missing say "not mentioned in offer."

       1. 🏢 Company Reliability
          Is the company name, role, and offer structure legitimate?
          Flag anything unusual or missing.

       2. ✈️ Visa + Relocation Support
          Is visa sponsorship mentioned?
          Is relocation support mentioned?
          If not — flag it as a risk for abroad candidates.

       3. ⚠️ Hidden Clauses + Bonds
          Identify any notice periods, non-compete clauses,
          clawback policies, or probation terms.
          Flag anything that could negatively impact the employee.

       4. 💰 Salary vs Market Rate
          Compare offered salary against typical market rate
          for this role, seniority, and location.
          Give a clear verdict: Below Market / At Market / Above Market.

       5. 🖥️ Tech Stack Future-Proofing
          Is the tech stack mentioned growing or declining?
          Will working here strengthen or weaken your market value?

       6. 🏙️ Cost of Living vs Salary
          For the given location — is this salary liveable?
          Give a rough monthly breakdown if possible.

       7. 📈 Equity + Growth Potential
          Are stock options or equity mentioned?
          Is there a career growth path indicated?

       8. 🎯 Personal Fit — Based on YOUR Resume
          Does your background match this role?
          What strengths do you bring?
          What gaps might affect your performance?
    
    FINAL VERDICT SCORING:

       Score each dimension 1-3:
       3 = Strong / clearly present
       2 = Acceptable / standard
       1 = Red flag / missing / concerning
       Total score = sum of all 8 dimensions out of 24

       ─────────────────────────────────────
       HARD DECLINE TRIGGERS
       Only decline if offer contains AT LEAST ONE of:

       TRIGGER 1: Bond or clawback clause
         Example: "must repay $10,000 if you leave before 2 years"
         Sample 1 has this? NO → not a decline trigger

       TRIGGER 2: Salary REDUCED during probation
         Example: "salary is 80% during 6 month probation"
         Sample 1 has this? NO → not a decline trigger

       TRIGGER 3: Notice period OVER 4 months
         Example: "6 month notice required"
         3 months notice = NOT a decline trigger → it is negotiable

       TRIGGER 4: Non-compete worldwide AND over 18 months
         Example: "24 months non-compete worldwide"
         12 months non-compete = NOT a decline trigger → it is negotiable

       TRIGGER 5: Tech stack is entirely outdated
         Example: AngularJS v1 only, jQuery only, proprietary only
         React + TypeScript + Next.js = NOT outdated → strong stack

       TRIGGER 6: Working hours explicitly over 10hrs/day
         Example: "9am-9pm mandatory"
         Sample 1 mentions occasional weekends = NOT a decline trigger

       TRIGGER 7: Equity described as vague with NO details
         Example: "significant equity to be discussed after joining"
         0.1% with 4yr vest + 1yr cliff = NOT vague → clear terms

       IF NONE OF THESE TRIGGERS EXIST → DO NOT DECLINE

       ─────────────────────────────────────
       NEGOTIATE if ALL of:
       - Zero hard decline triggers above
       - AND at least one of:
         * Salary below market rate for location
         * Visa not mentioned (flag but not decline)
         * Notice period is 3-4 months (flag but negotiate)
         * Equity terms present but could be better
         * Non-compete under 18 months (flag but negotiate)
       - Score between 10-17 out of 24

       ─────────────────────────────────────
       ACCEPT if ALL of:
       - Zero hard decline triggers
       - Salary at or above market rate
       - Score 18 or above out of 24

       ─────────────────────────────────────
       NEGOTIATION POINTS — always list if verdict is Negotiate:
       Be specific:
       "Negotiate salary from £58,000 to £68,000-£72,000
        based on London market rate for this stack"
       "Request clarity on visa sponsorship before signing"
       "Request reduction of non-compete from 12 to 6 months"

       IMPORTANT:
       Missing visa information = negotiation point, NOT decline
       3 month notice = negotiation point, NOT decline
       Below market salary = negotiation point, NOT decline
       Only HARD TRIGGERS above = decline`
        : `YOUR TASKS WITHOUT OFFER:
       - Tell user to paste their offer letter or offer details
       - Explain what you can analyse once they share it
       - Be helpful and encouraging`;

    const modelMessages = await convertToModelMessages(messages);
    try {
        const result = streamText({
            model: llm,
            system: `You are an expert career advisor specialising in
                tech job offers, international relocation, and developer
                career growth. You have deep knowledge of global tech
                salary benchmarks, visa processes, and startup culture.

                STRICT RULES:
                - Base every statement on the offer text or resume context
                - Never fabricate salary data, visa rules, or company info
                - If data is missing from offer — say "not mentioned"
                - Be honest about red flags — the candidate's career depends on it
                ${resumeSection}
                ${offerSection}
                ${gapSection}
                ${taskSection}`,
            messages: modelMessages,
        });
        return result.toUIMessageStreamResponse();
    } catch (error: any) {
        console.error("Offer agent error:", error);
        if (error?.status === 429) {
            return new Response(
                "Too many requests — please try again in a minute.",
                { status: 429 }
            );
        }
        return new Response("Something went wrong. Please try again.", { status: 500 });
    }
}