const pad = (n: number) => String(n).padStart(2, '0');

/** Date をローカルタイムの YYYY-MM-DD に変換（toISOString は UTC になるため使わない） */
export function toYmd(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function todayYmd(now: Date = new Date()): string {
  return toYmd(now);
}

export function parseYmd(ymd: string): Date {
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(ymd: string, days: number): string {
  const d = parseYmd(ymd);
  d.setDate(d.getDate() + days);
  return toYmd(d);
}

/** to - from の日数（同日は 0） */
export function diffDays(from: string, to: string): number {
  const ms = parseYmd(to).getTime() - parseYmd(from).getTime();
  return Math.round(ms / 86_400_000);
}

export function formatYmd(ymd?: string): string {
  if (!ymd) return '未設定';
  const d = parseYmd(ymd);
  const w = '日月火水木金土'[d.getDay()];
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}(${w})`;
}

export function formatMinutes(min: number): string {
  if (min < 60) return `${min}分`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h}時間${m}分` : `${h}時間`;
}
