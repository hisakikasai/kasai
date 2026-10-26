import type { StudyLink } from '../types';
import { useStore } from '../store';
import { hostOf } from '../lib/url';
import { Link, Timer } from './icons';

/** 外部学習サイトへのリンク。⏱ で開くとタイマーも同時に開始する */
export default function LinkButtons({ links, certId }: { links: StudyLink[]; certId?: string }) {
  const { data, update } = useStore();
  if (links.length === 0) return null;
  const openWithTimer = (url: string) => {
    if (certId && !data.timer) update((d) => (d.timer = { certId, startedAt: Date.now() }));
    window.open(url, '_blank', 'noopener,noreferrer');
  };
  return (
    <div className="links">
      {links.map((l) => (
        <span key={l.id} className="link-pill">
          <a href={l.url} target="_blank" rel="noopener noreferrer" title={l.url}>
            <Link size={14} /> {l.label || hostOf(l.url)}
          </a>
          {certId && !data.timer && (
            <button className="link-timer" aria-label="開いてタイマー開始" title="開いてタイマー開始" onClick={() => openWithTimer(l.url)}>
              <Timer size={16} />
            </button>
          )}
        </span>
      ))}
    </div>
  );
}
