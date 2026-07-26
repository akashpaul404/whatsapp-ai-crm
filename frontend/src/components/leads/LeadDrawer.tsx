import React, { useEffect, useState } from 'react';
import { X, MessageSquare, History, Phone, Calendar, User, ShieldAlert, CheckCircle } from 'lucide-react';
import { Lead, ChatMessage, ActionLog } from '../../types';
import { STAGE_COLORS } from '../../constants';

interface LeadDrawerProps {
  lead: Lead | null;
  onClose: () => void;
  auditLogs: ActionLog[];
}

export const LeadDrawer: React.FC<LeadDrawerProps> = ({ lead, onClose, auditLogs }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingMsg, setLoadingMsg] = useState(false);

  useEffect(() => {
    if (!lead) return;
    setLoadingMsg(true);
    fetch(`http://localhost:3000/crm/chat-history/${encodeURIComponent(lead.phone)}`)
      .then((res) => (res.ok ? res.json() : []))
      .then((history: ChatMessage[]) => {
        if (history && history.length > 0) {
          const sorted = [...history].sort((a, b) => {
            const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
            const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
            const diff = timeA - timeB;
            if (Math.abs(diff) < 2000 && a.role !== b.role) {
              return a.role === 'user' ? -1 : 1;
            }
            return diff;
          });
          setMessages(sorted);
        } else {
          setMessages([]);
        }
      })
      .catch(() => setMessages([]))
      .finally(() => setLoadingMsg(false));
  }, [lead]);

  if (!lead) return null;

  const leadLogs = auditLogs.filter((log) => log.leadId === lead.id || log.phone === lead.phone);

  return (
    <div className="fixed inset-y-0 right-0 w-[450px] bg-slate-900/95 backdrop-blur-2xl border-l border-slate-700/80 shadow-2xl flex flex-col z-50 animate-in slide-in-from-right duration-200">
      {/* Drawer Header */}
      <div className="p-5 bg-slate-950/80 border-b border-slate-800/80 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center font-bold text-lg text-white shadow-md shadow-emerald-950/50">
            {lead.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
              {lead.name}
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${
                  STAGE_COLORS[lead.status] || 'bg-slate-800 text-slate-300 border-slate-700'
                }`}
              >
                {lead.status}
              </span>
            </h3>
            <p className="text-xs text-slate-400 flex items-center gap-1 font-mono mt-0.5">
              <Phone className="w-3 h-3 text-emerald-400" /> {lead.phone}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Read-Only Notice Banner */}
      <div className="bg-emerald-950/40 border-b border-emerald-800/50 px-4 py-2 flex items-center gap-2 text-[11px] text-emerald-300">
        <CheckCircle className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
        <span>
          <strong>Read-Only View:</strong> All state mutations occur exclusively through AI conversational intent.
        </span>
      </div>

      {/* Drawer Content Tabs / Scroll Area */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6 divide-y divide-slate-800/60">
        {/* Requirement / Notes Section */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-teal-400" /> Requirement / Notes
          </h4>
          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 text-xs text-slate-300 leading-relaxed font-mono">
            {lead.notes || 'No notes available'}
          </div>
          <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1 font-mono">
            <Calendar className="w-3 h-3" /> Updated: {new Date(lead.updatedAt).toLocaleString()}
          </p>
        </div>

        {/* Conversation Transcript (Read-Only) */}
        <div className="pt-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5 text-emerald-400" /> WhatsApp Chat Transcript
          </h4>
          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
            {loadingMsg ? (
              <p className="text-xs text-slate-500 italic text-center py-4">Loading transcript...</p>
            ) : messages.length === 0 ? (
              <p className="text-xs text-slate-500 italic text-center py-4">No recorded messages yet.</p>
            ) : (
              messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex flex-col ${msg.role === 'user' ? 'items-start' : 'items-end'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-xl p-3 text-xs leading-relaxed shadow-sm ${
                      msg.role === 'user'
                        ? 'bg-slate-800/90 text-slate-200 border border-slate-700/80 rounded-tl-none'
                        : 'bg-emerald-950/70 text-emerald-200 border border-emerald-800/60 rounded-tr-none'
                    }`}
                  >
                    <span className="block text-[9px] uppercase font-bold tracking-wider mb-1 opacity-70">
                      {msg.role === 'user' ? lead.name : 'Helping Assistant'}
                    </span>
                    {msg.content}
                  </div>
                  {msg.timestamp && (
                    <span className="text-[9px] text-slate-500 font-mono mt-0.5 px-1">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Audit Log History */}
        <div className="pt-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
            <History className="w-3.5 h-3.5 text-cyan-400" /> Audit Log Trail
          </h4>
          <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
            {leadLogs.length === 0 ? (
              <p className="text-xs text-slate-500 italic text-center py-3">No mutation logs recorded for this lead.</p>
            ) : (
              leadLogs.map((log) => (
                <div key={log.id} className="p-2.5 bg-slate-950/80 rounded-lg border border-slate-800/80 text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-[10px] text-emerald-400 font-semibold">{log.intent}</span>
                    <span className="text-[9px] text-slate-500 font-mono">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 my-1 text-[11px]">
                    <span className="px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-mono">{log.previousStatus}</span>
                    <span className="text-slate-500">→</span>
                    <span className="px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/60 font-mono font-bold">
                      {log.newStatus}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 italic font-mono truncate mt-1">"{log.rawMessage}"</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Drawer Footer */}
      <div className="p-4 bg-slate-950/90 border-t border-slate-800/80 text-center shrink-0">
        <button
          onClick={onClose}
          className="w-full py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all border border-slate-700"
        >
          Close Drawer
        </button>
      </div>
    </div>
  );
};
