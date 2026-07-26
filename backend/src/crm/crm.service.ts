import { Injectable, Logger, OnModuleInit, Inject } from '@nestjs/common';
import { GroqService } from './groq.provider';
import { PrismaService } from './prisma.service';
import Redis from 'ioredis';

export interface Lead {
  id: string;
  name: string;
  phone: string;
  status: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface ActionLog {
  id: string;
  leadId: string;
  phone: string;
  previousStatus: string;
  newStatus: string;
  intent: string;
  confidence: number;
  rawMessage: string;
  timestamp: string;
}

// Destructive intents require a confirmation gate before committing to Postgres
const DESTRUCTIVE_INTENTS = new Set(['BOOK_APPOINTMENT', 'CANCEL_LEAD', 'UPDATE_INFO']);

const AFFIRMATIVES = new Set(['yes', 'haan', 'ha', 'confirm', 'ok', 'okay', 'done', 'proceed', 'sure', 'bilkul']);
const NEGATIVES = new Set(['no', 'nahi', 'na', 'cancel', 'nope', 'stop', 'mat', 'roko', 'nevermind']);

@Injectable()
export class CRMService implements OnModuleInit {
  private readonly logger = new Logger(CRMService.name);
  private redisClient: Redis;

  constructor(
    @Inject(GroqService) private readonly groqService: GroqService,
    @Inject(PrismaService) private readonly prisma: PrismaService,
  ) {
    this.redisClient = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
      maxRetriesPerRequest: null,
      lazyConnect: true,
      retryStrategy: (times) => Math.min(times * 50, 2000),
    });

