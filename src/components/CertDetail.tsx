import { useState, type ReactNode } from 'react';
import type { CertStatus, Certification, Expense, ExpenseKind, ExpenseStatus } from '../types';
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
import type { LucideIcon } from 'lucide-react';
import {
  Archive,
  ArchiveRestore,
  BookOpen,
  CalendarClock,
  CalendarDays,
  CalendarPlus,
  Check,
  ChevronLeft,
  Clock,
  Gauge,
  History,
  JapaneseYen,
  Link,
  ListChecks,
  MapPin,
  Pencil,
  Plus,
  Receipt,
  RefreshCw,
  Square,
  StickyNote,
  Target,
  Ticket,
  Trash2,
  Trophy,
  Wand2,
  X,
} from './icons';

const STATUS_ICON: Record<CertStatus, LucideIcon> = {
  planning: Square,
  studying: BookOpen,
  booked: Ticket,
  passed: Trophy,
  failed: X,
};

const EXPENSE_STEP_ICON: Record<ExpenseStatus, LucideIcon> = {
  unapplied: Square,
  applied: Check,
  approved: Check,
  paid: JapaneseYen,
};

function Section({ Icon, title, extra, children }: { Icon: LucideIcon; title: string; extra?: ReactNode; children: ReactNode }) {
  return (
    <section className="card stack-sm" aria-label={title}>
      <div className="row between section-head">
        <span className="row nowrap" title={title}>
          <Icon size={20} />
        </span>
        {extra}
      </div>
      {children}
    </section>
  );
}

/** アイコン付きの入力欄 */
function IconField({ Icon, label, children }: { Icon: LucideIcon; label: string; children: ReactNode }) {
  return (
    <label className="input-icon" title={label}>
      <Icon size={18} />
      {children}
    </label>
  );
}

