export interface Term {
  name: string;
  start: string;
  end: string;
  isHoliday?: boolean;
}

export interface SchoolEvent {
  id?: string;
  start?: string;
  end?: string;
  title: string;
  category: string;
  isTermInfo?: boolean;
}

export interface SchoolData {
  terms: Term[];
}