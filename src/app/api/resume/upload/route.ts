import { NextRequest, NextResponse } from "next/server";
import { parseFile } from "@/lib/parse-file";
import { storeResume } from "@/lib/rag";

export async function POST(req: NextRequest) {
    try {
        // Get the uploaded file from form data
        const formData = await req.formData();
        const file = formData.get("resume") as File;
        // Check file exists
        if (!file) {
            return NextResponse.json(
                { error: "No file Uploaded" },
                { status: 400 }
            )
        }
        // Validate file type — backend validation
        const allowedTypes = [
            "application/pdf",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ];
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json(
                { error: "Only PDF or DOCX files are allowed" },
                { status: 400 }
            );
        }

        // Validate file size — max 5MB
        const maxSize = 5 * 1024 * 1024; // 5MB in bytes
        if (file.size > maxSize) {
            return NextResponse.json(
                { error: "File size must be under 5MB" },
                { status: 400 }
            );
        }

        // Convert file to buffer for parsing
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Convert PDF/DOCX → plain text
        const resumeText = await parseFile(buffer, file.type);

        // Check extracted text is not empty
        if (!resumeText || resumeText.trim().length < 100) {
            return NextResponse.json(
                { error: "Could not extract text from file. Please try another file." },
                { status: 400 }
            )
        }

        // Temporary userId — will replace with Clerk later
        const userId = process.env.DEV_USER_ID || "dev-user-1";

        // Store in Upstash Vector DB
        await storeResume(resumeText, userId);

        return NextResponse.json({
            success: true,
            message: "Resume uploaded and processed successfully",
            uploadedAt: new Date().toISOString(),
            characterCount: resumeText.length,
        });

    } catch (error) {
        console.error("Resume upload error:", error);
        return NextResponse.json(
            { error: "Something went wrong. Please try again." },
            { status: 500 }
        );
    }


}