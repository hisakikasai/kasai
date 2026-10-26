export type CertStatus = 'planning' | 'studying' | 'booked' | 'passed' | 'failed';

export const CERT_STATUS_LABEL: Record<CertStatus, string> = {
  planning: '検討',
  studying: '勉強中',
  booked: '予約済',
  passed: '合格',
  failed: '不合格',
};

export interface StudyLink {
  id: string;
  label: string;
  url: string;
}

export interface PlanItem {
  id: string;
  title: string;
  /** YYYY-MM-DD */
  dueDate?: string;
  done: boolean;
  /** YYYY-MM-DD */
  doneAt?: string;
}

export type ExpenseKind = 'exam' | 'material' | 'other';
export type ExpenseStatus = 'unapplied' | 'applied' | 'approved' | 'paid';

export const EXPENSE_KIND_LABEL: Record<ExpenseKind, string> = {
  exam: '受験料',
  material: '教材',
  other: 'その他',
};

export const EXPENSE_STATUS_LABEL: Record<ExpenseStatus, string> = {
  unapplied: '未',
  applied: '申請',
  approved: '承認',
  paid: '精算',
};

export interface Expense {
  id: string;
  kind: ExpenseKind;
  label: string;
  amount: number;
  status: ExpenseStatus;
  /** 申請日 YYYY-MM-DD */
  appliedAt?: string;
  /** 申請期限 YYYY-MM-DD */
  deadline?: string;
  receiptSaved: boolean;
  note?: string;
}

export interface Certification {
  id: string;
  name: string;
  provider: string;
  status: CertStatus;
  /** 受験日 YYYY-MM-DD */
  examDate?: string;
  /** 受験時刻 HH:MM */
  examTime?: string;
  /** 会場 or オンライン */
  examLocation?: string;
  /** 予約番号・確認番号 */
  bookingRef?: string;
  /** 目標学習時間 (時間) */
  targetHours?: number;
  plan: PlanItem[];
  links: StudyLink[];
  expenses: Expense[];
  score?: string;
  /** 有効期限 YYYY-MM-DD (AWS は 3 年など) */
  expiresAt?: string;
  note?: string;
  archived?: boolean;
  createdAt: string;
}

export interface StudyLog {
  id: string;
  certId: string;
  /** 学習した日 YYYY-MM-DD（端末のローカル日付） */
  date: string;
  minutes: number;
  memo?: string;
  createdAt: string;
}

export interface ActiveTimer {
  certId: string;
  /** epoch ms */
  startedAt: number;
}

export interface Settings {
  dailyGoalMinutes: number;
  lastBackupAt?: string;
  lastCertId?: string;
}

export interface AppData {
  version: 1;
  certifications: Certification[];
  logs: StudyLog[];
  globalLinks: StudyLink[];
  settings: Settings;
  timer?: ActiveTimer;
}
