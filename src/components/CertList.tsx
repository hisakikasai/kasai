import { useState } from 'react';
import { useStore } from '../store';
import { newId } from '../lib/id';
import { navigate } from '../router';
import CertCard from './CertCard';

const TEMPLATES = [
  { name: 'AWS Certified Solutions Architect - Associate', provider: 'AWS', link: { label: 'AWS Skill Builder', url: 'https://skillbuilder.aws/' } },
  { name: 'AWS Certified Cloud Practitioner', provider: 'AWS', link: { label: 'AWS Skill Builder', url: 'https://skillbuilder.aws/' } },
  { name: '基本情報技術者試験', provider: 'IPA', link: { label: 'IPA', url: 'https://www.ipa.go.jp/shiken/' } },
  { name: '応用情報技術者試験', provider: 'IPA', link: { label: 'IPA', url: 'https://www.ipa.go.jp/shiken/' } },
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

  const list = data.certifications
    .filter((c) => showArchived || !c.archived)
    .sort((a, b) => (a.examDate ?? '9999').localeCompare(b.examDate ?? '9999'));

  return (
    <div className="stack">
      <section className="card">
        <h2>資格を追加</h2>
        <div className="row">
          <input
            className="grow"
            placeholder="資格名（例: AWS SAA）"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && create(name)}
          />
          <button className="btn primary" onClick={() => create(name)}>
            追加
          </button>
        </div>
        <div className="chips mt">
          <span className="muted small">テンプレート:</span>
          {TEMPLATES.map((t) => (
            <button key={t.name} className="chip" onClick={() => create(t.name, t.provider, t.link)}>
              + {t.name}
            </button>
          ))}
        </div>
      </section>

      <div className="row between">
        <h2>資格一覧（{list.length}）</h2>
        <label className="small row nowrap">
          <input type="checkbox" checked={showArchived} onChange={(e) => setShowArchived(e.target.checked)} />
          アーカイブも表示
        </label>
      </div>
      {list.length === 0 && <p className="muted">まだ資格が登録されていません。</p>}
      {list.map((c) => (
        <CertCard key={c.id} cert={c} />
      ))}
    </div>
  );
}
