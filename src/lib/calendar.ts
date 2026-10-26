import type { Certification } from '../types';
import { addDays } from './date';

const compact = (ymd: string) => ymd.replaceAll('-', '');

function escapeIcs(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/;/g, '\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}

function timeRange(cert: Certification): { start: string; end: string } | null {
  if (!cert.examDate) return null;
  if (cert.examTime) {
    const [h, m] = cert.examTime.split(':').map(Number);
    const endH = String(Math.min(23, h + 2)).padStart(2, '0');
    const t = `${String(h).padStart(2, '0')}${String(m).padStart(2, '0')}00`;
    return { start: `${compact(cert.examDate)}T${t}`, end: `${compact(cert.examDate)}T${endH}${t.slice(2)}` };
  }
  return { start: compact(cert.examDate), end: compact(addDays(cert.examDate, 1)) };
}

/** 受験日の .ics（前日・1週間前のリマインダー付き）。時刻はローカル時刻（フローティング）として出力 */
export function examToIcs(cert: Certification, now: Date = new Date()): string | null {
  const range = timeRange(cert);
  if (!range) return null;
  const allDay = !cert.examTime;
  const stamp = now.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const desc = [cert.bookingRef && `予約番号: ${cert.bookingRef}`, cert.note].filter(Boolean).join('\n');
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//shikaku-manager//JP',
    'BEGIN:VEVENT',
    `UID:${cert.id}@shikaku-manager`,
    `DTSTAMP:${stamp}`,
    allDay ? `DTSTART;VALUE=DATE:${range.start}` : `DTSTART:${range.start}`,
    allDay ? `DTEND;VALUE=DATE:${range.end}` : `DTEND:${range.end}`,
    `SUMMARY:${escapeIcs(`【受験】${cert.name}`)}`,
    cert.examLocation ? `LOCATION:${escapeIcs(cert.examLocation)}` : '',
    desc ? `DESCRIPTION:${escapeIcs(desc)}` : '',
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    'DESCRIPTION:受験1週間前',
    'TRIGGER:-P7D',
    'END:VALARM',
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    'DESCRIPTION:受験前日',
    'TRIGGER:-P1D',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ]
    .filter(Boolean)
    .join('\r\n');
}

export function googleCalendarUrl(cert: Certification): string | null {
  const range = timeRange(cert);
  if (!range) return null;
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: `【受験】${cert.name}`,
    dates: `${range.start}/${range.end}`,
    details: [cert.bookingRef && `予約番号: ${cert.bookingRef}`, cert.note].filter(Boolean).join('\n'),
    location: cert.examLocation ?? '',
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
