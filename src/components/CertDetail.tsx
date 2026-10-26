import { useState } from 'react';
import type { CertStatus, Certification, ExpenseKind, ExpenseStatus } from '../types';
import { CERT_STATUS_LABEL, EXPENSE_KIND_LABEL, EXPENSE_STATUS_LABEL } from '../types';
import { useStore } from '../store';
import { newId } from '../lib/id';
import { certProgress } from '../lib/stats';
import { addDays, diffDays, formatMinutes, formatYmd, todayYmd } from '../lib/date';
import { examToIcs, googleCalendarUrl } from '../lib/calendar';
import { saveFile } from '../lib/storage';
import { href, navigate } from '../router';
import LinkEditor from './LinkEditor';
import LinkButtons from './LinkButtons';
import { Countdown, Progress } from './CertCard';

export default function CertDetail({ id }: { id: string }) {
  const { data, update } = useStore();
  const cert = data.certifications.find((c) => c.id === id);
  if (!cert) {
    return (
      <p>
        資格が見つかりません。<a href={href({ name: 'certs' })}>一覧へ戻る</a>
      </p>
    );
  }
  const patch = (fn: (c: Certification) => void) =>
    update((d) => {
      const c = d.certifications.find((x) => x.id === id);
      if (c) fn(c);
    });

  const p = certProgress(cert, data.logs);
  const logs = data.logs.filter((l) => l.certId === id).sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="stack">
      <a href={href({ name: 'certs' })} className="small">
        ← 資格一覧
      </a>
      <div className="row between">
        <h1>{cert.name}</h1>
        <Countdown days={cert.status === 'passed' || cert.status === 'failed' ? undefined : p.daysLeft} />
      </div>
      <LinkButtons links={cert.links} certId={cert.id} />

      <section className="card">
        <h2>サマリー</h2>
        {p.planTotal > 0 && <Progress ratio={p.planRatio} label={`勉強予定 ${p.planDone}/${p.planTotal} 完了`} />}
        {p.targetMinutes ? (
          <Progress ratio={p.hoursRatio ?? 0} label={`学習 ${formatMinutes(p.studiedMinutes)} / ${cert.targetHours}時間`} />
        ) : (
          <div>累計 {formatMinutes(p.studiedMinutes)}（目標学習時間を設定するとペースを計算します）</div>
        )}
        {p.requiredPerDay !== undefined && (
          <div className="small">
            残り {p.daysLeft} 日 → 目標達成には 1日あたり約 <strong>{formatMinutes(p.requiredPerDay)}</strong>
          </div>
        )}
      </section>

      <BasicInfo cert={cert} patch={patch} />
      <PlanSection cert={cert} patch={patch} />

      <section className="card">
        <h2>学習サイト・リンク</h2>
        <p className="muted small">⏱ ボタンで開くと、サイトを開くと同時に学習タイマーが始まります。</p>
        <LinkEditor links={cert.links} onChange={(links) => patch((c) => (c.links = links))} />
      </section>

      <ExpenseSection cert={cert} patch={patch} />

      <section className="card">
        <h2>学習記録（{logs.length}件・{formatMinutes(p.studiedMinutes)}）</h2>
        {logs.length === 0 && <p className="muted">まだ記録がありません。ホームから記録できます。</p>}
        <ul className="list">
          {logs.slice(0, 20).map((l) => (
            <li key={l.id} className="row between">
              <span>
                {formatYmd(l.date)} <strong>{formatMinutes(l.minutes)}</strong> <span className="muted">{l.memo}</span>
              </span>
            </li>
          ))}
        </ul>
        {logs.length > 20 && (
          <a href={href({ name: 'logs' })} className="small">
            すべての記録を見る →
          </a>
        )}
      </section>

      <section className="card">
        <h2>その他</h2>
        <div className="row wrap">
          <button className="btn" onClick={() => patch((c) => (c.archived = !c.archived))}>
            {cert.archived ? 'アーカイブ解除' : 'アーカイブ'}
          </button>
          <button
            className="btn danger"
            onClick={() => {
              if (!confirm(`「${cert.name}」と学習記録 ${logs.length} 件を削除します。よろしいですか？`)) return;
              update((d) => {
                d.certifications = d.certifications.filter((c) => c.id !== id);
                d.logs = d.logs.filter((l) => l.certId !== id);
                if (d.timer?.certId === id) d.timer = undefined;
              });
              navigate({ name: 'certs' });
            }}
          >
            削除
          </button>
        </div>
      </section>
    </div>
  );
}

