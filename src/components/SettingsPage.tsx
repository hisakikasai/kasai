import { useRef, useState } from 'react';
import { useStore } from '../store';
import { emptyData, normalizeData, saveFile } from '../lib/storage';
import { formatYmd, todayYmd } from '../lib/date';
import { isStandalone } from '../lib/platform';
import InstallGuide from './InstallGuide';
import LinkEditor from './LinkEditor';
import { Check, Download, FileSpreadsheet, HardDriveDownload, Link, Target, Trash2, Upload, X } from './icons';

export default function SettingsPage() {
  const { data, update, replace } = useStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [result, setResult] = useState<'ok' | 'ng' | ''>('');

  const flash = (r: 'ok' | 'ng') => {
    setResult(r);
    setTimeout(() => setResult(''), 2500);
  };

  const exportJson = async () => {
    const now = new Date().toISOString();
    const out = { ...data, timer: undefined, settings: { ...data.settings, lastBackupAt: now } };
    try {
      await saveFile(`shikaku-backup-${todayYmd()}.json`, JSON.stringify(out, null, 2), 'application/json');
    } catch {
      return; // 共有シートをキャンセル
    }
    update((d) => (d.settings.lastBackupAt = now));
    flash('ok');
  };

  const exportCsv = () => {
    const names = new Map(data.certifications.map((c) => [c.id, c.name]));
    const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const rows = [
      ['日付', '資格', '分', 'メモ'],
      ...[...data.logs].sort((a, b) => a.date.localeCompare(b.date)).map((l) => [l.date, names.get(l.certId) ?? '', String(l.minutes), l.memo ?? '']),
    ];
    // Excel で文字化けしないよう BOM を付ける
    saveFile(`study-logs-${todayYmd()}.csv`, '﻿' + rows.map((r) => r.map(esc).join(',')).join('\r\n'), 'text/csv').catch(() => {});
  };

  const importJson = async (file: File) => {
    try {
      const next = normalizeData(JSON.parse(await file.text()));
      if (!confirm(`${next.certifications.length} / ${next.logs.length} → 上書き?`)) return;
      replace(next);
      flash('ok');
    } catch (e) {
      console.error(e);
      flash('ng');
    } finally {
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <div className="stack">
      <section className="card">
        <label className="input-icon" title="1日の目標">
          <Target size={20} />
          <input
            type="number"
            min={1}
            inputMode="numeric"
            aria-label="1日の目標（分）"
            value={data.settings.dailyGoalMinutes}
            onChange={(e) => {
              const v = Number(e.target.value);
              if (v > 0) update((d) => (d.settings.dailyGoalMinutes = v));
            }}
          />
          <span className="muted">m / 日</span>
        </label>
      </section>

      <section className="card stack-sm" aria-label="共通リンク">
        <Link size={20} />
        <LinkEditor links={data.globalLinks} onChange={(links) => update((d) => (d.globalLinks = links))} />
      </section>

      <section className="card stack-sm" aria-label="データ">
        <div className="row between">
          <HardDriveDownload size={20} />
          <span className="small muted" title="最終バックアップ">
            {data.settings.lastBackupAt ? formatYmd(data.settings.lastBackupAt.slice(0, 10)) : '—'}
          </span>
        </div>
        <div className="row wrap">
          <button className="btn primary" onClick={exportJson} aria-label="バックアップ" title="バックアップ">
            <Download size={18} /> JSON
          </button>
          <button className="btn" onClick={() => fileRef.current?.click()} aria-label="復元" title="復元">
            <Upload size={18} /> JSON
          </button>
          <button className="btn" onClick={exportCsv} aria-label="CSV 出力" title="学習記録 CSV">
            <FileSpreadsheet size={18} /> CSV
          </button>
          {result === 'ok' && <Check size={20} className="ok" />}
          {result === 'ng' && <X size={20} className="error" />}
          <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={(e) => e.target.files?.[0] && importJson(e.target.files[0])} />
        </div>
      </section>

      {!isStandalone() && (
        <section className="card">
          <InstallGuide />
        </section>
      )}

      <div className="row center">
        <button
          className="btn ghost icon danger"
          aria-label="全データ削除"
          title="全データ削除"
          onClick={() => {
            if (!confirm('全データ削除?')) return;
            if (!confirm('本当に?')) return;
            replace(emptyData());
          }}
        >
          <Trash2 size={20} />
        </button>
      </div>
    </div>
  );
}
