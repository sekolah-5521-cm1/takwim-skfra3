import React from 'react';
import { Calendar, Edit, Globe, Settings, ExternalLink, CheckCircle2 } from 'lucide-react';

interface HeaderProps {
  activeTab: 'draft' | 'public';
  setActiveTab: (tab: 'draft' | 'public') => void;
  gcalId?: string;
  onOpenSettings?: () => void;
}

export default function Header({ activeTab, setActiveTab, gcalId = 'sekolah-5521-cm1@moe-dl.edu.my', onOpenSettings }: HeaderProps) {
  return (
    <header className="fixed top-0 left-0 right-0 bg-slate-900 text-white z-40 shadow-lg h-16 flex items-center justify-between px-3 sm:px-6">
      <div className="flex items-center gap-2 sm:gap-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400" />
          <div className="font-bold text-xs sm:text-lg tracking-tight leading-tight max-w-[120px] sm:max-w-none">
            Sistem Pengurusan Takwim
          </div>
        </div>

        {/* GCal Connected Indicator */}
        <div 
          onClick={onOpenSettings}
          title={`Google Calendar: ${gcalId} (Klik untuk tetapan)`}
          className="hidden md:flex items-center gap-2 bg-slate-800/90 hover:bg-slate-700 text-xs px-2.5 py-1.5 rounded-full border border-slate-700 cursor-pointer transition"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-slate-300 font-medium truncate max-w-[180px]">
            {gcalId}
          </span>
          <Settings size={13} className="text-slate-400 hover:text-white" />
        </div>
      </div>
      
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="flex bg-slate-800 rounded-lg p-1 border border-slate-700 shrink-0">
          <button 
            onClick={() => setActiveTab('draft')}
            className={`px-3 sm:px-4 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-all flex items-center gap-1.5 sm:gap-2 ${activeTab === 'draft' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
          >
            <Edit size={14} className="hidden sm:block" />
            <Edit size={12} className="block sm:hidden" />
            <span><span className="hidden sm:inline">Draf</span> Takwim</span>
          </button>
          <button 
            onClick={() => setActiveTab('public')}
            className={`px-3 sm:px-4 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-all flex items-center gap-1.5 sm:gap-2 ${activeTab === 'public' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
          >
            <Globe size={14} className="hidden sm:block" />
            <Globe size={12} className="block sm:hidden" />
            <span><span className="hidden sm:inline">Takwim</span> Rasmi</span>
          </button>
        </div>

        {onOpenSettings && (
          <button
            onClick={onOpenSettings}
            title="Tetapan Integrasi Google Calendar"
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg border border-slate-700 transition"
          >
            <Settings size={18} />
          </button>
        )}
      </div>
    </header>
  );
}