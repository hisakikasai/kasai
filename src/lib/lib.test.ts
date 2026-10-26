import { describe, expect, it } from 'vitest';
import { addDays, diffDays, toYmd } from './date';
import { normalizeUrl } from './url';
import { buildAlerts, certProgress, currentStreak, longestStreak } from './stats';
import { emptyData, normalizeData } from './storage';
import { examToIcs, googleCalendarUrl } from './calendar';
import type { Certification, StudyLog } from '../types';

const log = (date: string, minutes = 30, certId = 'c1'): StudyLog => ({ id: date + certId + minutes, certId, date, minutes, createdAt: '' });
const cert = (over: Partial<Certification> = {}): Certification => ({
  id: 'c1', name: 'SAA', provider: 'AWS', status: 'studying', plan: [], links: [], expenses: [], createdAt: '', ...over,
});

describe('date', () => {
  it('ローカル日付で計算する', () => {
    expect(toYmd(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05');
    expect(addDays('2026-02-28', 1)).toBe('2026-03-01');
    expect(addDays('2026-01-01', -1)).toBe('2025-12-31');
    expect(diffDays('2026-10-26', '2026-11-25')).toBe(30);
  });
});

describe('normalizeUrl', () => {
  it('http(s) のみ許可し、スキームを補完する', () => {
    expect(normalizeUrl('skillbuilder.aws')).toBe('https://skillbuilder.aws/');
    expect(normalizeUrl('https://example.com/a?b=1')).toBe('https://example.com/a?b=1');
    expect(normalizeUrl('javascript:alert(1)')).toBeNull();
    expect(normalizeUrl('data:text/html,hi')).toBeNull();
    expect(normalizeUrl('not a url')).toBeNull();
    expect(normalizeUrl('')).toBeNull();
  });
});

describe('streak', () => {
  const today = '2026-10-26';
  it('今日未記録でも昨日まで続いていれば継続中', () => {
    expect(currentStreak([log('2026-10-25'), log('2026-10-24')], today)).toBe(2);
  });
  it('今日を含めて数える', () => {
    expect(currentStreak([log('2026-10-26'), log('2026-10-25'), log('2026-10-23')], today)).toBe(2);
  });
  it('一昨日で途切れていれば 0', () => {
    expect(currentStreak([log('2026-10-24')], today)).toBe(0);
  });
  it('最長記録', () => {
    expect(longestStreak([log('2026-10-01'), log('2026-10-02'), log('2026-10-03'), log('2026-10-10'), log('2026-10-10', 10)])).toBe(3);
  });
});

describe('certProgress', () => {
  it('残り時間から 1 日あたりの必要時間を出す', () => {
    const c = cert({ examDate: '2026-11-05', targetHours: 20, plan: [{ id: 'p', title: 't', done: true }, { id: 'q', title: 'u', done: false, dueDate: '2026-10-20' }] });
    const p = certProgress(c, [log('2026-10-25', 120 * 5)], '2026-10-26');
    expect(p.daysLeft).toBe(10);
    expect(p.studiedMinutes).toBe(600);
    expect(p.requiredPerDay).toBe(60);
    expect(p.planRatio).toBe(0.5);
    expect(p.overdueTasks).toBe(1);
  });
});

describe('buildAlerts', () => {
  it('未申請経費・受験日経過・バックアップ未実施を検出', () => {
    const data = emptyData();
    data.certifications.push(
      cert({ examDate: '2026-10-01', expenses: [{ id: 'e', kind: 'exam', label: '受験料', amount: 15000, status: 'unapplied', receiptSaved: false, deadline: '2026-10-20' }] }),
    );
    const msgs = buildAlerts(data, '2026-10-26');
    expect(msgs[0].level).toBe('danger');
    expect(msgs.some((a) => a.kind === 'examPast')).toBe(true);
    expect(msgs.some((a) => a.kind === 'backup')).toBe(true);
  });
});

describe('storage', () => {
  it('欠けた配列を補完する', () => {
    const d = normalizeData({ version: 1, certifications: [{ id: 'x', name: 'n' }], logs: [] });
    expect(d.certifications[0].plan).toEqual([]);
    expect(d.settings.dailyGoalMinutes).toBe(30);
  });
  it('不正なデータは例外', () => {
    expect(() => normalizeData({ foo: 1 })).toThrow();
    expect(() => normalizeData(null)).toThrow();
  });
});

describe('calendar', () => {
  it('終日・時刻付きのイベントを生成する', () => {
    const allDay = examToIcs(cert({ examDate: '2026-11-05' }))!;
    expect(allDay).toContain('DTSTART;VALUE=DATE:20261105');
    expect(allDay).toContain('DTEND;VALUE=DATE:20261106');
    const timed = examToIcs(cert({ examDate: '2026-11-05', examTime: '09:30', examLocation: 'A, B' }))!;
    expect(timed).toContain('DTSTART:20261105T093000');
    expect(timed).toContain('DTEND:20261105T113000');
    expect(timed).toContain('LOCATION:A\\, B');
    expect(examToIcs(cert())).toBeNull();
    expect(googleCalendarUrl(cert({ examDate: '2026-11-05' }))).toContain('dates=20261105%2F20261106');
  });
});
