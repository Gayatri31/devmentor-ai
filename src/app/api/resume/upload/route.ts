import { NextRequest, NextResponse } from "next/server";
import { parseFile } from "@/lib/parse-file";
import { storeResume } from "@/lib/rag";
import { auth } from "@/auth";

export async function POST(req: NextRequest) {
    // ── Auth — must be first ──────────────────────────────
    const session = await auth();
    if (!session?.user?.id) {
        return new Response("Unauthorised", { status: 401 });
    }
    const userId = session.user.id;

    try {
        const formData = await req.formData();
        const file = formData.get("resume") as File;

        if (!file) {
            return NextResponse.json(
                { error: "No file uploaded" },
                { status: 400 }
            );
        }

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

        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
            return NextResponse.json(
                { error: "File size must be under 5MB" },
                { status: 400 }
            );
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const resumeText = await parseFile(buffer, file.type);

        if (!resumeText || resumeText.trim().length < 100) {
            return NextResponse.json(
                { error: "Could not extract text from file. Please try another file." },
                { status: 400 }
            );
        }

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