import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { SchoolEvent, Term } from '../types';
import { MONTH_NAMES, CATEGORY_STYLES } from '../constants';
import { formatDate, getDaysInMonth, getFirstDayOfMonth, getEventsForDate, isDateInRange } from '../utils';

interface CalendarSectionProps {
  currentDate: Date;
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  activeTab: 'draft' | 'public';
  prevMonth: () => void;
  nextMonth: () => void;
  activeEventsList: SchoolEvent[];
  terms: Term[];
  loading: boolean;
  gcalId?: string;
  onOpenSettings?: () => void;
}

export default function CalendarSection({
  currentDate,
  selectedDate,
  setSelectedDate,
  activeTab,
  prevMonth,
  nextMonth,
  activeEventsList,
  terms,
  loading,
  gcalId = 'sekolah-5521-cm1@moe-dl.edu.my',
  onOpenSettings
}: CalendarSectionProps) {

  const renderCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const days = [];

    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-24 bg-gray-50 border border-gray-100"></div>);
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const currentDayDate = new Date(year, month, d);
      const dateStr = formatDate(currentDayDate);
      const dayEvents = getEventsForDate(currentDayDate, activeEventsList, terms);
      
      let bgClass = "bg-white";
      const term = terms.find(t => isDateInRange(dateStr, t.start, t.end));
      if (term && term.isHoliday) bgClass = "bg-red-50";

      const specificHoliday = dayEvents.find(e => e.category === 'holiday' && !e.isTermInfo);
      const exam = dayEvents.find(e => e.category === 'exam');
      
      if (specificHoliday) bgClass = "bg-red-100";
      else if (exam) bgClass = "bg-yellow-50";

      const isSelected = formatDate(selectedDate) === dateStr;
      const hasSpecificEvents = dayEvents.some(e => !e.isTermInfo);

      // Filter actual events for display (exclude term info for the small list unless it's the only thing)
      const displayEvents = dayEvents.filter(e => !e.isTermInfo);

      days.push(
        <div 
          key={d} 
          onClick={() => setSelectedDate(currentDayDate)}
          className={`h-24 sm:h-28 border border-gray-100 p-1 relative cursor-pointer transition-colors duration-200 
            ${bgClass} hover:bg-blue-50 
            ${isSelected ? 'ring-2 ring-blue-600 z-10' : ''}`}
        >
          <div className="flex justify-between items-start">
            <span className={`text-sm font-semibold rounded-full w-6 h-6 flex items-center justify-center 
              ${isSelected ? 'bg-blue-600 text-white' : 'text-gray-700'}`}>
              {d}
            </span>
            
            {/* Desktop Only Dots */}
            {hasSpecificEvents && (
              <div className="hidden sm:flex gap-1 flex-wrap justify-end max-w-[3rem]">
                {dayEvents.some(e => !e.isTermInfo && e.category === 'exam') && <div className="w-2 h-2 rounded-full bg-yellow-500"></div>}
                {dayEvents.some(e => !e.isTermInfo && e.category === 'meeting') && <div className="w-2 h-2 rounded-full bg-gray-500"></div>}
                {dayEvents.some(e => !e.isTermInfo && e.category === 'program') && <div className="w-2 h-2 rounded-full bg-purple-500"></div>}
                {dayEvents.some(e => !e.isTermInfo && e.category === 'koko') && <div className="w-2 h-2 rounded-full bg-orange-500"></div>}
                {dayEvents.some(e => !e.isTermInfo && e.category === 'hem') && <div className="w-2 h-2 rounded-full bg-green-500"></div>}
                {dayEvents.some(e => !e.isTermInfo && e.category === 'academic') && <div className="w-2 h-2 rounded-full bg-blue-500"></div>}
                {dayEvents.some(e => !e.isTermInfo && e.category === 'holiday') && <div className="w-2 h-2 rounded-full bg-red-500"></div>}
              </div>
            )}
          </div>
          
          {/* Mobile View: Highlighted Text List (Replaces Dots) */}
          <div className="block sm:hidden mt-1 space-y-0.5 overflow-hidden">
            {displayEvents.slice(0, 3).map((evt, idx) => (
               <div 
                 key={idx} 
                 className={`text-[8px] leading-tight px-1 py-0.5 rounded truncate font-medium ${CATEGORY_STYLES[evt.category] || CATEGORY_STYLES.default}`}
               >
                 {evt.title}
               </div>
            ))}
            {displayEvents.length > 3 && (
               <div className="text-[8px] text-gray-400 text-center leading-none">...</div>
            )}
          </div>

          {/* Desktop View: Standard Text List */}
          <div className="hidden sm:block mt-1 space-y-1 overflow-hidden">
            {dayEvents.slice(0, 2).map((evt, idx) => (
              <div key={idx} className={`text-[10px] truncate px-1 rounded ${CATEGORY_STYLES[evt.category] || CATEGORY_STYLES.default}`}>
                {evt.title}
              </div>
            ))}
            {dayEvents.length > 2 && (
              <div className="text-[10px] text-gray-500 px-1">+{dayEvents.length - 2} lagi</div>
            )}
          </div>
        </div>
      );
    }
    return days;
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm p-4 border border-gray-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
              {activeTab === 'draft' ? (
                    <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wide">Draf Dalaman</span>
              ) : (
                    <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wide">Paparan Umum</span>
              )}
          </div>
          <h1 className="text-2xl font-bold text-slate-800">
              {activeTab === 'draft' ? 'Draf Takwim SK Felda Raja Alias 3' : 'Takwim Rasmi SK Felda Raja Alias 3'}
          </h1>
          <p className="text-slate-500 text-sm">Sesi Persekolahan 2026 {activeTab === 'public' && '(Google Calendar)'}</p>
        </div>
        
        <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
          <button onClick={prevMonth} className="p-2 hover:bg-white rounded-md shadow-sm transition"><ChevronLeft size={20}/></button>
          <div className="w-40 text-center font-semibold text-lg">{MONTH_NAMES[currentDate.getMonth()]} {currentDate.getFullYear()}</div>
          <button onClick={nextMonth} className="p-2 hover:bg-white rounded-md shadow-sm transition"><ChevronRight size={20}/></button>
        </div>
      </div>

      {/* Days Header */}
      <div className="grid grid-cols-7 mb-2 text-center text-sm font-medium text-gray-500">
        <div className="text-red-500">Ahd</div>
        <div>Isn</div>
        <div>Sel</div>
        <div>Rab</div>
        <div>Kha</div>
        <div>Jum</div>
        <div className="text-red-500">Sab</div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 bg-white border border-gray-200 rounded-lg overflow-hidden relative">
        {renderCalendar()}
      </div>
      
      <div className="mt-4 flex flex-wrap gap-3 text-xs text-gray-600 justify-center">
          <span className="flex items-center gap-1.5"><div className="w-3 h-3 bg-blue-100 border border-blue-300 rounded-xs"></div> Akademik</span>
          <span className="flex items-center gap-1.5"><div className="w-3 h-3 bg-red-100 border border-red-300 rounded-xs"></div> Cuti</span>
          <span className="flex items-center gap-1.5"><div className="w-3 h-3 bg-yellow-100 border border-yellow-300 rounded-xs"></div> Peperiksaan</span>
          <span className="flex items-center gap-1.5"><div className="w-3 h-3 bg-purple-100 border border-purple-300 rounded-xs"></div> Program</span>
          <span className="flex items-center gap-1.5"><div className="w-3 h-3 bg-green-100 border border-green-300 rounded-xs"></div> HEM</span>
          <span className="flex items-center gap-1.5"><div className="w-3 h-3 bg-orange-100 border border-orange-300 rounded-xs"></div> Kokurikulum</span>
          <span className="flex items-center gap-1.5"><div className="w-3 h-3 bg-gray-100 border border-gray-300 rounded-xs"></div> Mesyuarat</span>
      </div>
    </div>
  );
}