import React, { useEffect, useRef, useState } from 'react';
import { X, Loader2, AlertCircle, CalendarPlus, Sparkles, CloudUpload, CheckCircle, SkipForward, Settings, ExternalLink, Copy, Check, RefreshCw, FileSpreadsheet, Database } from 'lucide-react';
import { SchoolEvent } from '../types';
import { CATEGORY_LABELS, DEFAULT_SHEET_ID } from '../constants';
import { formatEventDateRange } from '../utils';

// --- ADD / EDIT MODAL ---
interface AddEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  formData: { title: string; category: string; start: string; end: string };
  setFormData: (data: any) => void;
  isSubmitting: boolean;
  editingEvent: SchoolEvent | null;
  activeTab: 'draft' | 'public';
}

export const AddEditModal = ({ isOpen, onClose, onSubmit, formData, setFormData, isSubmitting, editingEvent, activeTab }: AddEditModalProps) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose}></div>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md relative z-10 overflow-hidden">
        <div className={`p-4 border-b border-gray-100 flex justify-between items-center ${activeTab === 'public' ? 'bg-emerald-50' : 'bg-gray-50'}`}>
          <div className="flex flex-col">
              <h3 className="font-semibold text-lg">{editingEvent ? 'Kemaskini Aktiviti' : 'Tambah Aktiviti Baru'}</h3>
              <span className="text-xs text-gray-500">{activeTab === 'public' ? 'Takwim Rasmi (Google Calendar)' : 'Draf Dalaman'}</span>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-full transition"><X size={20}/></button>
        </div>
        <form onSubmit={onSubmit} className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tarikh Mula</label>
                  <input 
                    type="date" 
                    required
                    value={formData.start}
                    onChange={e => setFormData({...formData, start: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tarikh Tamat</label>
                  <input 
                    type="date" 
                    value={formData.end}
                    onChange={e => setFormData({...formData, end: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  />
                </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tajuk Aktiviti</label>
              <input 
                type="text" 
                required
                placeholder="Contoh: Mesyuarat Guru"
                value={formData.title}
                onChange={e => setFormData({...formData, title: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
              <select 
                value={formData.category}
                onChange={e => setFormData({...formData, category: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              >
                {Object.keys(CATEGORY_LABELS).map(key => (
                  <option key={key} value={key}>{CATEGORY_LABELS[key]}</option>
                ))}
              </select>
              {activeTab === 'public' && <p className="text-xs text-amber-600 mt-1">Nota: Kategori dalam Google Calendar ditentukan secara automatik berdasarkan kata kunci tajuk.</p>}
            </div>
            <div className="pt-2 flex justify-end gap-2">
              <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition">Batal</button>
              <button 
              type="submit" 
              disabled={isSubmitting}
              className={`px-4 py-2 text-white font-medium rounded-lg transition flex items-center gap-2 disabled:opacity-70 ${activeTab === 'public' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-blue-600 hover:bg-blue-700'}`}
              >
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin"/>}
                {editingEvent ? 'Simpan' : 'Tambah'}
              </button>
            </div>
        </form>
      </div>
    </div>
  );
};

// --- DELETE MODAL ---
interface DeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isSubmitting: boolean;
  activeTab: 'draft' | 'public';
  count?: number;
}

export const DeleteModal = ({ isOpen, onClose, onConfirm, isSubmitting, activeTab, count = 1 }: DeleteModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose}></div>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm relative z-10 overflow-hidden transform transition-all scale-100">
        <div className="p-6 flex flex-col items-center text-center">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <AlertCircle className="w-6 h-6 text-red-600" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">Padam Aktiviti?</h3>
          <p className="text-sm text-gray-500 mb-6">
            {count > 1 
              ? `Adakah anda pasti mahu memadam ${count} acara terpilih? Tindakan ini tidak boleh dikembalikan.` 
              : `Adakah anda pasti mahu memadam aktiviti ini? Tindakan ini tidak boleh dikembalikan.`
            }
            {activeTab === 'public' && <span className="block mt-1 font-bold text-red-600">Amaran: Ini akan memadam dari Google Calendar rasmi.</span>}
          </p>
          <div className="flex gap-3 w-full">
            <button 
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition"
            >
              Batal
            </button>
            <button 
              onClick={onConfirm}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition flex items-center justify-center gap-2"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin"/> : `Padam${count > 1 ? ` (${count})` : ''}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- COPY MODAL ---
interface CopyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isSubmitting: boolean;
  eventToCopy: SchoolEvent | null;
  gcalId?: string;
}

export const CopyModal = ({ isOpen, onClose, onConfirm, isSubmitting, eventToCopy, gcalId = 'sekolah-5521-cm1@moe-dl.edu.my' }: CopyModalProps) => {
  if (!isOpen || !eventToCopy) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose}></div>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm relative z-10 overflow-hidden transform transition-all scale-100">
        <div className="bg-emerald-600 p-4 flex justify-center">
            <CalendarPlus className="w-10 h-10 text-white" />
        </div>
        <div className="p-6 flex flex-col items-center text-center">
          <h3 className="text-lg font-bold text-gray-900 mb-2">Tambah ke Takwim Rasmi?</h3>
          <div className="mb-4 bg-gray-50 p-3 rounded-lg w-full text-left border border-gray-100">
              <p className="font-semibold text-gray-800">{eventToCopy.title}</p>
              <p className="text-sm text-gray-500">{formatEventDateRange(eventToCopy)}</p>
          </div>
          <div className="mb-6 bg-emerald-50 border border-emerald-100 p-2.5 rounded-lg w-full text-left">
            <p className="text-[11px] text-emerald-800 font-medium">
              Google Calendar Sasaran:
            </p>
            <p className="text-xs font-bold text-emerald-900 truncate">
              {gcalId}
            </p>
          </div>
          <p className="text-xs text-gray-500 mb-6">
            Tindakan ini akan menyalin acara dari Draf ke <strong>Google Calendar Rasmi</strong>.
          </p>
          
          <div className="flex gap-3 w-full">
            <button 
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition"
            >
              Batal
            </button>
            <button 
              onClick={onConfirm}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition flex items-center justify-center gap-2"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin"/> : "Ya, Tambah"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- SYNC CONFIRMATION MODAL ---
interface SyncConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    count: number;
    targetName: string; // "Semua" or Category Name or "Selected"
    isSelection: boolean;
    gcalId?: string;
}

export const SyncConfirmationModal = ({ isOpen, onClose, onConfirm, count, targetName, isSelection, gcalId = 'sekolah-5521-cm1@moe-dl.edu.my' }: SyncConfirmationModalProps) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose}></div>
            <div className="bg-white rounded-xl shadow-xl w-full max-w-sm relative z-10 overflow-hidden transform transition-all scale-100">
                <div className="bg-emerald-600 p-4 flex justify-center">
                    <CloudUpload className="w-10 h-10 text-white" />
                </div>
                <div className="p-6 flex flex-col items-center text-center">
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Sahkan Sync ke GCal</h3>
                    <div className="mb-3 bg-emerald-50 border border-emerald-100 p-2.5 rounded-lg w-full text-left">
                        <p className="text-[11px] text-emerald-800 font-medium">Kalendar Google Sasaran:</p>
                        <p className="text-xs font-bold text-emerald-900 truncate">{gcalId}</p>
                    </div>
                    <p className="text-sm text-gray-600 mb-6">
                        {isSelection 
                            ? `Adakah anda pasti mahu menambah ${count} acara yang dipilih ke Takwim Rasmi Google Calendar?`
                            : `Adakah anda pasti mahu menambah semua acara dalam kategori "${targetName}" (${count} acara) ke Takwim Rasmi Google Calendar?`
                        }
                    </p>
                    <div className="flex gap-3 w-full">
                        <button 
                            onClick={onClose}
                            className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition"
                        >
                            Batal
                        </button>
                        <button 
                            onClick={onConfirm}
                            className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition flex items-center justify-center gap-2"
                        >
                            Mula Sync
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- AI MODAL ---
interface AIModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: 'draft' | 'public';
  aiInputText: string;
  setAiInputText: (text: string) => void;
  isProcessingAI: boolean;
  handleAIProcess: () => void;
  aiCategory: string;
  setAiCategory: (cat: string) => void;
}

export const AIModal = ({ isOpen, onClose, activeTab, aiInputText, setAiInputText, isProcessingAI, handleAIProcess, aiCategory, setAiCategory }: AIModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose}></div>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg relative z-10 overflow-hidden">
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-4 text-white flex justify-between items-center">
            <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-yellow-300" />
                <h3 className="font-semibold text-lg">AI Bulk Import ({activeTab === 'draft' ? 'Draf' : 'Rasmi'})</h3>
            </div>
            <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full transition"><X size={20}/></button>
          </div>
          
          <div className="p-6">
            <p className="text-sm text-gray-600 mb-4">
              Tampal teks jadual anda di sini. AI akan mengekstrak Tarikh, Tajuk dan Kategori.
            </p>

             <div className="mb-3">
                <label className="block text-xs font-medium text-gray-700 mb-1">Kategori Acara (Untuk Semua Item)</label>
                <select 
                    value={aiCategory}
                    onChange={(e) => setAiCategory(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition"
                >
                    <option value="auto">✨ Auto (AI Tentukan)</option>
                    {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                    ))}
                </select>
                {aiCategory !== 'auto' && (
                    <p className="text-[10px] text-purple-600 mt-1">Semua acara yang diekstrak akan ditetapkan sebagai <b>{CATEGORY_LABELS[aiCategory]}</b>.</p>
                )}
            </div>
            
            <textarea 
              value={aiInputText}
              onChange={(e) => setAiInputText(e.target.value)}
              placeholder="Contoh: Mesyuarat PIBG pada 27/02/2026. Latihan Sukan setiap Rabu."
              className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none resize-none text-sm mb-4"
            ></textarea>

            <div className="flex justify-end gap-2">
                <button 
                  onClick={onClose}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                >
                  Batal
                </button>
                <button 
                  onClick={handleAIProcess}
                  disabled={!aiInputText.trim() || isProcessingAI}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition flex items-center gap-2 disabled:opacity-50"
                >
                  <Sparkles size={16} />
                  Proses dengan AI
                </button>
            </div>
          </div>
      </div>
    </div>
  );
};

// --- BULK SYNC MODAL (PROGRESS) ---
interface LogItem {
    type: 'info' | 'success' | 'skip' | 'error';
    message: string;
}

interface BulkSyncModalProps {
    isOpen: boolean;
    onClose: () => void;
    logs: LogItem[];
    isSyncing: boolean;
    total: number;
    progress: number;
}

export const BulkSyncModal = ({ isOpen, onClose, logs, isSyncing, total, progress }: BulkSyncModalProps) => {
    const logsEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (logsEndRef.current) {
            logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [logs]);

    if (!isOpen) return null;

    const percentage = total > 0 ? Math.round((progress / total) * 100) : 0;

    return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg relative z-10 overflow-hidden flex flex-col max-h-[80vh]">
                <div className="bg-emerald-600 p-4 text-white flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-2">
                        <CloudUpload className="w-5 h-5" />
                        <h3 className="font-bold text-lg">Sync ke Takwim Rasmi</h3>
                    </div>
                    {!isSyncing && (
                        <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full transition"><X size={20} /></button>
                    )}
                </div>

                <div className="p-6 flex-1 flex flex-col overflow-hidden">
                    <div className="mb-4 shrink-0">
                        <div className="flex justify-between text-sm font-medium text-gray-700 mb-1">
                            <span>Status Proses</span>
                            <span>{progress} / {total} ({percentage}%)</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                            <div 
                                className="bg-emerald-500 h-2.5 rounded-full transition-all duration-300 ease-out" 
                                style={{ width: `${percentage}%` }}
                            ></div>
                        </div>
                    </div>

                    <div className="flex-1 bg-slate-900 rounded-lg p-4 overflow-y-auto font-mono text-xs border border-slate-700 shadow-inner">
                        <div className="space-y-1.5">
                            {logs.map((log, idx) => (
                                <div key={idx} className={`flex items-start gap-2 ${
                                    log.type === 'success' ? 'text-emerald-400' : 
                                    log.type === 'skip' ? 'text-amber-400' : 
                                    log.type === 'error' ? 'text-red-400' : 'text-slate-300'
                                }`}>
                                    <span className="shrink-0 mt-0.5">
                                        {log.type === 'success' && <CheckCircle size={10} />}
                                        {log.type === 'skip' && <SkipForward size={10} />}
                                        {log.type === 'error' && <X size={10} />}
                                        {log.type === 'info' && <span className="w-2.5 h-2.5 inline-block" />}
                                    </span>
                                    <span>{log.message}</span>
                                </div>
                            ))}
                            {logs.length === 0 && <span className="text-slate-500 italic">Menunggu proses bermula...</span>}
                            <div ref={logsEndRef} />
                        </div>
                    </div>
                </div>

                <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end shrink-0">
                     <button 
                        onClick={onClose} 
                        disabled={isSyncing}
                        className={`px-6 py-2 rounded-lg font-medium transition ${
                            isSyncing 
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                            : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-md'
                        }`}
                    >
                        {isSyncing ? 'Sedang Memproses...' : 'Tutup'}
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- CALENDAR SETTINGS MODAL ---
interface CalendarSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  gcalId: string;
  apiUrl: string;
  onSave: (newGcalId: string, newApiUrl: string) => void;
  onRefreshCalendar: () => void;
}

export const CalendarSettingsModal = ({
  isOpen,
  onClose,
  gcalId,
  apiUrl,
  onSave,
  onRefreshCalendar
}: CalendarSettingsModalProps) => {
  const [localGcalId, setLocalGcalId] = useState(gcalId);
  const [localApiUrl, setLocalApiUrl] = useState(apiUrl);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ status: 'idle' | 'success' | 'error'; message: string }>({
    status: 'idle',
    message: ''
  });

  useEffect(() => {
    setLocalGcalId(gcalId);
    setLocalApiUrl(apiUrl);
    setTestResult({ status: 'idle', message: '' });
  }, [isOpen, gcalId, apiUrl]);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult({ status: 'idle', message: 'Sedang menyemak sambungan Google Calendar...' });
    try {
      const url = `${localApiUrl}?source=gcal&gcal_id=${encodeURIComponent(localGcalId)}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.status === 'success') {
        const count = Array.isArray(data.data) ? data.data.length : 0;
        setTestResult({
          status: 'success',
          message: `Sambungan ke Google Calendar (${localGcalId}) berjaya! Ditemui ${count} acara.`
        });
      } else {
        setTestResult({
          status: 'error',
          message: `Maklum balas: ${data.message || 'Kalendar tidak dapat diakses'}`
        });
      }
    } catch (err: any) {
      setTestResult({
        status: 'error',
        message: `Ralat sambungan: ${err?.message || 'Gagal menghubungi pelayan skrip'}`
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(localGcalId.trim(), localApiUrl.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose}></div>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl relative z-10 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 text-blue-400 rounded-lg border border-blue-400/30">
              <Settings size={20} />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight">Integrasi Pangkalan Data & Google Calendar</h3>
              <p className="text-xs text-slate-400">Pengurusan sambungan Google Sheets (Draf) dan Google Calendar (Rasmi)</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-800 rounded-full transition text-slate-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 text-slate-800">

          {/* Google Sheets Status Banner */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
            <Database className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-blue-800">Pangkalan Data Google Sheets</h4>
                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold rounded-full border border-blue-200 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600 inline-block"></span>
                  Terhubung & Aktif
                </span>
              </div>
              <p className="text-xs text-blue-950 mt-1 font-semibold">Helaian: Events (Draf Takwim SK Felda Raja Alias 3)</p>
              <p className="text-[11px] text-blue-700 font-mono mt-0.5 break-all">ID Spreadsheet: {DEFAULT_SHEET_ID}</p>
              <div className="mt-2.5">
                <a
                  href={`https://docs.google.com/spreadsheets/d/${DEFAULT_SHEET_ID}/edit`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-medium transition shadow-sm"
                >
                  <FileSpreadsheet size={13} />
                  <span>Buka Google Spreadsheet Pangkalan Data</span>
                  <ExternalLink size={11} />
                </a>
              </div>
            </div>
          </div>
          
          {/* Active Target Banner */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-800">Google Calendar Rasmi</h4>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-full border border-emerald-200 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 inline-block"></span>
                  Terhubung
                </span>
              </div>
              <p className="text-sm font-semibold text-emerald-950 break-all mt-0.5">{localGcalId}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <a
                  href="https://calendar.google.com/calendar/u/0/r"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-medium transition"
                >
                  <ExternalLink size={12} />
                  <span>Buka Google Calendar Web</span>
                </a>
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={isTesting}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-emerald-100 text-emerald-700 border border-emerald-300 rounded-md text-xs font-medium transition disabled:opacity-50"
                >
                  {isTesting ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
                  <span>Uji Sambungan</span>
                </button>
              </div>
            </div>
          </div>

          {/* Test Result Message */}
          {testResult.status !== 'idle' && (
            <div className={`p-3.5 rounded-lg text-xs flex items-start gap-2.5 border ${
              testResult.status === 'success' 
                ? 'bg-green-50 text-green-800 border-green-200' 
                : 'bg-amber-50 text-amber-800 border-amber-200'
            }`}>
              {testResult.status === 'success' ? <CheckCircle size={16} className="text-green-600 shrink-0 mt-0.5" /> : <AlertCircle size={16} className="text-amber-600 shrink-0 mt-0.5" />}
              <div className="flex-1">
                <p className="font-medium">{testResult.message}</p>
              </div>
            </div>
          )}

          {/* Configuration Form */}
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                ID Emel Google Calendar
              </label>
              <input
                type="text"
                value={localGcalId}
                onChange={e => setLocalGcalId(e.target.value)}
                placeholder="cth: sekolah-5521-cm1@moe-dl.edu.my"
                className="w-full px-3 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-mono"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Semua acara Takwim Rasmi akan disinkronkan ke kalendar emel ini.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                URL Google Apps Script Web App (API Endpoint)
              </label>
              <input
                type="text"
                value={localApiUrl}
                onChange={e => setLocalApiUrl(e.target.value)}
                placeholder="https://script.google.com/macros/s/.../exec"
                className="w-full px-3 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-mono"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                URL skrip backend yang membaca dan menulis acara ke Google Spreadsheet & Google Calendar.
              </p>
            </div>

            {/* Instruction Accordion / Steps */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs space-y-2.5 text-slate-700">
              <h5 className="font-bold text-slate-900 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                Panduan Kebenaran Google Calendar ({localGcalId}):
              </h5>
              <ol className="list-decimal list-inside space-y-1.5 text-slate-600 leading-relaxed">
                <li>
                  Buka Google Calendar pada akaun <strong className="text-slate-800">{localGcalId}</strong>.
                </li>
                <li>
                  Pergi ke <strong>Settings</strong> &gt; Pilih kalendar sekolah anda &gt; <strong>Access permissions for events</strong>.
                </li>
                <li>
                  Tandakan <em>"Make available to public"</em> (atau <em>"Make available for MOE-DL"</em>) supaya aplikasi dapat membaca acara secara terus.
                </li>
                <li>
                  Jika anda ingin membenarkan kemas kini dan salinan dari Draf ke Google Calendar, pastikan skrip Google Apps Script dideploy menggunakan akaun emel sekolah atau dikongsi hak milik (Full Edit).
                </li>
              </ol>
            </div>

            <div className="pt-2 flex justify-between items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setLocalGcalId('sekolah-5521-cm1@moe-dl.edu.my');
                }}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium underline"
              >
                Reset ke Emel Rasmi Sekolah
              </button>
              
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-slate-600 text-xs font-medium hover:bg-slate-100 rounded-lg transition"
                >
                  Tutup
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition"
                >
                  Simpan Tetapan
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};