import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, AlertTriangle, Zap, Database, GitBranch, Shield } from 'lucide-react';

interface Props {
  onBack?: () => void;
}

const QA = ({ q, a, note }: { q: string; a: string; note?: string }) => (
  <div className="border border-slate-700 rounded-lg overflow-hidden">
    <div className="bg-slate-950 px-4 py-3 text-sm font-semibold text-slate-200 flex items-start gap-2">
      <AlertTriangle className="w-4 h-4 text-yellow-400 mt-0.5 shrink-0" />
      {q}
    </div>
    <div className="px-4 py-3 text-sm text-slate-300 leading-relaxed">{a}</div>
    {note && (
      <div className="px-4 pb-3 text-xs text-slate-500 italic">{note}</div>
    )}
  </div>
);

const Layer = ({ icon, title, detail, badge }: { icon: React.ReactNode; title: string; detail: string; badge: string }) => (
  <div className="flex items-start gap-3 p-3 bg-slate-900 rounded-lg border border-slate-800">
    <div className="mt-0.5">{icon}</div>
    <div className="flex-1">
      <div className="flex items-center gap-2 mb-0.5">
        <span className="text-sm font-semibold text-slate-100">{title}</span>
        <span className="text-[10px] font-mono text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded">{badge}</span>
      </div>
      <p className="text-xs text-slate-400 leading-relaxed">{detail}</p>
    </div>
  </div>
);

