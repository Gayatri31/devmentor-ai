"use client";
import { useState } from "react";

interface UploadState {
    status: "idle" | "uploading" | "success" | "error",
    message: string,
    uploadedAt: string | null
}

export default function ResumeUpload() {
    const [dragOver, setDragOver] = useState(false);
    const [uploadState, setUploadState] = useState<UploadState>({
        status: "idle",
        message: "",
        uploadedAt: null
    })

    //Handle actual file upload
    async function handleUpload(file: File) {
        const allowed = [
            "application/pdf",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ];

        if (!allowed.includes(file.type)) {
            setUploadState({
                status: "error",
                message: "Only PDF or DOCX files allowed",
                uploadedAt: null,
            });
            return;
        }

        // Frontend validation — file size (5MB)
        if (file.size > 5 * 1024 * 1024) {
            setUploadState({
                status: "error",
                message: "File must be under 5MB",
                uploadedAt: null,
            });
            return;
        }

        // Start uploading
        setUploadState({
            status: "uploading",
            message: "Processing your resume...",
            uploadedAt: null,
        });

        try {
            // Build FormData — standard way to send files
            const formData = new FormData();
            formData.append("resume", file);
            const response = await fetch("/api/resume/upload", {
                method: "POST",
                body: formData
            });

            const data = await response.json();

            if (!response) {
                throw new Error(data.error || "Upload failed")
            }

            setUploadState({
                status: "success",
                message: "Resume uploaded successfully",
                uploadedAt: data.uploadedAt,
            })

        } catch (error) {
            setUploadState({
                status: "error",
                message: error instanceof Error ? error.message : "Upload failed",
                uploadedAt: null,
            });
        }
    }

    //Handle file input change
    function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (file) handleUpload(file);
    }

    //Handle drag and drop
    function handleDrop(e: React.DragEvent) {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer?.files?.[0];
        if (file) handleUpload(file);
    }

    return (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
            {/* Header */}
            <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">
                    Your Resume
                </h2>

                {/* Last updated badge */}
                {uploadState.uploadedAt && (
                    <span className="rounded-full bg-zinc-800 px-3 py-1 text-xs text-zinc-400">
                        Last updated:{" "}
                        {new Date(uploadState.uploadedAt).toLocaleDateString()}
                    </span>
                )}
            </div>

            {/* Drop Zone */}
            <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-10 transition-all duration-200 ${dragOver
                    ? "border-blue-500 bg-blue-500/10"
                    : "border-zinc-700 hover:border-zinc-500"
                    }`}
            >
                {/* Upload Icon */}
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-800">
                    <svg
                        className="h-6 w-6 text-zinc-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                        />
                    </svg>
                </div>

                <p className="mb-1 text-sm font-medium text-zinc-300">
                    Drag and drop your resume
                </p>
                <p className="mb-4 text-xs text-zinc-500">PDF or DOCX · Max 5MB</p>

                {/* File Input */}
                <label className="cursor-pointer rounded-lg bg-zinc-800 px-4 py-2 text-sm text-zinc-300 transition hover:bg-zinc-700">
                    Browse File
                    <input
                        type="file"
                        accept=".pdf,.docx"
                        onChange={handleFileChange}
                        className="hidden"
                    />
                </label>
            </div>

            {/* Status Message */}
            {uploadState.message && (
                <div
                    className={`mt-4 rounded-lg px-4 py-3 text-sm ${uploadState.status === "success"
                        ? "bg-green-500/10 text-green-400"
                        : uploadState.status === "error"
                            ? "bg-red-500/10 text-red-400"
                            : "bg-blue-500/10 text-blue-400"
                        }`}
                >
                    {uploadState.status === "uploading" && (
                        <span className="mr-2 inline-block animate-spin">⟳</span>
                    )}
                    {uploadState.message}
                </div>
            )}
        </div>
    )
}