import { useState } from 'react';
import { useStore } from '../store';
import { isIos, isStandalone } from '../lib/platform';
import { buildAlerts, currentStreak, longestStreak, minutesByDate } from '../lib/stats';
import { addDays, formatMinutes, todayYmd } from '../lib/date';
import QuickLog from './QuickLog';
import Heatmap from './Heatmap';
import CertCard from './CertCard';
import LinkButtons from './LinkButtons';
import AlertList from './AlertList';
import InstallGuide from './InstallGuide';
import { CalendarDays, Flame, Target, X } from './icons';

const INSTALL_DISMISS_KEY = 'shikaku-manager:install-dismissed';

export default function Dashboard() {
  const { data } = useStore();
  const [showInstall, setShowInstall] = useState(() => {
    try {
      return isIos() && !isStandalone() && !localStorage.getItem(INSTALL_DISMISS_KEY);
    } catch {
      return false;
    }
  });
  const today = todayYmd();
  const byDate = minutesByDate(data.logs);
  const todayMin = byDate.get(today) ?? 0;
  let weekMin = 0;
  for (let i = 0; i < 7; i++) weekMin += byDate.get(addDays(today, -i)) ?? 0;
  const goal = data.settings.dailyGoalMinutes;
  const streak = currentStreak(data.logs, today);
  const alerts = buildAlerts(data, today);
  const goalRatio = Math.min(1, todayMin / goal);

  const active = data.certifications
    .filter((c) => !c.archived && c.status !== 'passed' && c.status !== 'failed')
    .sort((a, b) => (a.examDate ?? '9999').localeCompare(b.examDate ?? '9999'));

  return (
    <div className="stack">
      {showInstall && (
        <div className="card row between">
          <InstallGuide />
          <button
            className="btn ghost icon"
            aria-label="閉じる"
            onClick={() => {
              localStorage.setItem(INSTALL_DISMISS_KEY, '1');
              setShowInstall(false);
            }}
          >
            <X size={18} />
          </button>
        </div>
      )}

      <section className="stats">
        <div className={`stat ${streak > 0 && todayMin === 0 ? 'at-risk' : ''}`} title={`連続記録（最長 ${longestStreak(data.logs)}日）`}>
          <Flame size={22} className={streak > 0 ? 'flame' : 'muted'} />
          <div className="stat-value">{streak}</div>
        </div>
        <div className="stat" title={`今日 / 目標 ${formatMinutes(goal)}`}>
          <div className="ring" style={{ ['--p' as string]: goalRatio }}>
            <Target size={18} className={goalRatio >= 1 ? 'ok' : 'muted'} />
          </div>
          <div className={`stat-value ${goalRatio >= 1 ? 'ok' : ''}`}>{formatMinutes(todayMin)}</div>
        </div>
        <div className="stat" title="直近7日">
          <span className="row nowrap muted small"><CalendarDays size={18} />7d</span>
          <div className="stat-value">{formatMinutes(weekMin)}</div>
        </div>
      </section>

      <QuickLog />

      <AlertList alerts={alerts} />

      {active.map((c) => (
        <CertCard key={c.id} cert={c} />
      ))}

      {data.globalLinks.length > 0 && (
        <section className="card">
          <LinkButtons links={data.globalLinks} />
        </section>
      )}

      <section className="card">
        <Heatmap logs={data.logs} goal={goal} />
      </section>
    </div>
  );
}
