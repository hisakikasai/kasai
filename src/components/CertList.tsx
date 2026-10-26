import { useState } from 'react';
import { useStore } from '../store';
import { newId } from '../lib/id';
import { navigate } from '../router';
import CertCard from './CertCard';
import { Archive, Plus } from './icons';

const TEMPLATES = [
  { name: 'AWS SAA', provider: 'AWS', link: { label: 'AWS Skill Builder', url: 'https://skillbuilder.aws/' } },
  { name: 'AWS CLF', provider: 'AWS', link: { label: 'AWS Skill Builder', url: 'https://skillbuilder.aws/' } },
  { name: '基本情報', provider: 'IPA', link: { label: 'IPA', url: 'https://www.ipa.go.jp/shiken/' } },
  { name: '応用情報', provider: 'IPA', link: { label: 'IPA', url: 'https://www.ipa.go.jp/shiken/' } },
];

export default function CertList() {
  const { data, update } = useStore();
  const [name, setName] = useState('');
  const [showArchived, setShowArchived] = useState(false);

  const create = (n: string, provider = '', link?: { label: string; url: string }) => {
    if (!n.trim()) return;
    const id = newId();
    update((d) => {
      d.certifications.push({
        id,
        name: n.trim(),
        provider,
        status: 'studying',
        plan: [],
        links: link ? [{ id: newId(), ...link }] : [],
        expenses: [],
        createdAt: new Date().toISOString(),
      });
    });
    setName('');
    navigate({ name: 'cert', id });
  };

  const archivedCount = data.certifications.filter((c) => c.archived).length;
  const list = data.certifications
    .filter((c) => showArchived || !c.archived)
    .sort((a, b) => (a.examDate ?? '9999').localeCompare(b.examDate ?? '9999'));

  return (
    <div className="stack">
      <section className="card stack-sm">
        <div className="row">
          <input
            className="grow"
            placeholder="資格名"
            aria-label="資格名"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && create(name)}
          />
          <button className="btn primary icon" aria-label="追加" onClick={() => create(name)}>
            <Plus size={20} />
          </button>
        </div>
        <div className="chips">
          {TEMPLATES.map((t) => (
            <button key={t.name} className="chip" onClick={() => create(t.name, t.provider, t.link)}>
              <Plus size={12} /> {t.name}
            </button>
          ))}
        </div>
      </section>

      {list.map((c) => (
        <CertCard key={c.id} cert={c} />
      ))}

      {archivedCount > 0 && (
        <button className={`btn ghost self-center ${showArchived ? 'active' : ''}`} onClick={() => setShowArchived(!showArchived)} aria-label="アーカイブを表示">
          <Archive size={16} /> {archivedCount}
        </button>
      )}
    </div>
  );
}
