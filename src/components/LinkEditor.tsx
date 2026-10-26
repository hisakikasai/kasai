import { useState } from 'react';
import type { StudyLink } from '../types';
import { newId } from '../lib/id';
import { LINK_PRESETS, hostOf, normalizeUrl } from '../lib/url';

interface Props {
  links: StudyLink[];
  onChange: (links: StudyLink[]) => void;
}

export default function LinkEditor({ links, onChange }: Props) {
  const [label, setLabel] = useState('');
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');

  const add = (l: string, u: string) => {
    const normalized = normalizeUrl(u);
    if (!normalized) {
      setError('http(s) の URL を入力してください');
      return;
    }
    if (links.some((x) => x.url === normalized)) {
      setError('同じ URL が登録済みです');
      return;
    }
    onChange([...links, { id: newId(), label: l.trim() || hostOf(normalized), url: normalized }]);
    setLabel('');
    setUrl('');
    setError('');
  };

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= links.length) return;
    const next = [...links];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };

  return (
    <div className="stack-sm">
      {links.length > 0 && (
        <ul className="list">
          {links.map((l, i) => (
            <li key={l.id} className="row between">
              <a href={l.url} target="_blank" rel="noopener noreferrer" className="ellipsis">
                🔗 {l.label} <span className="muted small">{hostOf(l.url)}</span>
              </a>
              <span className="row nowrap">
                <button className="btn ghost sm" aria-label="上へ" onClick={() => move(i, -1)}>
                  ↑
                </button>
                <button className="btn ghost sm" aria-label="下へ" onClick={() => move(i, 1)}>
                  ↓
                </button>
                <button
                  className="btn ghost sm"
                  onClick={() => {
                    const nl = prompt('表示名', l.label);
                    if (nl === null) return;
                    const nu = prompt('URL', l.url);
                    if (nu === null) return;
                    const norm = normalizeUrl(nu);
                    if (!norm) return alert('http(s) の URL を入力してください');
                    onChange(links.map((x) => (x.id === l.id ? { ...x, label: nl.trim() || hostOf(norm), url: norm } : x)));
                  }}
                >
                  編集
                </button>
                <button className="btn ghost sm danger" onClick={() => onChange(links.filter((x) => x.id !== l.id))}>
                  削除
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}
      <div className="row wrap">
        <input placeholder="表示名（例: Skill Builder）" value={label} onChange={(e) => setLabel(e.target.value)} />
        <input
          placeholder="https://..."
          type="url"
          inputMode="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && add(label, url)}
        />
        <button className="btn" onClick={() => add(label, url)}>
          追加
        </button>
      </div>
      {error && <div className="error small">{error}</div>}
      <div className="chips">
        <span className="muted small">よく使うサイト:</span>
        {LINK_PRESETS.filter((p) => !links.some((l) => l.url === p.url)).map((p) => (
          <button key={p.url} className="chip" onClick={() => add(p.label, p.url)}>
            + {p.label}
          </button>
        ))}
      </div>
    </div>
  );
}
