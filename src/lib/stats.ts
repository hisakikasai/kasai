import type { AppData, Certification, StudyLog } from '../types';
import { addDays, diffDays, todayYmd } from './date';

export function minutesByDate(logs: StudyLog[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const l of logs) map.set(l.date, (map.get(l.date) ?? 0) + l.minutes);
  return map;
}

/**
 * 連続記録日数。今日まだ記録していなくても昨日まで続いていれば途切れ扱いにしない
 * （朝に開いた時点で 0 日と表示されるとやる気が下がるため）。
 */
export function currentStreak(logs: StudyLog[], today: string = todayYmd()): number {
  const days = new Set(logs.filter((l) => l.minutes > 0).map((l) => l.date));
  let cursor = days.has(today) ? today : addDays(today, -1);
  let streak = 0;
  while (days.has(cursor)) {
    streak++;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

export function longestStreak(logs: StudyLog[]): number {
  const days = [...new Set(logs.filter((l) => l.minutes > 0).map((l) => l.date))].sort();
  let best = 0;
  let run = 0;
  let prev: string | undefined;
  for (const d of days) {
    run = prev && diffDays(prev, d) === 1 ? run + 1 : 1;
    best = Math.max(best, run);
    prev = d;
  }
  return best;
}

export interface CertProgress {
  planTotal: number;
  planDone: number;
  /** 0-1 */
  planRatio: number;
  studiedMinutes: number;
  targetMinutes?: number;
  /** 0-1 */
  hoursRatio?: number;
  /** 受験日までの日数（今日=0、過去は負） */
  daysLeft?: number;
  /** 目標達成に必要な 1 日あたりの分数 */
  requiredPerDay?: number;
  overdueTasks: number;
}

export function certProgress(cert: Certification, logs: StudyLog[], today: string = todayYmd()): CertProgress {
  const planTotal = cert.plan.length;
  const planDone = cert.plan.filter((p) => p.done).length;
  const studiedMinutes = logs.filter((l) => l.certId === cert.id).reduce((s, l) => s + l.minutes, 0);
  const targetMinutes = cert.targetHours ? cert.targetHours * 60 : undefined;
  const daysLeft = cert.examDate ? diffDays(today, cert.examDate) : undefined;
  let requiredPerDay: number | undefined;
  if (targetMinutes !== undefined && daysLeft !== undefined && daysLeft > 0) {
    requiredPerDay = Math.max(0, Math.ceil((targetMinutes - studiedMinutes) / daysLeft));
  }
  return {
    planTotal,
    planDone,
    planRatio: planTotal ? planDone / planTotal : 0,
    studiedMinutes,
    targetMinutes,
    hoursRatio: targetMinutes ? Math.min(1, studiedMinutes / targetMinutes) : undefined,
    daysLeft,
    requiredPerDay,
    overdueTasks: cert.plan.filter((p) => !p.done && p.dueDate && p.dueDate < today).length,
  };
}

export type AlertLevel = 'danger' | 'warn' | 'info';
export type AlertKind = 'noExamDate' | 'examPast' | 'booking' | 'overdueTasks' | 'unapplied' | 'noReceipt' | 'expiry' | 'backup';
export interface Alert {
  level: AlertLevel;
  kind: AlertKind;
  certId?: string;
  certName?: string;
  /** 件数・残り日数・項目名など補足 */
  detail?: string;
}

const ACTIVE = (c: Certification) => !c.archived;

/** ダッシュボードに出す「やり忘れ」の一覧 */
export function buildAlerts(data: AppData, today: string = todayYmd()): Alert[] {
  const alerts: Alert[] = [];
  for (const c of data.certifications.filter(ACTIVE)) {
    const p = certProgress(c, data.logs, today);
    const finished = c.status === 'passed' || c.status === 'failed';
    const base = { certId: c.id, certName: c.name };

    if (!finished && !c.examDate) alerts.push({ ...base, level: 'info', kind: 'noExamDate' });
    if (!finished && p.daysLeft !== undefined && p.daysLeft < 0) alerts.push({ ...base, level: 'warn', kind: 'examPast' });
    if (c.status === 'studying' && p.daysLeft !== undefined && p.daysLeft >= 0 && p.daysLeft <= 30) {
      alerts.push({ ...base, level: 'warn', kind: 'booking', detail: `D-${p.daysLeft}` });
    }
    if (p.overdueTasks > 0) alerts.push({ ...base, level: 'warn', kind: 'overdueTasks', detail: String(p.overdueTasks) });
    for (const e of c.expenses) {
      if (e.status === 'unapplied') {
        const overdue = !!e.deadline && e.deadline < today;
        alerts.push({ ...base, level: overdue ? 'danger' : 'warn', kind: 'unapplied', detail: e.label });
      } else if (!e.receiptSaved && e.status !== 'paid') {
        alerts.push({ ...base, level: 'info', kind: 'noReceipt', detail: e.label });
      }
    }
    if (c.expiresAt) {
      const left = diffDays(today, c.expiresAt);
      if (left <= 90) alerts.push({ ...base, level: left < 0 ? 'danger' : 'warn', kind: 'expiry', detail: `${left}d` });
    }
  }

  const hasData = data.certifications.length > 0 || data.logs.length > 0;
  const last = data.settings.lastBackupAt;
  if (hasData && (!last || diffDays(last.slice(0, 10), today) >= 30)) {
    alerts.push({ level: 'info', kind: 'backup' });
  }

  const order: Record<AlertLevel, number> = { danger: 0, warn: 1, info: 2 };
  return alerts.sort((a, b) => order[a.level] - order[b.level]);
}