export default function CertDetail({ id }: { id: string }) {
  const { data, update } = useStore();
  const cert = data.certifications.find((c) => c.id === id);
  if (!cert) {
    return (
      <a href={href({ name: 'certs' })} className="row">
        <ChevronLeft size={20} />
      </a>
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
      <div className="row">
        <a href={href({ name: 'certs' })} className="btn ghost icon" aria-label="戻る">
          <ChevronLeft size={22} />
        </a>
        <input className="title-input grow" value={cert.name} aria-label="資格名" onChange={(e) => patch((c) => (c.name = e.target.value))} />
        <Countdown cert={cert} days={p.daysLeft} />
      </div>

      <div className="segmented" role="radiogroup" aria-label="ステータス">
        {(Object.keys(CERT_STATUS_LABEL) as CertStatus[]).map((s) => {
          const Icon = STATUS_ICON[s];
          return (
            <button
              key={s}
              role="radio"
              aria-checked={cert.status === s}
              className={cert.status === s ? 'on' : ''}
              title={CERT_STATUS_LABEL[s]}
              onClick={() => patch((c) => (c.status = s))}
            >
              <Icon size={18} />
              <span>{CERT_STATUS_LABEL[s]}</span>
            </button>
          );
        })}
      </div>

      <LinkButtons links={cert.links} certId={cert.id} />

      <section className="card stack-sm">
        {p.planTotal > 0 && <Progress Icon={ListChecks} ratio={p.planRatio} label={`${p.planDone}/${p.planTotal}`} />}
        <Progress
          Icon={Clock}
          ratio={p.hoursRatio ?? 0}
          label={p.targetMinutes ? `${formatMinutes(p.studiedMinutes)} / ${cert.targetHours}h` : formatMinutes(p.studiedMinutes)}
        />
        {p.requiredPerDay !== undefined && (
          <div className="row small" title="1日あたり必要な学習時間">
            <Gauge size={16} /> <strong>{formatMinutes(p.requiredPerDay)}</strong>/日
          </div>
        )}
      </section>

      <ExamSection cert={cert} patch={patch} />
      <PlanSection cert={cert} patch={patch} />

      <Section Icon={Link} title="リンク">
        <LinkEditor links={cert.links} onChange={(links) => patch((c) => (c.links = links))} />
      </Section>

      <ExpenseSection cert={cert} patch={patch} />

      <Section Icon={History} title="学習記録" extra={<span className="small muted">{formatMinutes(p.studiedMinutes)}</span>}>
        <ul className="list">
          {logs.slice(0, 20).map((l) => (
            <li key={l.id} className="row">
              <span className="muted small">{formatYmd(l.date)}</span> <strong>{formatMinutes(l.minutes)}</strong>{' '}
              <span className="muted ellipsis">{l.memo}</span>
            </li>
          ))}
        </ul>
      </Section>

      <div className="row center">
        <button
          className="btn ghost icon"
          aria-label={cert.archived ? 'アーカイブ解除' : 'アーカイブ'}
          title={cert.archived ? 'アーカイブ解除' : 'アーカイブ'}
          onClick={() => patch((c) => (c.archived = !c.archived))}
        >
          {cert.archived ? <ArchiveRestore size={20} /> : <Archive size={20} />}
        </button>
        <button
          className="btn ghost icon danger"
          aria-label="削除"
          title="削除"
          onClick={() => {
            if (!confirm(`「${cert.name}」削除?`)) return;
            update((d) => {
              d.certifications = d.certifications.filter((c) => c.id !== id);
              d.logs = d.logs.filter((l) => l.certId !== id);
              if (d.timer?.certId === id) d.timer = undefined;
            });
            navigate({ name: 'certs' });
          }}
        >
          <Trash2 size={20} />
        </button>
      </div>
    </div>
  );
}

type Patch = (fn: (c: Certification) => void) => void;

function ExamSection({ cert, patch }: { cert: Certification; patch: Patch }) {
  const ics = examToIcs(cert);
  const gcal = googleCalendarUrl(cert);
  const set = <K extends keyof Certification>(key: K, value: Certification[K]) => patch((c) => (c[key] = value));
  const opt = (v: string) => v || undefined;

  return (
    <Section
      Icon={CalendarDays}
      title="受験"
      extra={
        ics && (
          <span className="row nowrap">
            <button
              className="btn ghost icon"
              aria-label="カレンダーに追加"
              title="カレンダーに追加 (.ics)"
              onClick={() => saveFile(`exam-${cert.examDate}.ics`, ics, 'text/calendar').catch(() => {})}
            >
              <CalendarPlus size={20} />
            </button>
            {gcal && (
              <a className="btn ghost icon gcal" href={gcal} target="_blank" rel="noopener noreferrer" aria-label="Google カレンダーに追加" title="Google カレンダー">
                G
              </a>
            )}
          </span>
        )
      }
    >
      <div className="grid">
        <IconField Icon={CalendarDays} label="受験日">
          <input type="date" value={cert.examDate ?? ''} onChange={(e) => set('examDate', opt(e.target.value))} />
        </IconField>
        <IconField Icon={Clock} label="時刻">
          <input type="time" value={cert.examTime ?? ''} onChange={(e) => set('examTime', opt(e.target.value))} />
        </IconField>
        <IconField Icon={MapPin} label="会場">
          <input value={cert.examLocation ?? ''} placeholder="会場 / オンライン" onChange={(e) => set('examLocation', opt(e.target.value))} />
        </IconField>
        <IconField Icon={Ticket} label="予約番号">
          <input value={cert.bookingRef ?? ''} placeholder="予約番号" onChange={(e) => set('bookingRef', opt(e.target.value))} />
        </IconField>
        <IconField Icon={Target} label="目標学習時間">
          <input
            type="number"
            min={0}
            inputMode="numeric"
            value={cert.targetHours ?? ''}
            placeholder="目標"
            onChange={(e) => set('targetHours', e.target.value ? Number(e.target.value) : undefined)}
          />
          <span className="muted">h</span>
        </IconField>
        {(cert.status === 'passed' || cert.status === 'failed') && (
          <IconField Icon={Trophy} label="スコア">
            <input value={cert.score ?? ''} placeholder="スコア" onChange={(e) => set('score', opt(e.target.value))} />
          </IconField>
        )}
        {cert.status === 'passed' && (
          <IconField Icon={RefreshCw} label="有効期限">
            <input type="date" value={cert.expiresAt ?? ''} onChange={(e) => set('expiresAt', opt(e.target.value))} />
            {!cert.expiresAt && cert.examDate && (
              <button className="chip" title="受験日 + 3年" onClick={() => set('expiresAt', addDays(cert.examDate!, 365 * 3))}>
                +3y
              </button>
            )}
          </IconField>
        )}
      </div>
      <IconField Icon={StickyNote} label="メモ">
        <textarea rows={2} value={cert.note ?? ''} onChange={(e) => set('note', opt(e.target.value))} />
      </IconField>
    </Section>
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
    patch((c) => {
      for (let i = 1; i <= weeks; i++) {
        const d = i === weeks ? cert.examDate! : addDays(today, i * 7);
        const t = i === weeks ? '最終確認' : i === weeks - 1 ? '模擬試験' : `Week ${i}`;
        c.plan.push({ id: newId(), title: t, dueDate: d, done: false });
      }
    });
  };

  const sorted = [...cert.plan].sort(
    (a, b) => Number(a.done) - Number(b.done) || (a.dueDate ?? '9999').localeCompare(b.dueDate ?? '9999'),
  );
  const canGenerate = !!cert.examDate && cert.plan.length === 0 && diffDays(today, cert.examDate) > 0;

  return (
    <Section
      Icon={ListChecks}
      title="勉強予定"
      extra={
        canGenerate && (
          <button className="btn ghost icon" aria-label="受験日から週ごとの予定を作成" title="受験日から週ごとの予定を作成" onClick={generateWeekly}>
            <Wand2 size={20} />
          </button>
        )
      }
    >
      <ul className="list">
        {sorted.map((t) => {
          const overdue = !t.done && t.dueDate && t.dueDate < today;
          return (
            <li key={t.id} className={`row between ${t.done ? 'done' : ''}`}>
              <label className="row grow">
                <input
                  type="checkbox"
                  checked={t.done}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    patch((c) => {
                      const x = c.plan.find((y) => y.id === t.id)!;
                      x.done = checked;
                      x.doneAt = checked ? todayYmd() : undefined;
                    });
                  }}
                />
                <span className="grow">{t.title}</span>
                {t.dueDate && <span className={`small nowrap ${overdue ? 'error' : 'muted'}`}>{formatYmd(t.dueDate)}</span>}
              </label>
              <span className="row nowrap">
                <button
                  className="btn ghost icon"
                  aria-label="編集"
                  onClick={() => {
                    const nt = prompt('', t.title);
                    if (nt === null || !nt.trim()) return;
                    const nd = prompt('YYYY-MM-DD', t.dueDate ?? '');
                    if (nd === null) return;
                    if (nd && !/^\d{4}-\d{2}-\d{2}$/.test(nd)) return;
                    patch((c) => {
                      const x = c.plan.find((y) => y.id === t.id)!;
                      x.title = nt.trim();
                      x.dueDate = nd || undefined;
                    });
                  }}
                >
                  <Pencil size={16} />
                </button>
                <button className="btn ghost icon danger" aria-label="削除" onClick={() => patch((c) => (c.plan = c.plan.filter((y) => y.id !== t.id)))}>
                  <Trash2 size={16} />
                </button>
              </span>
            </li>
          );
        })}
      </ul>
      <div className="row wrap">
        <input className="grow" aria-label="予定" value={title} onChange={(e) => setTitle(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && add()} />
        <input type="date" value={due} onChange={(e) => setDue(e.target.value)} aria-label="期限" />
        <button className="btn icon" aria-label="追加" onClick={add}>
          <Plus size={18} />
        </button>
      </div>
    </Section>
  );
}