type Patch = (fn: (c: Certification) => void) => void;

function BasicInfo({ cert, patch }: { cert: Certification; patch: Patch }) {
  const ics = examToIcs(cert);
  const gcal = googleCalendarUrl(cert);
  const set = <K extends keyof Certification>(key: K, value: Certification[K]) => patch((c) => (c[key] = value));
  const opt = (v: string) => v || undefined;

  return (
    <section className="card">
      <h2>基本情報・受験日</h2>
      <div className="grid">
        <div className="field">
          <label>資格名</label>
          <input value={cert.name} onChange={(e) => set('name', e.target.value)} />
        </div>
        <div className="field">
          <label>主催・ベンダー</label>
          <input value={cert.provider} placeholder="AWS / IPA など" onChange={(e) => set('provider', e.target.value)} />
        </div>
        <div className="field">
          <label>ステータス</label>
          <select value={cert.status} onChange={(e) => set('status', e.target.value as CertStatus)}>
            {Object.entries(CERT_STATUS_LABEL).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>受験日</label>
          <input type="date" value={cert.examDate ?? ''} onChange={(e) => set('examDate', opt(e.target.value))} />
        </div>
        <div className="field">
          <label>開始時刻</label>
          <input type="time" value={cert.examTime ?? ''} onChange={(e) => set('examTime', opt(e.target.value))} />
        </div>
        <div className="field">
          <label>会場 / 受験方法</label>
          <input
            value={cert.examLocation ?? ''}
            placeholder="オンライン(OnVUE) / テストセンター名"
            onChange={(e) => set('examLocation', opt(e.target.value))}
          />
        </div>
        <div className="field">
          <label>予約番号・確認番号</label>
          <input value={cert.bookingRef ?? ''} onChange={(e) => set('bookingRef', opt(e.target.value))} />
        </div>
        <div className="field">
          <label>目標学習時間（時間）</label>
          <input
            type="number"
            min={0}
            inputMode="numeric"
            value={cert.targetHours ?? ''}
            onChange={(e) => set('targetHours', e.target.value ? Number(e.target.value) : undefined)}
          />
        </div>
        {(cert.status === 'passed' || cert.status === 'failed') && (
          <div className="field">
            <label>スコア</label>
            <input value={cert.score ?? ''} placeholder="例: 812/1000" onChange={(e) => set('score', opt(e.target.value))} />
          </div>
        )}
        {cert.status === 'passed' && (
          <div className="field">
            <label>有効期限</label>
            <input type="date" value={cert.expiresAt ?? ''} onChange={(e) => set('expiresAt', opt(e.target.value))} />
            {!cert.expiresAt && cert.examDate && (
              <button className="btn ghost sm" onClick={() => set('expiresAt', addDays(cert.examDate!, 365 * 3))}>
                受験日 + 3年で設定（AWS 等）
              </button>
            )}
          </div>
        )}
      </div>
      <div className="field">
        <label>メモ</label>
        <textarea rows={3} value={cert.note ?? ''} onChange={(e) => set('note', opt(e.target.value))} />
      </div>
      {ics && (
        <div className="row wrap">
          <button className="btn sm" onClick={() => saveFile(`exam-${cert.examDate}.ics`, ics, 'text/calendar').catch(() => {})}>
            📅 カレンダーに追加 (.ics)
          </button>
          {gcal && (
            <a className="btn sm" href={gcal} target="_blank" rel="noopener noreferrer">
              Google カレンダーに追加
            </a>
          )}
        </div>
      )}
    </section>
  );
}

function PlanSection({ cert, patch }: { cert: Certification; patch: Patch }) {
  const [title, setTitle] = useState('');
  const [due, setDue] = useState('');
  const today = todayYmd();

  const add = () => {
    if (!title.trim()) return;
    patch((c) => c.plan.push({ id: newId(), title: title.trim(), dueDate: due || undefined, done: false }));
    setTitle('');
  };

  /** 受験日までを週単位に分割して予定の枠を作る */
  const generateWeekly = () => {
    if (!cert.examDate) return;
    const weeks = Math.ceil(diffDays(today, cert.examDate) / 7);
    if (weeks <= 0) return;
    if (!confirm(`受験日まで ${weeks} 週分の予定枠を追加します。内容は後で編集してください。`)) return;
    patch((c) => {
      for (let i = 1; i <= weeks; i++) {
        const d = i === weeks ? cert.examDate! : addDays(today, i * 7);
        const title = i === weeks ? '最終確認・模擬試験' : i === weeks - 1 ? '模擬試験 / 苦手分野の復習' : `第${i}週: 学習範囲を記入`;
        c.plan.push({ id: newId(), title, dueDate: d, done: false });
      }
    });
  };

  const sorted = [...cert.plan].sort(
    (a, b) => Number(a.done) - Number(b.done) || (a.dueDate ?? '9999').localeCompare(b.dueDate ?? '9999'),
  );

  return (
    <section className="card">
      <h2>勉強予定・進捗</h2>
      <ul className="list">
        {sorted.map((t) => {
          const overdue = !t.done && t.dueDate && t.dueDate < today;
          return (
            <li key={t.id} className={`row between ${t.done ? 'done' : ''}`}>
              <label className="row grow">
                <input
                  type="checkbox"
                  checked={t.done}
                  onChange={(e) =>
                    patch((c) => {
                      const x = c.plan.find((y) => y.id === t.id)!;
                      x.done = e.target.checked;
                      x.doneAt = e.target.checked ? todayYmd() : undefined;
                    })
                  }
                />
                <span className="grow">
                  {t.title}
                  {t.dueDate && <span className={`small ${overdue ? 'error' : 'muted'}`}> 〜{formatYmd(t.dueDate)}</span>}
                </span>
              </label>
              <span className="row nowrap">
                <button
                  className="btn ghost sm"
                  onClick={() => {
                    const nt = prompt('予定の内容', t.title);
                    if (nt === null || !nt.trim()) return;
                    const nd = prompt('期限 (YYYY-MM-DD、空欄で期限なし)', t.dueDate ?? '');
                    if (nd === null) return;
                    if (nd && !/^\d{4}-\d{2}-\d{2}$/.test(nd)) return alert('日付は YYYY-MM-DD 形式で入力してください');
                    patch((c) => {
                      const x = c.plan.find((y) => y.id === t.id)!;
                      x.title = nt.trim();
                      x.dueDate = nd || undefined;
                    });
                  }}
                >
                  編集
                </button>
                <button className="btn ghost sm danger" onClick={() => patch((c) => (c.plan = c.plan.filter((y) => y.id !== t.id)))}>
                  削除
                </button>
              </span>
            </li>
          );
        })}
      </ul>
      <div className="row wrap">
        <input className="grow" placeholder="予定（例: 公式ドキュメント EC2 章）" value={title} onChange={(e) => setTitle(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && add()} />
        <input type="date" value={due} onChange={(e) => setDue(e.target.value)} aria-label="期限" />
        <button className="btn" onClick={add}>
          追加
        </button>
      </div>
      {cert.examDate && cert.plan.length === 0 && (
        <button className="btn ghost sm mt" onClick={generateWeekly}>
          受験日から逆算して週ごとの予定枠を作る
        </button>
      )}
    </section>
  );
}

function ExpenseSection({ cert, patch }: { cert: Certification; patch: Patch }) {
  const addExpense = (kind: ExpenseKind) =>
    patch((c) =>
      c.expenses.push({
        id: newId(),
        kind,
        label: EXPENSE_KIND_LABEL[kind],
        amount: 0,
        status: 'unapplied',
        receiptSaved: false,
      }),
    );
  const setE = (eid: string, fn: (e: Certification['expenses'][number]) => void) =>
    patch((c) => {
      const e = c.expenses.find((x) => x.id === eid);
      if (e) fn(e);
    });
  const total = cert.expenses.reduce((s, e) => s + (e.amount || 0), 0);
  const pending = cert.expenses.filter((e) => e.status !== 'paid').reduce((s, e) => s + (e.amount || 0), 0);

  return (
    <section className="card">
      <h2>経費申請</h2>
      {cert.expenses.length === 0 && <p className="muted small">受験料・教材費などを登録して、申請漏れを防ぎましょう。</p>}
      <div className="stack-sm">
        {cert.expenses.map((e) => (
          <div key={e.id} className={`expense ${e.status}`}>
            <div className="row wrap">
              <label className="row nowrap check-big">
                <input
                  type="checkbox"
                  checked={e.status !== 'unapplied'}
                  onChange={(ev) =>
                    setE(e.id, (x) => {
                      x.status = ev.target.checked ? 'applied' : 'unapplied';
                      x.appliedAt = ev.target.checked ? x.appliedAt ?? todayYmd() : undefined;
                    })
                  }
                />
                申請済み
              </label>
              <input className="grow" value={e.label} onChange={(ev) => setE(e.id, (x) => (x.label = ev.target.value))} aria-label="項目名" />
              <input
                type="number"
                min={0}
                inputMode="numeric"
                className="num-wide"
                value={e.amount || ''}
                placeholder="金額"
                onChange={(ev) => setE(e.id, (x) => (x.amount = Number(ev.target.value) || 0))}
                aria-label="金額"
              />
              <span className="muted">円</span>
            </div>
            <div className="row wrap small">
              <select value={e.kind} onChange={(ev) => setE(e.id, (x) => (x.kind = ev.target.value as ExpenseKind))} aria-label="種別">
                {Object.entries(EXPENSE_KIND_LABEL).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
              <select
                value={e.status}
                onChange={(ev) =>
                  setE(e.id, (x) => {
                    x.status = ev.target.value as ExpenseStatus;
                    if (x.status !== 'unapplied') x.appliedAt ??= todayYmd();
                  })
                }
                aria-label="申請状況"
              >
                {Object.entries(EXPENSE_STATUS_LABEL).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
              <label className="row nowrap">
                <input type="checkbox" checked={e.receiptSaved} onChange={(ev) => setE(e.id, (x) => (x.receiptSaved = ev.target.checked))} />
                領収書保存済み
              </label>
              <label className="row nowrap">
                申請期限
                <input type="date" value={e.deadline ?? ''} onChange={(ev) => setE(e.id, (x) => (x.deadline = ev.target.value || undefined))} />
              </label>
              {e.appliedAt && <span className="muted">申請日 {formatYmd(e.appliedAt)}</span>}
              <button
                className="btn ghost sm danger"
                onClick={() => confirm('この経費を削除しますか？') && patch((c) => (c.expenses = c.expenses.filter((x) => x.id !== e.id)))}
              >
                削除
              </button>
            </div>
            <input
              className="full small"
              placeholder="備考（例: 合格時のみ支給、申請番号など）"
              value={e.note ?? ''}
              onChange={(ev) => setE(e.id, (x) => (x.note = ev.target.value || undefined))}
            />
          </div>
        ))}
      </div>
      <div className="row wrap mt">
        {(Object.keys(EXPENSE_KIND_LABEL) as ExpenseKind[]).map((k) => (
          <button key={k} className="btn sm" onClick={() => addExpense(k)}>
            + {EXPENSE_KIND_LABEL[k]}
          </button>
        ))}
        {total > 0 && (
          <span className="small">
            合計 {total.toLocaleString()}円 / 未精算 {pending.toLocaleString()}円
          </span>
        )}
      </div>
    </section>
  );
}
