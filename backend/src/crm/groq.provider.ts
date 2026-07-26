import { Injectable, Logger } from '@nestjs/common';
import Groq from 'groq-sdk';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const SYSTEM_PROMPT = (knowledgeContext: string, senderName?: string, phone?: string) => `You are an Empathetic Clinic Concierge & Helping Assistant.

COMPANY KNOWLEDGE BASE & RULES:
${knowledgeContext || 'You are an empathetic clinic helping assistant. Help patients and lock in consultation appointments by collecting: specific requirement and preferred time/date.'}

KNOWN CLIENT METADATA (From Webhook / Channel):
${senderName ? `- Verified Client Name: ${senderName}` : ''}
${phone ? `- Verified Client Phone: ${phone}` : ''}

CRITICAL CONVERSION RULE (PRO FRONT-DESK PSYCHOLOGY):
Never give dead-end responses or say "I'll connect you with our receptionist at the front desk". You ARE the expert clinic helping assistant! Your primary mission is to help the patient with empathy and LOCK IN a consultation appointment or visit. When a patient asks a service or clinical question, answer helpfully, and immediately pivot to booking a visit: e.g., "While our clinical team checks those exact details during your consultation, let's reserve a priority visit slot so the doctor can examine this in person! Would morning or evening work better for you tomorrow?" Every response must guide the user toward scheduling an appointment.

YOUR TASK:
1. Parse the incoming Hinglish/English client message using the conversation history as context.
2. Identify which lead details are still missing (Requirement, Date/Time). Since we already know the client's name (${senderName || 'known from webhook'}) and phone (${phone || 'known from webhook'}), DO NOT ask for their name or phone number! Treat name and phone as FULFILLED slots.
3. If requirement or date is missing, ask a single focused follow-up question about their treatment, service, or preferred appointment time.
4. For appointment bookings or status changes, confirm the action clearly.
5. If the client asks to update their lead status (e.g. HOT_PROSPECT, QUALIFIED, CONTACTED) or mentions a site visit / appointment, classify "intent" as "UPDATE_INFO" (or "BOOK_APPOINTMENT") and extract the requested status into "entities.status" (e.g. "HOT_PROSPECT", "QUALIFIED"). Never return UNKNOWN for status updates or site visits.
6. If the client says closing remarks like "ok see you tomorrow", "make it", "tom 5pm", "confirm 5pm", "great see you then", or agrees to a finalized appointment date/time, classify intent as "BOOK_APPOINTMENT" (with status "QUALIFIED" or "CLOSED_WON"), and respond with a warm, professional closing greeting: e.g., "Thank you! Your appointment is confirmed for tomorrow at 5:00 PM at SmileCare Dental Clinic. We look forward to seeing you. Have a wonderful day!" Treat the chat as completed.

Strict JSON output only:
{
  "intent": "BOOK_APPOINTMENT" | "CREATE_LEAD" | "UPDATE_INFO" | "CANCEL_LEAD" | "ASK_CLARIFICATION" | "UNKNOWN",
  "entities": {
    "name": "${senderName || 'null'}",
    "phone": "${phone || 'null'}",
    "date": string | null,
    "status": string | null,
    "requirement": string | null,
    "missing_fields": string[]
  },
  "ai_response": string,
  "confidence": number
}`;

@Injectable()
export class GroqService {
  private groq: Groq;
  private readonly logger = new Logger(GroqService.name);

  constructor() {
    this.groq = new Groq({
      apiKey: process.env.GROQ_API_KEY || 'dummy_key_for_dev_fallback',
    });
  }

