import type { Alert, AlertKind } from '../lib/stats';
import { href } from '../router';
import type { LucideIcon } from 'lucide-react';
import { CalendarX, Flag, HardDriveDownload, JapaneseYen, ListChecks, Receipt, RefreshCw, Ticket } from './icons';

/** アイコン + 短い語で「やり忘れ」を表す */
const KIND: Record<AlertKind, { Icon: LucideIcon; text: string }> = {
  noExamDate: { Icon: CalendarX, text: '受験日?' },
  examPast: { Icon: Flag, text: '結果?' },
  booking: { Icon: Ticket, text: '予約?' },
  overdueTasks: { Icon: ListChecks, text: '遅れ' },
  unapplied: { Icon: JapaneseYen, text: '未申請' },
  noReceipt: { Icon: Receipt, text: '領収書?' },
  expiry: { Icon: RefreshCw, text: '更新' },
  backup: { Icon: HardDriveDownload, text: 'バックアップ' },
};

export default function AlertList({ alerts }: { alerts: Alert[] }) {
  if (alerts.length === 0) return null;
  return (
    <div className="alerts">
      {alerts.map((a, i) => {
        const { Icon, text } = KIND[a.kind];
        return (
          <a
            key={i}
            className={`alert ${a.level}`}
            href={a.certId ? href({ name: 'cert', id: a.certId }) : href({ name: 'settings' })}
          >
            <Icon size={16} />
            <span>{text}</span>
            {a.detail && <span className="alert-detail">{a.detail}</span>}
            {a.certName && <span className="muted ellipsis">{a.certName}</span>}
          </a>
        );
      })}
    </div>
  );
}
