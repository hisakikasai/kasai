import { useEffect, useState } from 'react';
import { useStore } from '../store';
import { newId } from '../lib/id';
import { toYmd } from '../lib/date';
import { Check, Timer, X } from './icons';

export function elapsedLabel(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

/** 外部サイトで勉強している間も動き続けるタイマー（開始時刻を保存しているのでタブを閉じても消えない） */
export default function TimerBanner() {
  const { data, update } = useStore();
  const timer = data.timer;
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!timer) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [timer]);

  if (!timer) return null;
  const cert = data.certifications.find((c) => c.id === timer.certId);
  const elapsed = now - timer.startedAt;

  const stop = (save: boolean) => {
    let minutes = Math.max(1, Math.round(elapsed / 60000));
    // 止め忘れ対策: 3 時間を超えたら実際の学習時間を確認する
    if (save && minutes > 180) {
      const input = prompt('分', String(minutes));
      if (input === null) return;
      const n = Number(input);
      if (!Number.isFinite(n) || n <= 0) return;
      minutes = Math.round(n);
    }
    update((d) => {
      if (save) {
        d.logs.push({
          id: newId(),
          certId: timer.certId,
          // 開始した日の学習として記録（日付をまたいでも記録先がぶれないように）
          date: toYmd(new Date(timer.startedAt)),
          minutes,
          memo: undefined,
          createdAt: new Date().toISOString(),
        });
      }
      d.timer = undefined;
    });
  };

  return (
    <div className="banner timer">
      <span className="row grow">
        <Timer size={18} className="pulse" />
        <strong className="mono">{elapsedLabel(elapsed)}</strong>
        <span className="muted ellipsis">{cert?.name}</span>
      </span>
      <span className="row nowrap">
        <button className="btn primary icon" aria-label="終了して記録" title="終了して記録" onClick={() => stop(true)}>
          <Check size={20} />
        </button>
        <button className="btn ghost icon" aria-label="破棄" title="破棄" onClick={() => confirm('破棄?') && stop(false)}>
          <X size={20} />
        </button>
      </span>
    </div>
  );
}
