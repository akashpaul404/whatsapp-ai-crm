import React, { useState } from 'react';
import { Users, RotateCcw, AlertCircle, History, LayoutGrid, Table as TableIcon, Phone, ExternalLink } from 'lucide-react';
import { useCRM } from '../context/CRMContext';
import { STAGE_COLORS } from '../constants';
import { LeadDrawer } from '../components/leads/LeadDrawer';
import { Lead } from '../types';

const STAGES = ['NEW', 'QUALIFIED', 'HOT_PROSPECT', 'CONTACTED', 'CLOSED_WON', 'CLOSED_LOST'];

export const LeadsPage: React.FC = () => {
  const { leads, auditLogs, fetchCRMState, handleRevertState, selectedLead, setSelectedLead } = useCRM();
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');

  const getLeadsByStage = (stage: string) => leads.filter((l) => l.status === stage);

  return (
    <div className="flex flex-1 h-full overflow-hidden bg-slate-900 relative">
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-y-auto">
        {/* Header Bar */}
        <div className="p-5 bg-slate-950/90 border-b border-slate-800/80 flex items-center justify-between shrink-0 sticky top-0 z-20 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 shadow-md shadow-blue-950/50">
              <Users className="text-white w-5 h-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-base text-slate-100">
                Live CRM Leads Dashboard — PostgreSQL + Redis Cache
              </h2>
              <p className="text-xs text-slate-400">
                Click any lead card or row to view read-only conversation transcript and audit trail.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* View Mode Switcher */}
            <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setViewMode('kanban')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  viewMode === 'kanban' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" /> Kanban
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  viewMode === 'table' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <TableIcon className="w-3.5 h-3.5" /> Table
              </button>
            </div>

            <button
              onClick={fetchCRMState}
              className="text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700/80 hover:border-slate-500 text-slate-200 px-3.5 py-2 rounded-xl font-semibold transition-all shadow-sm"
            >
              Refresh State
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="p-6 space-y-8 max-w-[1600px] mx-auto w-full">
          {/* VIEW 1: Kanban Board */}
          {viewMode === 'kanban' && (
            <div className="grid grid-cols-6 gap-4 items-start">
              {STAGES.map((stage) => {
                const stageLeads = getLeadsByStage(stage);
                return (
                  <div key={stage} className="bg-slate-950/60 border border-slate-800/80 rounded-2xl flex flex-col min-h-[420px] max-h-[600px] overflow-hidden shadow-md">
                    {/* Column Header */}
                    <div className="p-3.5 bg-slate-950 border-b border-slate-800/80 flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-200 tracking-wider uppercase">{stage}</span>
                      <span className="text-[10px] bg-slate-850 text-slate-400 font-mono px-2 py-0.5 rounded-full border border-slate-750">
                        {stageLeads.length}
                      </span>
                    </div>

                    {/* Cards Container */}
                    <div className="p-3 space-y-2.5 overflow-y-auto flex-1">
                      {stageLeads.length === 0 ? (
                        <div className="text-center py-8 text-slate-600 text-[11px] font-mono italic">Empty</div>
                      ) : (
                        stageLeads.map((lead) => (
                          <div
                            key={lead.id}
                            onClick={() => setSelectedLead(lead)}
                            className="p-3.5 bg-slate-900/90 hover:bg-slate-800/90 rounded-xl border border-slate-800 hover:border-slate-600 transition-all cursor-pointer shadow-sm group relative"
                          >
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="font-bold text-xs text-slate-100 group-hover:text-emerald-400 transition-colors">
                                {lead.name}
                              </span>
                              <ExternalLink className="w-3 h-3 text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                            <div className="text-[11px] text-teal-400 font-mono flex items-center gap-1 mb-2">
                              <Phone className="w-3 h-3" /> {lead.phone}
                            </div>
                            <p className="text-[11px] text-slate-400 line-clamp-2 bg-slate-950/50 p-2 rounded-lg border border-slate-850 font-sans">
                              {lead.notes || 'No requirement notes recorded.'}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* VIEW 2: Table Matrix */}
          {viewMode === 'table' && (
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl overflow-hidden shadow-lg">
              <div className="p-4 bg-slate-950 border-b border-slate-800/80 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300">TABULAR PIPELINE VIEW — Postgres Source of Truth</span>
                <span className="text-xs bg-emerald-950/60 text-emerald-400 border border-emerald-800/60 px-2.5 py-0.5 rounded-full font-mono">
                  Total Leads: {leads.length}
                </span>
              </div>
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-950/90 border-b border-slate-800 text-slate-400 font-semibold tracking-wider">
                    <th className="p-4">CLIENT NAME</th>
                    <th className="p-4">PHONE NUMBER</th>
                    <th className="p-4">STAGE / STATUS</th>
                    <th className="p-4">REQUIREMENT / NOTES</th>
                    <th className="p-4 text-right">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 text-slate-300">
                  {leads.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-500 font-mono text-xs">
                        <AlertCircle className="w-5 h-5 mx-auto mb-2 text-slate-600" />
                        No leads found in PostgreSQL database. Send a message in the Simulator!
                      </td>
                    </tr>
                  )}
                  {leads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-slate-850/60 transition-colors">
                      <td className="p-4 font-bold text-slate-100">{lead.name}</td>
                      <td className="p-4 font-mono text-teal-400">{lead.phone}</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wide border ${STAGE_COLORS[lead.status] ?? STAGE_COLORS.NEW}`}>
                          {lead.status}
                        </span>
                      </td>
                      <td className="p-4 text-slate-400 max-w-md truncate">{lead.notes || '—'}</td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => setSelectedLead(lead)}
                          className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-700 transition-all inline-flex items-center gap-1"
                        >
                          View Transcript
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Audit Trail Section */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl overflow-hidden shadow-lg">
            <div className="p-4 bg-slate-950 border-b border-slate-800/80 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-2">
                <History className="w-4 h-4 text-purple-400" /> SYSTEM AUDIT TRAIL + INSTANT STATE REVERT ENGINE
              </span>
              <span className="text-[11px] text-slate-500 font-mono">Real-time Redis Audit Stream</span>
            </div>
            <div className="divide-y divide-slate-800/80 max-h-72 overflow-y-auto text-xs">
              {auditLogs.length === 0 && (
                <div className="p-6 text-center text-slate-500 font-mono text-xs italic">No mutation logs recorded yet.</div>
              )}
              {auditLogs.map((log) => (
                <div key={log.id} className="p-4 flex items-center justify-between hover:bg-slate-850/40 transition-colors">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold font-mono text-slate-200">{log.phone}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-950/60 text-purple-300 border border-purple-800/60">
                        {log.intent}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                    </div>
                    <div className="text-[12px] text-slate-400 font-mono flex items-center gap-2">
                      <span className="px-1.5 py-0.5 rounded bg-slate-900 text-red-400">{log.previousStatus}</span>
                      <span className="text-slate-600">→</span>
                      <span className="px-1.5 py-0.5 rounded bg-slate-900 text-emerald-400 font-bold">{log.newStatus}</span>
                      {log.rawMessage && (
                        <span className="text-slate-500 font-sans italic ml-2">"{log.rawMessage.slice(0, 80)}"</span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleRevertState(log.id)}
                    className="bg-slate-900 hover:bg-red-950/80 hover:text-red-300 text-slate-300 border border-slate-750 hover:border-red-800 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Revert State
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Slide-out Read-Only Drawer */}
      <LeadDrawer lead={selectedLead} onClose={() => setSelectedLead(null)} auditLogs={auditLogs} />
    </div>
  );
};
