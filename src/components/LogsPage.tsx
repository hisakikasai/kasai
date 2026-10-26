import { useState } from 'react';
import { useStore } from '../store';
import { formatMinutes, formatYmd } from '../lib/date';
import Heatmap from './Heatmap';

export default function LogsPage() {
  const { data, update } = useStore();
  const [certId, setCertId] = useState('');
  const names = new Map(data.certifications.map((c) => [c.id, c.name]));
  const logs = data.logs
    .filter((l) => !certId || l.certId === certId)
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));

  // 日付ごとにまとめて表示
  const groups = new Map<string, typeof logs>();
  for (const l of logs) groups.set(l.date, [...(groups.get(l.date) ?? []), l]);

  return (
    <div className="stack">
      <section className="card">
        <div className="row between">
          <h2>学習記録</h2>
          <select value={certId} onChange={(e) => setCertId(e.target.value)} aria-label="資格で絞り込み">
            <option value="">すべての資格</option>
            {data.certifications.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <Heatmap logs={logs} goal={data.settings.dailyGoalMinutes} weeks={26} />
        <div className="small">
          合計 {formatMinutes(logs.reduce((s, l) => s + l.minutes, 0))} / {groups.size}日
        </div>
      </section>

      {logs.length === 0 && <p className="muted">記録はまだありません。</p>}
      {[...groups.entries()].map(([date, items]) => (
        <section key={date} className="card">
          <div className="row between">
            <strong>{formatYmd(date)}</strong>
            <span>{formatMinutes(items.reduce((s, l) => s + l.minutes, 0))}</span>
          </div>
          <ul className="list">
            {items.map((l) => (
              <li key={l.id} className="row between">
                <span>
                  {names.get(l.certId) ?? '(削除された資格)'} <strong>{formatMinutes(l.minutes)}</strong>{' '}
                  <span className="muted">{l.memo}</span>
                </span>
                <span className="row nowrap">
                  <button
                    className="btn ghost sm"
                    onClick={() => {
                      const m = prompt('学習時間（分）', String(l.minutes));
                      if (m === null) return;
                      const n = Number(m);
                      if (!Number.isFinite(n) || n <= 0) return alert('1 以上の数値を入力してください');
                      const memo = prompt('メモ', l.memo ?? '');
                      update((d) => {
                        const x = d.logs.find((y) => y.id === l.id);
                        if (!x) return;
                        x.minutes = Math.round(n);
                        if (memo !== null) x.memo = memo.trim() || undefined;
                      });
                    }}
                  >
                    編集
                  </button>
                  <button
                    className="btn ghost sm danger"
                    onClick={() => confirm('この記録を削除しますか？') && update((d) => (d.logs = d.logs.filter((y) => y.id !== l.id)))}
                  >
                    削除
                  </button>
                </span>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
