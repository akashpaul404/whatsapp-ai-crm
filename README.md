# WhatsApp AI CRM Platform

High-performance, event-driven microservice architecture for real-time WhatsApp webhook ingestion, Hinglish intent parsing via Groq LLM (Llama 3.3 70B), Redis BullMQ message queueing, and B2B SaaS CRM state management.

---

## 🏗️ Microservices Architecture

```
┌────────────────────────────────┐
│   React Simulator (Vite UI)    │  Port 5173
└───────────────┬────────────────┘
                │ 1. Dispatch Webhook Payload
                ▼
┌────────────────────────────────┐
│   Go-Gin Ingestion Layer       │  Port 8080
└───────────────┬────────────────┘
                │ 2. Push to Queue
                ▼
┌────────────────────────────────┐
│   Upstash / Redis Broker       │  BullMQ Queue (webhook-queue)
└───────────────┬────────────────┘
                │ 3. Consume Job
                ▼
┌────────────────────────────────┐
│   NestJS Core AI Engine        │  Port 3000
│   - Groq LLM Parser            │
│   - WebSocket Telemetry        │
│   - State Rollback Engine      │
└────────────────────────────────┘
```

---

## ⚡ Quick Start

### 1. Environment Setup
Add your Upstash Redis and Groq API keys to `backend/.env`:
```env
REDIS_URL="rediss://default:YOUR_UPSTASH_TOKEN@your-db.upstash.io:6379"
GROQ_API_KEY="gsk_YOUR_GROQ_API_KEY"
```

### 2. Launch All 3 Microservices

```bash
# Terminal 1: React Frontend (Port 5173)
cd frontend
npm run dev

# Terminal 2: NestJS Core Engine (Port 3000)
cd backend
npm run dev

# Terminal 3: Go Ingestion Engine (Port 8080)
cd backend/ingestion-go
go run main.go
```

## 🔮 Standalone NPM Package Roadmap

> **Future Release Plan:** The AI Intent Detector & Conversational Agent Engine ([groq.provider.ts](file:///d:/whatsapp-ai-crm/backend/src/crm/groq.provider.ts)) is built modularly and is planned for extraction as a standalone NPM package (`@whatsapp-crm/intent-detector`), allowing developers to use standalone intent parsing independently while powering this WhatsApp AI CRM.

---

## 📚 System Documentation

* **[AGENT.md](file:///d:/whatsapp-ai-crm/AGENT.md)**: System topology, guardrails, fallback specs, and reliability architecture.
* **[PROMPT.md](file:///d:/whatsapp-ai-crm/PROMPT.md)**: Groq LLM system prompt configurations and Hinglish test vectors.
* **[AGENTS.md](file:///d:/whatsapp-ai-crm/AGENTS.md)**: Persistent repository instructions for AI assistants.
