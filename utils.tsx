import React from 'react';
import { BookOpen, Calendar, FileText, Activity, User, Users, Info } from 'lucide-react';
import { SchoolEvent, Term } from './types';
import { MONTH_NAMES } from './constants';

export const getCategoryIcon = (cat: string) => {
  switch(cat) {
    case 'academic': return <BookOpen className="w-4 h-4" />;
    case 'holiday': return <Calendar className="w-4 h-4" />;
    case 'exam': return <FileText className="w-4 h-4" />;
    case 'program': return <Activity className="w-4 h-4" />;
    case 'hem': return <User className="w-4 h-4" />;
    case 'koko': return <Activity className="w-4 h-4" />;
    case 'meeting': return <Users className="w-4 h-4" />;
    default: return <Info className="w-4 h-4" />;
  }
};

export const formatDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();

export const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

export const isDateInRange = (dateStr: string, startStr: string, endStr: string) => {
  return dateStr >= startStr && dateStr <= endStr;
};

export const formatEventDateRange = (evt: SchoolEvent) => {
  if (!evt.start) return "";
  const d1 = new Date(evt.start);
  if (!evt.end || evt.start === evt.end) {
      return `${d1.getDate()} ${MONTH_NAMES[d1.getMonth()]}`;
  }
  const d2 = new Date(evt.end);
  // Same month?
  if (d1.getMonth() === d2.getMonth()) {
      return `${d1.getDate()} - ${d2.getDate()} ${MONTH_NAMES[d1.getMonth()]}`;
  }
  return `${d1.getDate()} ${MONTH_NAMES[d1.getMonth()].slice(0,3)} - ${d2.getDate()} ${MONTH_NAMES[d2.getMonth()].slice(0,3)}`;
};

export const getEventsForDate = (date: Date, activeEvents: SchoolEvent[], terms: Term[]): SchoolEvent[] => {
  const dateStr = formatDate(date);
  
  // 1. Database/API Events (Check range overlap)
  let dailyEvents: SchoolEvent[] = activeEvents.filter(e => {
      if (!e.start) return false;
      const end = e.end || e.start;
      return dateStr >= e.start && dateStr <= end;
  });
  
  // 2. School Terms
  const term = terms.find(t => isDateInRange(dateStr, t.start, t.end));
  if (term) {
    if (dailyEvents.length === 0 || term.isHoliday) {
      dailyEvents.push({
        title: term.name,
        category: term.isHoliday ? 'holiday' : 'academic',
        isTermInfo: true
      });
    }
  }

  return dailyEvents;
};