function ExpenseRow({ e, setE, remove }: { e: Expense; setE: (fn: (x: Expense) => void) => void; remove: () => void }) {
  const applied = e.status !== 'unapplied';
  return (
    <div className={`expense ${e.status}`}>
      <div className="row">
        <button
          className={`check-toggle ${applied ? 'on' : ''}`}
          aria-pressed={applied}
          aria-label="申請済み"
          title="申請済み"
          onClick={() =>
            setE((x) => {
              x.status = applied ? 'unapplied' : 'applied';
              x.appliedAt = applied ? undefined : x.appliedAt ?? todayYmd();
            })
          }
        >
          <Check size={22} />
        </button>
        <select value={e.kind} onChange={(ev) => { const v = ev.target.value as ExpenseKind; setE((x) => { x.kind = v; x.label = EXPENSE_KIND_LABEL[v]; }); }} aria-label="種別">
          {Object.entries(EXPENSE_KIND_LABEL).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
        <label className="input-icon grow">
          <JapaneseYen size={16} />
          <input
            type="number"
            min={0}
            inputMode="numeric"
            value={e.amount || ''}
            onChange={(ev) => {
              const v = Number(ev.target.value) || 0;
              setE((x) => (x.amount = v));
            }}
            aria-label="金額"
          />
        </label>
      </div>
      <div className="row wrap">
        <div className="steps" role="radiogroup" aria-label="申請状況">
          {(Object.keys(EXPENSE_STATUS_LABEL) as ExpenseStatus[]).map((s) => {
            const Icon = EXPENSE_STEP_ICON[s];
            return (
              <button
                key={s}
                role="radio"
                aria-checked={e.status === s}
                className={e.status === s ? 'on' : ''}
                title={EXPENSE_STATUS_LABEL[s]}
                onClick={() =>
                  setE((x) => {
                    x.status = s;
                    if (s === 'unapplied') x.appliedAt = undefined;
                    else x.appliedAt ??= todayYmd();
                  })
                }
              >
                <Icon size={14} /> {EXPENSE_STATUS_LABEL[s]}
              </button>
            );
          })}
        </div>
        <button
          className={`btn icon toggle ${e.receiptSaved ? 'on' : ''}`}
          aria-pressed={e.receiptSaved}
          aria-label="領収書保存済み"
          title="領収書保存済み"
          onClick={() => setE((x) => (x.receiptSaved = !x.receiptSaved))}
        >
          <Receipt size={18} />
        </button>
        <label className="input-icon" title="申請期限">
          <CalendarClock size={16} />
          <input type="date" value={e.deadline ?? ''} onChange={(ev) => { const v = ev.target.value || undefined; setE((x) => (x.deadline = v)); }} aria-label="申請期限" />
        </label>
        <button className="btn ghost icon danger" aria-label="削除" onClick={() => confirm('削除?') && remove()}>
          <Trash2 size={16} />
        </button>
      </div>
      <label className="input-icon">
        <StickyNote size={16} />
        <input className="grow" value={e.note ?? ''} onChange={(ev) => { const v = ev.target.value || undefined; setE((x) => (x.note = v)); }} aria-label="備考" />
      </label>
    </div>
  );
}

function ExpenseSection({ cert, patch }: { cert: Certification; patch: Patch }) {
  const addExpense = () =>
    patch((c) => {
      const kind: ExpenseKind = c.expenses.some((e) => e.kind === 'exam') ? 'material' : 'exam';
      c.expenses.push({
        id: newId(),
        kind,
        label: EXPENSE_KIND_LABEL[kind],
        amount: 0,
        status: 'unapplied',
        receiptSaved: false,
      });
    });
  const total = cert.expenses.reduce((s, e) => s + (e.amount || 0), 0);
  const pending = cert.expenses.filter((e) => e.status !== 'paid').reduce((s, e) => s + (e.amount || 0), 0);

  return (
    <Section
      Icon={JapaneseYen}
      title="経費"
      extra={
        <span className="row nowrap">
          {total > 0 && (
            <span className="small muted" title="未精算 / 合計">
              {pending.toLocaleString()} / {total.toLocaleString()}
            </span>
          )}
          <button className="btn ghost icon" aria-label="経費を追加" onClick={addExpense}>
            <Plus size={20} />
          </button>
        </span>
      }
    >
      {cert.expenses.map((e) => (
        <ExpenseRow
          key={e.id}
          e={e}
          setE={(fn) =>
            patch((c) => {
              const x = c.expenses.find((y) => y.id === e.id);
              if (x) fn(x);
            })
          }
          remove={() => patch((c) => (c.expenses = c.expenses.filter((x) => x.id !== e.id)))}
        />
      ))}
    </Section>
  );
}
