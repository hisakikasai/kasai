import type { AppData } from '../types';

export const STORAGE_KEY = 'shikaku-manager:v1';

export function emptyData(): AppData {
  return {
    version: 1,
    certifications: [],
    logs: [],
    globalLinks: [],
    settings: { dailyGoalMinutes: 30 },
  };
}

/** 古い・欠けたデータでも落ちないよう、既定値で補完する */
export function normalizeData(raw: unknown): AppData {
  if (!raw || typeof raw !== 'object') throw new Error('データ形式が正しくありません');
  const r = raw as Partial<AppData>;
  if (r.version !== 1) throw new Error(`未対応のデータバージョンです: ${String(r.version)}`);
  if (!Array.isArray(r.certifications) || !Array.isArray(r.logs)) {
    throw new Error('certifications / logs が見つかりません');
  }
  const base = emptyData();
  return {
    version: 1,
    certifications: r.certifications.map((c) => ({
      ...c,
      plan: Array.isArray(c.plan) ? c.plan : [],
      links: Array.isArray(c.links) ? c.links : [],
      expenses: Array.isArray(c.expenses) ? c.expenses : [],
    })),
    logs: r.logs.filter((l) => l && typeof l.minutes === 'number' && typeof l.date === 'string'),
    globalLinks: Array.isArray(r.globalLinks) ? r.globalLinks : [],
    settings: { ...base.settings, ...(r.settings ?? {}) },
    timer: r.timer,
  };
}

export function loadData(storage: Storage = localStorage): AppData {
  try {
    const text = storage.getItem(STORAGE_KEY);
    if (!text) return emptyData();
    return normalizeData(JSON.parse(text));
  } catch (e) {
    console.error('データの読み込みに失敗しました', e);
    return emptyData();
  }
}

export function saveData(data: AppData, storage: Storage = localStorage): boolean {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch (e) {
    console.error('データの保存に失敗しました', e);
    return false;
  }
}

export function downloadText(filename: string, text: string, mime: string) {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
