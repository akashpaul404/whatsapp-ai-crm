import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { CRMProvider } from './context/CRMContext';
import { Navbar } from './components/layout/Navbar';
import { SimulatorPage } from './pages/SimulatorPage';
import { LeadsPage } from './pages/LeadsPage';
import { KnowledgeBasePage } from './pages/KnowledgeBasePage';
import { TelemetryPage } from './pages/TelemetryPage';
import HowItWorks from './pages/HowItWorks';

export default function App() {
  return (
    <CRMProvider>
      <Router>
        <div className="flex h-screen bg-slate-900 text-slate-100 font-sans overflow-hidden flex-col">
          <Navbar />
          <Routes>
            <Route path="/" element={<SimulatorPage />} />
            <Route path="/leads" element={<LeadsPage />} />
            <Route path="/knowledge-base" element={<KnowledgeBasePage />} />
            <Route path="/telemetry" element={<TelemetryPage />} />
            <Route path="/how-it-works" element={<HowItWorks />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </CRMProvider>
  );
}