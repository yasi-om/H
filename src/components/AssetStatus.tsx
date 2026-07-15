import React, { useState } from 'react';
import { ITAsset, StationName } from '../types';
import { Activity, Radio, AlertTriangle, CheckCircle, Search, Play, RefreshCw, Terminal } from 'lucide-react';

interface AssetStatusProps {
  assets: ITAsset[];
  onPingAsset: (assetId: string) => Promise<{ asset: ITAsset; pingOutput: string[] }>;
}

export default function AssetStatus({ assets, onPingAsset }: AssetStatusProps) {
  const [filterStation, setFilterStation] = useState<string>('All');
  const [filterType, setFilterType] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [pingingId, setPingingId] = useState<string | null>(null);
  const [terminalOutput, setTerminalOutput] = useState<string[] | null>(null);
  const [terminalAsset, setTerminalAsset] = useState<ITAsset | null>(null);

  const handlePing = async (asset: ITAsset) => {
    setPingingId(asset.id);
    setTerminalOutput(['Establishing secure socket telemetry layer...', `Connecting to asset ${asset.name} at ${asset.ipAddress}...`]);
    setTerminalAsset(asset);
    
    try {
      // Small artificial delay to feel like a real network scan
      await new Promise((resolve) => setTimeout(resolve, 1200));
      const res = await onPingAsset(asset.id);
      setTerminalOutput(res.pingOutput);
    } catch (err) {
      setTerminalOutput([
        'ERROR: Failed to run diagnostic routine.',
        'Reason: Communication timeout on internal VPN railway routing.',
        'Please check fiber transceiver power status.'
      ]);
    } finally {
      setPingingId(null);
    }
  };

  // Extract unique stations for filter
  const stationsList = ['All', ...Array.from(new Set(assets.map((a) => a.station)))];
  const typesList = ['All', 'Router', 'Server', 'Signaling Panel', 'Radio Repeater', 'POS Terminal'];

  const filteredAssets = assets.filter((asset) => {
    const matchesStation = filterStation === 'All' || asset.station === filterStation;
    const matchesType = filterType === 'All' || asset.type === filterType;
    const matchesSearch = asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          asset.ipAddress.includes(searchQuery) ||
                          asset.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStation && matchesType && matchesSearch;
  });

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm relative" id="urc-assets-monitor">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-6">
        <div>
          <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-600 animate-pulse" />
            URC Critical IT Asset Telemetry
          </h2>
          <p className="text-xs text-slate-500 mt-0.5 font-sans">
            Status monitoring and active ping diagnostic interface for station infrastructure routers, relays, and radio towers.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-slate-500">Total Monitored: <span className="text-blue-600 font-bold">{assets.length}</span></span>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by IP, name or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white"
          />
        </div>

        <div>
          <select
            value={filterStation}
            onChange={(e) => setFilterStation(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-blue-500 focus:bg-white"
          >
            {stationsList.map((st) => (
              <option key={st} value={st}>{st === 'All' ? 'Filter: All Stations' : st}</option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-blue-500 focus:bg-white"
          >
            {typesList.map((tp) => (
              <option key={tp} value={tp}>{tp === 'All' ? 'Filter: All Asset Types' : tp}</option>
            ))}
          </select>
        </div>

        <div className="flex justify-end items-center">
          {terminalOutput && (
            <button
              onClick={() => {
                setTerminalOutput(null);
                setTerminalAsset(null);
              }}
              className="text-slate-500 hover:text-slate-700 text-xs flex items-center gap-1.5 transition-colors cursor-pointer font-medium"
            >
              <Terminal className="w-4 h-4" /> Close Diagnostic Console
            </button>
          )}
        </div>
      </div>

      {/* Split screen: Assets grid + Diagnostic Terminal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className={`${terminalOutput ? 'lg:col-span-2' : 'lg:col-span-3'} overflow-x-auto border border-slate-200 rounded-lg`}>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider font-mono">
                <th className="py-3 px-4">Asset ID</th>
                <th className="py-3 px-4">Name</th>
                <th className="py-3 px-4">Station Siding</th>
                <th className="py-3 px-4">IP Address</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Last Latency</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {filteredAssets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 font-medium">
                    No active assets match the current filter criteria.
                  </td>
                </tr>
              ) : (
                filteredAssets.map((asset) => {
                  const isPinging = pingingId === asset.id;
                  const isCurrentTerminal = terminalAsset?.id === asset.id;

                  return (
                    <tr
                      key={asset.id}
                      className={`hover:bg-slate-50/50 transition-colors ${
                        isCurrentTerminal ? 'bg-blue-50/40 border-l-2 border-l-blue-600' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4 font-mono font-medium text-slate-500">{asset.id}</td>
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-slate-800 block">{asset.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{asset.type}</span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">{asset.station}</td>
                      <td className="py-3.5 px-4 font-mono text-slate-600">{asset.ipAddress}</td>
                      <td className="py-3.5 px-4">
                        {asset.status === 'Online' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold text-[11px]">
                            ● Online
                          </span>
                        )}
                        {asset.status === 'Degraded' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-semibold text-[11px] animate-pulse">
                            ▲ Degraded
                          </span>
                        )}
                        {asset.status === 'Offline' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 font-semibold text-[11px]">
                            ■ Offline
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-600">{asset.lastPing}</td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handlePing(asset)}
                          disabled={!!pingingId}
                          className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                            isPinging
                              ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                              : 'bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 hover:text-blue-800'
                          }`}
                        >
                          {isPinging && pingingId === asset.id ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Play className="w-3 h-3 text-emerald-600 fill-emerald-600" />
                          )}
                          Diagnostics
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Live Diagnostics Console Panel */}
        {terminalOutput && (
          <div className="bg-slate-950 border border-slate-850 rounded-lg p-5 flex flex-col font-mono text-xs shadow-inner h-[320px] lg:h-auto overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 mb-3 text-[10px] text-slate-400 tracking-wider font-semibold">
              <span className="flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-blue-500 animate-pulse" />
                TELEMETRY SCANNER: {terminalAsset?.id}
              </span>
              <span className="bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-emerald-400">
                {terminalAsset?.ipAddress}
              </span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar text-slate-300">
              {terminalOutput.map((line, idx) => {
                let colorClass = 'text-slate-300';
                if (line.startsWith('Reply from') || line.startsWith('PING')) {
                  colorClass = 'text-slate-400';
                } else if (line.includes('DIAGNOSIS:') || line.includes('telemetry indicates')) {
                  colorClass = 'text-amber-400 font-medium';
                } else if (line.includes('Online') || line.includes('0% loss')) {
                  colorClass = 'text-emerald-400 font-semibold';
                } else if (line.includes('timed out') || line.includes('loss') || line.startsWith('ERROR:')) {
                  colorClass = 'text-rose-400';
                }

                return (
                  <p key={idx} className={`${colorClass} leading-relaxed break-all`}>
                    <span className="text-slate-600 mr-2 select-none">&gt;</span>
                    {line}
                  </p>
                );
              })}
              {pingingId && (
                <div className="flex items-center gap-1.5 text-blue-400 animate-pulse mt-1">
                  <span>Executing ICMP packet burst telemetry...</span>
                  <span className="w-1.5 h-3 bg-blue-400 block animate-ping"></span>
                </div>
              )}
            </div>

            <div className="mt-3 pt-3 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-500">
              <span>Siding Code: {terminalAsset?.station.split(' ')[0]}</span>
              <span>Port: Serial-over-IP Console</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
