import React from 'react';
import { StationSystemStatus, StationName } from '../types';
import { Train, Radio, CheckCircle, AlertTriangle, XCircle, ArrowRight } from 'lucide-react';

interface NetworkMapProps {
  stations: StationSystemStatus[];
  selectedStation: StationName | null;
  onSelectStation: (stationName: StationName | null) => void;
}

export default function NetworkMap({ stations, selectedStation, onSelectStation }: NetworkMapProps) {
  // SVG proportions
  const width = 800;
  const height = 400;

  // Render status badge helper
  const getStatusBadge = (status: 'Healthy' | 'Warning' | 'Disrupted') => {
    switch (status) {
      case 'Healthy':
        return <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">● Healthy</span>;
      case 'Warning':
        return <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">▲ Warning</span>;
      case 'Disrupted':
        return <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">■ Disrupted</span>;
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm relative overflow-hidden" id="urc-network-map-card">
      <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>

      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-6">
        <div>
          <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <Train className="w-5 h-5 text-blue-600" />
            URC Network IT Topology Map
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time infrastructure health and incident concentrations across Ugandan rail corridors.
          </p>
        </div>
        <div className="flex flex-wrap gap-3 text-xs">
          <div className="flex items-center gap-1.5 text-slate-500">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Healthy Siding
          </div>
          <div className="flex items-center gap-1.5 text-slate-500">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Local Issues
          </div>
          <div className="flex items-center gap-1.5 text-slate-500">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Block Disruptions
          </div>
          {selectedStation && (
            <button
              onClick={() => onSelectStation(null)}
              className="text-blue-600 hover:text-blue-500 transition-colors cursor-pointer ml-2 border-l border-slate-200 pl-3 font-semibold"
            >
              Show All Stations
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* SVG Network Visualizer */}
        <div className="lg:col-span-2 bg-slate-50/50 rounded-lg p-2 border border-slate-200 relative flex items-center justify-center min-h-[300px]">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full h-auto max-h-[340px] select-none text-slate-500 font-mono"
            style={{ filter: 'drop-shadow(0 2px 8px rgba(0, 0, 0, 0.04))' }}
          >
            {/* Grid background lines for a technical look */}
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(148, 163, 184, 0.1)" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" rx="6" />

            {/* Railway Network Lines (Backbone) */}
            {/* Kampala -> Port Bell */}
            <line x1="250" y1="280" x2="220" y2="330" stroke="#cbd5e1" strokeWidth="6" strokeLinecap="round" />
            <line x1="250" y1="280" x2="220" y2="330" stroke="#0ea5e9" strokeWidth="2" strokeDasharray="3 3" />

            {/* Gulu -> Tororo Branch */}
            <line x1="400" y1="80" x2="720" y2="240" stroke="#cbd5e1" strokeWidth="6" strokeLinecap="round" strokeDasharray="2" />
            <line x1="400" y1="80" x2="720" y2="240" stroke="#475569" strokeWidth="2" opacity="0.15" />

            {/* Kampala -> Jinja -> Tororo -> Malaba Mainline */}
            <path
              d="M 250 280 L 450 260 L 720 240 L 880 220"
              fill="none"
              stroke="#cbd5e1"
              strokeWidth="6"
              strokeLinecap="round"
            />
            {/* Interactive colored fiber overlay */}
            <path
              d="M 250 280 L 450 260 L 720 240"
              fill="none"
              stroke="#10b981" // Kampala to Tororo is mostly green, but Jinja-Tororo has issues
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <path
              d="M 450 260 L 720 240"
              fill="none"
              stroke="#f59e0b" // Warning on fiber segment Jinja to Tororo
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeDasharray="4 2"
            />
            <path
              d="M 720 240 L 880 220"
              fill="none"
              stroke="#ef4444" // Malaba segment is disrupted
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeDasharray="4 2"
            />

            {/* Rail network labels / legends */}
            <text x="260" y="315" fontSize="10" fill="#64748b" transform="rotate(-60 260 315)">Port Bell Spur</text>
            <text x="350" y="260" fontSize="10" fill="#10b981" fontWeight="500">Kampala-Jinja Fiber Loop</text>
            <text x="540" y="240" fontSize="10" fill="#d97706" fontWeight="500">Jinja-Tororo Loop</text>
            <text x="760" y="220" fontSize="10" fill="#ef4444" fontWeight="500">Tororo-Malaba Siding</text>
            <text x="500" y="140" fontSize="10" fill="#64748b" transform="rotate(25 500 140)">Northern Branch (VHF Corridor)</text>

            {/* Nodes (Stations) */}
            {stations.map((st) => {
              // Convert coordinate percentages to SVG coordinates
              const x = (st.coordinates.x / 100) * width;
              const y = (st.coordinates.y / 100) * height;
              const isSelected = selectedStation === st.name;
              
              let nodeColor = '#10b981'; // Healthy
              if (st.status === 'Warning') {
                nodeColor = '#f59e0b';
              } else if (st.status === 'Disrupted') {
                nodeColor = '#ef4444';
              }

              return (
                <g
                  key={st.name}
                  onClick={() => onSelectStation(isSelected ? null : st.name)}
                  className="cursor-pointer group"
                >
                  {/* Outer pulsating ring for active issues */}
                  {(st.status !== 'Healthy' || isSelected) && (
                    <circle
                      cx={x}
                      cy={y}
                      r={isSelected ? 18 : 14}
                      fill="none"
                      stroke={nodeColor}
                      strokeWidth="2"
                      opacity="0.8"
                      className="animate-ping"
                      style={{ transformOrigin: `${x}px ${y}px`, animationDuration: '3s' }}
                    />
                  )}

                  {/* Node Outer Circle */}
                  <circle
                    cx={x}
                    cy={y}
                    r={isSelected ? 11 : 8}
                    fill="#ffffff"
                    stroke={nodeColor}
                    strokeWidth={isSelected ? 4 : 2}
                    className="transition-all duration-200 group-hover:scale-125 shadow-sm"
                    style={{ transformOrigin: `${x}px ${y}px` }}
                  />

                  {/* Inner Core */}
                  <circle
                    cx={x}
                    cy={y}
                    r={isSelected ? 5 : 3.5}
                    fill={nodeColor}
                  />

                  {/* Label Text */}
                  <text
                    x={x}
                    y={y - 18}
                    textAnchor="middle"
                    fill={isSelected ? '#2563eb' : '#334155'}
                    fontWeight={isSelected ? 'bold' : '500'}
                    fontSize="11"
                    className="font-sans drop-shadow-sm select-none transition-all duration-200 group-hover:fill-blue-600"
                  >
                    {st.code}
                  </text>

                  {/* Active Ticket Counter Overlay (if > 0) */}
                  {st.activeTicketsCount > 0 && (
                    <g transform={`translate(${x + 10}, ${y - 10})`}>
                      <circle r="7.5" fill="#ef4444" />
                      <text
                        y="3"
                        textAnchor="middle"
                        fill="#ffffff"
                        fontSize="9"
                        fontWeight="bold"
                        className="font-sans"
                      >
                        {st.activeTicketsCount}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
          </svg>
        </div>

        {/* Station Inspector sidebar */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-5 flex flex-col justify-between">
          <div>
            <div className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-3 font-mono">Station Inspector</div>
            
            {selectedStation ? (
              (() => {
                const stat = stations.find((s) => s.name === selectedStation);
                if (!stat) return null;
                return (
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-base font-semibold text-slate-800 flex items-center gap-1.5">
                        <Radio className="w-4 h-4 text-blue-600" />
                        {stat.name}
                      </h3>
                      <div className="text-xs text-slate-500 font-mono mt-0.5">Station ID: URC-{stat.code}</div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-xs py-1.5 border-b border-slate-200">
                        <span className="text-slate-500">Backbone Connection</span>
                        <span>{getStatusBadge(stat.status)}</span>
                      </div>
                      <div className="flex justify-between text-xs py-1.5 border-b border-slate-200">
                        <span className="text-slate-500">Incident Density</span>
                        <span className="text-slate-800 font-medium">
                          {stat.activeTicketsCount} Active {stat.activeTicketsCount === 1 ? 'Incident' : 'Incidents'}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs py-1.5">
                        <span className="text-slate-500">Position Marker</span>
                        <span className="text-slate-400 font-mono">X:{stat.coordinates.x}% Y:{stat.coordinates.y}%</span>
                      </div>
                    </div>

                    <div className="p-3 bg-white border border-slate-200 rounded-md">
                      <p className="text-xs text-slate-600 leading-relaxed font-sans">
                        {stat.name === 'Malaba Border Post' && 'Border integration systems linking with Kenya SGR. Fiber loss has interrupted automatic custom manifest exchange.'}
                        {stat.name === 'Kampala Headquarters' && 'Central dispatch room and ticketing cluster terminal hosting. Running on elevated queue watch due to Terminal 2 DB locks.'}
                        {stat.name === 'Jinja Terminal' && 'Key rail bridge crossing. Fiber loop cut identified 2.4km East. Currently communicating via microwave packet links.'}
                        {stat.name === 'Tororo Station' && 'Major junction point branching to Gulu. Assets reporting nominal status. Serving as fiber route loopback terminator.'}
                        {stat.name === 'Gulu Depot' && 'Northern dry port link terminal. UHF radio tower showing heavy line impedance. Intermittent driver logs.'}
                        {stat.name === 'Port Bell Pier' && 'Lake Victoria ferry train links. Signaling and communications operating normally on all channels.'}
                      </p>
                    </div>
                  </div>
                );
              })()
            ) : (
              <div className="text-center py-8">
                <Radio className="w-8 h-8 text-slate-400 mx-auto mb-3 animate-pulse" />
                <p className="text-xs text-slate-500">
                  Select any station node on the map to inspect local telemetry, link safety factors, and active IT tickets.
                </p>
              </div>
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-slate-200">
            <div className="text-xs text-slate-500 leading-relaxed flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
              <span>Network map automatically updates when tickets are created or resolved.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
