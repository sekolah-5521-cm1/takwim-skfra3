import React from 'react';
import { Activity, Plus, Sparkles, Calendar, Edit, Trash2, CalendarPlus, ArrowRight, Loader2 } from 'lucide-react';
import { SchoolEvent } from '../types';
import { MONTH_NAMES, CATEGORY_STYLES, CATEGORY_LABELS } from '../constants';
import { getCategoryIcon, formatEventDateRange } from '../utils';

interface SidebarProps {
  selectedDate: Date;
  currentDate: Date;
  selectedEvents: SchoolEvent[];
  activeEventsList: SchoolEvent[];
  activeTab: 'draft' | 'public';
  openAddModal: () => void;
  openEditModal: (evt: SchoolEvent) => void;
  openDeleteModal: (id: string) => void;
  openCopyModal: (evt: SchoolEvent) => void;
  openAIModal: (category?: string) => void;
  copyingId?: string | null;
}

export default function Sidebar({
  selectedDate,
  currentDate,
  selectedEvents,
  activeEventsList,
  activeTab,
  openAddModal,
  openEditModal,
  openDeleteModal,
  openCopyModal,
  openAIModal,
  copyingId
}: SidebarProps) {

  const dayName = ['Ahad', 'Isnin', 'Selasa', 'Rabu', 'Khamis', 'Jumaat', 'Sabtu'][selectedDate.getDay()];

  return (
    <div className="space-y-6">
      
      {/* Selected Date Details */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-slate-800 text-white p-6 relative">
            <h2 className="text-3xl font-bold">{selectedDate.getDate()}</h2>
            <h3 className="text-xl opacity-90">{MONTH_NAMES[selectedDate.getMonth()]} {selectedDate.getFullYear()}</h3>
            <p className="opacity-75 mt-1">{dayName}</p>
            
            <div className="absolute right-6 top-6 flex gap-2">
            <button 
                onClick={() => openAIModal()}
                className="bg-purple-600 hover:bg-purple-500 text-white p-2 rounded-full shadow-lg transition-transform hover:scale-105 active:scale-95" 
                title="AI Bulk Import"
            >
                <Sparkles size={20} />
            </button>
            <button 
                onClick={openAddModal}
                className={`${activeTab === 'public' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-blue-600 hover:bg-blue-500'} text-white p-2 rounded-full shadow-lg transition-transform hover:scale-105 active:scale-95`}
                title="Tambah Aktiviti"
            >
                <Plus size={20} />
            </button>
            </div>
          </div>
          
          <div className="p-6">
            <h4 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
              <Activity size={18} />
              Aktiviti Hari Ini
            </h4>
            
            {selectedEvents.length > 0 ? (
              <div className="space-y-3">
                {selectedEvents.map((evt, idx) => (
                  <div key={idx} className={`p-3 rounded-lg border-l-4 text-sm ${CATEGORY_STYLES[evt.category] || CATEGORY_STYLES.default} border-l-[color:inherit] bg-opacity-30 group relative`}>
                    <div className="flex items-start gap-2 pr-12">
                      <span className="mt-0.5 opacity-70">{getCategoryIcon(evt.category)}</span>
                      <div>
                        <div className="font-medium">{evt.title}</div>
                        
                        {evt.start && evt.end && evt.start !== evt.end && (
                            <div className="text-[10px] text-gray-600 mt-1 font-mono flex items-center gap-1">
                                <Calendar size={10} />
                                {formatEventDateRange(evt)}
                            </div>
                        )}

                        <div className="text-xs opacity-75 mt-1 uppercase tracking-wider">{CATEGORY_LABELS[evt.category] || "Umum"}</div>
                      </div>
                    </div>
                    
                    {evt.id && (
                      <div className="absolute right-2 top-2 flex gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                          {activeTab === 'draft' && (
                            <button 
                                onClick={() => openCopyModal(evt)} 
                                className="p-1.5 bg-white text-emerald-600 rounded shadow hover:bg-gray-50" 
                                title="Salin ke Takwim Rasmi"
                            >
                                <CalendarPlus size={14} />
                            </button>
                          )}

                          <button onClick={() => openEditModal(evt)} className="p-1.5 bg-white text-blue-600 rounded shadow hover:bg-gray-50" title="Edit">
                            <Edit size={14} />
                          </button>
                          <button onClick={() => openDeleteModal(evt.id!)} className="p-1.5 bg-white text-red-600 rounded shadow hover:bg-gray-50" title="Padam">
                            <Trash2 size={14} />
                          </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <p>Tiada aktiviti khusus direkodkan.</p>
                <button onClick={openAddModal} className={`mt-4 text-sm font-medium hover:underline ${activeTab === 'public' ? 'text-emerald-600' : 'text-blue-600'}`}>Tambah Aktiviti +</button>
              </div>
            )}
          </div>
      </div>

      {/* Quick Stats / Legend / Upcoming */}
      <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200">
        <h4 className="font-semibold text-gray-800 mb-4">Sorotan Bulan Ini ({MONTH_NAMES[currentDate.getMonth()]})</h4>
        <div className="space-y-4">
          {activeEventsList
            .filter(e => {
              if (!e.start) return false;
              const d = new Date(e.start);
              return d.getMonth() === currentDate.getMonth() && d.getFullYear() === currentDate.getFullYear();
            })
            .sort((a,b) => {
                if (!a.start || !b.start) return 0;
                return new Date(a.start).getTime() - new Date(b.start).getTime();
            })
            .slice(0, 5) // Show top 5
            .map((evt, i) => (
              <div key={i} className="flex gap-3 items-start group">
                <div className="bg-gray-100 rounded px-2 py-1 text-center min-w-[3rem]">
                  <div className="text-xs font-bold text-gray-500">{evt.start ? new Date(evt.start).getDate() : '-'}</div>
                  <div className="text-[10px] text-gray-400">{evt.start ? MONTH_NAMES[new Date(evt.start).getMonth()].substring(0,3) : '-'}</div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-800 leading-tight truncate">{evt.title}</div>
                  <div className="text-xs text-gray-500 mt-1 flex gap-2">
                    <span>{CATEGORY_LABELS[evt.category]}</span>
                    {evt.end && evt.end !== evt.start && <span className="text-gray-400 text-[10px] flex items-center"><ArrowRight size={8} className="mx-0.5"/> {new Date(evt.end).getDate()}</span>}
                  </div>
                </div>
                
                {evt.id && (
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-auto shrink-0 self-center">
                      {activeTab === 'draft' && (
                          <button 
                            onClick={() => openCopyModal(evt)} 
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded shadow-sm border border-gray-100 bg-white" 
                            title="Tambah ke Takwim Rasmi (GCal)"
                            disabled={copyingId === evt.id}
                          >
                            {copyingId === evt.id ? <Loader2 size={14} className="animate-spin"/> : <CalendarPlus size={14} />}
                          </button>
                      )}

                      <button onClick={() => openEditModal(evt)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded shadow-sm border border-gray-100 bg-white" title="Edit">
                        <Edit size={14} />
                      </button>
                      <button onClick={() => openDeleteModal(evt.id!)} className="p-1.5 text-red-600 hover:bg-red-50 rounded shadow-sm border border-gray-100 bg-white" title="Padam">
                        <Trash2 size={14} />
                      </button>
                    </div>
                )}
              </div>
            ))
          }
          {activeEventsList.filter(e => e.start && new Date(e.start).getMonth() === currentDate.getMonth()).length === 0 && (
              <p className="text-sm text-gray-500 italic">Tiada acara utama disenaraikan bulan ini.</p>
          )}
        </div>
      </div>
    </div>
  );
}