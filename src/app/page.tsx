import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">

      {/* Navbar */}
      <nav className="border-b border-zinc-800 px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">✨</span>
            <span className="text-sm font-bold text-white tracking-tight">
              DevMentor AI
            </span>
          </div>
          <Link
            href="/sign-in"
            className="rounded-xl bg-white px-4 py-2 text-xs font-semibold text-zinc-950 transition hover:bg-zinc-200"
          >
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900 px-4 py-1.5 text-xs text-zinc-400 mb-8">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          Powered by Llama 3.3 · Groq · Upstash Vector
        </div>

        <h1 className="text-5xl font-bold text-white max-w-2xl leading-tight">
          Your personal AI
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-violet-400">
            {" "}career coach
          </span>
        </h1>

        <p className="mt-6 text-lg text-zinc-400 max-w-xl leading-relaxed">
          DevMentor AI analyses your resume, evaluates job offers,
          and conducts mock interviews — all personalised to your
          actual experience.
        </p>

        <div className="mt-10 flex items-center gap-4">
          <Link
            href="/sign-in"
            className="rounded-xl bg-white px-6 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-zinc-200"
          >
            Start for free
          </Link>
          <Link
            href="#features"
            className="rounded-xl border border-zinc-800 px-6 py-3 text-sm font-medium text-zinc-400 transition hover:border-zinc-600 hover:text-zinc-300"
          >
            See features
          </Link>
        </div>
      </div>

      {/* Features */}
      <div id="features" className="px-6 py-24 border-t border-zinc-800">
        <div className="mx-auto max-w-5xl">

          <h2 className="text-2xl font-bold text-white text-center mb-4">
            Everything you need to land your next role abroad
          </h2>
          <p className="text-zinc-400 text-center mb-16 max-w-xl mx-auto">
            Built for developers targeting international opportunities —
            especially EU and UK tech roles
          </p>

          <div className="grid gap-6 md:grid-cols-3">

            {/* Feature 1 */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
              <div className="text-3xl mb-4">📄</div>
              <h3 className="text-base font-semibold text-white mb-3">
                Resume Gap Analyzer
              </h3>
              <ul className="space-y-2">
                {[
                  "Upload your PDF or DOCX resume",
                  "Paste any job description",
                  "Get exact skill gaps identified",
                  "Receive a personalised learning roadmap",
                  "Match score out of 10",
                ].map((point) => (
                  <li
                    key={point}
                    className="flex items-start gap-2 text-xs text-zinc-400"
                  >
                    <span className="text-emerald-500 mt-0.5">✓</span>
                    {point}
                  </li>
                ))}
              </ul>
            </div>

            {/* Feature 2 */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
              <div className="text-3xl mb-4">💼</div>
              <h3 className="text-base font-semibold text-white mb-3">
                Offer Evaluator
              </h3>
              <ul className="space-y-2">
                {[
                  "Paste your complete offer letter",
                  "Salary vs market rate analysis",
                  "Visa and relocation support check",
                  "Hidden clauses and bond detection",
                  "Accept / Negotiate / Decline verdict",
                ].map((point) => (
                  <li
                    key={point}
                    className="flex items-start gap-2 text-xs text-zinc-400"
                  >
                    <span className="text-emerald-500 mt-0.5">✓</span>
                    {point}
                  </li>
                ))}
              </ul>
            </div>

            {/* Feature 3 */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
              <div className="text-3xl mb-4">🎯</div>
              <h3 className="text-base font-semibold text-white mb-3">
                Mock Interview
              </h3>
              <ul className="space-y-2">
                {[
                  "AI interviews you based on your resume",
                  "Questions tailored to target role",
                  "Adaptive — harder if you answer well",
                  "Feedback on every answer",
                  "Final performance score and report",
                ].map((point) => (
                  <li
                    key={point}
                    className="flex items-start gap-2 text-xs text-zinc-400"
                  >
                    <span className="text-emerald-500 mt-0.5">✓</span>
                    {point}
                  </li>
                ))}
              </ul>
            </div>

          </div>
        </div>
      </div>

      {/* How it works */}
      <div className="px-6 py-24 border-t border-zinc-800">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-2xl font-bold text-white mb-16">
            How it works
          </h2>
          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                step: "01",
                title: "Upload your resume",
                description:
                  "Upload your PDF or DOCX resume once. DevMentor AI stores it securely and uses it to personalise every response.",
              },
              {
                step: "02",
                title: "Choose your tool",
                description:
                  "Analyse gaps for a specific role, evaluate a job offer, or practice with a mock interview — all in one place.",
              },
              {
                step: "03",
                title: "Get personalised advice",
                description:
                  "Every response is grounded in your actual resume — not generic advice. Real gaps, real salary data, real feedback.",
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="text-4xl font-bold text-zinc-800 mb-3">
                  {item.step}
                </div>
                <h3 className="text-sm font-semibold text-white mb-2">
                  {item.title}
                </h3>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="px-6 py-24 border-t border-zinc-800">
        <div className="mx-auto max-w-xl text-center">
          <h2 className="text-2xl font-bold text-white mb-4">
            Ready to land your next role?
          </h2>
          <p className="text-zinc-400 text-sm mb-8">
            Free to use. No credit card required.
            Built by a developer, for developers.
          </p>
          <Link
            href="/sign-in"
            className="inline-flex rounded-xl bg-white px-8 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-zinc-200"
          >
            Get started for free →
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-zinc-800 px-6 py-8">
        <div className="mx-auto max-w-5xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>✨</span>
            <span className="text-xs font-bold text-white">
              DevMentor AI
            </span>
          </div>
          <p className="text-xs text-zinc-600">
            Open source · Built with Next.js + Vercel AI SDK
          </p>
        </div>
      </footer>

    </div>
  );
}