import { useRoute, href } from './router';
import { useStore } from './store';
import Dashboard from './components/Dashboard';
import CertList from './components/CertList';
import CertDetail from './components/CertDetail';
import LogsPage from './components/LogsPage';
import SettingsPage from './components/SettingsPage';
import TimerBanner from './components/TimerBanner';
import { BookOpen, History, House, Settings, X } from './components/icons';

const NAV = [
  { name: 'home', label: 'ホーム', Icon: House, to: href({ name: 'home' }) },
  { name: 'certs', label: '資格', Icon: BookOpen, to: href({ name: 'certs' }) },
  { name: 'logs', label: '記録', Icon: History, to: href({ name: 'logs' }) },
  { name: 'settings', label: '設定', Icon: Settings, to: href({ name: 'settings' }) },
] as const;

export default function App() {
  const route = useRoute();
  const { saveError } = useStore();
  const active = route.name === 'cert' ? 'certs' : route.name;

  return (
    <div className="app">
      <header className="topbar">
        <a href={href({ name: 'home' })} className="brand" aria-label="ホーム">
          <img src="./icon.svg" alt="" width={28} height={28} />
        </a>
        <nav className="topnav">
          {NAV.map(({ name, label, Icon, to }) => (
            <a key={name} href={to} className={active === name ? 'active' : ''} aria-label={label} title={label}>
              <Icon size={22} />
            </a>
          ))}
        </nav>
      </header>

      <TimerBanner />
      {saveError && (
        <div className="banner danger" role="alert">
          <X size={18} /> 保存失敗
        </div>
      )}

      <main className="content">
        {route.name === 'home' && <Dashboard />}
        {route.name === 'certs' && <CertList />}
        {route.name === 'cert' && <CertDetail id={route.id} />}
        {route.name === 'logs' && <LogsPage />}
        {route.name === 'settings' && <SettingsPage />}
      </main>

      <nav className="bottomnav">
        {NAV.map(({ name, label, Icon, to }) => (
          <a key={name} href={to} className={active === name ? 'active' : ''} aria-label={label}>
            <Icon size={24} strokeWidth={active === name ? 2.5 : 2} />
          </a>
        ))}
      </nav>
    </div>
  );
}