export default function HowItWorks({ onBack }: Props = {}) {
  const navigate = useNavigate();
  const handleBack = () => {
    if (onBack) onBack();
    else navigate('/');
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans flex-1 overflow-y-auto">
      <div className="max-w-3xl mx-auto px-6 py-8">
        {/* Header */}
        <button onClick={handleBack} className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 mb-6 transition-all">
          <ArrowLeft className="w-4 h-4" /> Back to Simulator
        </button>

        <h1 className="text-2xl font-bold text-slate-100 mb-1">How It Works</h1>
        <p className="text-slate-400 text-sm mb-8">Architecture reference & CTO Q&A for the WhatsApp AI CRM Platform</p>

        {/* Architecture Pipeline */}
        <section className="mb-8">
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">System Architecture</h2>
          <div className="space-y-2">
            <Layer
              icon={<Zap className="w-4 h-4 text-yellow-400" />}
              title="React Frontend Simulator"
              detail="WhatsApp-style chat UI. Sends messages to Go ingestion engine. Subscribes to Socket.IO for real-time pipeline traces and lead updates."
              badge=":5173"
            />
            <div className="flex items-center justify-center text-slate-600 text-xs font-mono">↓ POST /webhook</div>
            <Layer
              icon={<Zap className="w-4 h-4 text-orange-400" />}
              title="Go Ingestion Engine (Gin)"
              detail="Absorbs raw webhook payloads on a tight 2s window (matching Meta's webhook timeout). Validates structure, forwards to NestJS queue producer. Decoupled from LLM processing so webhook acknowledgement is always fast."
              badge=":8080"
            />
            <div className="flex items-center justify-center text-slate-600 text-xs font-mono">↓ POST /crm/webhook-ingest (dedup check → BullMQ)</div>
            <Layer
              icon={<Database className="w-4 h-4 text-blue-400" />}
              title="NestJS Core Engine"
              detail="Queue consumer (BullMQ Worker) processes jobs. Calls Groq LLM for intent parsing, runs confirmation gate for destructive actions, writes to PostgreSQL as source of truth, invalidates Redis cache. Emits structured pipeline trace events via Socket.IO."
              badge=":3000"
            />
            <div className="flex items-center justify-center text-slate-600 text-xs font-mono">↓ Postgres write → Redis.del (cache-aside)</div>
            <Layer
              icon={<Database className="w-4 h-4 text-emerald-400" />}
              title="PostgreSQL — Source of Truth"
              detail="Canonical store for Lead, ChatMessage, ActionLog, and KnowledgeBase. Queryable by stage, date range, and agent. Hosted on Neon (serverless Postgres)."
              badge="Neon"
            />
            <Layer
              icon={<Database className="w-4 h-4 text-red-400" />}
              title="Redis — Queue, Cache & Ephemeral State"
              detail="BullMQ queue (webhook-queue), dedup keys (crm:dedup:*), cache keys (crm:leads:all, crm:chat_history:*), pending confirmation staging (crm:pending:*). Hosted on Upstash (serverless Redis TLS)."
              badge="Upstash"
            />
          </div>
        </section>

        {/* CTO Q&A */}
        <section className="mb-8">
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Common Technical Questions</h2>
          <div className="space-y-3">
            <QA
              q="How do you prevent duplicate webhook processing?"
              a="Redis SETNX on a synthetic dedup key (sha256 of phone + message + 30s time bucket) before pushing to BullMQ. If the key already exists, the job is rejected at the controller with status 'duplicate'. In production this key would be Meta's wamid (per-message unique ID). The hash is a stand-in for this simulation since there's no real webhook ID available."
              note="Production note: dedup on wamid directly. The 30s bucket hash is a reasonable substitute for simulated retries."
            />
            <QA
              q="How do you prevent hallucination-driven data corruption?"
              a="Two-layer defense: (1) Confirmation gate — destructive intents (BOOK_APPOINTMENT, CANCEL_LEAD, UPDATE_INFO) are staged in Redis with a 5-minute TTL. The AI replies 'Reply YES to confirm'. Only on an explicit affirmative is the action committed to Postgres. (2) Revert engine — every committed action writes an audit log. One-click state revert restores the previous Postgres record."
            />
            <QA
              q="What happens if the LLM is down or rate-limited?"
              a="Three-tier fallback: (1) Primary — llama-3.3-70b-versatile with 8s timeout. (2) Fallback — llama-3.1-8b-instant with 4s timeout, same Groq API key and JSON schema. (3) Static — deterministic local rule engine (regex + keyword matching) with domain-agnostic responses. Zero crashes at any tier."
            />
            <QA
              q="Why Go for ingestion and not just NestJS directly?"
              a="Meta's webhook delivery expects a 200 response within ~2 seconds or it will retry. LLM calls (Groq) can take 2–6 seconds. The Go layer absorbs the webhook immediately, acknowledges Meta, and hands off to NestJS async. This decouples webhook reliability from LLM latency. It also maps directly to the Brewszilla Go experience — high-throughput ingestion is a natural Go use case."
            />
            <QA
              q="Why cache-aside and not dual-write for Redis + Postgres?"
              a="Dual-write creates a window where Postgres and Redis can silently disagree if one write succeeds and the other fails. Cache-aside eliminates this: writes go to Postgres only (source of truth), then the Redis key is deleted (invalidated). The next read populates Redis from Postgres. Maximum staleness is one read cycle. Any CTO running production systems will ask 'what happens on partial failure' — cache-aside has a clean answer."
            />
            <QA
              q="How do you handle the NO / decline path in the confirmation gate?"
              a="If a pending confirmation exists for a phone number and the incoming message matches a negative pattern (no, nahi, cancel, stop, etc.), the pending Redis key is deleted immediately and the bot replies 'Okay, cancelled. No changes made.' The lead status is untouched. If the user goes silent, the Redis key expires after 5 minutes via TTL."
            />
          </div>
        </section>

        {/* Stack Summary */}
        <section>
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Technology Stack</h2>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {[
              ['Frontend', 'React + Vite + Socket.IO client'],
              ['Ingestion', 'Go + Gin (port 8080)'],
              ['Queue', 'BullMQ + Upstash Redis'],
              ['AI Engine', 'NestJS + Groq SDK (llama-3.3-70b → 8b-instant)'],
              ['Primary DB', 'PostgreSQL via Prisma (Neon serverless)'],
              ['Cache / Staging', 'Redis (Upstash) — cache-aside pattern'],
              ['WebSocket', 'Socket.IO (NestJS gateway)'],
              ['Dedup', 'Redis SETNX — 30s synthetic hash window'],
            ].map(([label, value]) => (
              <div key={label} className="flex items-start gap-2 p-2.5 bg-slate-800 rounded border border-slate-700">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                <div>
                  <div className="font-semibold text-slate-300">{label}</div>
                  <div className="text-slate-500">{value}</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