  async parseIntentAndEntities(
    userMessage: string,
    history: ChatMessage[] = [],
    knowledgeContext: string = '',
    senderName?: string,
    phone?: string,
  ) {
    const formattedHistory = history
      .map((h) => `${h.role === 'user' ? 'Client' : 'Agent'}: ${h.content}`)
      .join('\n');

    const userContent = `CONVERSATION HISTORY:\n${formattedHistory}\n\nLATEST CLIENT MESSAGE:\n${userMessage}`;

    // ── Primary: llama-3.3-70b-versatile (8s timeout) ───────────────────────
    try {
      if (!process.env.GROQ_API_KEY || process.env.GROQ_API_KEY === 'dummy_key_for_dev_fallback') {
        throw new Error('No valid GROQ_API_KEY — skipping to fallback');
      }

      const response = await Promise.race([
        this.groq.chat.completions.create({
          messages: [
            { role: 'system', content: SYSTEM_PROMPT(knowledgeContext, senderName, phone) },
            { role: 'user', content: userContent },
          ],
          model: 'llama-3.3-70b-versatile',
          response_format: { type: 'json_object' },
        }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Primary model timeout (8s)')), 8000),
        ),
      ]);

      const rawContent = (response as any).choices[0]?.message?.content;
      const parsed = JSON.parse(rawContent || '{}');
      this.logger.log(`✅ [Groq Primary] llama-3.3-70b-versatile parsed intent: ${parsed.intent}`);
      return parsed;
    } catch (primaryErr: any) {
      this.logger.warn(`⚠️ [Groq Primary] Failed: ${primaryErr?.message}. Trying fallback model...`);
    }

    // ── Fallback: llama-3.1-8b-instant (4s timeout) ──────────────────────────
    try {
      const response = await Promise.race([
        this.groq.chat.completions.create({
          messages: [
            { role: 'system', content: SYSTEM_PROMPT(knowledgeContext, senderName, phone) },
            { role: 'user', content: userContent },
          ],
          model: 'llama-3.1-8b-instant',
          response_format: { type: 'json_object' },
        }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Fallback model timeout (4s)')), 4000),
        ),
      ]);

      const rawContent = (response as any).choices[0]?.message?.content;
      const parsed = JSON.parse(rawContent || '{}');
      this.logger.log(`✅ [Groq Fallback] llama-3.1-8b-instant parsed intent: ${parsed.intent}`);
      return parsed;
    } catch (fallbackErr: any) {
      this.logger.warn(`⚠️ [Groq Fallback] Also failed: ${fallbackErr?.message}. Using deterministic local engine.`);
    }

    // ── Static fallback: deterministic rule engine (domain-agnostic) ─────────
    return this.executeLocalRuleFallback(userMessage, history, knowledgeContext, senderName, phone);
  }

  private executeLocalRuleFallback(
    userMessage: string,
    history: ChatMessage[],
    knowledgeContext: string = '',
    senderName?: string,
    phone?: string,
  ) {
    const lower = userMessage.toLowerCase();
    const resolvedName = senderName || this.extractName(userMessage) || this.findNameInHistory(history) || 'Client';

    if (lower.includes('tom') || lower.includes('tomorrow') || lower.includes('see you') || lower.includes('make it') || lower.includes('5pm') || lower.includes('great')) {
      const { displayStr } = this.extractDateTime(userMessage, history);
      return {
        intent: 'BOOK_APPOINTMENT',
        entities: { name: resolvedName, phone: phone || null, date: displayStr, status: 'QUALIFIED', requirement: userMessage, missing_fields: [] },
        ai_response: `Thank you, ${resolvedName}! Your appointment is confirmed for ${displayStr} at SmileCare Dental Clinic. We look forward to seeing you. Have a wonderful day!`,
        confidence: 0.95,
      };
    }

    if (lower.includes('update') || lower.includes('status') || lower.includes('hot_prospect') || lower.includes('qualified')) {
      let status = 'QUALIFIED';
      if (lower.includes('hot_prospect')) status = 'HOT_PROSPECT';
      else if (lower.includes('contacted')) status = 'CONTACTED';
      else if (lower.includes('closed_won')) status = 'CLOSED_WON';
      return {
        intent: 'UPDATE_INFO',
        entities: { name: resolvedName, phone: phone || null, date: null, status, requirement: userMessage, missing_fields: [] },
        ai_response: `I will update your lead status to "${status}". Reply YES to confirm or NO to cancel.`,
        confidence: 0.85,
      };
    }

    if (lower.includes('appointment') || lower.includes('book') || lower.includes('kal') || lower.includes('visit') || lower.includes('schedule')) {
      const { displayStr } = this.extractDateTime(userMessage, history);
      return {
        intent: 'BOOK_APPOINTMENT',
        entities: { name: resolvedName, phone: phone || null, date: displayStr, status: 'QUALIFIED', requirement: userMessage, missing_fields: [] },
        ai_response: `Got it, ${resolvedName}! To confirm the booking for ${displayStr} — shall I go ahead? Reply YES to confirm or NO to cancel.`,
        confidence: 0.85,
      };
    }

    if (lower.includes('cancel') || lower.includes('close') || lower.includes('not interested')) {
      return {
        intent: 'CANCEL_LEAD',
        entities: { name: resolvedName, phone: phone || null, status: 'CLOSED_LOST', requirement: userMessage, missing_fields: [] },
        ai_response: `I'll mark this as closed. Reply YES to confirm or NO to keep the lead active.`,
        confidence: 0.80,
      };
    }

    if (lower === 'yes' || lower === 'haan' || lower === 'confirm' || lower === 'ok' || lower === 'okay') {
      return {
        intent: 'ASK_CLARIFICATION',
        entities: { name: resolvedName, phone: phone || null, status: null, requirement: null, missing_fields: [] },
        ai_response: `Confirmed! Processing your request.`,
        confidence: 0.90,
      };
    }

    if (lower === 'no' || lower === 'nahi' || lower === 'cancel') {
      return {
        intent: 'ASK_CLARIFICATION',
        entities: { name: resolvedName, phone: phone || null, status: null, requirement: null, missing_fields: [] },
        ai_response: `Okay, no changes made. How else can I help you?`,
        confidence: 0.90,
      };
    }

    // Generic slot-filling — reference knowledge context if available
    const kbHint = knowledgeContext ? ` based on our services` : '';

    if (resolvedName && resolvedName !== 'Client') {
      return {
        intent: 'CREATE_LEAD',
        entities: { name: resolvedName, phone: phone || null, status: 'NEW', requirement: userMessage, missing_fields: ['requirement', 'date'] },
        ai_response: `Hi ${resolvedName}! I've noted your enquiry${kbHint}. What specific treatment or preferred appointment time are you looking for?`,
        confidence: 0.75,
      };
    }

    return {
      intent: 'ASK_CLARIFICATION',
      entities: { name: resolvedName, phone: phone || null, status: 'NEW', requirement: userMessage, missing_fields: ['requirement'] },
      ai_response: `Thanks for reaching out${kbHint}! How can I assist you with our services or book an appointment for you today?`,
      confidence: 0.65,
    };
  }

