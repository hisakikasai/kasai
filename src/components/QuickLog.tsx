import { useEffect, useState } from 'react';
import { useStore } from '../store';
import { newId } from '../lib/id';
import { formatMinutes, todayYmd } from '../lib/date';
import { href } from '../router';
import { CalendarDays, Check, Plus, StickyNote, Timer } from './icons';

const QUICK = [15, 30, 60, 90];

/** ワンタップで今日の学習を記録するカード */
export default function QuickLog() {
  const { data, update } = useStore();
  const certs = data.certifications.filter((c) => !c.archived && c.status !== 'passed');
  const [certId, setCertId] = useState(data.settings.lastCertId ?? certs[0]?.id ?? '');
  const [minutes, setMinutes] = useState(30);
  const [memo, setMemo] = useState('');
  const [date, setDate] = useState(todayYmd());
  const [flash, setFlash] = useState('');

  useEffect(() => {
    if (!certs.some((c) => c.id === certId) && certs[0]) setCertId(certs[0].id);
  }, [certs, certId]);

  if (certs.length === 0) {
    return (
      <a href={href({ name: 'certs' })} className="card empty-add" aria-label="資格を追加">
        <Plus size={32} />
      </a>
    );
  }

  const save = () => {
    if (!certId || minutes <= 0) return;
    update((d) => {
      d.logs.push({ id: newId(), certId, date, minutes, memo: memo.trim() || undefined, createdAt: new Date().toISOString() });
      d.settings.lastCertId = certId;
    });
    setMemo('');
    setFlash(`+${formatMinutes(minutes)}`);
    setTimeout(() => setFlash(''), 2000);
  };

  const startTimer = () => {
    update((d) => {
      d.timer = { certId, startedAt: Date.now() };
      d.settings.lastCertId = certId;
    });
  };

  const today = todayYmd();

  return (
    <section className="card stack-sm">
      {certs.length > 1 && (
        <select value={certId} onChange={(e) => setCertId(e.target.value)} aria-label="資格">
          {certs.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      )}
      {certs.length === 1 && <strong className="ellipsis">{certs[0].name}</strong>}
      <div className="chips">
        {QUICK.map((m) => (
          <button key={m} className={`chip ${minutes === m ? 'on' : ''}`} onClick={() => setMinutes(m)}>
            {formatMinutes(m)}
          </button>
        ))}
        <input
          type="number"
          min={1}
          inputMode="numeric"
          className="num"
          aria-label="分"
          value={minutes}
          onChange={(e) => setMinutes(Number(e.target.value))}
        />
      </div>
      <div className="row">
        <label className={`input-icon ${date !== today ? 'warn' : ''}`}>
          <CalendarDays size={18} />
          <input type="date" value={date} max={today} onChange={(e) => setDate(e.target.value || today)} aria-label="日付" />
        </label>
        <label className="input-icon grow">
          <StickyNote size={18} />
          <input className="grow" value={memo} onChange={(e) => setMemo(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && save()} aria-label="メモ" />
        </label>
      </div>
      <div className="row">
        <button className="btn primary grow big" onClick={save} aria-label="記録する">
          <Check size={22} /> {flash || formatMinutes(minutes)}
        </button>
        {!data.timer && (
          <button className="btn big icon" onClick={startTimer} aria-label="タイマー開始" title="タイマー開始">
            <Timer size={22} />
          </button>
        )}
      </div>
    </section>
  );
}
