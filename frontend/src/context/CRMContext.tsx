import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { Lead, ActionLog, ChatMessage, TraceGroup, TraceEvent } from '../types';

interface CRMContextType {
  phone: string;
  setPhone: (phone: string) => void;
  phoneDraft: string;
  setPhoneDraft: (draft: string) => void;
  sender: string;
  setSender: (sender: string) => void;
  message: string;
  setMessage: (msg: string) => void;
  chatMessages: ChatMessage[];
  knowledgeBase: string;
  setKnowledgeBase: React.Dispatch<React.SetStateAction<string>>;
  traceGroups: TraceGroup[];
  leads: Lead[];
  auditLogs: ActionLog[];
  loading: boolean;
  savingKb: boolean;
  selectedLead: Lead | null;
  setSelectedLead: (lead: Lead | null) => void;
  fetchCRMState: () => Promise<void>;
  fetchKnowledgeBase: () => Promise<void>;
  fetchChatHistory: (phoneNum: string) => Promise<void>;
  handleSendMessage: (e: React.FormEvent) => Promise<void>;
  handleSaveKnowledgeBase: () => Promise<void>;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleRevertState: (actionId: string) => Promise<void>;
  commitPhoneDraft: () => void;
  clearSessionHistory: (phoneNum?: string) => Promise<void>;
}

const CRMContext = createContext<CRMContextType | undefined>(undefined);

