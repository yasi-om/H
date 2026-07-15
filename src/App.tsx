import React, { useState, useEffect } from 'react';
import { Ticket, SOP, ITAsset, StationSystemStatus, StationName, TicketCategory, TicketPriority, UserRole } from './types';
import NetworkMap from './components/NetworkMap';
import AssetStatus from './components/AssetStatus';
import SOPReference from './components/SOPReference';
import TicketDetails from './components/TicketDetails';
import KnowledgeBase from './components/KnowledgeBase';
import { 
  Train, Radio, ShieldAlert, Clock, ClipboardList, Activity, 
  PlusCircle, AlertCircle, Wrench, CheckCircle, Database, Server,
  Sliders, User, RefreshCw, Layers, MapPin, X, Flame, Search, Trash2, Shield
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'tickets' | 'assets' | 'sops' | 'kb' | 'admin'>('dashboard');
  const [userRole, setUserRole] = useState<UserRole>('IT Staff');
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [sops, setSops] = useState<SOP[]>([]);
  const [assets, setAssets] = useState<ITAsset[]>([]);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [selectedStation, setSelectedStation] = useState<StationName | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [showCreateForm, setShowCreateForm] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Sorting and Filtering states for Tickets Queue
  const [filterPriority, setFilterPriority] = useState<TicketPriority | 'All'>('All');
  const [filterStatus, setFilterStatus] = useState<Ticket['status'] | 'All'>('All');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'priority-desc' | 'priority-asc'>('newest');
  const [ticketSearchQuery, setTicketSearchQuery] = useState<string>('');

  // New ticket form state
  const [newTicket, setNewTicket] = useState({
    title: '',
    station: 'Kampala Headquarters' as StationName,
    category: 'General Office IT' as TicketCategory,
    priority: 'Medium' as TicketPriority,
    description: '',
    reporter: 'Dispatcher Office',
  });

  // Fetch initial data from Express backend
  const fetchData = async () => {
    try {
      setLoading(true);
      const [ticketsRes, sopsRes, assetsRes] = await Promise.all([
        fetch('/api/tickets'),
        fetch('/api/sops'),
        fetch('/api/assets'),
      ]);

      if (!ticketsRes.ok || !sopsRes.ok || !assetsRes.ok) {
        throw new Error('Failed to load in-memory helpdesk databases.');
      }

      const ticketsData = await ticketsRes.json();
      const sopsData = await sopsRes.json();
      const assetsData = await assetsRes.json();

      setTickets(ticketsData);
      setSops(sopsData);
      setAssets(assetsData);

      // Default select first ticket
      if (ticketsData.length > 0 && !selectedTicketId) {
        setSelectedTicketId(ticketsData[0].id);
      }
      setError(null);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Server connectivity issue.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Auto-redirect if role restricts the current active tab
  useEffect(() => {
    if (userRole === 'End User') {
      if (activeTab === 'assets' || activeTab === 'sops' || activeTab === 'admin') {
        setActiveTab('dashboard');
      }
    } else if (userRole === 'IT Staff') {
      if (activeTab === 'admin') {
        setActiveTab('dashboard');
      }
    }
  }, [userRole, activeTab]);

  // Admin incident simulation
  const handleSimulateIncident = async (type: 'malaba-outage' | 'kampala-pos-crash') => {
    try {
      const res = await fetch('/api/admin/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      });
      if (!res.ok) throw new Error('Simulation endpoint failed.');
      const data = await res.json();
      setTickets(data.tickets);
      setAssets(data.assets);
      if (data.tickets.length > 0) {
        setSelectedTicketId(data.tickets[0].id);
      }
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Simulation execution failed.');
    }
  };

  // Admin database reset
  const handleResetDatabase = async () => {
    try {
      const res = await fetch('/api/admin/reset', { method: 'POST' });
      if (!res.ok) throw new Error('Database reset failed.');
      const data = await res.json();
      setTickets(data.tickets);
      setAssets(data.assets);
      if (data.tickets.length > 0) {
        setSelectedTicketId(data.tickets[0].id);
      }
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Database reset failed.');
    }
  };

  // Update single ticket via backend API
  const handleUpdateTicket = async (ticketId: string, updates: any) => {
    try {
      const res = await fetch(`/api/tickets/${ticketId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error('Failed to update ticket.');
      const updatedTicket: Ticket = await res.json();
      
      setTickets(prev => prev.map(t => t.id === ticketId ? updatedTicket : t));
      return updatedTicket;
    } catch (err: any) {
      alert(err.message);
      throw err;
    }
  };

  // Create new ticket via backend API
  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTicket.title || !newTicket.description || !newTicket.reporter) {
      alert('Please fill out all mandatory incident fields.');
      return;
    }

    try {
      const res = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTicket),
      });

      if (!res.ok) throw new Error('Failed to create ticket.');
      const newlyCreated: Ticket = await res.json();

      setTickets(prev => [newlyCreated, ...prev]);
      setSelectedTicketId(newlyCreated.id);
      setShowCreateForm(false);
      setNewTicket({
        title: '',
        station: 'Kampala Headquarters',
        category: 'General Office IT',
        priority: 'Medium',
        description: '',
        reporter: 'Dispatcher Office',
      });
      // Automatically navigate to tickets tab
      setActiveTab('tickets');
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Ping an asset via backend API
  const handlePingAsset = async (assetId: string) => {
    const res = await fetch(`/api/assets/${assetId}/ping`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to ping asset.');
    const data = await res.json();
    
    // Update local state with new asset status
    setAssets(prev => prev.map(a => a.id === assetId ? data.asset : a));
    return data;
  };

  // Trigger Gemini AI diagnostics
  const handleTriggerAIDiagnosis = async (ticketId: string) => {
    const res = await fetch(`/api/tickets/${ticketId}/ai-diagnose`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('AI Diagnostics failed.');
    return await res.json();
  };

  // Dynamic Station status calculations based on active tickets
  const initialStations: StationSystemStatus[] = [
    { name: 'Kampala Headquarters' as StationName, code: 'KLA', coordinates: { x: 25, y: 70 }, status: 'Healthy', activeTicketsCount: 0 },
    { name: 'Port Bell Pier' as StationName, code: 'PBL', coordinates: { x: 22, y: 82 }, status: 'Healthy', activeTicketsCount: 0 },
    { name: 'Jinja Terminal' as StationName, code: 'JJA', coordinates: { x: 45, y: 65 }, status: 'Healthy', activeTicketsCount: 0 },
    { name: 'Tororo Station' as StationName, code: 'TTO', coordinates: { x: 72, y: 60 }, status: 'Healthy', activeTicketsCount: 0 },
    { name: 'Malaba Border Post' as StationName, code: 'MBA', coordinates: { x: 88, y: 55 }, status: 'Healthy', activeTicketsCount: 0 },
    { name: 'Gulu Depot' as StationName, code: 'GLU', coordinates: { x: 40, y: 20 }, status: 'Healthy', activeTicketsCount: 0 },
  ];

  const computedStations: StationSystemStatus[] = initialStations.map(st => {
    const activeForStation = tickets.filter(t => t.station === st.name && t.status !== 'Resolved');
    st.activeTicketsCount = activeForStation.length;
    
    if (activeForStation.length === 0) {
      st.status = 'Healthy';
    } else {
      const hasCritical = activeForStation.some(t => t.priority === 'Critical');
      st.status = hasCritical ? 'Disrupted' : 'Warning';
    }
    return st;
  });

  // KPI calculations
  const activeTicketsCount = tickets.filter(t => t.status !== 'Resolved').length;
  const criticalTicketsCount = tickets.filter(t => t.priority === 'Critical' && t.status !== 'Resolved').length;
  const activeSopTicketsCount = tickets.filter(t => t.status === 'SOP Applied').length;
  const resolvedTodayCount = tickets.filter(t => t.status === 'Resolved').length;

  const currentSelectedTicket = tickets.find(t => t.id === selectedTicketId);

  // Priority weights for prioritization sort
  const priorityWeights: Record<TicketPriority, number> = {
    'Critical': 4,
    'High': 3,
    'Medium': 2,
    'Low': 1,
  };

  // Comprehensive sorting, filtering, and search logic for tickets
  const filteredTickets = tickets
    .filter(t => {
      // 1. Station Filter
      const matchesStation = selectedStation ? t.station === selectedStation : true;
      // 2. Priority Filter
      const matchesPriority = filterPriority === 'All' ? true : t.priority === filterPriority;
      // 3. Status Filter
      const matchesStatus = filterStatus === 'All' ? true : t.status === filterStatus;
      // 4. Search Filter (by title, description, id, or reporter)
      const query = ticketSearchQuery.trim().toLowerCase();
      const matchesSearch = query === '' 
        ? true 
        : t.title.toLowerCase().includes(query) || 
          t.description.toLowerCase().includes(query) || 
          t.id.toLowerCase().includes(query) ||
          t.reporter.toLowerCase().includes(query);
      
      return matchesStation && matchesPriority && matchesStatus && matchesSearch;
    })
    .sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      } else if (sortBy === 'oldest') {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      } else if (sortBy === 'priority-desc') {
        const diff = (priorityWeights[b.priority] || 0) - (priorityWeights[a.priority] || 0);
        if (diff !== 0) return diff;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(); // fallback to newest
      } else if (sortBy === 'priority-asc') {
        const diff = (priorityWeights[a.priority] || 0) - (priorityWeights[b.priority] || 0);
        if (diff !== 0) return diff;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(); // fallback to newest
      }
      return 0;
    });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans select-none antialiased">
      {/* Top Professional Header */}
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-4 sticky top-0 z-50 shadow-md text-white">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          
          {/* Logo & Slogan */}
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-blue-600 to-blue-800 p-2.5 rounded-lg shadow-lg shadow-blue-950/40 border border-blue-400/30">
              <Train className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-mono tracking-widest text-blue-500 font-extrabold">URC</span>
                <span className="text-xs text-slate-400 border-l border-slate-700 pl-2 font-medium">UGANDA RAILWAY CORPORATION</span>
              </div>
              <h1 className="text-lg font-bold text-slate-100 tracking-tight flex items-center gap-1.5 mt-0.5">
                IT Operations Helpdesk
                <span className="text-[10px] uppercase bg-slate-800 border border-slate-700 text-slate-300 px-1.5 py-0.5 rounded tracking-wide font-semibold">Internal Network</span>
              </h1>
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                onClick={() => { setActiveTab('dashboard'); setSelectedStation(null); }}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                  activeTab === 'dashboard'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/10'
                    : 'bg-slate-800 border border-slate-700/80 text-slate-300 hover:text-white'
                }`}
              >
                <Layers className="w-4 h-4" /> Operational Dashboard
              </button>
              <button
                onClick={() => setActiveTab('tickets')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                  activeTab === 'tickets'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/10'
                    : 'bg-slate-800 border border-slate-700/80 text-slate-300 hover:text-white'
                }`}
              >
                <ClipboardList className="w-4 h-4" /> Incident Tickets
                {activeTicketsCount > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 text-[10px] rounded-full bg-slate-950 text-blue-400 font-bold border border-slate-800">
                    {activeTicketsCount}
                  </span>
                )}
              </button>

              {userRole !== 'End User' && (
                <button
                  onClick={() => setActiveTab('assets')}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                    activeTab === 'assets'
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/10'
                      : 'bg-slate-800 border border-slate-700/80 text-slate-300 hover:text-white'
                  }`}
                >
                  <Activity className="w-4 h-4" /> Asset Monitoring
                </button>
              )}

              {userRole !== 'End User' && (
                <button
                  onClick={() => setActiveTab('sops')}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                    activeTab === 'sops'
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/10'
                      : 'bg-slate-800 border border-slate-700/80 text-slate-300 hover:text-white'
                  }`}
                >
                  <Sliders className="w-4 h-4" /> Standard Playbooks
                </button>
              )}

              <button
                onClick={() => setActiveTab('kb')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                  activeTab === 'kb'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/10'
                    : 'bg-slate-800 border border-slate-700/80 text-slate-300 hover:text-white'
                }`}
              >
                <Database className="w-4 h-4" /> Knowledge Base
              </button>

              {userRole === 'Administrator' && (
                <button
                  onClick={() => setActiveTab('admin')}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                    activeTab === 'admin'
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/10'
                      : 'bg-slate-800 border border-slate-700/80 text-slate-300 hover:text-white'
                  }`}
                >
                  <Shield className="w-4 h-4 text-red-400" /> Admin Console
                </button>
              )}
            </div>

            {/* Active Session Role Switcher */}
            <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-300 shadow-inner">
              <User className="w-4 h-4 text-blue-400" />
              <span className="font-semibold font-mono text-[10px] uppercase text-slate-400">Session Role:</span>
              <select
                value={userRole}
                onChange={(e) => setUserRole(e.target.value as UserRole)}
                className="bg-transparent text-white font-bold text-xs focus:outline-none cursor-pointer pr-1"
              >
                <option value="End User" className="bg-slate-900 text-slate-200">End User</option>
                <option value="IT Staff" className="bg-slate-900 text-slate-200">IT Staff</option>
                <option value="Administrator" className="bg-slate-900 text-slate-200">Administrator</option>
              </select>
            </div>
          </div>
        </div>
      </header>

      {/* KPI Metrics Ribbon Banner */}
      <section className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
          
          {/* KPI 1 */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between gap-3 shadow-sm">
            <div className="space-y-0.5">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold">Active Incidents</span>
              <div className="text-2xl font-bold text-slate-900">{activeTicketsCount}</div>
            </div>
            <div className="bg-blue-50 p-2.5 rounded-lg border border-blue-100 text-blue-600 shrink-0">
              <ClipboardList className="w-5 h-5" />
            </div>
          </div>

          {/* KPI 2 */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between gap-3 shadow-sm">
            <div className="space-y-0.5">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold">Critical Blockades</span>
              <div className="text-2xl font-bold text-red-600">{criticalTicketsCount}</div>
            </div>
            <div className="bg-red-50 p-2.5 rounded-lg border border-red-100 text-red-600 shrink-0">
              <ShieldAlert className="w-5 h-5 animate-pulse" />
            </div>
          </div>

          {/* KPI 3 */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between gap-3 shadow-sm">
            <div className="space-y-0.5">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold">SOP Sequences Active</span>
              <div className="text-2xl font-bold text-amber-600">{activeSopTicketsCount}</div>
            </div>
            <div className="bg-amber-50 p-2.5 rounded-lg border border-amber-100 text-amber-600 shrink-0">
              <Wrench className="w-5 h-5" />
            </div>
          </div>

          {/* KPI 4 */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between gap-3 shadow-sm">
            <div className="space-y-0.5">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold">System Diagnostics</span>
              <div className="text-xs text-emerald-600 font-mono flex items-center gap-1 font-semibold mt-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span> Operational
              </div>
            </div>
            <div className="bg-emerald-50 p-2.5 rounded-lg border border-emerald-100 text-emerald-600 shrink-0">
              <Activity className="w-5 h-5" />
            </div>
          </div>

        </div>
      </section>

      {/* Main Body Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6">
        
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
            <RefreshCw className="w-10 h-10 text-blue-600 animate-spin" />
            <p className="text-xs text-slate-500 font-mono">Initializing Uganda Railway IT databases...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-100 p-6 rounded-xl text-center space-y-3 max-w-md mx-auto my-12 shadow-sm">
            <AlertCircle className="w-10 h-10 text-red-500 mx-auto" />
            <h3 className="text-base font-bold text-slate-900">Database Connection Interruption</h3>
            <p className="text-xs text-slate-600 leading-relaxed">{error}</p>
            <button 
              onClick={fetchData}
              className="bg-red-600 text-white text-xs px-4 py-2 rounded-lg font-semibold hover:bg-red-500 cursor-pointer shadow-sm"
            >
              Re-establish Link
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            
            {/* VIEW 1: OPERATIONS DASHBOARD */}
            {activeTab === 'dashboard' && (
              <div className="space-y-6">
                
                {/* Network Map Segment */}
                <NetworkMap
                  stations={computedStations}
                  selectedStation={selectedStation}
                  onSelectStation={(st) => {
                    setSelectedStation(st);
                    if (st) {
                      // Navigate to tickets filtered by selected station
                      setActiveTab('tickets');
                    }
                  }}
                />

                {/* Grid Layout: Active Incidents Watch + Station Summary List */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Station summary grid table */}
                  <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                    <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100">
                      <h3 className="text-sm font-bold text-slate-700">Siding Operations</h3>
                      <span className="text-[10px] font-mono text-slate-400">6 Monitored Terminals</span>
                    </div>
                    <div className="space-y-2">
                      {computedStations.map((st) => (
                        <div 
                          key={st.name}
                          onClick={() => {
                            setSelectedStation(st.name);
                            setActiveTab('tickets');
                          }}
                          className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50/50 border border-slate-100 hover:border-slate-200 hover:bg-slate-100 transition-all cursor-pointer"
                        >
                          <div className="flex items-center gap-2">
                            <span className={`w-2.5 h-2.5 rounded-full ${
                              st.status === 'Healthy' ? 'bg-emerald-500' :
                              st.status === 'Warning' ? 'bg-amber-500 animate-pulse' : 'bg-rose-500 animate-ping'
                            }`}></span>
                            <div>
                              <div className="text-xs font-semibold text-slate-800">{st.name}</div>
                              <div className="text-[9px] text-slate-400 font-mono">Code: {st.code}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-[11px] font-mono font-bold text-slate-700">
                              {st.activeTicketsCount}
                            </span>
                            <span className="text-[9px] text-slate-400">tkt</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Active Incidents quick view */}
                  <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100">
                        <h3 className="text-sm font-bold text-slate-700">Emergency Dispatch Queue</h3>
                        <button
                          onClick={() => setActiveTab('tickets')}
                          className="text-xs text-blue-600 hover:text-blue-500 font-bold flex items-center gap-1 cursor-pointer"
                        >
                          Full Helpdesk <X className="w-3.5 h-3.5 rotate-45" />
                        </button>
                      </div>
                      <div className="space-y-3">
                        {tickets.filter(t => t.status !== 'Resolved').slice(0, 3).map((t) => (
                          <div
                            key={t.id}
                            onClick={() => {
                              setSelectedTicketId(t.id);
                              setActiveTab('tickets');
                            }}
                            className="bg-slate-50/50 hover:bg-slate-50 border border-slate-100 hover:border-slate-200 rounded-lg p-3 transition-colors cursor-pointer flex items-start justify-between gap-4"
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-mono text-blue-600 font-bold">{t.id}</span>
                                <span className="text-[10px] text-slate-400 flex items-center gap-0.5"><MapPin className="w-3 h-3 text-slate-400" /> {t.station}</span>
                              </div>
                              <h4 className="text-xs font-semibold text-slate-800 line-clamp-1">{t.title}</h4>
                            </div>
                            <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded shrink-0 ${
                              t.priority === 'Critical' ? 'bg-red-100 text-red-600 border border-red-200' :
                              t.priority === 'High' ? 'bg-orange-100 text-orange-600 border border-orange-200' : 'bg-slate-100 text-slate-600 border border-slate-200'
                            }`}>
                              {t.priority}
                            </span>
                          </div>
                        ))}
                        {tickets.filter(t => t.status !== 'Resolved').length === 0 && (
                          <div className="text-center py-12 text-xs text-slate-400">
                            Zero blockages logged. All Uganda Railway signaling corridors are running green.
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <span className="text-xs text-slate-400 font-mono">
                        Lead Operators: nalule.p@urc.go.ug, kigozi.r@urc.go.ug
                      </span>
                      <button
                        onClick={() => { setShowCreateForm(true); setActiveTab('tickets'); }}
                        className="inline-flex items-center gap-1 text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100 hover:bg-blue-100 px-3.5 py-2 rounded-lg cursor-pointer transition-all"
                      >
                        <PlusCircle className="w-4 h-4 text-emerald-600" /> Log New Incident
                      </button>
                    </div>
                  </div>

                </div>

              </div>
            )}

            {/* VIEW 2: INCIDENT TICKETS */}
            {activeTab === 'tickets' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* Tickets list panel */}
                <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4 flex flex-col max-h-[750px]">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-100 shrink-0">
                    <div>
                      <h3 className="text-sm font-bold text-slate-700">Helpdesk Queue</h3>
                      {selectedStation && (
                        <div className="text-[10px] text-blue-600 flex items-center gap-1 font-mono mt-0.5 animate-pulse">
                          Filtering station: {selectedStation} 
                          <button onClick={() => setSelectedStation(null)} className="hover:text-red-500 font-bold text-xs pl-1">×</button>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => setShowCreateForm(!showCreateForm)}
                      className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-500 transition-colors cursor-pointer bg-slate-50 px-2.5 py-1.5 border border-slate-200 rounded-lg"
                    >
                      {showCreateForm ? <X className="w-3.5 h-3.5 text-red-500" /> : <PlusCircle className="w-3.5 h-3.5 text-emerald-500" />}
                      {showCreateForm ? 'Cancel Form' : 'Log Incident'}
                    </button>
                  </div>

                  {/* Advanced Filters and Prioritization Controls */}
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-3 shrink-0 text-xs font-mono">
                    {/* Search Field */}
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search tickets (ID, title, reporter...)"
                        value={ticketSearchQuery}
                        onChange={(e) => setTicketSearchQuery(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:border-blue-500 font-sans"
                      />
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                      {ticketSearchQuery && (
                        <button 
                          onClick={() => setTicketSearchQuery('')} 
                          className="absolute right-2.5 top-2.5 text-slate-450 hover:text-red-500 text-xs font-bold"
                        >
                          ×
                        </button>
                      )}
                    </div>

                    {/* Filter Grid */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <span className="text-[9px] uppercase font-bold text-slate-400 block">Priority</span>
                        <select
                          value={filterPriority}
                          onChange={(e) => setFilterPriority(e.target.value as any)}
                          className="w-full bg-white border border-slate-200 rounded-md p-1 py-1 text-[11px] font-sans focus:outline-none focus:border-blue-500"
                        >
                          <option value="All">All Priorities</option>
                          <option value="Critical">Critical Only</option>
                          <option value="High">High Only</option>
                          <option value="Medium">Medium Only</option>
                          <option value="Low">Low Only</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[9px] uppercase font-bold text-slate-400 block">Status</span>
                        <select
                          value={filterStatus}
                          onChange={(e) => setFilterStatus(e.target.value as any)}
                          className="w-full bg-white border border-slate-200 rounded-md p-1 py-1 text-[11px] font-sans focus:outline-none focus:border-blue-500"
                        >
                          <option value="All">All Statuses</option>
                          <option value="Open">Open</option>
                          <option value="In Progress">In Progress</option>
                          <option value="SOP Applied">SOP Applied</option>
                          <option value="Resolved">Resolved</option>
                        </select>
                      </div>
                    </div>

                    {/* Sorting Dropdown */}
                    <div className="space-y-1">
                      <span className="text-[9px] uppercase font-bold text-slate-400 block">Sort Queue By</span>
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as any)}
                        className="w-full bg-white border border-slate-200 rounded-md p-1 py-1 text-[11px] font-sans font-semibold text-slate-700 focus:outline-none focus:border-blue-500"
                      >
                        <option value="newest">Newest First</option>
                        <option value="oldest">Oldest First</option>
                        <option value="priority-desc">Priority (Highest First)</option>
                        <option value="priority-asc">Priority (Lowest First)</option>
                      </select>
                    </div>
                  </div>

                  {/* Create Ticket Form Inline Drawer */}
                  {showCreateForm && (
                    <form onSubmit={handleCreateTicket} className="bg-slate-50 p-4 border border-blue-100 rounded-lg space-y-3 text-xs shrink-0 max-h-[460px] overflow-y-auto">
                      <div className="text-[10px] font-mono text-blue-600 uppercase tracking-wider font-bold mb-2">Create Incident Record</div>
                      
                      <div className="space-y-1">
                        <label className="text-slate-500 font-mono font-semibold">Incident Title *</label>
                        <input
                          type="text"
                          placeholder="Short summary (e.g. Signal failure Block 4)"
                          required
                          value={newTicket.title}
                          onChange={(e) => setNewTicket(prev => ({ ...prev, title: e.target.value }))}
                          className="w-full bg-white border border-slate-200 rounded p-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="text-slate-500 font-mono font-semibold">Station / Siding *</label>
                          <select
                            value={newTicket.station}
                            onChange={(e) => setNewTicket(prev => ({ ...prev, station: e.target.value as StationName }))}
                            className="w-full bg-white border border-slate-200 rounded p-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                          >
                            <option value="Kampala Headquarters">Kampala Headquarters</option>
                            <option value="Malaba Border Post">Malaba Border Post</option>
                            <option value="Tororo Station">Tororo Station</option>
                            <option value="Jinja Terminal">Jinja Terminal</option>
                            <option value="Gulu Depot">Gulu Depot</option>
                            <option value="Port Bell Pier">Port Bell Pier</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-slate-500 font-mono font-semibold">Category *</label>
                          <select
                            value={newTicket.category}
                            onChange={(e) => setNewTicket(prev => ({ ...prev, category: e.target.value as TicketCategory }))}
                            className="w-full bg-white border border-slate-200 rounded p-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                          >
                            <option value="Signaling & Track Control">Signaling & Track Control</option>
                            <option value="VHF Radio & Telecommunications">VHF Radio & Telecommunications</option>
                            <option value="Ticketing & Passenger POS">Ticketing & Passenger POS</option>
                            <option value="Fiber Backbone & LAN">Fiber Backbone & LAN</option>
                            <option value="Freight Database & Logistics">Freight Database & Logistics</option>
                            <option value="General Office IT">General Office IT</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="text-slate-500 font-mono font-semibold">Priority *</label>
                          <select
                            value={newTicket.priority}
                            onChange={(e) => setNewTicket(prev => ({ ...prev, priority: e.target.value as TicketPriority }))}
                            className="w-full bg-white border border-slate-200 rounded p-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                          >
                            <option value="Low">Low</option>
                            <option value="Medium">Medium</option>
                            <option value="High">High</option>
                            <option value="Critical">Critical</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-slate-500 font-mono font-semibold">Reporter Name *</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. S. Mulondo"
                            value={newTicket.reporter}
                            onChange={(e) => setNewTicket(prev => ({ ...prev, reporter: e.target.value }))}
                            className="w-full bg-white border border-slate-200 rounded p-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-slate-500 font-mono font-semibold">Symptom Statement & Description *</label>
                        <textarea
                          rows={3}
                          required
                          placeholder="Provide detailed logs or telemetry observations..."
                          value={newTicket.description}
                          onChange={(e) => setNewTicket(prev => ({ ...prev, description: e.target.value }))}
                          className="w-full bg-white border border-slate-200 rounded p-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold p-2.5 rounded text-xs transition-colors cursor-pointer shadow-sm"
                      >
                        Submit Dispatch Incident Record
                      </button>
                    </form>
                  )}

                  {/* Tickets list iterator */}
                  <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 max-h-[580px]">
                    {filteredTickets.length === 0 ? (
                      <div className="text-center py-12 text-xs text-slate-400">
                        No tickets logged. Queue is nominal.
                      </div>
                    ) : (
                      filteredTickets.map((t) => {
                        const isSelected = selectedTicketId === t.id;
                        return (
                          <div
                            key={t.id}
                            onClick={() => setSelectedTicketId(t.id)}
                            className={`p-3.5 border rounded-lg cursor-pointer transition-all ${
                              isSelected
                                ? 'bg-blue-50/70 border-blue-500 text-slate-900 shadow-sm'
                                : 'bg-slate-50/50 border-slate-100 hover:border-slate-200 text-slate-600'
                            }`}
                          >
                            <div className="flex justify-between items-center text-[10px] font-mono mb-1">
                              <div className="flex items-center gap-1.5">
                                <span className={isSelected ? 'text-blue-600 font-bold' : 'text-slate-400'}>
                                  {t.id}
                                </span>
                                <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-sm ${
                                  t.priority === 'Critical' ? 'bg-red-100 text-red-700 font-mono' :
                                  t.priority === 'High' ? 'bg-amber-100 text-amber-700 font-mono' :
                                  t.priority === 'Medium' ? 'bg-blue-100 text-blue-700 font-mono' : 'bg-slate-100 text-slate-600 font-mono'
                                }`}>
                                  {t.priority}
                                </span>
                              </div>
                              <span className="text-slate-400">{new Date(t.createdAt).toLocaleDateString()}</span>
                            </div>
                            
                            <h4 className="text-xs font-semibold text-slate-800 line-clamp-1 mb-1.5">{t.title}</h4>
                            
                            <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                              <span className="flex items-center gap-0.5"><MapPin className="w-3 h-3 text-slate-400" /> {t.station.split(' ')[0]}</span>
                              <span className={
                                t.status === 'Resolved' ? 'text-emerald-600 font-medium' :
                                t.status === 'SOP Applied' ? 'text-amber-600 font-medium' : 'text-slate-500'
                              }>
                                {t.status}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Ticket Details View Cockpit */}
                <div className="lg:col-span-7 h-full">
                  {currentSelectedTicket ? (
                    <TicketDetails
                      ticket={currentSelectedTicket}
                      sops={sops}
                      userRole={userRole}
                      onUpdateTicket={handleUpdateTicket}
                      onTriggerAIDiagnosis={handleTriggerAIDiagnosis}
                    />
                  ) : (
                    <div className="bg-white border border-slate-200 rounded-xl p-16 text-center text-slate-400 text-xs shadow-sm">
                      <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                      Select a trouble ticket from the list queue to open the active diagnostic workplane.
                    </div>
                  )}
                </div>

              </div>
            )}

            {/* VIEW 3: ASSET MONITORING */}
            {activeTab === 'assets' && (
              <AssetStatus
                assets={assets}
                onPingAsset={handlePingAsset}
              />
            )}

            {/* VIEW 4: SOPS MANUAL */}
            {activeTab === 'sops' && (
              <SOPReference
                sops={sops}
              />
            )}

            {/* VIEW 5: KNOWLEDGE BASE */}
            {activeTab === 'kb' && (
              <KnowledgeBase />
            )}

            {/* VIEW 6: ADMINISTRATOR CONTROL PANEL */}
            {activeTab === 'admin' && userRole === 'Administrator' && (
              <div className="space-y-6">
                
                {/* Admin Header */}
                <div className="bg-slate-950 border border-slate-850 rounded-xl p-6 text-white shadow-lg">
                  <div className="flex items-center gap-3">
                    <div className="bg-red-500/10 border border-red-500/20 p-2.5 rounded-lg text-red-400">
                      <Shield className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-sm font-mono tracking-wider uppercase text-red-400 font-bold">URC Cybersecurity & Database Admin Console</h3>
                      <h2 className="text-base font-bold text-slate-100">Railway Incident Simulation Desk</h2>
                      <p className="text-xs text-slate-400 mt-1">
                        Force-inject real-time infrastructure network outages and restore/seed primary in-memory ticket/asset relational databases.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Grid controls */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Incident Simulator */}
                  <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                      <Flame className="w-5 h-5 text-amber-500" />
                      <h4 className="text-sm font-bold text-slate-700">Real-Time Telemetry Outage Simulator</h4>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Force-inject network anomalies into active railway channels. Telemetry will trigger automatic physical asset failure warnings and push critical emergency tickets into the live IT dispatcher queue.
                    </p>

                    <div className="space-y-3 pt-2">
                      <button
                        onClick={() => handleSimulateIncident('malaba-outage')}
                        className="w-full flex items-center justify-between p-3.5 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors text-left cursor-pointer group animate-fade-in"
                      >
                        <div className="space-y-0.5">
                          <div className="text-xs font-bold text-red-700 font-mono">SIMULATE MALABA SIGNALLING FAILURE</div>
                          <div className="text-[10px] text-red-600 font-sans">Forces primary optical switch offline & injects critical ticket</div>
                        </div>
                        <AlertCircle className="w-4 h-4 text-red-500 group-hover:scale-110 transition-transform" />
                      </button>

                      <button
                        onClick={() => handleSimulateIncident('kampala-pos-crash')}
                        className="w-full flex items-center justify-between p-3.5 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors text-left cursor-pointer group"
                      >
                        <div className="space-y-0.5">
                          <div className="text-xs font-bold text-amber-700 font-mono">SIMULATE KAMPALA POS BLOCKADE</div>
                          <div className="text-[10px] text-amber-600 font-sans">Deadlocks ticketing database server & logs high ticket</div>
                        </div>
                        <AlertCircle className="w-4 h-4 text-amber-500 group-hover:scale-110 transition-transform" />
                      </button>
                    </div>
                  </div>

                  {/* Database Seed Reset */}
                  <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                        <Database className="w-5 h-5 text-blue-600" />
                        <h4 className="text-sm font-bold text-slate-700">Database State Restoration</h4>
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        Reset the temporary, in-memory databases back to their fresh corporate seed state. This will immediately purge any newly simulated outages, wipe manual trial logs, and re-timestamp initial locomotive tracker and POS terminals as online and healthy.
                      </p>
                    </div>

                    <div className="pt-4">
                      <button
                        onClick={handleResetDatabase}
                        className="w-full inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold p-3.5 rounded-lg text-xs shadow-md transition-colors cursor-pointer"
                      >
                        <RefreshCw className="w-4 h-4 text-emerald-400 animate-spin" style={{ animationDuration: '4s' }} />
                        Reset Helpdesk & Telemetry State
                      </button>
                    </div>
                  </div>

                </div>

                {/* Permissions Matrix */}
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                  <div className="flex items-center gap-2 pb-3 border-b border-slate-100 mb-4">
                    <Shield className="w-5 h-5 text-emerald-600" />
                    <h4 className="text-sm font-bold text-slate-700">IT Helpdesk Authorization & Access Matrix</h4>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100 font-mono text-[10px] uppercase text-slate-400">
                          <th className="p-3">User Role</th>
                          <th className="p-3">Log Tickets</th>
                          <th className="p-3">Communications Log</th>
                          <th className="p-3">Apply SOP Playbooks</th>
                          <th className="p-3">Ping Assets</th>
                          <th className="p-3">Simulate Incident / DB Reset</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-600 font-sans">
                        <tr>
                          <td className="p-3 font-semibold text-slate-800">End User</td>
                          <td className="p-3 text-emerald-600 font-bold font-mono">✅ Allowed</td>
                          <td className="p-3 text-emerald-600 font-bold font-mono">✅ Allowed (Notes Only)</td>
                          <td className="p-3 text-red-500 font-bold font-mono">🔒 Locked (Staff Only)</td>
                          <td className="p-3 text-red-500 font-bold font-mono">🔒 Locked (Staff Only)</td>
                          <td className="p-3 text-red-500 font-bold font-mono">🔒 Locked (Admin Only)</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-semibold text-slate-800">IT Staff</td>
                          <td className="p-3 text-emerald-600 font-bold font-mono">✅ Allowed</td>
                          <td className="p-3 text-emerald-600 font-bold font-mono">✅ Full Access (SOP Actions)</td>
                          <td className="p-3 text-emerald-600 font-bold font-mono">✅ Allowed</td>
                          <td className="p-3 text-emerald-600 font-bold font-mono">✅ Allowed</td>
                          <td className="p-3 text-red-500 font-bold font-mono">🔒 Locked (Admin Only)</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-semibold text-slate-800">Administrator</td>
                          <td className="p-3 text-emerald-600 font-bold font-mono">✅ Allowed</td>
                          <td className="p-3 text-emerald-600 font-bold font-mono">✅ Full Access</td>
                          <td className="p-3 text-emerald-600 font-bold font-mono">✅ Allowed</td>
                          <td className="p-3 text-emerald-600 font-bold font-mono">✅ Allowed</td>
                          <td className="p-3 text-emerald-600 font-bold font-mono">✅ Full Access (Simulator/Reset)</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            )}

          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 px-6 py-4 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px] text-slate-400 font-mono">
          <div className="flex items-center gap-2">
            <span className="text-slate-500">&copy; 2026 Uganda Railway Corporation. All rights reserved.</span>
            <span className="border-l border-slate-200 pl-2">IT Systems Safety Assurance</span>
          </div>
          <div className="flex items-center gap-3">
            <span>Siding telemetry status: <strong className="text-emerald-500">SYNCED</strong></span>
            <span>Channel: Main Dispatch IP-VPN Link A</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
