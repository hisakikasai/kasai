import { useState } from 'react';
import { useStore } from '../store';
import { formatMinutes, formatYmd } from '../lib/date';
import Heatmap from './Heatmap';
import { Clock, Pencil, Trash2 } from './icons';

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
      <section className="card stack-sm">
        <div className="row between">
          <span className="row nowrap">
            <Clock size={18} /> <strong>{formatMinutes(logs.reduce((s, l) => s + l.minutes, 0))}</strong>
            <span className="muted small">/ {groups.size}d</span>
          </span>
          {data.certifications.length > 1 && (
            <select value={certId} onChange={(e) => setCertId(e.target.value)} aria-label="資格で絞り込み">
              <option value="">all</option>
              {data.certifications.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          )}
        </div>
        <Heatmap logs={logs} goal={data.settings.dailyGoalMinutes} weeks={26} />
      </section>

      {[...groups.entries()].map(([date, items]) => (
        <section key={date} className="card">
          <div className="row between">
            <strong>{formatYmd(date)}</strong>
            <span>{formatMinutes(items.reduce((s, l) => s + l.minutes, 0))}</span>
          </div>
          <ul className="list">
            {items.map((l) => (
              <li key={l.id} className="row between">
                <span className="row grow">
                  <strong className="nowrap">{formatMinutes(l.minutes)}</strong>
                  <span className="ellipsis">{names.get(l.certId) ?? '—'}</span>
                  <span className="muted ellipsis">{l.memo}</span>
                </span>
                <span className="row nowrap">
                  <button
                    className="btn ghost icon"
                    aria-label="編集"
                    onClick={() => {
                      const m = prompt('分', String(l.minutes));
                      if (m === null) return;
                      const n = Number(m);
                      if (!Number.isFinite(n) || n <= 0) return;
                      const memo = prompt('', l.memo ?? '');
                      update((d) => {
                        const x = d.logs.find((y) => y.id === l.id);
                        if (!x) return;
                        x.minutes = Math.round(n);
                        if (memo !== null) x.memo = memo.trim() || undefined;
                      });
                    }}
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    className="btn ghost icon danger"
                    aria-label="削除"
                    onClick={() => confirm('削除?') && update((d) => (d.logs = d.logs.filter((y) => y.id !== l.id)))}
                  >
                    <Trash2 size={16} />
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
