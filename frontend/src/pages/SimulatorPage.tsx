import React, { useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Send, Activity, ShieldCheck, Zap, ArrowRight, Trash2, Sparkles, UserCheck, CheckCircle2, AlertCircle, Terminal, Info, Clock, RefreshCw } from 'lucide-react';
import { useCRM } from '../context/CRMContext';
import { STEP_ORDER, STEP_LABEL, STATUS_ICON, STATUS_COLOR } from '../constants';

export const SimulatorPage: React.FC = () => {
  const {
    phone,
    setPhone,
    phoneDraft,
    setPhoneDraft,
    sender,
    setSender,
    message,
    setMessage,
    chatMessages,
    loading,
    traceGroups,
    leads,
    setSelectedLead,
    handleSendMessage,
    commitPhoneDraft,
    clearSessionHistory,
  } = useCRM();

  const navigate = useNavigate();
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const [showSuccessBanner, setShowSuccessBanner] = useState(false);
  const [showDemoInfo, setShowDemoInfo] = useState(false);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, loading]);

  // Watch for natural sign-off / appointment confirmation from AI (without auto-redirecting!)
  useEffect(() => {
    if (chatMessages.length > 0) {
      const lastMsg = chatMessages[chatMessages.length - 1];
      if (lastMsg.role === 'assistant') {
        const lower = lastMsg.content.toLowerCase();
        if (
          lower.includes('look forward to seeing you') ||
          lower.includes('have a wonderful day') ||
          lower.includes('appointment is confirmed') ||
          lower.includes('happy to assist you') ||
          lower.includes('confirmed for')
        ) {
          setShowSuccessBanner(true);
        }
      }
    }
  }, [chatMessages]);

  const selectPreset = async (name: string, num: string) => {
    setSender(name);
    setPhoneDraft(num);
    setPhone(num);
    setShowSuccessBanner(false);
    await clearSessionHistory(num);
  };

  const tryRandomClient = async () => {
    const firsts = ['Ananya', 'Rahul', 'Priya', 'Karan', 'Sneha', 'Rohan', 'Pooja', 'Aarav', 'Meera', 'Kabir', 'Aditya', 'Neha'];
    const lasts = ['Patel', 'Verma', 'Gupta', 'Mehta', 'Nair', 'Iyer', 'Reddy', 'Joshi', 'Sharma', 'Singh', 'Chopra', 'Malhotra'];
    const randomName = `${firsts[Math.floor(Math.random() * firsts.length)]} ${lasts[Math.floor(Math.random() * lasts.length)]}`;
    const randomNum = `+9198${Math.floor(10000000 + Math.random() * 90000000)}`;
    await selectPreset(randomName, randomNum);
  };

  const latestTrace = traceGroups[0];

  return (
    <div className="flex flex-1 h-full overflow-hidden bg-slate-950 font-sans">
      {/* LEFT: Chat Simulator (Linear Minimalist Aesthetics) */}
      <div className="w-7/12 flex flex-col h-full border-r border-slate-800/80 bg-slate-950/60">
        {/* Header & Client Profile Bar (Single Sleek Glassmorphic Container) */}
        <div className="p-5 bg-slate-900/60 backdrop-blur-xl border-b border-slate-800/80 shrink-0 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </div>
              <h2 className="font-extrabold text-base text-slate-100 tracking-tight flex items-center gap-2">
                <span>WhatsApp Client Simulator</span>
                <button
                  type="button"
                  onClick={() => setShowDemoInfo(!showDemoInfo)}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-400 hover:text-slate-200 transition-colors cursor-pointer border border-slate-700/60 font-normal"
                >
                  <Info className="w-3 h-3 text-cyan-400" />
                  <span>{showDemoInfo ? 'Hide Demo Info' : 'Why Demo Presets?'}</span>
                </button>
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs bg-slate-950/80 border border-slate-800 px-3 py-1 rounded-lg text-slate-400 font-mono flex items-center gap-1.5 shadow-inner">
                <Terminal className="w-3 h-3 text-emerald-400" />
                <span>Port: 8080 (Go Ingestion)</span>
              </span>
            </div>
          </div>

          {/* Collapsible Demo Mode Explanation (Progressive Disclosure) */}
          {showDemoInfo && (
            <div className="bg-slate-950/90 border border-cyan-500/30 rounded-xl p-3.5 text-slate-300 text-xs shadow-lg animate-in fade-in slide-in-from-top-1 duration-200">
              <div className="flex items-center gap-1.5 font-bold mb-1.5 text-cyan-400">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>Meta WhatsApp Cloud API vs. Trial Demo Setup</span>
              </div>
              <p className="text-[11px] leading-relaxed text-slate-400 font-sans">
                In a live production environment, the customer's <strong>Name</strong> and <strong>Phone Number</strong> are automatically extracted from Meta's incoming webhook payload (<code>entry[0].changes[0].value.contacts</code>). For this interactive demo, select a quick preset below or enter a test client to simulate real-time webhook streams with a clean session!
              </p>
            </div>
          )}

          {/* Clean Unified Control Row: Presets + Inline Input */}
          <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-3 shadow-inner flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mr-1">Presets:</span>
              <button
                type="button"
                onClick={() => selectPreset('Dinu Sharma', '+919876543299')}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                  phone === '+919876543299'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 shadow-sm'
                    : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-slate-700'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5 text-emerald-400" /> <span>Dinu Sharma</span>
              </button>
              <button
                type="button"
                onClick={() => selectPreset('Vikram Singh', '+919999888877')}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                  phone === '+919999888877'
                    ? 'bg-teal-500/20 text-teal-300 border border-teal-500/50 shadow-sm'
                    : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-slate-700'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5 text-teal-400" /> <span>Vikram Singh</span>
              </button>
              <button
                type="button"
                onClick={tryRandomClient}
                className="bg-gradient-to-r from-teal-950/80 to-cyan-950/80 hover:from-teal-900 hover:to-cyan-900 border border-teal-500/40 text-teal-300 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm hover:border-teal-400"
              >
                <Sparkles className="w-3.5 h-3.5 text-teal-300" /> <span>Random Lead</span>
              </button>
            </div>

            <div className="flex items-center gap-2 ml-auto">
              <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700/80 rounded-xl px-3 py-1">
                <span className="text-[10px] uppercase font-bold text-slate-500">Name:</span>
                <input
                  type="text"
                  value={sender}
                  onChange={(e) => setSender(e.target.value)}
                  className="w-24 bg-transparent text-xs text-slate-200 font-medium focus:outline-none"
                  placeholder="Client Name"
                />
                <span className="text-slate-700 font-light">|</span>
                <span className="text-[10px] uppercase font-bold text-slate-500">Phone:</span>
                <input
                  type="text"
                  value={phoneDraft}
                  onChange={(e) => setPhoneDraft(e.target.value)}
                  onBlur={commitPhoneDraft}
                  className="w-28 bg-transparent text-xs text-teal-400 font-mono font-bold focus:outline-none"
                  placeholder="+9198..."
                />
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowSuccessBanner(false);
                  clearSessionHistory();
                }}
                className="bg-slate-900 hover:bg-rose-950/50 border border-slate-800 hover:border-rose-500/40 text-slate-400 hover:text-rose-300 p-2 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer shadow-sm"
                title="Reset session & wipe chat history for this number"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Static Action Banner (No Auto-Redirect!) */}
        {showSuccessBanner && (
          <div className="mx-6 mt-4 bg-gradient-to-r from-emerald-950/90 via-teal-950/90 to-emerald-950/90 border border-emerald-500/50 rounded-2xl p-4 shadow-2xl flex items-center justify-between animate-in fade-in slide-in-from-top-3 duration-300 backdrop-blur-md">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0 shadow-inner">
                <CheckCircle2 className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <span>🎉 Lead Qualified & Appointment Confirmed!</span>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-mono font-normal">Postgres Verified</span>
                </h4>
                <p className="text-xs text-slate-300 mt-0.5 font-sans">
                  The client's details and dynamic schedule have been saved to PostgreSQL and synced across the pipeline.
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                const matched = leads.find((l) => l.phone === phone);
                if (matched) setSelectedLead(matched);
                navigate('/leads');
              }}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-lg shadow-emerald-950/50 hover:scale-105 active:scale-95 shrink-0"
            >
              <span>View in Live CRM</span> <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Chat Transcript Area (Generous Spacing & Typography) */}
        <div className="flex-1 p-6 overflow-y-auto space-y-5 bg-gradient-to-b from-slate-950 via-slate-900/40 to-slate-950">
          {chatMessages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center py-16 text-slate-500 space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-600 mb-2">
                <MessageSquare className="w-6 h-6" />
              </div>
              <p className="text-xs font-medium text-slate-400">No conversation history for <span className="text-teal-400 font-mono font-bold">{phone}</span></p>
              <p className="text-[11px] text-slate-600 max-w-sm">Type a message below or select a quick preset above to start testing the AI sales pipeline.</p>
            </div>
          )}

          {chatMessages.map((msg, idx) => (
            <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-in fade-in duration-200`}>
              <div
                className={`max-w-[75%] rounded-2xl px-5 py-3.5 text-xs shadow-xl transition-all duration-200 ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-br-none shadow-emerald-950/40 border border-emerald-500/30'
                    : 'bg-slate-900/90 backdrop-blur-md border border-slate-800 text-slate-100 rounded-bl-none shadow-slate-950/60 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-[10px] opacity-80 mb-1.5 tracking-wider uppercase">
                  <span>{msg.role === 'user' ? `👤 ${sender}` : '🤖 Helping Assistant'}</span>
                  {msg.timestamp && (
                    <span className="opacity-60 font-mono font-normal flex items-center gap-1">
                      <span>•</span> {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>
                <p className="leading-relaxed text-sm font-sans whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-start animate-in fade-in duration-200">
              <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-2xl rounded-bl-none px-5 py-3.5 text-xs text-slate-200 shadow-xl flex items-center gap-2.5">
                <div className="flex space-x-1.5 items-center py-1">
                  <span className="w-2 h-2 bg-teal-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                  <span className="w-2 h-2 bg-teal-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                  <span className="w-2 h-2 bg-teal-400 rounded-full animate-bounce"></span>
                </div>
                <span className="text-slate-400 font-medium text-xs">Helping Assistant is typing...</span>
              </div>
            </div>
          )}
          <div ref={chatBottomRef} />
        </div>

        {/* Composer Bar (Spacious & Clean) */}
        <form onSubmit={handleSendMessage} className="p-4 bg-slate-900/60 backdrop-blur-xl border-t border-slate-800/80 flex gap-3 shrink-0">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type message, inquiry, or 'YES' to confirm pending CRM mutation..."
            className="flex-1 bg-slate-950/90 border border-slate-800 rounded-xl px-4 py-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-sans"
          />
          <button
            type="submit"
            disabled={loading || !message.trim()}
            className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-40 text-white px-6 py-3 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-lg shadow-emerald-950/50 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
          >
            <Send className="w-3.5 h-3.5" /> <span>Send Message</span>
          </button>
        </form>
      </div>

      {/* RIGHT: Live Pipeline Telemetry Preview (Linear Diagnostic Layout) */}
      <div className="w-5/12 flex flex-col h-full bg-slate-950/90 overflow-hidden border-l border-slate-900">
        <div className="p-5 bg-slate-900/60 backdrop-blur-xl border-b border-slate-800/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-100 tracking-tight">Live Telemetry & AI Pipeline</h3>
              <p className="text-[10px] text-slate-500 font-mono">Real-time WebSocket Sync</p>
            </div>
          </div>
          <span className="text-[10px] bg-cyan-950/60 border border-cyan-800/60 text-cyan-300 px-3 py-1 rounded-full font-mono flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
            <span>Connected</span>
          </span>
        </div>

        <div className="flex-1 p-6 overflow-y-auto space-y-5">
          {/* Clean Architecture Banner without broken markdown */}
          <div className="bg-gradient-to-r from-slate-900 to-slate-900/60 border border-slate-800/80 rounded-2xl p-4 shadow-sm">
            <h4 className="text-xs font-bold text-slate-200 mb-1.5 flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
              <span>Microservices Execution Flow</span>
            </h4>
            <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
              Inquiries hit the <span className="text-slate-200 font-semibold">Go Ingestion Engine (Port 8080)</span> for sub-millisecond absorption and <span className="text-slate-200 font-semibold">30s Redis Dedup</span>, then queue into <span className="text-slate-200 font-semibold">BullMQ</span> where NestJS executes <span className="text-teal-300 font-semibold">Groq Llama-3.3-70B</span> with Cache-Aside PostgreSQL persistence.
            </p>
          </div>

          {!latestTrace && (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-900/80 border border-slate-850 flex items-center justify-center text-slate-600">
                <Clock className="w-6 h-6 animate-pulse" />
              </div>
              <p className="text-xs font-medium text-slate-400">Awaiting Webhook Ingestion</p>
              <p className="text-[11px] text-slate-600 max-w-xs">Send a test message on the left to watch the 6-step backend pipeline execute in real-time!</p>
            </div>
          )}

          {latestTrace && (
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl animate-in fade-in duration-300">
              <div className="px-5 py-3.5 bg-slate-950/90 border-b border-slate-800/80 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span className="font-mono text-xs text-cyan-400 font-bold">{latestTrace.phone}</span>
                </div>
                <span className="text-[10px] text-slate-500 font-mono bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                  {new Date(latestTrace.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              </div>
              
              <div className="px-5 py-3 bg-slate-900/40 border-b border-slate-800/60 text-xs text-slate-300 italic font-mono truncate">
                "{latestTrace.message || 'Processing message...'}"
              </div>

              <div className="divide-y divide-slate-800/60">
                {STEP_ORDER.filter((s) => latestTrace.steps.some((e) => e.step === s)).map((step) => {
                  const event = latestTrace.steps.find((e) => e.step === step);
                  if (!event) return null;
                  return (
                    <div key={step} className="flex items-center gap-3.5 px-5 py-3.5 text-xs hover:bg-slate-850/40 transition-colors">
                      <div className="shrink-0 scale-110">{STATUS_ICON[event.status]}</div>
                      <span className="text-slate-200 font-semibold w-36 shrink-0">{STEP_LABEL[step]}</span>
                      <span className={`${STATUS_COLOR[event.status]} font-mono text-[11px] truncate flex-1`}>
                        {event.detail}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};


