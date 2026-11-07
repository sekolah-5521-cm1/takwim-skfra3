import { SchoolData } from "./types";

export const DEFAULT_GCAL_ID = "sekolah-5521-cm1@moe-dl.edu.my";
export const DEFAULT_SHEET_ID = "1Vwv--4En_xUeJ8Kaal1oqH3pSJxuK1DPTvHJwPkXBps";
export const API_URL = "https://script.google.com/macros/s/AKfycbyhSDwebNChChJEKT_KbjLG8URQXgGnYyGLud2ZpLvDtu2ng4ZgCcgHKN3-5eHIBDeF/exec";

export const STORAGE_KEYS = {
  GCAL_ID: 'takwim_gcal_id',
  API_URL: 'takwim_api_url'
};

export const SCHOOL_DATA: SchoolData = {
  terms: [
    { name: "Penggal 1", start: "2026-01-12", end: "2026-03-20" },
    { name: "Cuti Penggal 1", start: "2026-03-21", end: "2026-03-29", isHoliday: true },
    { name: "Penggal 2", start: "2026-03-30", end: "2026-05-22" },
    { name: "Cuti Pertengahan Tahun", start: "2026-05-23", end: "2026-06-07", isHoliday: true },
    { name: "Penggal 3", start: "2026-06-08", end: "2026-08-28" },
    { name: "Cuti Penggal 2", start: "2026-08-29", end: "2026-09-06", isHoliday: true },
    { name: "Penggal 4", start: "2026-09-07", end: "2026-12-04" },
    { name: "Cuti Akhir Persekolahan", start: "2026-12-05", end: "2026-12-31", isHoliday: true },
  ]
};

export const CATEGORY_STYLES: Record<string, string> = {
  academic: "bg-blue-100 text-blue-800 border-blue-200",
  holiday: "bg-red-100 text-red-800 border-red-200",
  exam: "bg-yellow-100 text-yellow-800 border-yellow-200",
  program: "bg-purple-100 text-purple-800 border-purple-200",
  hem: "bg-green-100 text-green-800 border-green-200",
  koko: "bg-orange-100 text-orange-800 border-orange-200",
  meeting: "bg-gray-100 text-gray-800 border-gray-200",
  default: "bg-white text-gray-800 border-gray-100"
};

export const CATEGORY_LABELS: Record<string, string> = {
  academic: "Akademik/Sekolah",
  holiday: "Cuti",
  exam: "Peperiksaan",
  program: "Program Sekolah",
  hem: "Hal Ehwal Murid",
  koko: "Kokurikulum",
  meeting: "Mesyuarat"
};

export const MONTH_NAMES = [
  "Januari", "Februari", "Mac", "April", "Mei", "Jun",
  "Julai", "Ogos", "September", "Oktober", "November", "Disember"
];