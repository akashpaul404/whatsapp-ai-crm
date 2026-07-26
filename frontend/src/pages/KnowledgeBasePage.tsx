import React from 'react';
import { BookOpen, Upload, Cpu, ShieldCheck, Database, Zap } from 'lucide-react';
import { useCRM } from '../context/CRMContext';

export const KnowledgeBasePage: React.FC = () => {
  const { knowledgeBase, setKnowledgeBase, handleSaveKnowledgeBase, handleFileUpload, savingKb } = useCRM();

  return (
    <div className="flex flex-1 h-full overflow-y-auto bg-slate-900 p-8">
      <div className="max-w-4xl mx-auto w-full space-y-6">
        {/* Header */}
        <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-6 shadow-xl backdrop-blur-md">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 shadow-md shadow-blue-950/50">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="font-extrabold text-lg text-slate-100">
                  AI Company Knowledge Base & Rules Engine
                </h2>
                <p className="text-xs text-slate-400">
                  Manage clinic services, pricing, slot timings, and FAQ rules for the Groq Llama-3.3-70B Helping Assistant.
                </p>
              </div>
            </div>

            <label className="bg-slate-850 hover:bg-slate-800 border border-slate-750 text-slate-200 px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer flex items-center gap-2 transition-all shadow-sm">
              <Upload className="w-3.5 h-3.5 text-cyan-400" /> Upload File (.txt, .md)
              <input type="file" accept=".txt,.md" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>

          <div className="bg-blue-950/30 border border-blue-800/40 rounded-xl p-4 flex items-start gap-3 text-xs text-blue-200 leading-relaxed">
            <ShieldCheck className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-cyan-300 block mb-0.5">Cache-Aside Persistence Strategy:</strong>
              When you click Save, the new memory is written directly to **Neon PostgreSQL** (the permanent source of truth). The system then automatically invalidates the **Upstash Redis** cache (`crm:knowledge_base`), guaranteeing zero dual-write race conditions and instant sub-millisecond retrieval on the next customer inquiry!
            </div>
          </div>
        </div>

        {/* Editor Card */}
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-4 flex flex-col min-h-[500px]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-2 uppercase tracking-wider">
              <Database className="w-4 h-4 text-emerald-400" /> Active System Context Prompt
            </span>
            <span className="text-[11px] font-mono text-slate-500">
              {knowledgeBase.length} characters
            </span>
          </div>

          <textarea
            value={knowledgeBase}
            onChange={(e) => setKnowledgeBase(e.target.value)}
            placeholder="Paste your company services, pricing, doctor availability, clinic timings, FAQs, and custom qualification instructions here..."
            className="flex-1 w-full bg-slate-900/90 border border-slate-750 rounded-xl p-4 font-mono text-xs text-slate-100 leading-relaxed resize-none focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all shadow-inner"
          />

          <button
            onClick={handleSaveKnowledgeBase}
            disabled={savingKb}
            className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 disabled:opacity-40 text-white py-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2.5 transition-all shadow-lg shadow-blue-950/50 cursor-pointer"
          >
            <Cpu className="w-4 h-4 animate-spin-slow" />
            {savingKb ? 'Committing to Neon Postgres & Invalidating Redis...' : 'Save Knowledge Base → Commit Postgres & Invalidate Cache'}
          </button>
        </div>
      </div>
    </div>
  );
};