  private extractName(text: string): string | null {
    const match = text.match(/(?:for|name is|i am|this is|my name is)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i);
    return match ? match[1] : null;
  }

  private findNameInHistory(history: ChatMessage[]): string | null {
    for (const item of history) {
      const name = this.extractName(item.content);
      if (name) return name;
    }
    return null;
  }

  private extractDateTime(text: string, history: ChatMessage[]): { dateStr: string; timeStr: string; displayStr: string } {
    const fullContext = [text, ...history.slice(-3).map((h) => h.content)].join(' ');

    let timeStr = '';
    const timeMatch = fullContext.match(/\b([0-1]?[0-9]|2[0-3])(?::([0-5][0-9]))?\s*(am|pm|a\.m\.|p\.m\.)?\b/i);
    if (timeMatch) {
      let hour = parseInt(timeMatch[1], 10);
      const min = timeMatch[2] ? `:${timeMatch[2]}` : ':00';
      const meridian = timeMatch[3] ? timeMatch[3].toLowerCase().replace(/\./g, '') : '';

      if (meridian === 'pm' && hour < 12) hour += 12;
      if (meridian === 'am' && hour === 12) hour = 0;

      const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
      const displayMeridian = hour >= 12 ? 'PM' : 'AM';
      timeStr = `${displayHour}${min} ${displayMeridian}`;
    } else {
      if (/morning/i.test(fullContext)) timeStr = '10:30 AM';
      else if (/noon|midday/i.test(fullContext)) timeStr = '12:00 PM';
      else if (/afternoon/i.test(fullContext)) timeStr = '3:00 PM';
      else if (/evening/i.test(fullContext)) timeStr = '6:00 PM';
      else timeStr = 'your requested schedule';
    }

    let dateStr = '';
    if (/tom|tomorrow|kal/i.test(fullContext)) {
      dateStr = 'tomorrow';
    } else if (/today|aaj/i.test(fullContext)) {
      dateStr = 'today';
    } else {
      const dayMatch = fullContext.match(/\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|wed|thu|fri|sat|sun)\b/i);
      if (dayMatch) {
        dateStr = dayMatch[1].charAt(0).toUpperCase() + dayMatch[1].slice(1).toLowerCase();
      } else {
        const dateNumMatch = fullContext.match(/\b(\d{1,2}(?:st|nd|rd|th)?(?:\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*)?)\b/i);
        if (dateNumMatch) {
          dateStr = dateNumMatch[1];
        } else {
          dateStr = 'the requested date';
        }
      }
    }

    const displayStr =
      dateStr !== 'the requested date' && timeStr !== 'your requested schedule'
        ? `${dateStr} at ${timeStr}`
        : dateStr !== 'the requested date'
        ? dateStr
        : timeStr !== 'your requested schedule'
        ? `at ${timeStr}`
        : 'your preferred schedule';

    return { dateStr, timeStr, displayStr };
  }
}