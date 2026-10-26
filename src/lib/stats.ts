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
export interface Alert {
  level: AlertLevel;
  message: string;
  certId?: string;
}

const ACTIVE = (c: Certification) => !c.archived;

/** ダッシュボードに出す「やり忘れ」の一覧 */
export function buildAlerts(data: AppData, today: string = todayYmd()): Alert[] {
  const alerts: Alert[] = [];
  for (const c of data.certifications.filter(ACTIVE)) {
    const p = certProgress(c, data.logs, today);
    const finished = c.status === 'passed' || c.status === 'failed';

    if (!finished && !c.examDate) {
      alerts.push({ level: 'info', certId: c.id, message: `${c.name}: 受験日が未設定です` });
    }
    if (!finished && c.examDate && p.daysLeft !== undefined && p.daysLeft < 0) {
      alerts.push({ level: 'warn', certId: c.id, message: `${c.name}: 受験日を過ぎています。結果（合格/不合格）を記録しましょう` });
    }
    if (c.status === 'studying' && p.daysLeft !== undefined && p.daysLeft >= 0 && p.daysLeft <= 30) {
      alerts.push({ level: 'warn', certId: c.id, message: `${c.name}: 受験日まで${p.daysLeft}日。受験予約は済んでいますか？` });
    }
    if (p.overdueTasks > 0) {
      alerts.push({ level: 'warn', certId: c.id, message: `${c.name}: 期限切れの勉強予定が${p.overdueTasks}件あります` });
    }
    for (const e of c.expenses) {
      if (e.status === 'unapplied') {
        const overdue = e.deadline && e.deadline < today;
        alerts.push({
          level: overdue ? 'danger' : 'warn',
          certId: c.id,
          message: `${c.name}: ${e.label || '経費'} が未申請${e.deadline ? `（期限 ${e.deadline}${overdue ? ' 超過' : ''}）` : ''}`,
        });
      } else if (!e.receiptSaved && e.status !== 'paid') {
        alerts.push({ level: 'info', certId: c.id, message: `${c.name}: ${e.label || '経費'} の領収書が未保存です` });
      }
    }
    if (c.expiresAt) {
      const left = diffDays(today, c.expiresAt);
      if (left <= 90) {
        alerts.push({
          level: left < 0 ? 'danger' : 'warn',
          certId: c.id,
          message: left < 0 ? `${c.name}: 有効期限が切れています` : `${c.name}: 有効期限まで${left}日。更新の準備を`,
        });
      }
    }
  }

  const hasData = data.certifications.length > 0 || data.logs.length > 0;
  const last = data.settings.lastBackupAt;
  if (hasData && (!last || diffDays(last.slice(0, 10), today) >= 30)) {
    alerts.push({ level: 'info', message: 'データはこの端末のブラウザ内にのみ保存されています。設定からバックアップを取りましょう' });
  }

  const order: Record<AlertLevel, number> = { danger: 0, warn: 1, info: 2 };
  return alerts.sort((a, b) => order[a.level] - order[b.level]);
}
