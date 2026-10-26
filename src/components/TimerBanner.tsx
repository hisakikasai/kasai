import { useEffect, useState } from 'react';
import { useStore } from '../store';
import { newId } from '../lib/id';
import { toYmd } from '../lib/date';

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
      const input = prompt(`計測時間が ${minutes} 分になっています。記録する分数を入力してください`, String(minutes));
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
          memo: 'タイマー計測',
          createdAt: new Date().toISOString(),
        });
      }
      d.timer = undefined;
    });
  };

  return (
    <div className="banner timer">
      <span>
        ⏱ {cert?.name ?? '学習'} を計測中 <strong className="mono">{elapsedLabel(elapsed)}</strong>
      </span>
      <span className="row">
        <button className="btn primary sm" onClick={() => stop(true)}>
          終了して記録
        </button>
        <button
          className="btn ghost sm"
          onClick={() => confirm('計測を破棄しますか？') && stop(false)}
        >
          破棄
        </button>
      </span>
    </div>
  );
}
