import {streamText} from "ai";
import {llm} from "@/lib/llm";
import { retrieveResumeContext } from "@/lib/rag";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest){
    const {messages, userId, jobDescription} = await req.json();
    // Get the user's latest message
    const latestMessages = messages[messages.length - 1].content;
    
    // Fetch relevant resume chunks from vector DB
    // Agent reads YOUR resume — not generic advice
    const resumeContext = retrieveResumeContext(latestMessages, userId);

    const result = streamText({
        model: llm,
        system: `You are an expert resume analyst and career coach 
            specializing in tech roles and international job markets.
            
            You have access to the candidate's resume below.
            Use it to give SPECIFIC, PERSONALIZED advice — 
            never generic responses.
            
            CANDIDATE'S RESUME CONTEXT:
            ${resumeContext}
            
            JOB DESCRIPTION THEY ARE TARGETING:
            ${jobDescription || "No job description provided yet"}
            
            YOUR TASKS:
            1. Identify exact skill gaps between resume and JD
            2. Highlight strengths that match the role
            3. Suggest specific improvements with examples
            4. Give a match score out of 10
            5. Provide a prioritized learning roadmap
            
            FORMAT your response clearly with sections:
            ✅ Strengths Match
            ❌ Gaps Found  
            📚 Learning Roadmap
            🎯 Match Score: X/10
            
            Be honest, specific, and actionable.
            Reference actual content from their resume.`,
        messages
    })
    return result.toTextStreamResponse();
}