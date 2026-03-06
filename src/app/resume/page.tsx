import ResumeUpload from "@/components/agents/ResumeUpload";
import ResumeChat from "@/components/agents/ResumeChat";

export default function ResumePage() {
  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">
          Resume Analyzer
        </h1>
        <p className="mt-2 text-zinc-400">
          Upload your resume and get AI-powered gap analysis
          tailored to your target role
        </p>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <ResumeUpload />
        <ResumeChat />
      </div>
    </div>
  );
}