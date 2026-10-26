import { useState } from 'react';
import type { StudyLink } from '../types';
import { newId } from '../lib/id';
import { LINK_PRESETS, hostOf, normalizeUrl } from '../lib/url';
import { ArrowDown, ArrowUp, Link, Pencil, Plus, Trash2 } from './icons';

interface Props {
  links: StudyLink[];
  onChange: (links: StudyLink[]) => void;
}

export default function LinkEditor({ links, onChange }: Props) {
  const [label, setLabel] = useState('');
  const [url, setUrl] = useState('');
  const [error, setError] = useState(false);

  const add = (l: string, u: string) => {
    const normalized = normalizeUrl(u);
    if (!normalized || links.some((x) => x.url === normalized)) {
      setError(true);
      return;
    }
    onChange([...links, { id: newId(), label: l.trim() || hostOf(normalized), url: normalized }]);
    setLabel('');
    setUrl('');
    setError(false);
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
              <a href={l.url} target="_blank" rel="noopener noreferrer" className="grow ellipsis" title={l.url}>
                <Link size={14} className="inline-icon" /> {l.label}
              </a>
              <span className="row nowrap">
                <button className="btn ghost icon" aria-label="上へ" disabled={i === 0} onClick={() => move(i, -1)}>
                  <ArrowUp size={16} />
                </button>
                <button className="btn ghost icon" aria-label="下へ" disabled={i === links.length - 1} onClick={() => move(i, 1)}>
                  <ArrowDown size={16} />
                </button>
                <button
                  className="btn ghost icon"
                  aria-label="編集"
                  onClick={() => {
                    const nl = prompt('名前', l.label);
                    if (nl === null) return;
                    const nu = prompt('URL', l.url);
                    if (nu === null) return;
                    const norm = normalizeUrl(nu);
                    if (!norm) return;
                    onChange(links.map((x) => (x.id === l.id ? { ...x, label: nl.trim() || hostOf(norm), url: norm } : x)));
                  }}
                >
                  <Pencil size={16} />
                </button>
                <button className="btn ghost icon danger" aria-label="削除" onClick={() => onChange(links.filter((x) => x.id !== l.id))}>
                  <Trash2 size={16} />
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}
      <div className="row wrap">
        <input className="grow" placeholder="名前" value={label} onChange={(e) => setLabel(e.target.value)} aria-label="名前" />
        <input
          className={`grow ${error ? 'invalid' : ''}`}
          placeholder="https://"
          type="url"
          inputMode="url"
          value={url}
          onChange={(e) => {
            setUrl(e.target.value);
            setError(false);
          }}
          onKeyDown={(e) => e.key === 'Enter' && add(label, url)}
          aria-label="URL"
        />
        <button className="btn icon" aria-label="追加" onClick={() => add(label, url)}>
          <Plus size={18} />
        </button>
      </div>
      <div className="chips">
        {LINK_PRESETS.filter((p) => !links.some((l) => l.url === p.url)).map((p) => (
          <button key={p.url} className="chip" onClick={() => add(p.label, p.url)}>
            <Plus size={12} /> {p.label}
          </button>
        ))}
      </div>
    </div>
  );
}
