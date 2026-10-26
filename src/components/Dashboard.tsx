import { useState } from 'react';
import { useStore } from '../store';
import { isIos, isStandalone } from '../lib/platform';
import { buildAlerts, currentStreak, longestStreak, minutesByDate } from '../lib/stats';
import { addDays, formatMinutes, todayYmd } from '../lib/date';
import { href } from '../router';
import QuickLog from './QuickLog';
import Heatmap from './Heatmap';
import CertCard from './CertCard';
import LinkButtons from './LinkButtons';
import InstallGuide from './InstallGuide';

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

  const active = data.certifications
    .filter((c) => !c.archived && c.status !== 'passed' && c.status !== 'failed')
    .sort((a, b) => (a.examDate ?? '9999').localeCompare(b.examDate ?? '9999'));

  return (
    <div className="stack">
      {showInstall && (
        <section className="card">
          <div className="row between">
            <h2>📱 ホーム画面に追加しましょう</h2>
            <button
              className="btn ghost sm"
              aria-label="閉じる"
              onClick={() => {
                localStorage.setItem(INSTALL_DISMISS_KEY, '1');
                setShowInstall(false);
              }}
            >
              ✕
            </button>
          </div>
          <InstallGuide />
        </section>
      )}
      <section className="stats">
        <div className="stat">
          <div className="stat-value">🔥 {streak}日</div>
          <div className="stat-label">連続記録（最長 {longestStreak(data.logs)}日）</div>
        </div>
        <div className="stat">
          <div className={`stat-value ${todayMin >= goal ? 'ok' : ''}`}>{formatMinutes(todayMin)}</div>
          <div className="stat-label">今日 / 目標 {formatMinutes(goal)}</div>
        </div>
        <div className="stat">
          <div className="stat-value">{formatMinutes(weekMin)}</div>
          <div className="stat-label">直近7日</div>
        </div>
      </section>

      {streak > 0 && todayMin === 0 && (
        <div className="banner warn">今日はまだ記録がありません。5分だけでも記録して連続 {streak + 1} 日目にしましょう!</div>
      )}

      <QuickLog />

      {alerts.length > 0 && (
        <section className="card">
          <h2>確認事項</h2>
          <ul className="alerts">
            {alerts.map((a, i) => (
              <li key={i} className={a.level}>
                {a.certId ? <a href={href({ name: 'cert', id: a.certId })}>{a.message}</a> : <a href={href({ name: 'settings' })}>{a.message}</a>}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="stack">
        <div className="row between">
          <h2>受験予定</h2>
          <a href={href({ name: 'certs' })} className="small">
            すべての資格 →
          </a>
        </div>
        {active.length === 0 && <p className="muted">勉強中の資格はありません。</p>}
        {active.map((c) => (
          <CertCard key={c.id} cert={c} />
        ))}
      </section>

      {data.globalLinks.length > 0 && (
        <section className="card">
          <h2>学習サイト</h2>
          <LinkButtons links={data.globalLinks} />
        </section>
      )}

      <section className="card">
        <h2>学習カレンダー</h2>
        <Heatmap logs={data.logs} goal={goal} />
      </section>
    </div>
  );
}
