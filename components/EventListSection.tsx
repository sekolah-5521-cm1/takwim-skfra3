import React, { useState, useEffect } from 'react';
import { Edit, Trash2, Plus, Calendar, Filter, CalendarPlus, Loader2, Sparkles, CloudUpload } from 'lucide-react';
import { SchoolEvent } from '../types';
import { CATEGORY_LABELS, CATEGORY_STYLES } from '../constants';
import { formatEventDateRange, getCategoryIcon } from '../utils';

interface EventListSectionProps {
  events: SchoolEvent[];
  activeTab: 'draft' | 'public';
  openEditModal: (evt: SchoolEvent) => void;
  openDeleteModal: (id: string) => void;
  openAddModal: (category?: string) => void;
  openCopyModal: (evt: SchoolEvent) => void;
  copyingId?: string | null;
  openAIModal: (category?: string) => void;
  handleBulkSync?: (category: string, specificIds?: string[]) => void;
  handleBulkDelete?: (ids: string[]) => void;
  handleClearAllDraft?: () => void;
}

const TABS = [
  { key: 'all', label: 'Semua' },
  { key: 'holiday', label: 'Cuti' },
  { key: 'academic', label: 'Sekolah' },
  { key: 'exam', label: 'Peperiksaan' },
  { key: 'program', label: 'Program' },
  { key: 'hem', label: 'HEM' },
  { key: 'koko', label: 'Kokurikulum' },
  { key: 'meeting', label: 'Mesyuarat' },
];

