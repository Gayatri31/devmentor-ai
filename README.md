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

DevMentor AI is a multi-agent AI platform that helps developers land international tech roles. It combines RAG (Retrieval-Augmented Generation), agent-to-agent communication, streaming AI responses, and stateful conversation to deliver personalised career guidance grounded in your actual resume — not generic advice.

---

## Features
 
### 📄 Resume Gap Analyzer
- Upload PDF or DOCX resume once — stored as vector embeddings per user
- Paste any job description to get exact skill gap analysis
- AI identifies missing skills grounded in YOUR resume
- Personalised learning roadmap with priority order
- Match score out of 10 with evidence-based reasoning
- **Gap analysis stored in Redis — feeds directly into Interview and Offer agents**
 
### 💼 Offer Evaluator
- 8-dimension evaluation framework:
  - 🏢 Company reliability
  - ✈️ Visa + relocation support
  - ⚠️ Hidden clauses + bonds
  - 💰 Salary vs market rate
  - 🖥️ Tech stack future-proofing
  - 🏙️ Cost of living analysis
  - 📈 Equity + growth potential
  - 🎯 Personal fit — **cross-referenced with your gap analysis**
- Explicit verdict: **Accept / Negotiate / Decline**
- Hard decline trigger detection with scoring rules
 
### 🎯 Mock Interview Agent
- Stateful conversation — tracks what was asked and answered
- **Reads gap analysis from Resume Agent — focuses 60% of questions on your weak areas**
- Starts warm-up questions from your strengths, then probes gaps in Phase 2
- Adaptive difficulty — probes deeper on weak answers
- 4-phase interview arc: warm up → technical depth → system design → closing
- Performance score + detailed feedback referencing your specific gaps
 
### ⚡ Unified Dashboard
- Single chat interface routing across all agents
- AI orchestrator detects intent and routes intelligently
- Real-time agent status panel shows which agent is thinking
- Streaming responses with token-by-token visibility
 
---

## Architecture
 
```
┌───────────────────────────────────────────────────────────┐
│                     Next.js 15 Frontend                   │
│  Landing  │  Dashboard  │  Resume  │  Interview  │  Offer │
└─────────────────────────┬─────────────────────────────────┘
                          │ HTTP + SSE Streaming
┌─────────────────────────▼─────────────────────────────────┐
│                    Orchestrator Agent                     │
│         Reads intent → routes to specialist agent         │
└────┬──────────────┬──────────────┬──────────────┬─────────┘
     │              │              │              │
┌────▼───┐    ┌─────▼──┐     ┌─────▼───┐    ┌─────▼──┐
│ Resume │    │ Offer  │     │Interview│    │  RAG   │
│ Agent  │    │ Agent  │     │ Agent   │    │ Agent  │
└────┬───┘    └─────┬──┘     └─────┬───┘    └─────┬──┘
     │              │              │              │
     │    ┌─────────────────────────────────┐     │
     │    │      Agent-to-Agent Layer       │     │
     └───►│   Upstash Redis (TTL: 7 days)   │◄────┘
          │   gapanalysis:{userId}          │
          │   GAPS · STRENGTHS · SCORE      │
          └─────────────────────────────────┘
                          │
              ┌───────────▼──────────┐
              │      lib/rag.ts      │
              │ retrieveResumeContext│
              └───────────┬──────────┘
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
 ┌──────▼──────┐  ┌───────▼─────┐   ┌───────▼─────┐
 │ Voyage AI   │  │  Upstash    │   │    Groq     │
 │ Embeddings  │  │  Vector DB  │   │ Llama 3.3   │
 └─────────────┘  └─────────────┘   └─────────────┘
```
 
---
## Agent-to-Agent Communication
 
This is what makes DevMentor AI different from a simple chatbot. Agents share context through Upstash Redis:
 