export const CRMProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [phone, setPhoneState] = useState('+919876543299');
  const [phoneDraft, setPhoneDraft] = useState('+919876543299');
  const [sender, setSender] = useState('Dinu Sharma');
  const [message, setMessage] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [knowledgeBase, setKnowledgeBase] = useState('');
  const [traceGroups, setTraceGroups] = useState<TraceGroup[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [auditLogs, setAuditLogs] = useState<ActionLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingKb, setSavingKb] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  const socketRef = useRef<Socket | null>(null);

  const setPhone = (newPhone: string) => {
    setPhoneState(newPhone);
    setPhoneDraft(newPhone);
    fetchChatHistory(newPhone);
  };

  const commitPhoneDraft = () => {
    if (phoneDraft !== phone && phoneDraft.length >= 5) {
      setPhoneState(phoneDraft);
      fetchChatHistory(phoneDraft);
    }
  };

  useEffect(() => {
    const socket = io('http://localhost:3000', { transports: ['websocket'] });
    socketRef.current = socket;

    socket.on('telemetry_trace', (event: TraceEvent) => {
      setTraceGroups((prev) => {
        const existing = prev.find((g) => g.msgId === event.msgId);
        if (existing) {
          return prev.map((g) =>
            g.msgId === event.msgId
              ? { ...g, steps: [...g.steps.filter((s) => s.step !== event.step), event] }
              : g,
          );
        }
        return [
          { msgId: event.msgId, phone: event.phone, message: '', steps: [event], startedAt: event.timestamp },
          ...prev,
        ].slice(0, 20);
      });
    });

    socket.on('lead_updated', () => {
      fetchCRMState();
    });

    socket.on('chat_updated', (data: { phone?: string; timestamp?: string }) => {
      if (data && data.phone) {
        fetchChatHistory(data.phone);
      } else {
        fetchChatHistory(phone);
      }
      setLoading(false);
    });

    return () => {
      socket.disconnect();
    };
  }, [phone]);

  useEffect(() => {
    fetchCRMState();
    fetchKnowledgeBase();
    fetchChatHistory(phone);
  }, []);

  const fetchCRMState = async () => {
    try {
      const [rLeads, rLogs] = await Promise.all([
        fetch('http://localhost:3000/crm/leads'),
        fetch('http://localhost:3000/crm/audit-logs'),
      ]);
      if (rLeads.ok) {
        const leadsData = await rLeads.json();
        setLeads(leadsData);
        if (selectedLead) {
          const updatedSelected = leadsData.find((l: Lead) => l.id === selectedLead.id || l.phone === selectedLead.phone);
          if (updatedSelected) setSelectedLead(updatedSelected);
        }
      }
      if (rLogs.ok) setAuditLogs(await rLogs.json());
    } catch (_) {}
  };

  const fetchKnowledgeBase = async () => {
    try {
      const res = await fetch('http://localhost:3000/crm/knowledge-base');
      if (res.ok) {
        const data = await res.json();
        setKnowledgeBase(data.content ?? '');
      }
    } catch (_) {}
  };

  const fetchChatHistory = async (phoneNum: string) => {
    if (!phoneNum || phoneNum.length < 5) return;
    try {
      const res = await fetch(`http://localhost:3000/crm/chat-history/${encodeURIComponent(phoneNum)}`);
      if (res.ok) {
        const history = await res.json();
        if (history && history.length > 0) {
          const sorted = [...history].sort((a: ChatMessage, b: ChatMessage) => {
            const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
            const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
            const diff = timeA - timeB;
            if (Math.abs(diff) < 2000 && a.role !== b.role) {
              return a.role === 'user' ? -1 : 1;
            }
            return diff;
          });
          setChatMessages(sorted);
        } else {
          setChatMessages([{ role: 'assistant', content: `Hello! How can I assist you today?`, timestamp: new Date().toISOString() }]);
        }
      }
    } catch (_) {}
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    const currentMsg = message;
    setMessage('');
    setLoading(true);

    const userMsg: ChatMessage = { role: 'user', content: currentMsg, timestamp: new Date().toISOString() };
    setChatMessages((prev) => [...prev, userMsg]);

    const localMsgId = `local-${Date.now()}`;
    setTraceGroups((prev) => [
      {
        msgId: localMsgId,
        phone,
        message: currentMsg,
        steps: [{ msgId: localMsgId, phone, step: 'DEDUP_CHECK', status: 'pending', detail: 'Sending to Go ingestion layer...', timestamp: new Date().toISOString() }],
        startedAt: new Date().toISOString(),
      },
      ...prev,
    ].slice(0, 20));

    try {
      const resp = await fetch('http://localhost:8080/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, message: currentMsg, sender }),
      });
      const data = await resp.json();

      const isDuplicate = data.status === 'duplicate';

      setTraceGroups((prev) =>
        prev.map((g) =>
          g.msgId === localMsgId
            ? {
                ...g,
                message: currentMsg,
                steps: [
                  { msgId: localMsgId, phone, step: 'DEDUP_CHECK', status: isDuplicate ? 'fail' : 'ok', detail: isDuplicate ? 'Duplicate — already queued within 30s' : 'New message — dedup passed', timestamp: new Date().toISOString() },
                ],
              }
            : g,
        ),
      );

      if (!isDuplicate) {
        setTimeout(async () => {
          await fetchCRMState();
          await fetchChatHistory(phone);
          setLoading(false);
        }, 1500);
      } else {
        setChatMessages((prev) => [...prev, { role: 'assistant', content: '⚠️ Duplicate message detected. Already queued within the last 30 seconds.', timestamp: new Date().toISOString() }]);
        setLoading(false);
      }
    } catch (_) {
      setChatMessages((prev) => [...prev, { role: 'assistant', content: '❌ Go ingestion engine appears to be offline. Please check port 8080.', timestamp: new Date().toISOString() }]);
      setLoading(false);
    }
  };

  const handleSaveKnowledgeBase = async () => {
    setSavingKb(true);
    try {
      await fetch('http://localhost:3000/crm/knowledge-base', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: knowledgeBase }),
      });
    } catch (_) {} finally {
      setSavingKb(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setKnowledgeBase((prev) => `${prev}\n\n--- ${file.name} ---\n${ev.target?.result as string}`);
    };
    reader.readAsText(file);
  };

  const handleRevertState = async (actionId: string) => {
    try {
      const res = await fetch('http://localhost:3000/crm/revert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actionId }),
      });
      if (res.ok) fetchCRMState();
    } catch (_) {}
  };

  const clearSessionHistory = async (targetPhone?: string) => {
    const phoneToClear = targetPhone || phone;
    try {
      await fetch('http://localhost:3000/crm/clear-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phoneToClear }),
      });
      setChatMessages([{ role: 'assistant', content: `Hello! How can I assist you today?`, timestamp: new Date().toISOString() }]);
      setTraceGroups([]);
      await fetchCRMState();
    } catch (_) {}
  };

  return (
    <CRMContext.Provider
      value={{
        phone,
        setPhone,
        phoneDraft,
        setPhoneDraft,
        sender,
        setSender,
        message,
        setMessage,
        chatMessages,
        knowledgeBase,
        setKnowledgeBase,
        traceGroups,
        leads,
        auditLogs,
        loading,
        savingKb,
        selectedLead,
        setSelectedLead,
        fetchCRMState,
        fetchKnowledgeBase,
        fetchChatHistory,
        handleSendMessage,
        handleSaveKnowledgeBase,
        handleFileUpload,
        handleRevertState,
        commitPhoneDraft,
        clearSessionHistory,
      }}
    >
      {children}
    </CRMContext.Provider>
  );
};

export const useCRM = () => {
  const context = useContext(CRMContext);
  if (!context) {
    throw new Error('useCRM must be used within a CRMProvider');
  }
  return context;
};
