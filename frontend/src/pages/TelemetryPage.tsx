import React from 'react';
import { Activity, ShieldAlert, Cpu, Terminal, CheckCircle, Clock, XCircle, Zap, RefreshCw } from 'lucide-react';
import { useCRM } from '../context/CRMContext';
import { STEP_ORDER, STEP_LABEL, STATUS_ICON, STATUS_COLOR } from '../constants';

export const TelemetryPage: React.FC = () => {
  const { traceGroups } = useCRM();

  return (
    <div className="flex flex-1 h-full overflow-y-auto bg-slate-900 p-8">
      <div className="max-w-5xl mx-auto w-full space-y-6">
        {/* Header */}
        <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-6 shadow-xl backdrop-blur-md flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-500 shadow-md shadow-purple-950/50">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="font-extrabold text-lg text-slate-100">
                Live Microservices Telemetry & Trace Stream
              </h2>
              <p className="text-xs text-slate-400">
                Real-time WebSocket event broadcast from NestJS Core Engine & Go Webhook Gateway.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-950/40 border border-purple-800/60 rounded-full text-xs text-purple-300 font-mono">
            <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping"></span>
            <span>Socket.IO Connected</span>
          </div>
        </div>

        {/* Trace List */}
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Terminal className="w-4 h-4 text-cyan-400" /> Recent Ingestion Pipelines ({traceGroups.length})
            </span>
            <span className="text-[11px] text-slate-500 font-mono">Auto-scroll disabled</span>
          </div>

          {traceGroups.length === 0 && (
            <div className="text-center py-16 text-slate-500 text-xs font-mono">
              No telemetry events recorded in this session yet. Send a message in the Simulator to trigger a pipeline trace!
            </div>
          )}

          <div className="space-y-4">
            {traceGroups.map((group) => (
              <div key={group.msgId} className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-md">
                <div className="px-4 py-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-bold text-cyan-400 bg-cyan-950/50 px-2 py-0.5 rounded border border-cyan-800/60">
                      {group.phone}
                    </span>
                    <span className="text-xs text-slate-200 font-medium truncate max-w-lg">
                      "{group.message || 'Incoming payload...'}"
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">
                    Started: {new Date(group.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', fractionalSecondDigits: 2 })}
                  </span>
                </div>

                <div className="divide-y divide-slate-800/70">
                  {STEP_ORDER.filter((s) => group.steps.some((e) => e.step === s)).map((step) => {
                    const event = group.steps.find((e) => e.step === step);
                    if (!event) return null;
                    return (
                      <div key={step} className="flex items-center gap-4 px-5 py-3 text-xs hover:bg-slate-850/40 transition-colors">
                        <div className="shrink-0">{STATUS_ICON[event.status]}</div>
                        <span className="text-slate-200 font-bold w-44 shrink-0">{STEP_LABEL[step]}</span>
                        <span className={`${STATUS_COLOR[event.status]} font-mono text-xs truncate flex-1`}>
                          {event.detail}
                        </span>
                        <span className="text-[10px] text-slate-600 font-mono shrink-0">
                          {new Date(event.timestamp).toLocaleTimeString([], { second: '2-digit', fractionalSecondDigits: 3 })}s
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