```
Step 1 — Resume Agent analyses gaps
  User pastes JD → AI identifies skill gaps
  Structured summary stored in Redis:
    GAPS: GraphQL, Docker, CI/CD
    STRENGTHS: React, TypeScript, Next.js
    SCORE: 7/10
    TTL: 7 days
 
Step 2 — Interview Agent reads gap analysis
  Warm-up questions → drawn from STRENGTHS
  Technical depth   → 60% focused on GAPS
  Weak answer       → probes deeper before moving on
  Closing summary   → confirms or disproves each gap
 
Step 3 — Offer Agent reads gap analysis
  Dimension 8 (Personal Fit) becomes deeply personalised:
  "Your gap analysis shows weak Docker skills —
   this role requires Docker expertise.
   Factor in 2-3 months reskilling time."
 
Step 4 — RAG Agent reads gap analysis
  General advice becomes targeted:
  Recommends learning resources for YOUR specific gaps
  Avoids recommending skills you already have
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
| Agent Memory | Upstash Redis | Agent-to-agent gap analysis sharing (TTL: 7d) |
| Auth | NextAuth.js v5 | JWT sessions, credentials provider |
| Styling | Tailwind CSS | Utility-first styling |
| Deployment | Vercel | Serverless edge deployment |
| File Parsing | pdf2json + mammoth | PDF and DOCX text extraction |
 
---

## Key Technical Decisions
 
**Why agent-to-agent communication via Redis vs re-running analysis?**
Re-running gap analysis on every interview/offer request would cost 2-3x tokens and add 3-5 seconds latency. Redis stores the structured output with a 7-day TTL — zero latency retrieval, zero extra LLM calls. The Resume Agent writes once; all other agents read many times.
 
**Why RAG over fine-tuning?**
Resume data changes per user. RAG retrieves the right context at query time — no retraining needed. Each user's resume is chunked into 500-char segments, embedded via Voyage AI, and stored in Upstash with `userId` namespace isolation.
 
**Why Groq over OpenAI?**
Groq runs Llama 3.3 70B at 300+ tokens/second — dramatically faster streaming UX. Free tier is sufficient for a POC with zero cold starts vs OpenAI's occasional latency spikes.
 
**Why Voyage AI for embeddings?**
HuggingFace free tier has 20-60 second cold starts — unusable for production UX. Voyage AI provides dedicated API servers with no cold starts, 50M free tokens/month, and works via direct REST API with no broken npm packages.
 
**Why implicit state for Interview Agent?**
Rather than storing interview state in a database, the agent reads the full conversation history on each request and infers state from it. No extra storage, no sync issues — the messages array IS the state.
 
**Why NextAuth.js over Clerk?**
Clerk's development instance has a known incompatibility with `*.vercel.app` domains (`needs_client_trust` error). NextAuth.js v5 works on any domain including vercel.app with zero configuration.
 
---
 
## Project Structure
 
```
src/
├── app/
│   ├── api/
│   │   ├── agents/
│   │   │   ├── resume/route.ts        ← Gap analysis + stores to Redis
│   │   │   ├── offer/route.ts         ← Reads Redis gap analysis for dim 8
│   │   │   ├── interview/route.ts     ← Reads Redis gap analysis for targeting
│   │   │   └── rag/route.ts           ← Reads Redis gap analysis for advice
│   │   ├── resume/upload/route.ts     ← File parsing + vector storage
│   │   └── auth/[...nextauth]/route.ts
│   ├── dashboard/page.tsx             ← Unified chat + orchestrator
│   ├── resume/page.tsx
│   ├── interview/page.tsx
│   ├── offer/page.tsx
│   ├── login/page.tsx
│   └── page.tsx                       ← Landing page
├── components/
│   ├── agents/
│   │   ├── DashboardChat.tsx
│   │   ├── ResumeChat.tsx
│   │   ├── ResumeUpload.tsx
│   │   ├── OfferChat.tsx
│   │   ├── InterviewChat.tsx
│   │   └── AgentStatusPanel.tsx       ← Live agent indicator
│   ├── Navbar.tsx
│   └── ConditionalNavbar.tsx
└── lib/
    ├── llm.ts                         ← Provider abstraction
    ├── rag.ts                         ← Voyage AI + Upstash Vector
    ├── redis.ts                       ← Agent-to-agent communication
    └── parse-file.ts                  ← PDF/DOCX extraction
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
# LLM
LLM_PROVIDER=groq
GROQ_API_KEY=                    # console.groq.com — free
 
