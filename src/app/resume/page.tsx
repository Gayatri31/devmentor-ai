import ResumeChat from "@/components/agents/ResumeChat";
import ResumeUpload from "@/components/agents/ResumeUpload";

export default function ResumePage() {
  return (
    <main className="min-h-screen bg-zinc-950 p-6">
      <div className="mx-auto max-w-5xl">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">
            Resume Analyzer
          </h1>
          <p className="mt-2 text-zinc-400">
            Upload your resume and get AI-powered gap analysis
            tailored to your target role
          </p>
        </div>

        {/* Two column layout on desktop, stacked on mobile */}
        <div className="grid gap-6 lg:grid-cols-2">
          <ResumeUpload />
          <ResumeChat />
        </div>
      </div>
    </main>
  );
}