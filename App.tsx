import React, { useState, useEffect } from 'react';
import { Loader2, Sparkles } from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";

import Header from './components/Header';
import CalendarSection from './components/CalendarSection';
import Sidebar from './components/Sidebar';
import EventListSection from './components/EventListSection';
import { AddEditModal, DeleteModal, CopyModal, AIModal, BulkSyncModal, SyncConfirmationModal, CalendarSettingsModal } from './components/Modals';

import { SchoolEvent } from './types';
import { API_URL, SCHOOL_DATA, CATEGORY_LABELS, DEFAULT_GCAL_ID, STORAGE_KEYS } from './constants';
import { formatDate, getEventsForDate } from './utils';

interface LogItem {
    type: 'info' | 'success' | 'skip' | 'error';
    message: string;
}

export default function App() {
  const getInitialDate = () => {
    const today = new Date();
    // Default to 2026 for this specific calendar app
    return new Date(2026, today.getMonth(), today.getDate());
  };

  const [activeTab, setActiveTab] = useState<'draft' | 'public'>('draft');
  const [currentDate, setCurrentDate] = useState<Date>(getInitialDate()); 
  const [selectedDate, setSelectedDate] = useState<Date>(getInitialDate());
  
  const [draftEvents, setDraftEvents] = useState<SchoolEvent[]>([]);
  const [publicEvents, setPublicEvents] = useState<SchoolEvent[]>([]);
  
  const [loading, setLoading] = useState(true);

  // Google Calendar & API Configuration
  const [gcalId, setGcalId] = useState<string>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.GCAL_ID);
      if (stored && stored !== 'smaujn9@gmail.com' && !stored.includes('smaujn')) {
        return stored;
      }
      localStorage.setItem(STORAGE_KEYS.GCAL_ID, DEFAULT_GCAL_ID);
      return DEFAULT_GCAL_ID;
    } catch {
      return DEFAULT_GCAL_ID;
    }
  });
  const [apiUrl, setApiUrl] = useState<string>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.API_URL);
      if (stored && !stored.includes('AKfycbyxauDNUyzxhHLJtDT9gYD5mj88gJADkPCMPFd3JGIfWk34b_xxEftNsbGT4eoEoxxb')) {
        return stored;
      }
      localStorage.setItem(STORAGE_KEYS.API_URL, API_URL);
      return API_URL;
    } catch {
      return API_URL;
    }
  });
  const [isCalendarSettingsOpen, setIsCalendarSettingsOpen] = useState(false);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [eventToDeleteId, setEventToDeleteId] = useState<string | null>(null);
  const [bulkDeleteIds, setBulkDeleteIds] = useState<string[]>([]);

  // AI Modal State
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [aiInputText, setAiInputText] = useState("");
  const [aiCategory, setAiCategory] = useState("auto");
  const [isProcessingAI, setIsProcessingAI] = useState(false);

  // Copy Modal State
  const [isCopyModalOpen, setIsCopyModalOpen] = useState(false);
  const [eventToCopy, setEventToCopy] = useState<SchoolEvent | null>(null);

  // Bulk Sync Modal State
  const [isBulkSyncModalOpen, setIsBulkSyncModalOpen] = useState(false);
  const [isSyncConfirmModalOpen, setIsSyncConfirmModalOpen] = useState(false);
  const [syncLogs, setSyncLogs] = useState<LogItem[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncTotal, setSyncTotal] = useState(0);
  const [syncProgress, setSyncProgress] = useState(0);
  const [pendingSyncData, setPendingSyncData] = useState<{ category: string, ids?: string[] } | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingEvent, setEditingEvent] = useState<SchoolEvent | null>(null);
  const [formData, setFormData] = useState({ title: '', category: 'academic', start: '', end: '' });

  // --- API FUNCTIONS ---
  
  const fetchDraftEvents = async () => {
    setLoading(true);
    try {
      const response = await fetch(apiUrl);
      const result = await response.json();
      if (result.status === 'success') {
        setDraftEvents(result.data);
      } else {
        console.error("Failed to fetch draft:", result.message);
      }
    } catch (error) {
      console.error("Error fetching draft events:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPublicEvents = async () => {
    setLoading(true);
    try {
        const response = await fetch(`${apiUrl}?source=gcal&gcal_id=${encodeURIComponent(gcalId)}`);
        const result = await response.json();
        
        if (result.status === 'success') {
            setPublicEvents(result.data);
        } else {
            console.warn("GCal fetch warning:", result.message);
            setPublicEvents([]);
        }
    } catch (error) {
        console.error("Error fetching public GCal events:", error);
    } finally {
        setLoading(false);
    }
  };

  const saveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    if (formData.end && formData.start && formData.end < formData.start) {
        alert("Tarikh tamat tidak boleh sebelum tarikh mula.");
        setIsSubmitting(false);
        return;
    }

    try {
      const action = editingEvent ? 'update' : 'create';
      const payload = {
        action,
        source: activeTab === 'public' ? 'gcal' : 'draft',
        id: editingEvent ? editingEvent.id : undefined,
        title: formData.title,
        category: formData.category,
        start: formData.start,
        end: formData.end || formData.start,
        gcal_id: gcalId
      };

      await fetch(apiUrl, {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (activeTab === 'public') {
          await fetchPublicEvents();
      } else {
          await fetchDraftEvents();
      }
      closeModal();
    } catch (error) {
      console.error("Error saving:", error);
      alert("Ralat menyimpan data. Sila cuba lagi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Trigger modal delete (Single)
  const openDeleteModal = (id: string) => {
    setEventToDeleteId(id);
    setBulkDeleteIds([]); // Clear bulk
    setIsDeleteModalOpen(true);
  };

  // Trigger modal delete (Bulk)
  const openBulkDeleteModal = (ids: string[]) => {
      setBulkDeleteIds(ids);
      setEventToDeleteId(null); // Clear single
      setIsDeleteModalOpen(true);
  };

  const handleClearAllDraft = () => {
      const allIds = draftEvents.filter(e => e.id).map(e => e.id as string);
      if (allIds.length === 0) return;
      openBulkDeleteModal(allIds);
  };

  // The actual API call for bulk delete
  const performBulkDelete = async (ids: string[]) => {
      const isAllDraft = activeTab === 'draft' && ids.length >= draftEvents.length;
      await fetch(apiUrl, {
             method: 'POST',
             body: JSON.stringify({
                 action: isAllDraft ? 'clear_all' : 'bulk_delete',
                 ids: ids,
                 source: activeTab === 'public' ? 'gcal' : 'draft',
                 gcal_id: gcalId
             })
         });
  };

  // The actual API call for single delete
  const performSingleDelete = async (id: string) => {
       await fetch(apiUrl, {
        method: 'POST',
        body: JSON.stringify({ 
            action: 'delete', 
            id: id,
            source: activeTab === 'public' ? 'gcal' : 'draft',
            gcal_id: gcalId
        }),
      });
  };

  const confirmDelete = async () => {
    setIsSubmitting(true); 
    try {
      const isClearingAllDraft = activeTab === 'draft' && bulkDeleteIds.length >= draftEvents.length;

      if (bulkDeleteIds.length > 0) {
          await performBulkDelete(bulkDeleteIds);
      } else if (eventToDeleteId) {
          await performSingleDelete(eventToDeleteId);
      }
      
      if (activeTab === 'public') {
          await fetchPublicEvents();
      } else {
          if (isClearingAllDraft) {
              setDraftEvents([]);
          } else {
              await fetchDraftEvents();
          }
      }
      setIsDeleteModalOpen(false);
      setEventToDeleteId(null);
      setBulkDeleteIds([]);
    } catch (error) {
      console.error("Error deleting:", error);
      alert("Ralat memadam data.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- COPY TO GCAL LOGIC ---
  const openCopyModal = (evt: SchoolEvent) => {
      setEventToCopy(evt);
      setIsCopyModalOpen(true);
  };

  const confirmCopy = async () => {
    if (!eventToCopy || !eventToCopy.id) return;
    setIsSubmitting(true);

    try {
        await fetch(apiUrl, {
            method: 'POST',
            body: JSON.stringify({
                action: 'copy_to_gcal',
                id: eventToCopy.id,
                gcal_id: gcalId
            }),
        });
        
        await fetchPublicEvents();
        setIsCopyModalOpen(false);
        setEventToCopy(null);
        alert(`"${eventToCopy.title}" berjaya ditambah ke Takwim Rasmi (Google Calendar: ${gcalId}).`);
    } catch (error) {
        console.error("Error copying to GCal:", error);
        alert("Gagal menyalin ke Google Calendar.");
    } finally {
        setIsSubmitting(false);
    }
  };

  // --- BULK SYNC LOGIC ---
  const handleBulkSync = (category: string, specificIds?: string[]) => {
      setPendingSyncData({ category, ids: specificIds });
      setIsSyncConfirmModalOpen(true);
  };

  const runBulkSync = async () => {
    setIsSyncConfirmModalOpen(false);
    setSyncLogs([]);
    setSyncProgress(0);
    setIsSyncing(true);
    setIsBulkSyncModalOpen(true);

    const { category, ids } = pendingSyncData || { category: 'all' };

    const addLog = (item: LogItem) => {
        setSyncLogs(prev => [...prev, item]);
    };

    // 1. Filter events 
    let eventsToSync: SchoolEvent[] = [];
    if (ids && ids.length > 0) {
        // Sync specifically selected IDs
        eventsToSync = draftEvents.filter(e => e.id && ids.includes(e.id));
        addLog({ type: 'info', message: `Memproses ${eventsToSync.length} acara yang dipilih...` });
    } else {
        // Sync by category
        eventsToSync = draftEvents.filter(e => category === 'all' || e.category === category);
        addLog({ type: 'info', message: `Memproses semua acara kategori "${CATEGORY_LABELS[category] || 'Semua'}"...` });
    }

    setSyncTotal(eventsToSync.length);

    if (eventsToSync.length === 0) {
        addLog({ type: 'info', message: 'Tiada acara untuk disinkronkan.' });
        setIsSyncing(false);
        return;
    }

    // 2. Fetch latest Public Events for comparison
    addLog({ type: 'info', message: `Menyemak data Takwim Rasmi (${gcalId}) terkini...` });
    let currentPublicEvents = publicEvents;
    try {
         const response = await fetch(`${apiUrl}?source=gcal&gcal_id=${encodeURIComponent(gcalId)}`);
         const result = await response.json();
         if(result.status === 'success') currentPublicEvents = result.data;
    } catch (e) {
        addLog({type: 'error', message: 'Gagal mendapatkan data terkini. Menggunakan cache.'});
    }

    // 3. Loop and Process
    let successCount = 0;
    let skipCount = 0;

    for (let i = 0; i < eventsToSync.length; i++) {
        const evt = eventsToSync[i];
        setSyncProgress(i + 1);

        // Duplicate Check (Simple: Same Title & Start Date)
        const isDuplicate = currentPublicEvents.some(
            p => p.start === evt.start && p.title.toLowerCase().trim() === evt.title.toLowerCase().trim()
        );

        if (isDuplicate) {
            addLog({ type: 'skip', message: `[Langkau] "${evt.title}" (Sudah wujud)` });
            skipCount++;
            continue;
        }

        try {
            // Call API to Copy
            const res = await fetch(apiUrl, {
                method: 'POST',
                body: JSON.stringify({
                    action: 'copy_to_gcal',
                    id: evt.id,
                    gcal_id: gcalId
                }),
            });
            const data = await res.json();
            
            if (data.status === 'success') {
                addLog({ type: 'success', message: `[Berjaya] "${evt.title}" ditambah.` });
                successCount++;
            } else {
                addLog({ type: 'error', message: `[Gagal] "${evt.title}": ${data.message}` });
            }

            // Small delay to prevent rate limit and allow UI update
            await new Promise(r => setTimeout(r, 500));

        } catch (error) {
             addLog({ type: 'error', message: `[Ralat Rangkaian] "${evt.title}"` });
        }
    }

    addLog({ type: 'info', message: `Proses Selesai! Ditambah: ${successCount}, Dilangkau: ${skipCount}` });
    setIsSyncing(false);
    
    // Refresh public events if any changes made
    if (successCount > 0) {
        fetchPublicEvents();
    }
  };

  // --- AI LOGIC ---
  const openAIModal = (category: string = "auto") => {
      setAiCategory(category === 'all' ? 'auto' : category);
      setAiInputText("");
      setIsAIModalOpen(true);
  };

  const handleAIProcess = async () => {
    if (!aiInputText.trim()) return;
    setIsProcessingAI(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `
        Anda adalah pembantu takwim sekolah. Ekstrak senarai acara dari teks yang diberikan ke dalam format JSON.
        
        Kategori yang dibenarkan:
        - academic (untuk persekolahan, kelas, bengkel)
        - holiday (cuti, pelepasan)
        - exam (peperiksaan, ujian)
        - program (program sekolah, sambutan)
        - hem (hal ehwal murid, asrama, disiplin)
        - koko (sukan, kelab, persatuan)
        - meeting (mesyuarat)

        Jika kategori tidak jelas, gunakan 'program'.
        Tarikh mesti dalam format YYYY-MM-DD. Jika tiada tarikh tamat, gunakan tarikh mula sebagai tarikh tamat.
        Tahun semasa adalah 2026.

        Teks Input:
        "${aiInputText}"
      `;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                start: { type: Type.STRING },
                end: { type: Type.STRING },
                category: { type: Type.STRING }
              },
              required: ["title", "start", "category"]
            }
          }
        }
      });

      const parsedEvents = JSON.parse(response.text);
      
      // Apply forced category if selected
      const extractedEvents = parsedEvents.map((evt: any) => ({
          ...evt,
          category: aiCategory !== 'auto' ? aiCategory : (evt.category || 'program')
      }));

      if (extractedEvents.length > 0) {
        const apiResponse = await fetch(apiUrl, {
          method: 'POST',
          body: JSON.stringify({ 
              action: 'bulk_create', 
              events: extractedEvents,
              source: activeTab === 'public' ? 'gcal' : 'draft',
              gcal_id: gcalId
          }),
        });
        
        const result = await apiResponse.json();
        
        if (result.status === 'success') {
          alert(`Proses Selesai!\n${result.added} acara ditambah.\n${result.duplicates} acara diabaikan (duplikasi).`);
          if (activeTab === 'public') await fetchPublicEvents();
          else await fetchDraftEvents();
          
          setAiInputText("");
          setIsAIModalOpen(false);
        } else {
          alert("Ralat menyimpan data ke pangkalan data.");
        }
      } else {
        alert("Tiada acara dapat diekstrak dari teks tersebut.");
      }

    } catch (error) {
      console.error("AI Processing Error:", error);
      alert("Berlaku ralat semasa memproses AI. Sila cuba lagi.");
    } finally {
      setIsProcessingAI(false);
    }
  };

  useEffect(() => {
    fetchDraftEvents();
    fetchPublicEvents();
  }, []);

  const [selectedEvents, setSelectedEvents] = useState<SchoolEvent[]>([]);

  // Navigation Logic
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));

  // Modals Open Logic
  const openAddModal = (preselectedCategory?: string) => {
    setEditingEvent(null);
    const dateStr = formatDate(selectedDate);
    setFormData({
      title: '',
      category: preselectedCategory || 'program',
      start: dateStr,
      end: dateStr
    });
    setIsModalOpen(true);
  };

  const openEditModal = (evt: SchoolEvent) => {
    setEditingEvent(evt);
    setFormData({
      title: evt.title,
      category: evt.category,
      start: evt.start || '',
      end: evt.end || evt.start || ''
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingEvent(null);
  };

  const activeEventsList = activeTab === 'draft' ? draftEvents : publicEvents;

  useEffect(() => {
    const evts = getEventsForDate(selectedDate, activeEventsList, SCHOOL_DATA.terms);
    setSelectedEvents(evts);
  }, [selectedDate, draftEvents, publicEvents, activeTab]);

  return (
    <div className="min-h-screen bg-gray-100 font-sans text-slate-800">
      
      <Header 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        gcalId={gcalId}
        onOpenSettings={() => setIsCalendarSettingsOpen(true)}
      />

      <div className="pt-20 p-4">
      
      {/* Loading Overlay */}
      {loading && activeEventsList.length === 0 && (
         <div className="fixed inset-0 bg-white/80 z-50 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
               <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
               <p className="text-sm font-medium text-gray-600">Sedang memuat data...</p>
            </div>
         </div>
      )}

      {/* AI Processing Overlay */}
      {isProcessingAI && (
         <div className="fixed inset-0 bg-white/90 z-[70] flex items-center justify-center">
            <div className="flex flex-col items-center gap-4 animate-pulse">
               <Sparkles className="w-12 h-12 text-purple-600 animate-spin" />
               <div className="text-center">
                  <p className="text-lg font-bold text-gray-800">Sedang Memproses...</p>
                  <p className="text-sm text-gray-500">AI sedang membaca jadual anda dan menyimpannya.</p>
               </div>
            </div>
         </div>
      )}

      {/* MODALS */}
      <CalendarSettingsModal
        isOpen={isCalendarSettingsOpen}
        onClose={() => setIsCalendarSettingsOpen(false)}
        gcalId={gcalId}
        apiUrl={apiUrl}
        onSave={(newGcal, newApi) => {
          setGcalId(newGcal);
          setApiUrl(newApi);
          try {
            localStorage.setItem(STORAGE_KEYS.GCAL_ID, newGcal);
            localStorage.setItem(STORAGE_KEYS.API_URL, newApi);
          } catch (e) {
            console.warn("Storage error", e);
          }
          fetchPublicEvents();
        }}
        onRefreshCalendar={fetchPublicEvents}
      />

      <AIModal 
        isOpen={isAIModalOpen} 
        onClose={() => setIsAIModalOpen(false)} 
        activeTab={activeTab}
        aiInputText={aiInputText}
        setAiInputText={setAiInputText}
        isProcessingAI={isProcessingAI}
        handleAIProcess={handleAIProcess}
        aiCategory={aiCategory}
        setAiCategory={setAiCategory}
      />

      <BulkSyncModal 
        isOpen={isBulkSyncModalOpen}
        onClose={() => setIsBulkSyncModalOpen(false)}
        logs={syncLogs}
        isSyncing={isSyncing}
        total={syncTotal}
        progress={syncProgress}
      />

      <SyncConfirmationModal 
        isOpen={isSyncConfirmModalOpen}
        onClose={() => setIsSyncConfirmModalOpen(false)}
        onConfirm={runBulkSync}
        count={pendingSyncData?.ids ? pendingSyncData.ids.length : draftEvents.filter(e => pendingSyncData?.category === 'all' || e.category === pendingSyncData?.category).length}
        targetName={pendingSyncData?.category === 'all' ? 'Semua' : (CATEGORY_LABELS[pendingSyncData?.category || ''] || pendingSyncData?.category || '')}
        isSelection={!!pendingSyncData?.ids && pendingSyncData.ids.length > 0}
        gcalId={gcalId}
      />

      <AddEditModal 
        isOpen={isModalOpen} 
        onClose={closeModal} 
        onSubmit={saveEvent}
        formData={formData}
        setFormData={setFormData}
        isSubmitting={isSubmitting}
        editingEvent={editingEvent}
        activeTab={activeTab}
      />

      <DeleteModal 
        isOpen={isDeleteModalOpen} 
        onClose={() => setIsDeleteModalOpen(false)} 
        onConfirm={confirmDelete}
        isSubmitting={isSubmitting}
        activeTab={activeTab}
        count={bulkDeleteIds.length || 1}
      />

      <CopyModal 
        isOpen={isCopyModalOpen} 
        onClose={() => setIsCopyModalOpen(false)} 
        onConfirm={confirmCopy}
        isSubmitting={isSubmitting}
        eventToCopy={eventToCopy}
        gcalId={gcalId}
      />

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* 1. Calendar (Top Mobile, Left Top Desktop) */}
        <div className="lg:col-span-2">
          <CalendarSection 
            currentDate={currentDate}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            activeTab={activeTab}
            prevMonth={prevMonth}
            nextMonth={nextMonth}
            activeEventsList={activeEventsList}
            terms={SCHOOL_DATA.terms}
            loading={loading}
            gcalId={gcalId}
            onOpenSettings={() => setIsCalendarSettingsOpen(true)}
          />
        </div>

        {/* 2. Sidebar (Middle Mobile, Right Desktop) */}
        <div className="lg:col-span-1 lg:row-span-2 h-fit">
            <Sidebar 
            selectedDate={selectedDate}
            currentDate={currentDate}
            selectedEvents={selectedEvents}
            activeEventsList={activeEventsList}
            activeTab={activeTab}
            openAddModal={() => openAddModal()}
            openEditModal={openEditModal}
            openDeleteModal={openDeleteModal}
            openCopyModal={openCopyModal}
            openAIModal={openAIModal}
            copyingId={eventToCopy?.id}
            />
        </div>

        {/* 3. Event List (Bottom Mobile, Left Bottom Desktop) */}
        <div className="lg:col-span-2">
            <EventListSection 
            events={activeEventsList}
            activeTab={activeTab}
            openEditModal={openEditModal}
            openDeleteModal={openDeleteModal}
            openAddModal={openAddModal}
            openCopyModal={openCopyModal}
            copyingId={eventToCopy?.id}
            openAIModal={openAIModal}
            handleBulkSync={handleBulkSync}
            handleBulkDelete={openBulkDeleteModal}
            handleClearAllDraft={handleClearAllDraft}
            />
        </div>
        
      </div>
      </div>
    </div>
  );
}