    this.redisClient.on('error', () => {
      // Suppress ECONNRESET from Upstash idle TLS socket closures
    });
  }

  async onModuleInit() {
    try {
      await this.redisClient.connect();
      this.logger.log('🗄️ [CRM Engine] Redis cache layer connected');
    } catch (err: any) {
      this.logger.warn(`⚠️ [CRM Engine] Redis unavailable: ${err?.message}`);
    }
    await this.seedInitialLeadsIfEmpty();
  }

  // ─── Helpers ────────────────────────────────────────────────────────────────

  private isAffirmative(msg: string): boolean {
    const lower = msg.trim().toLowerCase();
    if (AFFIRMATIVES.has(lower)) return true;
    return lower.split(/[\s,.-]+/).some((w) => AFFIRMATIVES.has(w));
  }

  private isNegative(msg: string): boolean {
    const lower = msg.trim().toLowerCase();
    if (NEGATIVES.has(lower)) return true;
    return lower.split(/[\s,.-]+/).some((w) => NEGATIVES.has(w));
  }

  private async redisDel(...keys: string[]) {
    try {
      if (this.redisClient.status === 'ready') {
        await this.redisClient.del(...keys);
      }
    } catch (_) {}
  }

  private async redisGet(key: string): Promise<string | null> {
    try {
      if (this.redisClient.status === 'ready') {
        return await this.redisClient.get(key);
      }
    } catch (_) {}
    return null;
  }

  // ─── Seed ───────────────────────────────────────────────────────────────────

  private async seedInitialLeadsIfEmpty() {
    try {
      const count = await this.prisma.lead.count();
      if (count === 0) {
        await this.prisma.lead.createMany({
          data: [
            {
              id: 'seed-1',
              phone: '+919876543210',
              name: 'Rahul Sharma',
              status: 'NEW',
              notes: 'Interested in 2BHK property. Prefer evening calls.',
            },
            {
              id: 'seed-2',
              phone: '+918765432109',
              name: 'Priya Nair',
              status: 'HOT_PROSPECT',
              notes: 'Visa application urgent. Documents pending.',
            },
          ],
          skipDuplicates: true,
        });
        this.logger.log('🌱 [Postgres] Seeded initial CRM leads');
      }
    } catch (err: any) {
      this.logger.warn(`Seed failed: ${err?.message}`);
    }
  }

  // ─── Leads — cache-aside read ───────────────────────────────────────────────

  async getAllLeads(): Promise<Lead[]> {
    // 1. Cache check
    try {
      if (this.redisClient.status === 'ready') {
        const cached = await this.redisClient.get('crm:leads:all');
        if (cached) return JSON.parse(cached);
      }
    } catch (_) {}

    // 2. Postgres read
    const rows = await this.prisma.lead.findMany({ orderBy: { updatedAt: 'desc' } });
    const leads: Lead[] = rows.map((r) => ({
      id: r.id,
      name: r.name,
      phone: r.phone,
      status: r.status,
      notes: r.notes ?? '',
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    }));

    // 3. Populate cache (60s TTL)
    try {
      if (this.redisClient.status === 'ready') {
        await this.redisClient.set('crm:leads:all', JSON.stringify(leads), 'EX', 60);
      }
    } catch (_) {}

    return leads;
  }

  // ─── Audit Logs — cache-aside read ─────────────────────────────────────────

  async getAuditLogs(): Promise<ActionLog[]> {
    try {
      if (this.redisClient.status === 'ready') {
        const cached = await this.redisClient.get('crm:audit_logs:cache');
        if (cached) return JSON.parse(cached);
      }
    } catch (_) {}

    const rows = await this.prisma.actionLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    const logs: ActionLog[] = rows.map((r) => {
      const prev = r.previousData as any;
      return {
        id: r.id,
        leadId: r.leadId,
        phone: prev?.phone ?? '',
        previousStatus: prev?.status ?? '',
        newStatus: r.actionType,
        intent: r.intent,
        confidence: r.confidence,
        rawMessage: r.rawMessage,
        timestamp: r.createdAt.toISOString(),
      };
    });

    try {
      if (this.redisClient.status === 'ready') {
        await this.redisClient.set('crm:audit_logs:cache', JSON.stringify(logs), 'EX', 30);
      }
    } catch (_) {}

    return logs;
  }

  // ─── Knowledge Base — cache-aside ──────────────────────────────────────────

  async getKnowledgeBase(): Promise<string> {
    try {
      if (this.redisClient.status === 'ready') {
        const cached = await this.redisClient.get('crm:knowledge_base');
        if (cached) return cached;
      }
    } catch (_) {}

    const row = await this.prisma.knowledgeBase.findFirst();
    const content = row?.content ?? 'Clinic Helping Assistant. Help patients with empathy and secure consultation appointments: collect requirement and preferred appointment time.';

    try {
      if (this.redisClient.status === 'ready') {
        await this.redisClient.set('crm:knowledge_base', content, 'EX', 300);
      }
    } catch (_) {}

    return content;
  }

  async updateKnowledgeBase(content: string): Promise<{ success: boolean; content: string }> {
    // Write to Postgres (source of truth)
    await this.prisma.knowledgeBase.upsert({
      where: { id: 1 },
      update: { content },
      create: { content },
    });

    // Invalidate cache
    await this.redisDel('crm:knowledge_base');

    this.logger.log('🧠 [Knowledge Base] Updated in Postgres → Redis cache invalidated');
    return { success: true, content };
  }

  // ─── Chat History — cache-aside ─────────────────────────────────────────────

  async getChatHistory(phone: string): Promise<Array<{ role: 'user' | 'assistant'; content: string; timestamp: string }>> {
    const cacheKey = `crm:chat_history:${phone}`;

    try {
      if (this.redisClient.status === 'ready') {
        const cached = await this.redisClient.get(cacheKey);
        if (cached) return JSON.parse(cached);
      }
    } catch (_) {}

    const rows = await this.prisma.chatMessage.findMany({
      where: { phone },
      orderBy: { createdAt: 'asc' },
      take: 50,
    });

    const history = rows
      .map((r) => ({
        role: r.role as 'user' | 'assistant',
        content: r.content,
        timestamp: r.createdAt.toISOString(),
      }))
      .sort((a, b) => {
        const diff = new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
        if (Math.abs(diff) < 2000 && a.role !== b.role) {
          return a.role === 'user' ? -1 : 1;
        }
        return diff;
      });

    try {
      if (this.redisClient.status === 'ready') {
        await this.redisClient.set(cacheKey, JSON.stringify(history), 'EX', 120);
      }
    } catch (_) {}

    return history;
  }

  async clearChatHistory(phone: string): Promise<{ status: string; phone: string }> {
    const cacheKey = `crm:chat_history:${phone}`;
    const pendingKey = `crm:pending:${phone}`;
    try {
      if (this.redisClient.status === 'ready') {
        await this.redisClient.del(cacheKey, pendingKey);
      }
    } catch (_) {}

    await this.prisma.chatMessage.deleteMany({ where: { phone } });
    this.logger.log(`🧹 [CRM Engine] Cleared chat history and pending state for ${phone}`);
    return { status: 'cleared', phone };
  }

  // ─── Confirmation Gate ──────────────────────────────────────────────────────

  private async stagePendingAction(phone: string, payload: any) {
    try {
      if (this.redisClient.status === 'ready') {
        await this.redisClient.set(
          `crm:pending:${phone}`,
          JSON.stringify(payload),
          'EX',
          300,
        );
      }
    } catch (_) {}
  }

  private async consumePendingAction(phone: string): Promise<any | null> {
    const raw = await this.redisGet(`crm:pending:${phone}`);
    if (!raw) return null;
    await this.redisDel(`crm:pending:${phone}`);
    return JSON.parse(raw);
  }

  private async cancelPendingAction(phone: string): Promise<void> {
    await this.redisDel(`crm:pending:${phone}`);
  }

  // ─── Core message processor ─────────────────────────────────────────────────

  async processIncomingMessage(payload: { sender?: string; phone: string; message: string }) {
    const phone = payload.phone;
    const rawMessage = payload.message;

    // ── Step 1: Check if this is a YES/NO reply to a pending confirmation ───
    const pending = await this.redisGet(`crm:pending:${phone}`);
    if (pending) {
      if (this.isNegative(rawMessage)) {
        await this.cancelPendingAction(phone);
        const cancelResponse = 'Okay, cancelled. Your lead status has not been changed. How else can I help?';
        await this.saveChatMessages(phone, rawMessage, cancelResponse, null);
        return { ai_response: cancelResponse, lead: null, actionLog: null, parsed: { intent: 'CANCEL_CONFIRMATION', confidence: 1 } };
      }
      if (this.isAffirmative(rawMessage)) {
        return await this.commitPendingAction(phone, rawMessage);
      }
      // Not YES/NO — treat as new message, pending TTL expires naturally
    }

    // ── Step 2: Normal intent parsing via Groq LLM ───────────────────────────
    const history = await this.getChatHistory(phone);
    const knowledgeBase = await this.getKnowledgeBase();

    const parsed = await this.groqService.parseIntentAndEntities(
      rawMessage,
      history.map((h) => ({ role: h.role, content: h.content })),
      knowledgeBase,
    );
    this.logger.log(`⚡ [Groq] Intent: ${parsed.intent} | Confidence: ${parsed.confidence} | Phone: ${phone}`);

    // ── Step 3: Fetch or create Lead from Postgres ───────────────────────────
    let dbLead = await this.prisma.lead.findUnique({ where: { phone } });
    const previousStatus = dbLead?.status ?? 'NEW';

    if (!dbLead) {
      dbLead = await this.prisma.lead.create({
        data: {
          phone,
          name: payload.sender || parsed.entities?.name || 'New Inbound Lead',
          status: 'NEW',
          notes: rawMessage,
        },
      });
    } else if (payload.sender && payload.sender !== dbLead.name) {
      dbLead = await this.prisma.lead.update({
        where: { phone },
        data: { name: payload.sender },
      });
    }

    // ── Step 4: Destructive intent → stage instead of commit ─────────────────
    if (DESTRUCTIVE_INTENTS.has(parsed.intent)) {
      const stagePayload = { parsed, previousStatus, rawMessage, sender: payload.sender };
      await this.stagePendingAction(phone, stagePayload);

      const confirmPrompt =
        parsed.ai_response ||
        `Got it! To confirm: shall I update the pipeline to "${parsed.entities?.status || 'QUALIFIED'}"? Reply YES to confirm or NO to cancel.`;

      await this.saveChatMessages(phone, rawMessage, confirmPrompt, dbLead.id);

      const lead = this.toLeadShape(dbLead);
      return { ai_response: confirmPrompt, lead, actionLog: null, parsed };
    }

    // ── Step 5: Non-destructive → commit directly to Postgres ────────────────
    let newStatus: string = previousStatus;
    if (parsed.entities?.status && parsed.entities.status !== previousStatus) {
      newStatus = parsed.entities.status;
    }

    const updatedLead = await this.prisma.lead.update({
      where: { phone },
      data: {
        status: newStatus as any,
        notes: rawMessage,
        updatedAt: new Date(),
      },
    });

    // Invalidate leads cache
    await this.redisDel('crm:leads:all');

    // ── Step 6: Save chat messages to Postgres + invalidate cache ────────────
    const aiText = parsed.ai_response || `Lead ${updatedLead.name} status: ${newStatus}.`;
    await this.saveChatMessages(phone, rawMessage, aiText, updatedLead.id);

    // ── Step 7: Write audit log to Postgres + invalidate cache ───────────────
    const actionLog = await this.prisma.actionLog.create({
      data: {
        leadId: updatedLead.id,
        actionType: newStatus,
        intent: parsed.intent,
        confidence: parsed.confidence,
        rawMessage,
        previousData: { status: previousStatus, phone },
      },
    });
    await this.redisDel('crm:audit_logs:cache');

    const lead = this.toLeadShape(updatedLead);
    const logShape: ActionLog = {
      id: actionLog.id,
      leadId: actionLog.leadId,
      phone,
      previousStatus,
      newStatus,
      intent: actionLog.intent,
      confidence: actionLog.confidence,
      rawMessage: actionLog.rawMessage,
      timestamp: actionLog.createdAt.toISOString(),
    };

    return { ai_response: aiText, lead, actionLog: logShape, parsed };
  }

  // ─── Commit a staged pending confirmation ───────────────────────────────────

  private async commitPendingAction(phone: string, rawMessage: string) {
    const staged = await this.consumePendingAction(phone);
    if (!staged) {
      const msg = 'No pending confirmation found. Please re-send your request.';
      await this.saveChatMessages(phone, rawMessage, msg, null);
      return { ai_response: msg, lead: null, actionLog: null, parsed: { intent: 'UNKNOWN', confidence: 0 } };
    }

    const { parsed, previousStatus } = staged;
    const newStatus: string =
      parsed.intent === 'CANCEL_LEAD'
        ? 'CLOSED_LOST'
        : parsed.entities?.status ?? 'QUALIFIED';

    const dbLead = await this.prisma.lead.findUnique({ where: { phone } });
    if (!dbLead) {
      const msg = 'Lead not found. Please re-send your original request.';
      return { ai_response: msg, lead: null, actionLog: null, parsed };
    }

    const updatedLead = await this.prisma.lead.update({
      where: { phone },
      data: { status: newStatus as any, updatedAt: new Date() },
    });

    await this.redisDel('crm:leads:all');

    const aiText = `✅ Confirmed! Lead "${updatedLead.name}" updated to ${newStatus}.`;
    await this.saveChatMessages(phone, rawMessage, aiText, updatedLead.id);

    const actionLog = await this.prisma.actionLog.create({
      data: {
        leadId: updatedLead.id,
        actionType: newStatus,
        intent: parsed.intent,
        confidence: parsed.confidence,
        rawMessage: staged.rawMessage,
        previousData: { status: previousStatus, phone },
      },
    });
    await this.redisDel('crm:audit_logs:cache');

    const lead = this.toLeadShape(updatedLead);
    const logShape: ActionLog = {
      id: actionLog.id,
      leadId: actionLog.leadId,
      phone,
      previousStatus,
      newStatus,
      intent: actionLog.intent,
      confidence: actionLog.confidence,
      rawMessage: actionLog.rawMessage,
      timestamp: actionLog.createdAt.toISOString(),
    };

    return { ai_response: aiText, lead, actionLog: logShape, parsed };
  }

  // ─── Helpers ────────────────────────────────────────────────────────────────

  private async saveChatMessages(phone: string, userContent: string, aiContent: string, leadId: string | null) {
    const now = new Date();
    await this.prisma.chatMessage.createMany({
      data: [
        { phone, role: 'user', content: userContent, leadId, createdAt: now },
        { phone, role: 'assistant', content: aiContent, leadId, createdAt: new Date(now.getTime() + 1000) },
      ],
    });
    await this.redisDel(`crm:chat_history:${phone}`);
  }

  private toLeadShape(dbLead: any): Lead {
    return {
      id: dbLead.id,
      name: dbLead.name,
      phone: dbLead.phone,
      status: dbLead.status,
      notes: dbLead.notes ?? '',
      createdAt: dbLead.createdAt?.toISOString?.() ?? new Date().toISOString(),
      updatedAt: dbLead.updatedAt?.toISOString?.() ?? new Date().toISOString(),
    };
  }

  // ─── State Revert ────────────────────────────────────────────────────────────

  async revertState(actionLogId: string) {
    const log = await this.prisma.actionLog.findUnique({ where: { id: actionLogId } });
    if (!log) throw new Error(`Audit log ${actionLogId} not found.`);

    const prev = log.previousData as any;
    const lead = await this.prisma.lead.update({
      where: { id: log.leadId },
      data: { status: prev.status as any, updatedAt: new Date() },
    });

    await this.redisDel('crm:leads:all');
    this.logger.warn(`↩️ Reverted Lead ${lead.phone}: ${log.actionType} → ${prev.status}`);

    return { success: true, lead: this.toLeadShape(lead), revertedActionId: actionLogId };
  }
}