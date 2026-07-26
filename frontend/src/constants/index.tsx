import React from 'react';
import { CheckCircle, Clock, XCircle } from 'lucide-react';
import { TraceStep } from '../types';

export const STEP_ORDER: TraceStep[] = ['DEDUP_CHECK', 'QUEUED', 'LLM_CALLED', 'CONFIRMATION_STAGED', 'COMMITTED', 'CANCELLED', 'ERROR'];

export const STEP_LABEL: Record<TraceStep, string> = {
  DEDUP_CHECK: 'Dedup Check',
  QUEUED: 'Queued to BullMQ',
  LLM_CALLED: 'Groq LLM Called',
  CONFIRMATION_STAGED: 'Confirmation Staged',
  COMMITTED: 'Committed to Postgres',
  CANCELLED: 'Cancelled',
  ERROR: 'Error',
};

export const STATUS_ICON: Record<string, React.ReactNode> = {
  ok: <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />,
  pending: <Clock className="w-3.5 h-3.5 text-yellow-400" />,
  fail: <XCircle className="w-3.5 h-3.5 text-red-400" />,
};

export const STATUS_COLOR: Record<string, string> = {
  ok: 'text-emerald-400',
  pending: 'text-yellow-400',
  fail: 'text-red-400',
};

export const STAGE_COLORS: Record<string, string> = {
  HOT_PROSPECT: 'bg-orange-950 text-orange-400 border-orange-800',
  QUALIFIED: 'bg-emerald-950 text-emerald-400 border-emerald-800',
  CLOSED_LOST: 'bg-red-950 text-red-400 border-red-800',
  CLOSED_WON: 'bg-blue-950 text-blue-400 border-blue-800',
  NEW: 'bg-slate-900 text-slate-400 border-slate-700',
  CONTACTED: 'bg-purple-950 text-purple-400 border-purple-800',
};
