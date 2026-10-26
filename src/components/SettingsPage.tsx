import { useRef, useState } from 'react';
import { useStore } from '../store';
import { downloadText, emptyData, normalizeData } from '../lib/storage';
import { formatYmd, todayYmd } from '../lib/date';
import LinkEditor from './LinkEditor';

export default function SettingsPage() {
  const { data, update, replace } = useStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState('');

  const exportJson = () => {
    const now = new Date().toISOString();
    const out = { ...data, timer: undefined, settings: { ...data.settings, lastBackupAt: now } };
    downloadText(`shikaku-backup-${todayYmd()}.json`, JSON.stringify(out, null, 2), 'application/json');
    update((d) => (d.settings.lastBackupAt = now));
    setMsg('バックアップをダウンロードしました');
  };

  const exportCsv = () => {
    const names = new Map(data.certifications.map((c) => [c.id, c.name]));
    const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const rows = [
      ['日付', '資格', '分', 'メモ'],
      ...[...data.logs].sort((a, b) => a.date.localeCompare(b.date)).map((l) => [l.date, names.get(l.certId) ?? '', String(l.minutes), l.memo ?? '']),
    ];
    // Excel で文字化けしないよう BOM を付ける
    downloadText(`study-logs-${todayYmd()}.csv`, '﻿' + rows.map((r) => r.map(esc).join(',')).join('\r\n'), 'text/csv');
  };

  const importJson = async (file: File) => {
    try {
      const next = normalizeData(JSON.parse(await file.text()));
      if (!confirm(`資格 ${next.certifications.length} 件・記録 ${next.logs.length} 件で現在のデータを上書きします。よろしいですか？`)) return;
      replace(next);
      setMsg('インポートしました');
    } catch (e) {
      setMsg(`インポートに失敗しました: ${(e as Error).message}`);
    } finally {
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <div className="stack">
      <section className="card">
        <h2>目標</h2>
        <div className="field">
          <label htmlFor="goal">1日の目標学習時間（分）</label>
          <input
            id="goal"
            type="number"
            min={1}
            inputMode="numeric"
            value={data.settings.dailyGoalMinutes}
            onChange={(e) => {
              const v = Number(e.target.value);
              if (v > 0) update((d) => (d.settings.dailyGoalMinutes = v));
            }}
          />
        </div>
      </section>

      <section className="card">
        <h2>学習サイト（共通リンク）</h2>
        <p className="muted small">ホーム画面に表示されます。資格ごとのリンクは各資格の画面で登録できます。</p>
        <LinkEditor links={data.globalLinks} onChange={(links) => update((d) => (d.globalLinks = links))} />
      </section>

      <section className="card">
        <h2>データ管理</h2>
        <p className="small">
          データはこのブラウザ（端末）内にのみ保存されます。機種変更・ブラウザのデータ削除で消えるため、定期的にバックアップしてください。
          <br />
          最終バックアップ: {data.settings.lastBackupAt ? formatYmd(data.settings.lastBackupAt.slice(0, 10)) : 'なし'}
        </p>
        <div className="row wrap">
          <button className="btn primary" onClick={exportJson}>
            バックアップ (JSON)
          </button>
          <button className="btn" onClick={() => fileRef.current?.click()}>
            復元 (JSON)
          </button>
          <button className="btn" onClick={exportCsv}>
            学習記録を CSV 出力
          </button>
          <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={(e) => e.target.files?.[0] && importJson(e.target.files[0])} />
        </div>
        {msg && <p className="small">{msg}</p>}
      </section>

      <section className="card">
        <h2>ホーム画面に追加</h2>
        <p className="small">
          スマホのブラウザで「ホーム画面に追加」するとアプリのように起動でき、オフラインでも記録できます。
        </p>
      </section>

      <section className="card">
        <h2>リセット</h2>
        <button
          className="btn danger"
          onClick={() => {
            if (!confirm('すべてのデータを削除します。元に戻せません。よろしいですか？')) return;
            if (!confirm('本当に削除しますか？（先にバックアップを推奨）')) return;
            replace(emptyData());
          }}
        >
          すべてのデータを削除
        </button>
      </section>
    </div>
  );
}
