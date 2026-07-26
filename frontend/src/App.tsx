import React, { useState } from 'react';
import { MessageSquare, Users, Send, CheckCircle, AlertCircle } from 'lucide-react';

interface Lead {
  id: string;
  name: string;
  phone: string;
  status: string;
  notes: string;
  
}

export default function App() {
  const [phone, setPhone] = useState('+919876543210');
  const [message, setMessage] = useState('');
  const [sender, setSender] = useState('Rahul Sharma');
  const [logs, setLogs] = useState<string[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch current CRM state from NestJS Backend
  const fetchCRMState = async () => {
    try {
      const response = await fetch('http://localhost:3000/crm/leads');
      const data = await response.json();
      setLeads(data);
    } catch (err) {
      setLogs((prev) => [...prev, '❌ Error fetching CRM state from NestJS Engine']);
    }
  };

  // Trigger real-time data ingestion flow to Go-Gin Engine
  const handleIngestMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setLoading(true);
    const payload = { phone, message, sender };
    setLogs((prev) => [...prev, `[Client] Dispatching payload to Go Ingestion Layer...`]);

    try {
      const response = await fetch('http://localhost:8080/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      
      setLogs((prev) => [...prev, `[Go Engine]: ${data.status.toUpperCase()} - ${data.message}`]);
      setMessage('');

      // Polling step: Fetch the updated state after a short delay to allow background worker processing
      setTimeout(fetchCRMState, 1500);
    } catch (err) {
      setLogs((prev) => [...prev, '❌ Ingestion Failed: Go Engine Offline']);
    } finally {
      setLoading(false);
    }
  };

  // Run initial state loading sequence on mount
  React.useEffect(() => {
    fetchCRMState();
  }, []);

  return (
    <div className="flex h-screen bg-slate-900 text-slate-100 font-sans overflow-hidden">
      
      {/* LEFT PANEL: WhatsApp Simulation Webhook Web-Triggers */}
      <div className="w-1/3 bg-slate-800 border-r border-slate-700 flex flex-col h-full">
        <div className="p-4 bg-slate-950 border-b border-slate-700 flex items-center gap-3">
          <MessageSquare className="text-emerald-400 w-6 h-6" />
          <h2 className="font-bold text-lg text-emerald-400">WhatsApp Ingestion Gateway</h2>
        </div>

        <form onSubmit={handleIngestMessage} className="p-4 flex flex-col gap-4 border-b border-slate-700">
          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-1">SENDER FULL NAME</label>
            <input type="text" value={sender} onChange={(e) => setSender(e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500" />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-1">PHONE NUMBER STRING</label>
            <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500" />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-1">NATURAL LANGUAGE WHATSAPP MESSAGE</label>
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder='e.g., "bhai mera lead status check karo" or "Update Rahul status to hot prospect"' className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-sm text-slate-200 h-24 resize-none focus:outline-none focus:border-emerald-500" />
          </div>
          <button type="submit" disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 text-white py-2 rounded font-medium flex items-center justify-center gap-2 transition-all">
            <Send className="w-4 h-4" /> Ship via Go Pipeline
          </button>
        </form>

        <div className="flex-1 p-4 flex flex-col min-h-0">
          <span className="text-xs font-semibold text-slate-400 mb-2 block">INGESTION NETWORK PIPELINE TELEMETRY</span>
          <div className="bg-slate-950 font-mono text-xs p-3 rounded border border-slate-700 flex-1 overflow-y-auto space-y-1 text-slate-300">
            {logs.length === 0 && <span className="text-slate-600">// Standing by. Awaiting pipeline activity...</span>}
            {logs.map((log, index) => (
              <div key={index} className="border-b border-slate-900 pb-1 text-emerald-400">
                ⚡ {log}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT PANEL: Live B2B SaaS CRM Control Board */}
      <div className="flex-1 flex flex-col h-full bg-slate-900">
        <div className="p-4 bg-slate-950 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Users className="text-blue-400 w-6 h-6" />
            <h2 className="font-bold text-lg">AI Distributed CRM System Core</h2>
          </div>
          <button onClick={fetchCRMState} className="text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 px-3 py-1.5 rounded transition-all">
            Force Manual Sync Sync
          </button>
        </div>

        {/* Live CRM Data Matrix View */}
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="bg-slate-800 border border-slate-700 rounded overflow-hidden">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-950 border-b border-slate-700 text-slate-300 font-semibold text-xs tracking-wider">
                  <th className="p-4">LEAD IDENTITY</th>
                  <th className="p-4">PHONE LINK</th>
                  <th className="p-4">PIPELINE STAGE</th>
                  <th className="p-4">CONTEXT-EXTRACTION INTERNAL AGENT NOTES</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700 text-slate-300">
                {leads.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-slate-500 font-mono text-xs">
                      <AlertCircle className="w-5 h-5 mx-auto mb-2 text-slate-600" />
                      No leads detected in PostgreSQL database layer. Execute a seed command or trigger ingestion.
                    </td>
                  </tr>
                )}
                {leads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-slate-750 transition-all">
                    <td className="p-4 font-medium text-slate-100">{lead.name}</td>
                    <td className="p-4 font-mono text-xs text-blue-400">{lead.phone}</td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wide ${
                        lead.status === 'HOT_PROSPECT' ? 'bg-orange-950 text-orange-400 border border-orange-800' : 'bg-slate-900 text-slate-400 border border-slate-700'
                      }`}>
                        {lead.status}
                      </span>
                    </td>
                    <td className="p-4 text-slate-400 text-xs max-w-sm truncate">{lead.notes || 'No notes compiled yet.'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}