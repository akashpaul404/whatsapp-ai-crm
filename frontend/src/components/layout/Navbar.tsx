import React from 'react';
import { NavLink } from 'react-router-dom';
import { MessageSquare, Users, BookOpen, Activity, Info, ShieldCheck } from 'lucide-react';

export const Navbar: React.FC = () => {
  return (
    <div className="flex items-center justify-between px-6 py-3 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 shrink-0 shadow-lg z-50">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-gradient-to-tr from-emerald-600 to-teal-500 shadow-md shadow-emerald-900/40">
            <MessageSquare className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="font-extrabold text-base bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
              WhatsApp AI CRM
            </span>
            <span className="block text-[10px] text-slate-500 font-mono tracking-tight -mt-0.5">
              Go · BullMQ · Groq · Postgres · Redis
            </span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800/60 ml-4">
          <NavLink
            to="/"
            className={({ isActive }) =>
              `flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-950/50'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`
            }
          >
            <MessageSquare className="w-3.5 h-3.5" /> Simulator
          </NavLink>

          <NavLink
            to="/leads"
            className={({ isActive }) =>
              `flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-950/50'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`
            }
          >
            <Users className="w-3.5 h-3.5" /> Leads CRM
          </NavLink>

          <NavLink
            to="/knowledge-base"
            className={({ isActive }) =>
              `flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-950/50'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`
            }
          >
            <BookOpen className="w-3.5 h-3.5" /> Knowledge Base
          </NavLink>

          <NavLink
            to="/telemetry"
            className={({ isActive }) =>
              `flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-950/50'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`
            }
          >
            <Activity className="w-3.5 h-3.5" /> Live Telemetry
          </NavLink>
        </nav>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/50 border border-emerald-800/60 text-emerald-400 text-[11px] font-medium">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Cache-Aside Active</span>
        </div>

        <NavLink
          to="/how-it-works"
          className={({ isActive }) =>
            `text-xs text-slate-300 hover:text-white border border-slate-700/80 hover:border-slate-500 bg-slate-900/60 hover:bg-slate-800 px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 shadow-sm ${
              isActive ? 'border-emerald-500 text-emerald-300' : ''
            }`
          }
        >
          <Info className="w-3.5 h-3.5 text-emerald-400" /> How It Works
        </NavLink>
      </div>
    </div>
  );
};
