# ✨ DevMentor AI

> Your personal AI career intelligence platform — built for developers targeting international roles

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)](https://typescriptlang.org)
[![Vercel AI SDK](https://img.shields.io/badge/Vercel_AI_SDK-4-black?style=flat-square&logo=vercel)](https://sdk.vercel.ai)
[![Groq](https://img.shields.io/badge/Groq-Llama_3.3-orange?style=flat-square)](https://groq.com)
[![Upstash](https://img.shields.io/badge/Upstash-Vector-green?style=flat-square)](https://upstash.com)
[![Deployed on Vercel](https://img.shields.io/badge/Deployed-Vercel-black?style=flat-square&logo=vercel)](https://devmentor-ai-phi.vercel.app)

**Live Demo → [devmentor-ai-phi.vercel.app](https://devmentor-ai-phi.vercel.app)**

---

## What Is This?

DevMentor AI is a multi-agent AI platform that helps developers land international tech roles. It combines RAG (Retrieval-Augmented Generation), streaming AI responses, and stateful conversation to deliver personalised career guidance grounded in your actual resume — not generic advice.

---

## Features

### 📄 Resume Gap Analyzer
- Upload PDF or DOCX resume once — stored as vector embeddings
- Paste any job description to get exact skill gap analysis
- AI identifies missing skills grounded in YOUR resume
- Personalised learning roadmap with priority order
- Match score out of 10 with evidence-based reasoning

### 💼 Offer Evaluator
- 8-dimension evaluation framework:
  - 🏢 Company reliability
  - ✈️ Visa + relocation support
  - ⚠️ Hidden clauses + bonds
  - 💰 Salary vs market rate
  - 🖥️ Tech stack future-proofing
  - 🏙️ Cost of living analysis
  - 📈 Equity + growth potential
  - 🎯 Personal fit vs your resume
- Explicit verdict: **Accept / Negotiate / Decline**
- Red flag detection with scoring rules

### 🎯 Mock Interview Agent
- Stateful conversation — tracks what was asked and answered
- Questions generated from YOUR resume + target JD
- Adaptive difficulty — probes deeper on weak answers
- 4-phase interview arc: warm up → technical depth → system design → closing
- Performance score + detailed feedback report

### ⚡ Unified Dashboard
- Single chat interface routing across all agents
- AI orchestrator detects intent and routes intelligently
- Real-time agent status panel shows which agent is thinking
- Streaming responses with 50ms render throttle

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Next.js Frontend                     │
│  Landing  │  Dashboard  │  Resume  │  Interview  │  Offer │
└─────────────────────────┬───────────────────────────────┘
                          │ HTTP + SSE Streaming
┌─────────────────────────▼───────────────────────────────┐
│                    Orchestrator Agent                    │
│         Reads intent → routes to specialist agent        │
└────┬──────────────┬──────────────┬──────────────┬───────┘
     │              │              │              │
┌────▼───┐    ┌─────▼──┐    ┌─────▼──┐    ┌─────▼──┐
│ Resume │    │ Offer  │    │Interview│   │  RAG   │
│ Agent  │    │ Agent  │    │ Agent  │    │ Agent  │
└────┬───┘    └─────┬──┘    └─────┬──┘    └─────┬──┘
     │              │              │              │
     └──────────────┴──────┬───────┴──────────────┘
                           │
              ┌────────────▼────────────┐
              │       lib/rag.ts        │
              │  retrieveResumeContext  │
              └────────────┬────────────┘
                           │
          ┌────────────────┼────────────────┐
          │                │                │
   ┌──────▼──────┐  ┌──────▼──────┐  ┌─────▼───────┐
   │ Voyage AI   │  │  Upstash    │  │    Groq     │
   │ Embeddings  │  │  Vector DB  │  │ Llama 3.3   │
   └─────────────┘  └─────────────┘  └─────────────┘
```

---

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Framework | Next.js 15 App Router | Full stack React framework |
| Language | TypeScript | Type safety throughout |
| AI SDK | Vercel AI SDK v4 | Streaming, useChat, transport layer |
| LLM | Groq + Llama 3.3 70B | Fast inference — 300+ tokens/sec |
| Embeddings | Voyage AI voyage-3-lite | 512-dim vectors via REST API |
| Vector DB | Upstash Vector | Serverless vector storage + similarity search |
| Auth | NextAuth.js v5 | JWT sessions, credentials provider |
| Styling | Tailwind CSS | Utility-first styling |
| Deployment | Vercel | Serverless edge deployment |
| File Parsing | pdf2json + mammoth | PDF and DOCX text extraction |

---

## Key Technical Decisions

### Why RAG over fine-tuning?
Resume data changes per user. RAG retrieves the right context at query time — no retraining needed. Each user's resume is chunked into 500-char segments, embedded via Voyage AI, and stored in Upstash with `userId` namespace isolation.

### Why Groq over OpenAI?
Groq runs Llama 3.3 70B at 300+ tokens/second — dramatically faster streaming UX. Free tier is sufficient for a POC. Zero cold starts vs OpenAI's occasional latency spikes.

### Why Voyage AI for embeddings?
HuggingFace free tier has 20-60 second cold starts — unusable for production UX. Voyage AI provides dedicated API servers with no cold starts, free tier, and REST API (no broken npm packages).

### Why implicit state for Interview Agent?
Rather than storing interview state in a database, the agent reads the full conversation history (messages array) on each request and infers state from it. No extra storage, no sync issues — the messages array IS the state.

### Why streaming with 50ms throttle?
Raw streaming causes a React re-render on every token — 50+ renders/second freezes the browser. Batching updates every 50ms reduces renders by ~90% with zero perceived UX difference.

---

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── agents/
│   │   │   ├── orchestrator/route.ts  ← Intent detection + routing
│   │   │   ├── resume/route.ts        ← Gap analysis agent
│   │   │   ├── offer/route.ts         ← 8-dimension offer evaluation
│   │   │   ├── interview/route.ts     ← Stateful interview agent
│   │   │   └── rag/route.ts           ← General knowledge agent
│   │   ├── resume/upload/route.ts     ← File parsing + vector storage
│   │   └── auth/[...nextauth]/route.ts
│   ├── dashboard/page.tsx
│   ├── resume/page.tsx
│   ├── interview/page.tsx
│   ├── offer/page.tsx
│   ├── login/page.tsx
│   └── page.tsx                       ← Landing page
├── components/
│   ├── agents/
│   │   ├── DashboardChat.tsx          ← Orchestrator + stream parser
│   │   ├── ResumeChat.tsx
│   │   ├── ResumeUpload.tsx
│   │   ├── OfferChat.tsx
│   │   ├── InterviewChat.tsx
│   │   └── AgentStatusPanel.tsx       ← Live agent indicator
│   ├── Navbar.tsx
│   └── ConditionalNavbar.tsx
└── lib/
    ├── llm.ts                         ← Provider abstraction (Groq/Ollama)
    ├── rag.ts                         ← Voyage AI embeddings + Upstash
    └── parse-file.ts                  ← PDF/DOCX text extraction
```

---

## Local Setup

### Prerequisites

```bash
node >= 18
npm >= 9
```

### 1. Clone and install

```bash
git clone https://github.com/Gayatri31/devmentor-ai.git
cd devmentor-ai
npm install
```

### 2. Set up environment variables

```bash
cp .env.example .env.local
```

Fill in `.env.local`:

```bash
# LLM Provider
LLM_PROVIDER=groq
GROQ_API_KEY=                    # console.groq.com — free

# Vector Database
UPSTASH_VECTOR_REST_URL=         # console.upstash.com
UPSTASH_VECTOR_REST_TOKEN=       # create index: 512 dims, Cosine

# Embeddings
VOYAGE_API_KEY=                  # voyageai.com — free

# Auth
NEXTAUTH_SECRET=                 # openssl rand -base64 32

# Optional — local LLM
OLLAMA_HOST=http://localhost:11434
```

### 3. Create Upstash Vector index

```
Upstash Dashboard
→ Vector
→ Create Index
→ Dimensions: 512
→ Metric: Cosine
```

### 4. Run development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 5. Upload your resume

```
Sign up → Go to /resume → Upload PDF or DOCX
```

---

## API Routes

| Route | Method | Description |
|---|---|---|
| `/api/agents/orchestrator` | POST | Detects intent, returns agent key |
| `/api/agents/resume` | POST | Resume gap analysis with RAG |
| `/api/agents/offer` | POST | 8-dimension offer evaluation |
| `/api/agents/interview` | POST | Stateful adaptive interview |
| `/api/agents/rag` | POST | General career knowledge |
| `/api/resume/upload` | POST | Parse file + store vectors |
| `/api/auth/[...nextauth]` | GET/POST | NextAuth handlers |

All agent routes accept:
```json
{
  "messages": "UIMessage[]",
  "userId": "string (from session)"
}
```

All agent routes return: `text/event-stream` (SSE streaming)

---

## Environment Variables Reference

| Variable | Required | Description |
|---|---|---|
| `LLM_PROVIDER` | ✅ | `groq` or `ollama` |
| `GROQ_API_KEY` | ✅ | Groq API key |
| `UPSTASH_VECTOR_REST_URL` | ✅ | Upstash Vector endpoint |
| `UPSTASH_VECTOR_REST_TOKEN` | ✅ | Upstash Vector token |
| `VOYAGE_API_KEY` | ✅ | Voyage AI API key |
| `NEXTAUTH_SECRET` | ✅ | JWT signing secret |
| `OLLAMA_HOST` | ❌ | Local Ollama (dev only) |

---

## Roadmap

- [ ] Voice interview mode — Web Speech API + ElevenLabs TTS
- [ ] Clerk production auth with custom domain
- [ ] Interview performance history + analytics
- [ ] Multi-resume support
- [ ] LinkedIn profile import
- [ ] Salary negotiation simulator

---

## Author

Built by **Gayatri** — Senior Frontend Engineer targeting international roles.

- Live demo: [devmentor-ai-phi.vercel.app](https://devmentor-ai-phi.vercel.app)
- GitHub: [github.com/Gayatri31/devmentor-ai](https://github.com/Gayatri31/devmentor-ai)

---

## License

MIT — feel free to fork and build on this.