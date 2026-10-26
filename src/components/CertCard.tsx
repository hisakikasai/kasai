import type { Certification } from '../types';
import { CERT_STATUS_LABEL } from '../types';
import { useStore } from '../store';
import { certProgress } from '../lib/stats';
import { formatMinutes, formatYmd } from '../lib/date';
import { href } from '../router';
import LinkButtons from './LinkButtons';

export function Progress({ ratio, label }: { ratio: number; label: string }) {
  return (
    <div className="progress" title={label}>
      <div className="bar" style={{ width: `${Math.round(ratio * 100)}%` }} />
      <span>{label}</span>
    </div>
  );
}

export function Countdown({ days }: { days?: number }) {
  if (days === undefined) return <span className="badge">受験日未定</span>;
  if (days < 0) return <span className="badge">受験済み/過ぎています</span>;
  if (days === 0) return <span className="badge danger">今日が受験日!</span>;
  return <span className={`badge ${days <= 7 ? 'danger' : days <= 30 ? 'warn' : ''}`}>あと {days} 日</span>;
}

export default function CertCard({ cert }: { cert: Certification }) {
  const { data } = useStore();
  const p = certProgress(cert, data.logs);
  const unapplied = cert.expenses.filter((e) => e.status === 'unapplied').length;
  const nextTask = cert.plan
    .filter((t) => !t.done)
    .sort((a, b) => (a.dueDate ?? '9999').localeCompare(b.dueDate ?? '9999'))[0];

  return (
    <article className="card cert-card">
      <div className="row between">
        <a href={href({ name: 'cert', id: cert.id })} className="cert-title">
          {cert.name}
        </a>
        <Countdown days={cert.status === 'passed' || cert.status === 'failed' ? undefined : p.daysLeft} />
      </div>
      <div className="muted small">
        {cert.provider && `${cert.provider} ・ `}
        {CERT_STATUS_LABEL[cert.status]} ・ 受験日 {formatYmd(cert.examDate)}
      </div>

      {p.planTotal > 0 && <Progress ratio={p.planRatio} label={`予定 ${p.planDone}/${p.planTotal}`} />}
      {p.targetMinutes ? (
        <Progress
          ratio={p.hoursRatio ?? 0}
          label={`学習 ${formatMinutes(p.studiedMinutes)} / ${cert.targetHours}時間`}
        />
      ) : (
        <div className="small">累計 {formatMinutes(p.studiedMinutes)}</div>
      )}
      {p.requiredPerDay !== undefined && p.requiredPerDay > 0 && (
        <div className="small">目標達成ペース: 1日あたり約 {formatMinutes(p.requiredPerDay)}</div>
      )}
      {nextTask && (
        <div className="small">
          次の予定: {nextTask.title}
          {nextTask.dueDate && <span className="muted">（{formatYmd(nextTask.dueDate)}まで）</span>}
        </div>
      )}
      <div className="row wrap">
        {unapplied > 0 && <span className="badge warn">経費 未申請 {unapplied}件</span>}
        {p.overdueTasks > 0 && <span className="badge warn">期限切れ予定 {p.overdueTasks}件</span>}
      </div>
      <LinkButtons links={cert.links} certId={cert.id} />
    </article>
  );
}
