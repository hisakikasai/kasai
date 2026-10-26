import type { Certification } from '../types';
import { useStore } from '../store';
import { certProgress } from '../lib/stats';
import { formatMinutes, formatYmd } from '../lib/date';
import { href } from '../router';
import LinkButtons from './LinkButtons';
import { CalendarDays, Clock, Gauge, JapaneseYen, ListChecks, Trophy } from './icons';
import type { LucideIcon } from 'lucide-react';

export function Progress({ ratio, label, Icon }: { ratio: number; label: string; Icon: LucideIcon }) {
  return (
    <div className="progress-row">
      <Icon size={16} className="muted" />
      <div className="progress">
        <div className="bar" style={{ width: `${Math.round(ratio * 100)}%` }} />
        <span>{label}</span>
      </div>
    </div>
  );
}

export function Countdown({ cert, days }: { cert: Certification; days?: number }) {
  if (cert.status === 'passed') return <span className="badge ok"><Trophy size={14} /></span>;
  if (cert.status === 'failed') return <span className="badge">✕</span>;
  if (days === undefined) return <span className="badge">D-?</span>;
  if (days < 0) return <span className="badge warn">D+{-days}</span>;
  if (days === 0) return <span className="badge danger">D-DAY</span>;
  return <span className={`badge ${days <= 7 ? 'danger' : days <= 30 ? 'warn' : ''}`}>D-{days}</span>;
}

export default function CertCard({ cert }: { cert: Certification }) {
  const { data } = useStore();
  const p = certProgress(cert, data.logs);
  const unapplied = cert.expenses.filter((e) => e.status === 'unapplied').length;
  const nextTask = cert.plan
    .filter((t) => !t.done)
    .sort((a, b) => (a.dueDate ?? '9999').localeCompare(b.dueDate ?? '9999'))[0];

  return (
    <article className={`card cert-card ${cert.archived ? 'archived' : ''}`}>
      <div className="row between">
        <a href={href({ name: 'cert', id: cert.id })} className="cert-title">
          {cert.name}
        </a>
        <Countdown cert={cert} days={p.daysLeft} />
      </div>
      <div className="row wrap small muted">
        <span className="row nowrap"><CalendarDays size={14} /> {formatYmd(cert.examDate)}</span>
        {p.requiredPerDay !== undefined && p.requiredPerDay > 0 && (
          <span className="row nowrap" title="1日あたり必要な学習時間"><Gauge size={14} /> {formatMinutes(p.requiredPerDay)}/日</span>
        )}
        {unapplied > 0 && <span className="badge warn"><JapaneseYen size={12} /> {unapplied}</span>}
        {p.overdueTasks > 0 && <span className="badge warn"><ListChecks size={12} /> {p.overdueTasks}</span>}
      </div>

      {p.planTotal > 0 && <Progress Icon={ListChecks} ratio={p.planRatio} label={`${p.planDone}/${p.planTotal}`} />}
      <Progress
        Icon={Clock}
        ratio={p.hoursRatio ?? 0}
        label={p.targetMinutes ? `${formatMinutes(p.studiedMinutes)} / ${cert.targetHours}h` : formatMinutes(p.studiedMinutes)}
      />
      {nextTask && (
        <div className="small row nowrap">
          <span className="dot" /> <span className="ellipsis">{nextTask.title}</span>
          {nextTask.dueDate && <span className="muted">{formatYmd(nextTask.dueDate)}</span>}
        </div>
      )}
      <LinkButtons links={cert.links} certId={cert.id} />
    </article>
  );
}
