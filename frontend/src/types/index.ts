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

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

export type TraceStep = 'DEDUP_CHECK' | 'QUEUED' | 'LLM_CALLED' | 'CONFIRMATION_STAGED' | 'COMMITTED' | 'CANCELLED' | 'ERROR';

export interface TraceEvent {
  msgId: string;
  phone: string;
  step: TraceStep;
  status: 'ok' | 'pending' | 'fail';
  detail: string;
  timestamp: string;
}

export interface TraceGroup {
  msgId: string;
  phone: string;
  message: string;
  steps: TraceEvent[];
  startedAt: string;
}
