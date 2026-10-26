import { useEffect, useState } from 'react';
import { useStore } from '../store';
import { newId } from '../lib/id';
import { addDays, formatMinutes, todayYmd } from '../lib/date';

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
      <section className="card">
        <h2>今日の記録</h2>
        <p className="muted">
          まずは <a href="#/certs">資格を登録</a> しましょう。
        </p>
      </section>
    );
  }

  const save = () => {
    if (!certId || minutes <= 0) return;
    update((d) => {
      d.logs.push({ id: newId(), certId, date, minutes, memo: memo.trim() || undefined, createdAt: new Date().toISOString() });
      d.settings.lastCertId = certId;
    });
    setMemo('');
    setFlash(`${formatMinutes(minutes)} を記録しました 🎉`);
    setTimeout(() => setFlash(''), 2500);
  };

  const startTimer = () => {
    update((d) => {
      d.timer = { certId, startedAt: Date.now() };
      d.settings.lastCertId = certId;
    });
  };

  const today = todayYmd();

  return (
    <section className="card">
      <h2>今日の記録</h2>
      <div className="field">
        <label htmlFor="ql-cert">資格</label>
        <select id="ql-cert" value={certId} onChange={(e) => setCertId(e.target.value)}>
          {certs.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
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
          aria-label="分数"
          value={minutes}
          onChange={(e) => setMinutes(Number(e.target.value))}
        />
        <span className="muted">分</span>
      </div>
      <div className="chips">
        <button className={`chip ${date === today ? 'on' : ''}`} onClick={() => setDate(today)}>
          今日
        </button>
        <button className={`chip ${date === addDays(today, -1) ? 'on' : ''}`} onClick={() => setDate(addDays(today, -1))}>
          昨日
        </button>
        <input type="date" value={date} max={today} onChange={(e) => e.target.value && setDate(e.target.value)} aria-label="日付" />
      </div>
      <input
        className="full"
        placeholder="メモ（任意）例: Skill Builder 模擬試験 72%"
        value={memo}
        onChange={(e) => setMemo(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && save()}
      />
      <div className="row mt">
        <button className="btn primary" onClick={save}>
          記録する
        </button>
        {!data.timer && (
          <button className="btn" onClick={startTimer}>
            ⏱ タイマー開始
          </button>
        )}
        {flash && <span className="ok">{flash}</span>}
      </div>
    </section>
  );
}