# Vector DB
UPSTASH_VECTOR_REST_URL=         # console.upstash.com
UPSTASH_VECTOR_REST_TOKEN=       # create index: 512 dims, Cosine
 
# Agent-to-Agent Memory
UPSTASH_REDIS_REST_URL=          # console.upstash.com → Redis
UPSTASH_REDIS_REST_TOKEN=        # free tier — 10K commands/day
 
# Embeddings
VOYAGE_API_KEY=                  # voyageai.com — free
 
# Auth
NEXTAUTH_SECRET=                 # openssl rand -base64 32
```
 
### 3. Create Upstash resources
 
```
Vector DB:
  Upstash Dashboard → Vector → Create Index
  Dimensions: 512 | Metric: Cosine
 
Redis DB:
  Upstash Dashboard → Redis → Create Database
  Region: us-east-1 | Free tier
```
 
### 4. Run
 
```bash
npm run dev
```
 
Open [http://localhost:3000](http://localhost:3000), sign up, upload your resume at `/resume`.
 
### 5. Test agent-to-agent communication
 
```
1. Go to /resume → upload resume → paste a JD → ask "Analyse my gaps"
2. Go to /interview → Start Interview
   → Should focus warm-up on your strengths
   → Should probe your specific gaps in Phase 2
3. Go to /offer → paste an offer
   → Dimension 8 should reference your specific gaps
```
 
---
 
## API Routes
 
| Route | Method | Description |
|---|---|---|
| `/api/agents/resume` | POST | Gap analysis + stores summary to Redis |
| `/api/agents/offer` | POST | 8-dimension evaluation + reads Redis gap analysis |
| `/api/agents/interview` | POST | Stateful interview + reads Redis for gap targeting |
| `/api/agents/rag` | POST | General career knowledge + reads Redis |
| `/api/resume/upload` | POST | Parse file + store vectors in Upstash |
| `/api/auth/[...nextauth]` | GET/POST | NextAuth handlers |
 
All agent routes return `text/event-stream` (SSE streaming).
 
---
 
## Environment Variables
 
| Variable | Required | Description |
|---|---|---|
| `LLM_PROVIDER` | ✅ | `groq` or `ollama` |
| `GROQ_API_KEY` | ✅ | Groq API key |
| `UPSTASH_VECTOR_REST_URL` | ✅ | Upstash Vector endpoint |
| `UPSTASH_VECTOR_REST_TOKEN` | ✅ | Upstash Vector token |
| `UPSTASH_REDIS_REST_URL` | ✅ | Upstash Redis endpoint |
| `UPSTASH_REDIS_REST_TOKEN` | ✅ | Upstash Redis token |
| `VOYAGE_API_KEY` | ✅ | Voyage AI API key |
| `NEXTAUTH_SECRET` | ✅ | JWT signing secret |
| `OLLAMA_HOST` | ❌ | Local Ollama (dev only) |
 
---

## Roadmap

- [x] Multi-agent orchestration with intent routing
- [x] RAG pipeline with per-user vector storage
- [x] Agent-to-agent communication via Redis
- [ ] Voice interview mode — Web Speech API + ElevenLabs TTS
- [ ] Interview performance history + analytics
- [ ] Multi-resume support per user
- [ ] Tool use — live salary APIs, job board data

---

## Author

Built by **Gayatri** — Senior Frontend Engineer.

- Live demo: [devmentor-ai-phi.vercel.app](https://devmentor-ai-phi.vercel.app)
- GitHub: [github.com/Gayatri31/devmentor-ai](https://github.com/Gayatri31/devmentor-ai)

---

## License

MIT — feel free to fork and build on this.
