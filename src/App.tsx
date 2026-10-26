import { useRoute, href } from './router';
import { useStore } from './store';
import Dashboard from './components/Dashboard';
import CertList from './components/CertList';
import CertDetail from './components/CertDetail';
import LogsPage from './components/LogsPage';
import SettingsPage from './components/SettingsPage';
import TimerBanner from './components/TimerBanner';

const NAV = [
  { name: 'home', label: 'ホーム', icon: '🏠', to: href({ name: 'home' }) },
  { name: 'certs', label: '資格', icon: '📚', to: href({ name: 'certs' }) },
  { name: 'logs', label: '記録', icon: '📝', to: href({ name: 'logs' }) },
  { name: 'settings', label: '設定', icon: '⚙️', to: href({ name: 'settings' }) },
] as const;

export default function App() {
  const route = useRoute();
  const { saveError } = useStore();
  const active = route.name === 'cert' ? 'certs' : route.name;

  return (
    <div className="app">
      <header className="topbar">
        <a href={href({ name: 'home' })} className="brand">
          資格マネージャー
        </a>
        <nav className="topnav">
          {NAV.map((n) => (
            <a key={n.name} href={n.to} className={active === n.name ? 'active' : ''}>
              {n.label}
            </a>
          ))}
        </nav>
      </header>

      <TimerBanner />
      {saveError && (
        <div className="banner danger">保存に失敗しました。ブラウザの容量やプライベートモードを確認してください。</div>
      )}

      <main className="content">
        {route.name === 'home' && <Dashboard />}
        {route.name === 'certs' && <CertList />}
        {route.name === 'cert' && <CertDetail id={route.id} />}
        {route.name === 'logs' && <LogsPage />}
        {route.name === 'settings' && <SettingsPage />}
      </main>

      <nav className="bottomnav">
        {NAV.map((n) => (
          <a key={n.name} href={n.to} className={active === n.name ? 'active' : ''}>
            <span aria-hidden>{n.icon}</span>
            {n.label}
          </a>
        ))}
      </nav>
    </div>
  );
}
