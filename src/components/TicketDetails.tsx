import React, { useState, useEffect } from 'react';
import { Ticket, SOP, TicketStatus, TicketPriority, UserRole } from '../types';
import { 
  Clock, User, MapPin, Sparkles, CheckSquare, FileText, Send, 
  AlertCircle, Wrench, CheckCircle, ArrowRight, ClipboardList, 
  Terminal, RefreshCw, Copy, CheckCircle2, UserCheck, Play 
} from 'lucide-react';

interface TicketDetailsProps {
  ticket: Ticket;
  sops: SOP[];
  onUpdateTicket: (ticketId: string, updates: any) => Promise<Ticket>;
  onTriggerAIDiagnosis: (ticketId: string) => Promise<{ suggestion: string; modelUsed: string }>;
  userRole: UserRole;
}

export default function TicketDetails({ ticket, sops, onUpdateTicket, onTriggerAIDiagnosis, userRole }: TicketDetailsProps) {
  const [activeTab, setActiveTab] = useState<'details' | 'sop' | 'ai'>('details');
  const [logMessage, setLogMessage] = useState<string>('');
  const [resolutionNotes, setResolutionNotes] = useState<string>(ticket.resolutionNotes || '');
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const [aiPlaybook, setAiPlaybook] = useState<string | null>(null);
  const [aiModelUsed, setAiModelUsed] = useState<string | null>(null);

  const isReadOnly = userRole === 'End User';
  const activeUserLabel = userRole === 'End User' 
    ? 'End User (Reporter)' 
    : userRole === 'Administrator' 
      ? 'Administrator' 
      : 'Technical Dispatcher';

  // Clear previous AI playbook when switching tickets
  useEffect(() => {
    setAiPlaybook(null);
    setAiModelUsed(null);
    setActiveTab('details');
    setResolutionNotes(ticket.resolutionNotes || '');
  }, [ticket.id]);

  // Priority styling helper
  const getPriorityBadge = (priority: TicketPriority) => {
    switch (priority) {
      case 'Critical':
        return <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 animate-pulse">Critical</span>;
      case 'High':
        return <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 font-medium">High</span>;
      case 'Medium':
        return <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-medium">Medium</span>;
      case 'Low':
        return <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">Low</span>;
    }
  };

  // Status badge helper
  const getStatusBadge = (status: TicketStatus) => {
    switch (status) {
      case 'Open':
        return <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-200">Open</span>;
      case 'In Progress':
        return <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">In Progress</span>;
      case 'SOP Applied':
        return <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">SOP Active</span>;
      case 'Resolved':
        return <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">Resolved</span>;
    }
  };

  // Handle Note Log Submission
  const handleAddLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!logMessage.trim()) return;
    setIsUpdating(true);
    try {
      await onUpdateTicket(ticket.id, {
        logMessage: logMessage.trim(),
        user: activeUserLabel, // Dynamic based on active session role
      });
      setLogMessage('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle SOP Linking
  const handleApplySop = async (sopId: string | null) => {
    if (isReadOnly) return; // Prevent unauthorized action
    setIsUpdating(true);
    try {
      await onUpdateTicket(ticket.id, {
        appliedSopId: sopId,
        completedSteps: sopId ? [] : [],
        status: sopId ? 'SOP Applied' : 'In Progress',
        user: activeUserLabel,
      });
      if (sopId) {
        setActiveTab('sop');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle SOP checklist ticking
  const handleToggleSopStep = async (step: string) => {
    if (isReadOnly) return; // Prevent unauthorized action
    const currentCompleted = ticket.completedSteps || [];
    let updatedCompleted: string[];
    if (currentCompleted.includes(step)) {
      updatedCompleted = currentCompleted.filter((s) => s !== step);
    } else {
      updatedCompleted = [...currentCompleted, step];
    }

    setIsUpdating(true);
    try {
      await onUpdateTicket(ticket.id, {
        completedSteps: updatedCompleted,
        user: activeUserLabel,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle Resolve ticket
  const handleResolveTicket = async () => {
    if (isReadOnly) return; // Prevent unauthorized action
    if (!resolutionNotes.trim()) return;
    setIsUpdating(true);
    try {
      await onUpdateTicket(ticket.id, {
        status: 'Resolved',
        resolutionNotes: resolutionNotes.trim(),
        user: activeUserLabel,
        logMessage: `TICKET RESOLVED: ${resolutionNotes.trim()}`
      });
      setActiveTab('details');
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle change status directly
  const handleStatusChange = async (newStatus: TicketStatus) => {
    if (isReadOnly) return; // Prevent unauthorized action
    setIsUpdating(true);
    try {
      await onUpdateTicket(ticket.id, {
        status: newStatus,
        user: activeUserLabel,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle change assignee directly
  const handleAssigneeChange = async (assignee: string) => {
    if (isReadOnly) return; // Prevent unauthorized action
    setIsUpdating(true);
    try {
      await onUpdateTicket(ticket.id, {
        assignedTo: assignee,
        user: activeUserLabel,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle Gemini AI query
  const handleConsultAI = async () => {
    setAiLoading(true);
    setAiPlaybook(null);
    try {
      const res = await onTriggerAIDiagnosis(ticket.id);
      setAiPlaybook(res.suggestion);
      setAiModelUsed(res.modelUsed);
      setActiveTab('ai');
    } catch (err) {
      console.error(err);
      setAiPlaybook('ERROR: Failed to establish secure connection to AI routing service. Verify local config.');
    } finally {
      setAiLoading(false);
    }
  };

  // Copy AI playbook to manual log
  const handleCopyPlaybookToLogs = async () => {
    if (!aiPlaybook) return;
    setIsUpdating(true);
    try {
      const shortLog = `[Gemini Diagnostic Playbook Applied] Recommending standard actions: ${
        ticket.category
      } procedure initialized. Playbook content logged in technician dispatch panel.`;
      await onUpdateTicket(ticket.id, {
        logMessage: shortLog,
        user: 'AI-Dispatcher Agent',
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdating(false);
    }
  };

  // Custom parser to format raw Markdown nicely
  const renderMarkdown = (text: string) => {
    return text.split('\n').map((line, idx) => {
      const trimmed = line.trim();
      if (trimmed.startsWith('### ')) {
        return <h4 key={idx} className="text-xs font-bold text-slate-300 uppercase tracking-wider mt-4 mb-2 border-b border-slate-800 pb-1">{trimmed.replace('### ', '')}</h4>;
      }
      if (trimmed.startsWith('## ')) {
        return <h3 key={idx} className="text-sm font-bold text-blue-400 mt-5 mb-2 border-b border-slate-800 pb-1.5">{trimmed.replace('## ', '')}</h3>;
      }
      if (trimmed.startsWith('# ')) {
        return <h2 key={idx} className="text-base font-extrabold text-white mt-6 mb-3 pb-2">{trimmed.replace('# ', '')}</h2>;
      }
      if (trimmed.startsWith('- **') || trimmed.startsWith('* **')) {
        const matches = trimmed.match(/^[-*]\s+\*\*(.*?)\*\*:(.*)/);
        if (matches) {
          return (
            <div key={idx} className="ml-4 my-2 text-xs text-slate-300 leading-relaxed">
              <span className="text-blue-400 font-semibold">• {matches[1]}:</span>{matches[2]}
            </div>
          );
        }
      }
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        return <div key={idx} className="ml-4 my-1.5 text-xs text-slate-300 flex items-start gap-1.5"><span>•</span><span>{trimmed.substring(2)}</span></div>;
      }
      if (trimmed === '') {
        return <div key={idx} className="h-2"></div>;
      }
      return <p key={idx} className="text-xs text-slate-300 leading-relaxed my-1.5 font-sans">{line}</p>;
    });
  };

  const currentSop = sops.find((s) => s.id === ticket.appliedSopId);
  const relevantSops = sops.filter((s) => s.category === ticket.category);

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex flex-col h-full" id="urc-ticket-details-panel">
      {/* Header Info */}
      <div className="border-b border-slate-100 pb-4 mb-4">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono bg-slate-50 border border-slate-200 text-slate-500 px-2.5 py-0.5 rounded font-bold">
              {ticket.id}
            </span>
            <span className="text-xs text-slate-500 font-mono flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400" /> {ticket.station}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {getPriorityBadge(ticket.priority)}
            {getStatusBadge(ticket.status)}
          </div>
        </div>
        <h1 className="text-lg font-bold text-slate-800">{ticket.title}</h1>
        <div className="text-[10px] text-slate-500 font-mono mt-1.5">
          Incident Domain: <span className="text-slate-600 font-semibold">{ticket.category}</span>
        </div>
      </div>

      {/* Technician Controls (Status & Assignment Quick Updates) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-lg mb-5 text-xs">
        <div className="flex items-center justify-between sm:justify-start gap-4">
          <span className="text-slate-500 font-mono">Status Control:</span>
          <select
            value={ticket.status}
            onChange={(e) => handleStatusChange(e.target.value as TicketStatus)}
            disabled={isUpdating || isReadOnly}
            className={`bg-white border border-slate-200 rounded px-2 py-1 text-xs text-slate-700 focus:outline-none focus:border-blue-500 focus:bg-white ${
              isReadOnly ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'
            }`}
          >
            <option value="Open">Open</option>
            <option value="In Progress">In Progress</option>
            <option value="SOP Applied">SOP Active</option>
            <option value="Resolved">Resolved</option>
          </select>
        </div>
        <div className="flex items-center justify-between sm:justify-start gap-4 border-t sm:border-t-0 sm:border-l border-slate-200 pt-2 sm:pt-0 sm:pl-4">
          <span className="text-slate-500 font-mono">Assigned Tech:</span>
          <select
            value={ticket.assignedTo}
            onChange={(e) => handleAssigneeChange(e.target.value)}
            disabled={isUpdating || isReadOnly}
            className={`bg-white border border-slate-200 rounded px-2 py-1 text-xs text-slate-700 focus:outline-none focus:border-blue-500 focus:bg-white ${
              isReadOnly ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'
            }`}
          >
            <option value="Unassigned">Unassigned (Queue)</option>
            <option value="Nalule Patricia (Lead Signaling Eng.)">Nalule Patricia (Signaling)</option>
            <option value="Katushabe Davis (Systems Eng.)">Katushabe Davis (Systems)</option>
            <option value="Kigozi Ronald (Senior Fiber Tech)">Kigozi Ronald (Fiber)</option>
            <option value="Technical Dispatcher">Self (Technical Dispatcher)</option>
          </select>
        </div>
        {isReadOnly && (
          <div className="sm:col-span-2 text-[10px] text-amber-700 font-mono flex items-center gap-1 bg-amber-50/50 border border-amber-200 p-2 rounded mt-1">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>View-Only Access: Account role "End User" has restricted incident management clearance.</span>
          </div>
        )}
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-slate-100 mb-4 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('details')}
          className={`px-4 py-2 border-b-2 cursor-pointer transition-colors ${
            activeTab === 'details'
              ? 'border-blue-600 text-slate-800'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          Incident Narrative
        </button>
        <button
          onClick={() => setActiveTab('sop')}
          className={`px-4 py-2 border-b-2 cursor-pointer transition-colors flex items-center gap-1.5 ${
            activeTab === 'sop'
              ? 'border-blue-600 text-slate-800'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <ClipboardList className="w-3.5 h-3.5" />
          SOP Checklist {ticket.appliedSopId ? `(Active)` : ''}
        </button>
        <button
          onClick={() => setActiveTab('ai')}
          className={`px-4 py-2 border-b-2 cursor-pointer transition-colors flex items-center gap-1.5 ${
            activeTab === 'ai'
              ? 'border-blue-600 text-slate-800'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          AI Playbook Suggestion
        </button>
      </div>

      {/* Tabs Content */}
      <div className="flex-1 overflow-y-auto min-h-[250px] pr-1">
        {/* TAB 1: DETAILS & ACTIVITY FEED */}
        {activeTab === 'details' && (
          <div className="space-y-5">
            {/* Incident Description */}
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold mb-1.5">Symptom Statement</div>
              <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-4 border border-slate-200 rounded-lg">
                {ticket.description}
              </p>
              <div className="flex justify-between items-center text-[10px] text-slate-400 mt-2">
                <span>Reporter: <strong className="text-slate-600">{ticket.reporter}</strong></span>
                <span>Logged: {new Date(ticket.createdAt).toLocaleString()}</span>
              </div>
            </div>

            {/* Resolution Form if resolved, or resolve button */}
            {ticket.status === 'Resolved' ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                <div className="flex items-center gap-1.5 text-xs text-emerald-800 font-bold mb-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Official Resolution play
                </div>
                <p className="text-xs text-emerald-700 leading-relaxed italic">
                  "{ticket.resolutionNotes || 'Incident flagged complete with default SOP restoration sequence.'}"
                </p>
                <div className="text-[9px] text-slate-400 mt-2 font-mono text-right">
                  Timestamp: {new Date(ticket.updatedAt).toLocaleString()}
                </div>
              </div>
            ) : isReadOnly ? (
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-xs">
                <div className="flex items-center gap-1.5 font-bold text-slate-700 mb-1.5 font-mono text-[10px] uppercase tracking-wider">
                  <AlertCircle className="w-4 h-4 text-slate-500" /> Resolution Action Locked
                </div>
                <p className="text-slate-600 leading-relaxed leading-relaxed">
                  Only IT Staff and Administrators are authorized to execute standard URC restoration checklists and officially close out system tickets. If you have progress updates, please append them to the Communications Log below.
                </p>
              </div>
            ) : (
              <div className="border border-slate-200 rounded-lg p-4 bg-slate-50/50">
                <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold mb-2">Close Incident Out (Resolution play)</div>
                <div className="space-y-3">
                  <textarea
                    rows={2}
                    placeholder="Enter permanent fix documentation... (e.g., Spliced fiber loop east Jinja bridge, ran continuity ping, dispatch handshake confirmed)."
                    value={resolutionNotes}
                    onChange={(e) => setResolutionNotes(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg p-3 text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white"
                  />
                  <div className="flex justify-end">
                    <button
                      onClick={handleResolveTicket}
                      disabled={!resolutionNotes.trim() || isUpdating}
                      className={`inline-flex items-center gap-1 px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer ${
                        resolutionNotes.trim()
                          ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg'
                          : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      <CheckCircle className="w-4 h-4" /> Resolve Ticket
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Logs Timeline */}
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold mb-3">System Audit & Communications Log</div>
              <div className="relative border-l border-slate-200 ml-2.5 pl-4 space-y-4 text-xs">
                {ticket.logs.map((log) => (
                  <div key={log.id} className="relative">
                    {/* Pulsing timeline bullet */}
                    <span className="absolute -left-[21.5px] top-1.5 h-2.5 w-2.5 rounded-full bg-slate-100 border-2 border-slate-300"></span>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                      <span>{log.user} • <span className="text-blue-600 font-bold">{log.action}</span></span>
                      <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed bg-slate-50/50 p-2 border border-slate-100 rounded">
                      {log.message}
                    </p>
                  </div>
                ))}
              </div>

              {/* Add Log Form */}
              {ticket.status !== 'Resolved' && (
                <form onSubmit={handleAddLog} className="mt-4 flex gap-2">
                  <input
                    type="text"
                    placeholder="Add manual progress update note..."
                    value={logMessage}
                    onChange={(e) => setLogMessage(e.target.value)}
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white"
                  />
                  <button
                    type="submit"
                    disabled={!logMessage.trim() || isUpdating}
                    className="bg-blue-600 hover:bg-blue-500 text-white rounded-lg px-4 py-2 text-xs font-semibold flex items-center gap-1 cursor-pointer shrink-0"
                  >
                    <Send className="w-3.5 h-3.5" /> Log Note
                  </button>
                </form>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: SOP CHECKLIST */}
        {activeTab === 'sop' && (
          <div className="space-y-4">
            {ticket.appliedSopId ? (
              <div className="space-y-4">
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-mono text-amber-800 font-bold uppercase tracking-wider">Active Standard response checklist</span>
                    <h3 className="text-sm font-bold text-slate-800">{currentSop?.title}</h3>
                    <p className="text-xs text-slate-600 mt-1">{currentSop?.description}</p>
                  </div>
                  {!isReadOnly && (
                    <button
                      onClick={() => handleApplySop(null)}
                      className="text-xs text-rose-600 hover:text-rose-700 underline font-mono shrink-0 cursor-pointer font-bold"
                    >
                      Unlink Playbook
                    </button>
                  )}
                </div>

                {/* Progress Indicators */}
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-xs font-mono">
                  <div className="flex justify-between text-[11px] mb-1.5">
                    <span className="text-slate-500">Task Restoration Progress</span>
                    <span className="text-emerald-600 font-bold">
                      {ticket.completedSteps?.length || 0} of {currentSop?.steps.length || 0} steps
                    </span>
                  </div>
                  {/* Progress bar */}
                  <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden border border-slate-300">
                    <div 
                      className="bg-emerald-500 h-full transition-all duration-300"
                      style={{ 
                        width: `${((ticket.completedSteps?.length || 0) / (currentSop?.steps?.length || 1)) * 100}%` 
                    }}
                    ></div>
                  </div>
                </div>

                {/* Checklist steps */}
                <div className="space-y-2">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold px-1">Execute Procedural Steps</div>
                  {currentSop?.steps.map((step, idx) => {
                    const isCompleted = ticket.completedSteps?.includes(step);
                    return (
                      <div 
                        key={idx}
                        onClick={() => !isReadOnly && handleToggleSopStep(step)}
                        className={`flex items-start gap-3 border rounded-lg p-3 transition-all ${
                          isReadOnly ? 'cursor-not-allowed opacity-90' : 'cursor-pointer'
                        } ${
                          isCompleted 
                            ? 'bg-emerald-50 border-emerald-200 text-slate-700 shadow-sm'
                            : 'bg-white border-slate-200 hover:border-slate-300 text-slate-600'
                        }`}
                      >
                        <div className="mt-0.5 shrink-0">
                          {isCompleted ? (
                            <CheckCircle className="w-4 h-4 text-emerald-500" />
                          ) : (
                            <div className={`w-4 h-4 rounded border bg-slate-50 ${isReadOnly ? 'border-slate-200' : 'border-slate-300 hover:border-blue-400'}`}></div>
                          )}
                        </div>
                        <div className="text-xs leading-relaxed font-sans">
                          <span className={`font-mono text-[10px] font-bold mr-1.5 ${isCompleted ? 'text-emerald-600' : 'text-slate-400'}`}>
                            STEP {idx + 1}:
                          </span>
                          <span className={isCompleted ? 'line-through text-slate-400' : ''}>{step}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Safety Precautions Warning */}
                {currentSop && currentSop.precautions.length > 0 && (
                  <div className="bg-rose-50 border border-rose-200 rounded-lg p-3">
                    <div className="text-[10px] font-mono uppercase tracking-wider text-rose-700 font-bold flex items-center gap-1 mb-1.5">
                      <AlertCircle className="w-4 h-4" /> Critical safety advisory
                    </div>
                    <ul className="list-disc list-inside space-y-1 text-xs text-rose-600 leading-relaxed font-sans">
                      {currentSop.precautions.map((p, idx) => <li key={idx}>{p}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-center py-6 bg-slate-50 border border-slate-200 rounded-lg px-4">
                  <ClipboardList className="w-8 h-8 text-slate-400 mx-auto mb-3" />
                  <h4 className="text-sm font-semibold text-slate-700">No SOP Linked to Ticket</h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
                    Uganda Railway procedures mandate associating a Standard Operating Procedure checklist to guarantee safety loop verification.
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold px-1">Available SOPs for this incident category</div>
                  {relevantSops.length === 0 ? (
                    <div className="text-xs text-slate-400 italic p-2">
                      No direct SOP matches for this category. You may link any corporate SOP manual below.
                    </div>
                  ) : (
                    relevantSops.map((sop) => (
                      <div 
                        key={sop.id}
                        className="bg-slate-50 border border-slate-200 rounded-lg p-3 flex justify-between items-center gap-4 hover:border-slate-300 transition-colors"
                      >
                        <div>
                          <div className="font-mono text-[9px] text-blue-600 font-bold">{sop.code}</div>
                          <div className="text-xs font-semibold text-slate-800">{sop.title}</div>
                          <div className="text-[10px] text-slate-500 mt-0.5 font-sans leading-relaxed line-clamp-1">{sop.description}</div>
                        </div>
                        {!isReadOnly ? (
                          <button
                            onClick={() => handleApplySop(sop.id)}
                            className="bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 hover:text-blue-800 px-3 py-1.5 rounded text-xs font-bold shrink-0 cursor-pointer transition-colors"
                          >
                            Link Playbook
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-mono italic">Staff Only</span>
                        )}
                      </div>
                    ))
                  )}

                  {/* Option to link any other SOP */}
                  <div className="mt-4">
                    <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold px-1 mb-2">Cross-Category SOP playbooks</div>
                    <div className="grid grid-cols-1 gap-2 max-h-[160px] overflow-y-auto pr-1">
                      {sops
                        .filter((s) => s.category !== ticket.category)
                        .map((sop) => (
                          <div key={sop.id} className="bg-slate-50/40 border border-slate-200 rounded p-2.5 flex justify-between items-center text-xs">
                            <div>
                              <span className="font-mono text-[9px] text-slate-400 mr-2">{sop.code}</span>
                              <span className="text-slate-600 text-xs font-medium">{sop.title}</span>
                            </div>
                            {!isReadOnly ? (
                              <button
                                onClick={() => handleApplySop(sop.id)}
                                className="text-xs text-blue-600 hover:text-blue-700 font-bold shrink-0 cursor-pointer"
                              >
                                Link SOP
                              </button>
                            ) : (
                              <span className="text-[10px] text-slate-400 font-mono">Restricted</span>
                            )}
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: GEMINI AI DIAGNOSTICS */}
        {activeTab === 'ai' && (
          <div className="space-y-4">
            {aiLoading ? (
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-12 text-center flex flex-col items-center justify-center space-y-4">
                <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
                <div>
                  <h4 className="text-xs font-mono text-blue-600 font-bold uppercase tracking-wider">Consulting Gemini AI Operator</h4>
                  <p className="text-[11px] text-slate-500 mt-1 max-w-sm font-sans leading-relaxed">
                    Analyzing railway telemetry, matching with URC standard response playbooks, and drafting custom mitigation sequence steps...
                  </p>
                </div>
              </div>
            ) : aiPlaybook ? (
              <div className="space-y-4">
                {/* AI Header Card */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-amber-500 shrink-0 animate-pulse" />
                    <div>
                      <div className="text-[10px] font-mono text-blue-600 font-bold uppercase">Incident Diagnostics Agent</div>
                      <div className="text-xs text-slate-600 font-medium">Playbook suggestion compiled by <span className="font-mono">{aiModelUsed}</span></div>
                    </div>
                  </div>
                  {!isReadOnly && (
                    <button
                      onClick={handleCopyPlaybookToLogs}
                      className="inline-flex items-center gap-1.5 bg-white border border-slate-200 text-slate-700 hover:text-slate-900 px-3.5 py-1.5 rounded text-[11px] font-bold cursor-pointer transition-colors shadow-sm"
                    >
                      <Copy className="w-3.5 h-3.5 text-blue-600" /> Log AI Reference Note
                    </button>
                  )}
                </div>

                {/* AI Markdown response container */}
                <div className="bg-slate-950 border border-slate-850 rounded-lg p-5 font-mono text-xs select-text shadow-inner">
                  <div className="space-y-1">
                    {renderMarkdown(aiPlaybook)}
                  </div>
                </div>

                <div className="text-[10px] text-slate-500 leading-relaxed font-sans bg-slate-50 p-3 rounded-md border border-slate-200 flex items-start gap-1.5">
                  <AlertCircle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <span>
                    Gemini AI playbook recommendations are assistive diagnostic advice. Technicians must cross-reference physical track gauges and electrical currents prior to relay actuation.
                  </span>
                </div>
              </div>
            ) : isReadOnly ? (
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-8 text-center max-w-lg mx-auto">
                <Sparkles className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                <h4 className="text-sm font-semibold text-slate-600">AI Diagnostics Restricted</h4>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  Real-time diagnostic evaluations, telemetry parsing, and automated response recommendations are restricted to technical responders and Administrators.
                </p>
              </div>
            ) : (
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-8 text-center max-w-lg mx-auto">
                <Sparkles className="w-8 h-8 text-amber-500 mx-auto mb-3 animate-pulse" />
                <h4 className="text-sm font-semibold text-slate-700">AI-Powered Helpdesk Diagnostic play</h4>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                  Generate a highly customized troubleshooting guide matching the exact symptoms of this incident ticket. The model cross-references Uganda Railway Corporation IT specifications, location constraints, and historical system configurations.
                </p>
                <button
                  onClick={handleConsultAI}
                  className="mt-5 inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold px-5 py-2.5 rounded-lg text-xs shadow-md cursor-pointer transition-all"
                >
                  <Sparkles className="w-4 h-4 text-amber-200 fill-amber-200" /> Consult AI Assistant
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
