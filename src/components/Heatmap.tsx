import type { StudyLog } from '../types';
import { addDays, formatMinutes, parseYmd, todayYmd } from '../lib/date';
import { minutesByDate } from '../lib/stats';

function level(min: number, goal: number): number {
  if (min <= 0) return 0;
  if (min < goal / 2) return 1;
  if (min < goal) return 2;
  if (min < goal * 2) return 3;
  return 4;
}

/** GitHub 風の学習カレンダー（直近 weeks 週） */
export default function Heatmap({ logs, goal, weeks = 16 }: { logs: StudyLog[]; goal: number; weeks?: number }) {
  const map = minutesByDate(logs);
  const today = todayYmd();
  // 今週の日曜から遡って開始日を決める
  const end = addDays(today, 6 - parseYmd(today).getDay());
  const start = addDays(end, -(weeks * 7 - 1));
  const cols: string[][] = [];
  for (let w = 0; w < weeks; w++) {
    cols.push(Array.from({ length: 7 }, (_, i) => addDays(start, w * 7 + i)));
  }
  return (
    <div className="heatmap" role="img" aria-label="学習カレンダー">
      {cols.map((col, i) => (
        <div key={i} className="hm-col">
          {col.map((d) => {
            const m = map.get(d) ?? 0;
            return (
              <div
                key={d}
                className={`hm-cell l${d > today ? 'x' : level(m, goal)}`}
                title={`${d} ${m ? formatMinutes(m) : '記録なし'}`}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}
