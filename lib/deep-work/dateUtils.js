export function todayDateStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function toDateStr(date) {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function startOfWeek(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function startOfMonth(date = new Date()) {
  const d = new Date(date);
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function minutesBetween(start, end) {
  const ms = new Date(end).getTime() - new Date(start).getTime();
  return Math.max(0, Math.round(ms / 60000));
}

export function formatMinutes(mins) {
  const m = Math.max(0, Math.round(mins || 0));
  if (m < 60) return `${m} dk`;
  const h = Math.floor(m / 60);
  const r = m % 60;
  return r ? `${h} sa ${r} dk` : `${h} sa`;
}

export function monthDays(year, month) {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const days = [];
  for (let d = 1; d <= last.getDate(); d++) {
    days.push(new Date(year, month, d));
  }
  return { first, last, days };
}

/** 3 gün: dün, bugün, yarın (-1 … +1). Bugün index 1. */
export function boardWeekDates(anchor = new Date()) {
  const base = new Date(anchor);
  base.setHours(12, 0, 0, 0);
  const days = [];
  for (let offset = -1; offset <= 1; offset++) {
    const d = new Date(base);
    d.setDate(base.getDate() + offset);
    days.push(d);
  }
  return days;
}

export function lastNDateStrs(n = 7, end = new Date()) {
  const out = [];
  const base = new Date(end);
  base.setHours(12, 0, 0, 0);
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(base);
    d.setDate(base.getDate() - i);
    out.push(toDateStr(d));
  }
  return out;
}

const DAY_LABELS_TR = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"];
const MONTH_LABELS_TR = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];

export function dayLabelShort(date) {
  const d = new Date(date);
  return DAY_LABELS_TR[d.getDay()];
}

export function dayHeaderLabel(date) {
  const d = new Date(date);
  return `${DAY_LABELS_TR[d.getDay()]} ${d.getDate()} ${MONTH_LABELS_TR[d.getMonth()]}`;
}

export function addDaysToDateStr(dateStr, days) {
  const d = new Date(`${dateStr}T12:00:00`);
  d.setDate(d.getDate() + days);
  return toDateStr(d);
}
