import React, { useState } from 'react';
import { SOP } from '../types';
import { BookOpen, AlertCircle, Clock, ShieldAlert, ArrowRight, Search, CheckSquare } from 'lucide-react';

interface SOPReferenceProps {
  sops: SOP[];
}

export default function SOPReference({ sops }: SOPReferenceProps) {
  const [selectedSopId, setSelectedSopId] = useState<string>('URC-SOP-01');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredSops = sops.filter(
    (sop) =>
      sop.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sop.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sop.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeSop = sops.find((s) => s.id === selectedSopId) || sops[0];

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm relative" id="urc-sop-knowledge-base">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-6">
        <div>
          <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-600" />
            URC IT Standard Response Procedures (SOP)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Official IT department playbook containing railway-grade emergency diagnostics and field safety guidelines.
          </p>
        </div>
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search playbook..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Playbook Index Sidebar */}
        <div className="lg:col-span-1 space-y-2 max-h-[400px] overflow-y-auto pr-1">
          <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold mb-2 px-2">Procedural Manual Index</div>
          {filteredSops.length === 0 ? (
            <p className="text-xs text-slate-400 px-2">No procedures match search term.</p>
          ) : (
            filteredSops.map((sop) => {
              const isActive = activeSop?.id === sop.id;
              return (
                <button
                  key={sop.id}
                  onClick={() => setSelectedSopId(sop.id)}
                  className={`w-full text-left px-3 py-3 rounded-lg border text-xs transition-all cursor-pointer flex flex-col gap-1 ${
                    isActive
                      ? 'bg-blue-50 border-blue-200 text-blue-800 shadow-sm'
                      : 'bg-slate-50/50 border-slate-200 hover:border-slate-300 text-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between font-mono text-[10px]">
                    <span className={isActive ? 'text-blue-600 font-bold' : 'text-slate-400'}>{sop.code}</span>
                    <span className="opacity-80">{sop.estimatedMinutes} Mins</span>
                  </div>
                  <div className={`font-semibold line-clamp-1 ${isActive ? 'text-blue-900' : 'text-slate-800'}`}>{sop.title}</div>
                  <div className="text-[10px] opacity-70 truncate">{sop.category}</div>
                </button>
              );
            })
          )}
        </div>

        {/* Playbook Reader Panel */}
        <div className="lg:col-span-2 bg-slate-50 border border-slate-200 rounded-lg p-5 flex flex-col justify-between">
          {activeSop ? (
            <div className="space-y-5">
              <div className="border-b border-slate-200 pb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <div className="font-mono text-xs text-blue-600 font-bold">{activeSop.code}</div>
                  <h3 className="text-base font-bold text-slate-800">{activeSop.title}</h3>
                </div>
                <div className="flex items-center gap-4 text-xs font-mono text-slate-500 shrink-0">
                  <span className="flex items-center gap-1"><Clock className="w-4.5 h-4.5 text-slate-400" /> est: {activeSop.estimatedMinutes}m</span>
                </div>
              </div>

              <div>
                <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold mb-1.5">Scope of Application</div>
                <p className="text-xs text-slate-600 leading-relaxed bg-white border border-slate-200 rounded-md p-3">
                  {activeSop.description}
                </p>
              </div>

              {/* Steps Checklist */}
              <div>
                <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold mb-2.5">Procedural Restoration Sequence</div>
                <div className="space-y-2">
                  {activeSop.steps.map((step, idx) => (
                    <div key={idx} className="flex items-start gap-3 bg-white border border-slate-100 rounded-md p-2.5 shadow-sm">
                      <div className="bg-blue-50 border border-blue-100 h-5 w-5 rounded flex items-center justify-center font-mono text-[10px] text-blue-600 shrink-0 mt-0.5">
                        {idx + 1}
                      </div>
                      <span className="text-xs text-slate-600 leading-relaxed font-sans">{step}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Safety Precautions */}
              <div className="bg-rose-50 border border-rose-200 rounded-lg p-3.5">
                <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-rose-700 font-bold mb-2">
                  <ShieldAlert className="w-4 h-4 text-rose-500" />
                  Mandatory Railway Safety Precautions
                </div>
                <ul className="list-disc list-inside space-y-1 text-xs text-rose-600">
                  {activeSop.precautions.map((prec, idx) => (
                    <li key={idx} className="leading-relaxed">{prec}</li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <div className="text-center py-16 text-slate-400 text-xs">
              Select a standard operating procedure from the sidebar menu to read instructions.
            </div>
          )}

          <div className="mt-6 pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <span className="text-[10px] text-slate-400 font-mono">
              Classified: URC IT Operational Standard
            </span>
            <span className="text-xs text-blue-600 flex items-center gap-1 font-medium">
              Checklists can be linked and interactive on active tickets. <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