export default function EventListSection({
  events,
  activeTab,
  openEditModal,
  openDeleteModal,
  openAddModal,
  openCopyModal,
  copyingId,
  openAIModal,
  handleBulkSync,
  handleBulkDelete,
  handleClearAllDraft
}: EventListSectionProps) {
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Filter and Sort Events
  const filteredEvents = events
    .filter(evt => activeCategory === 'all' || evt.category === activeCategory)
    .sort((a, b) => {
        if (!a.start || !b.start) return 0;
        return new Date(a.start).getTime() - new Date(b.start).getTime();
    });

  // Calculate Select All State
  const validEventIds = filteredEvents.filter(e => e.id).map(e => e.id as string);
  const areAllSelected = validEventIds.length > 0 && validEventIds.every(id => selectedIds.has(id));

  // Clear selection when events are updated (e.g. after deletion)
  useEffect(() => {
    setSelectedIds(new Set());
  }, [events]);

  const toggleSelection = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const toggleSelectAll = () => {
    if (areAllSelected) {
        setSelectedIds(new Set());
    } else {
        setSelectedIds(new Set(validEventIds));
    }
  };

  const executeBulkDelete = () => {
      if (selectedIds.size === 0 || !handleBulkDelete) return;
      handleBulkDelete(Array.from(selectedIds));
  };

  const executeBulkSync = () => {
      if (!handleBulkSync) return;
      // If selection exists, sync selected IDs. Else, sync entire active category.
      if (selectedIds.size > 0) {
          handleBulkSync(activeCategory, Array.from(selectedIds));
      } else {
          handleBulkSync(activeCategory);
      }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <Filter size={20} className="text-blue-600" />
                Senarai Pengurusan Takwim
            </h3>
            <p className="text-sm text-gray-500">Urus semua acara sekolah mengikut kategori.</p>
        </div>
        
        <div className="flex gap-2 items-center flex-wrap sm:flex-nowrap">
            {/* Butang Aksi Pukal */}
            {selectedIds.size > 0 ? (
                <>
                    {handleBulkDelete && (
                        <button 
                            onClick={executeBulkDelete}
                            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-3 py-2 sm:px-4 rounded-lg text-sm font-medium transition shadow-sm w-fit animate-in fade-in"
                            title={`Padam ${selectedIds.size} acara yang dipilih`}
                        >
                            <Trash2 size={16} />
                            <span className="hidden sm:inline">Padam ({selectedIds.size})</span>
                        </button>
                    )}
                    {activeTab === 'draft' && handleBulkSync && (
                         <button 
                            onClick={executeBulkSync}
                            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 sm:px-4 rounded-lg text-sm font-medium transition shadow-sm w-fit animate-in fade-in"
                            title={`Sync ${selectedIds.size} acara ke GCal`}
                        >
                            <CloudUpload size={16} />
                            <span className="hidden sm:inline">Sync ({selectedIds.size})</span>
                        </button>
                    )}
                </>
            ) : (
                <>
                     {/* Butang Default (Tiada Pilihan) */}
                    {activeTab === 'draft' && handleBulkSync && (
                        <button 
                            onClick={executeBulkSync}
                            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 sm:px-4 rounded-lg text-sm font-medium transition shadow-sm w-fit"
                            title="Sync GCal (Kategori Ini)"
                        >
                            <CloudUpload size={16} />
                            <span className="hidden sm:inline">Sync GCal</span>
                        </button>
                    )}
                    {activeTab === 'draft' && handleClearAllDraft && events.length > 0 && (
                        <button 
                            onClick={handleClearAllDraft}
                            className="flex items-center gap-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-3 py-2 sm:px-3.5 rounded-lg text-sm font-medium transition shadow-sm w-fit"
                            title="Kosongkan Semua Acara Draf"
                        >
                            <Trash2 size={16} />
                            <span className="hidden sm:inline">Kosongkan Draf</span>
                        </button>
                    )}
                </>
            )}

            <button 
                onClick={() => openAIModal(activeCategory)}
                className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 sm:px-4 rounded-lg text-sm font-medium transition shadow-sm w-fit"
                title="AI Import"
            >
                <Sparkles size={16} />
                <span className="hidden sm:inline">AI Import</span>
            </button>
            <button 
                onClick={() => openAddModal(activeCategory === 'all' ? 'program' : activeCategory)}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 sm:px-4 rounded-lg text-sm font-medium transition shadow-sm w-fit"
                title="Tambah Event"
            >
                <Plus size={16} />
                <span className="hidden sm:inline">Tambah Event</span>
            </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-100 overflow-x-auto">
        <div className="flex px-4 min-w-max">
            {TABS.map((tab) => (
                <button
                    key={tab.key}
                    onClick={() => {
                        setActiveCategory(tab.key);
                        setSelectedIds(new Set()); // Reset selection on tab change
                    }}
                    className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors duration-200 ${
                        activeCategory === tab.key 
                        ? 'border-blue-600 text-blue-600' 
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                >
                    {tab.label}
                </button>
            ))}
        </div>
      </div>

      {/* Event List */}
      <div className="bg-gray-50 min-h-[300px] max-h-[600px] overflow-y-auto p-4 custom-scrollbar">
        {filteredEvents.length > 0 ? (
            <div className="space-y-3 relative">
                 {/* Select All Header */}
                 <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4 sticky top-0 z-10">
                    <div className="flex items-center justify-center pl-1 sm:pl-2">
                        <input 
                            type="checkbox"
                            checked={areAllSelected}
                            onChange={toggleSelectAll}
                            className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer accent-blue-600"
                            id="select-all-checkbox"
                        />
                    </div>
                    <label htmlFor="select-all-checkbox" className="text-sm font-bold text-gray-700 cursor-pointer select-none flex-1">
                        {areAllSelected ? 'Nyahpilih Semua' : 'Pilih Semua'} ({filteredEvents.length})
                    </label>
                </div>

                {filteredEvents.map((evt, idx) => (
                    <div 
                        key={evt.id || idx} 
                        className={`bg-white p-4 rounded-xl shadow-sm border flex flex-col sm:flex-row gap-4 items-start sm:items-center hover:shadow-md transition-shadow group
                         ${evt.id && selectedIds.has(evt.id) ? 'border-blue-300 ring-1 ring-blue-300 bg-blue-50' : 'border-gray-100'}`}
                    >
                        {/* Checkbox Selection */}
                        <div className="flex items-center justify-center pl-1 sm:pl-2">
                            <input 
                                type="checkbox"
                                checked={evt.id ? selectedIds.has(evt.id) : false}
                                onChange={() => evt.id && toggleSelection(evt.id)}
                                className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer accent-blue-600"
                            />
                        </div>

                        {/* Date Box */}
                        <div className="flex sm:flex-col items-center justify-center bg-gray-100 rounded-lg p-2 min-w-[4rem] sm:min-w-[5rem] text-center shrink-0 gap-2 sm:gap-0">
                             <span className="text-xs font-bold text-gray-500 uppercase">
                                {evt.start ? new Date(evt.start).toLocaleString('ms-MY', { month: 'short' }) : '-'}
                             </span>
                             <span className="text-xl sm:text-2xl font-bold text-gray-800 leading-none">
                                {evt.start ? new Date(evt.start).getDate() : '-'}
                             </span>
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${CATEGORY_STYLES[evt.category]?.replace('bg-', 'bg-opacity-20 ')}`}>
                                    {CATEGORY_LABELS[evt.category]}
                                </span>
                            </div>
                            <h4 className="font-semibold text-gray-800 text-sm sm:text-base mb-1">{evt.title}</h4>
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                                <span className="flex items-center gap-1">
                                    <Calendar size={12} />
                                    {formatEventDateRange(evt)}
                                </span>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 w-full sm:w-auto justify-end border-t sm:border-t-0 pt-3 sm:pt-0 mt-2 sm:mt-0 border-gray-100">
                            {/* Butang Tambah ke Takwim Rasmi (Hanya untuk Draf) */}
                            {activeTab === 'draft' && (
                                <button 
                                    onClick={() => openCopyModal(evt)}
                                    className="p-2 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition border border-emerald-100"
                                    title="Tambah ke Takwim Rasmi"
                                    disabled={copyingId === evt.id}
                                >
                                    {copyingId === evt.id ? <Loader2 size={16} className="animate-spin" /> : <CalendarPlus size={16} />}
                                </button>
                            )}

                            <button 
                                onClick={() => openEditModal(evt)}
                                className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition"
                                title="Edit"
                            >
                                <Edit size={16} />
                            </button>
                            <button 
                                onClick={() => evt.id && openDeleteModal(evt.id)}
                                className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition"
                                title="Padam"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        ) : (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                <Calendar size={48} className="mb-4 opacity-20" />
                <p>Tiada acara dalam kategori ini.</p>
                <div className="flex gap-3">
                    <button 
                        onClick={() => openAIModal(activeCategory)}
                        className="mt-2 text-purple-600 text-sm font-medium hover:underline flex items-center gap-1"
                    >
                        <Sparkles size={14}/>
                        AI Import
                    </button>
                    <button 
                        onClick={() => openAddModal(activeCategory === 'all' ? 'program' : activeCategory)}
                        className="mt-2 text-blue-600 text-sm font-medium hover:underline flex items-center gap-1"
                    >
                        <Plus size={14}/>
                        Tambah Event
                    </button>
                </div>
            </div>
        )}
      </div>
    </div>
  );
}