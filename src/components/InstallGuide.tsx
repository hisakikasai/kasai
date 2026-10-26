import { isIos } from '../lib/platform';
import { Share, SquarePlus } from './icons';

/** ホーム画面への追加手順をアイコンで示す */
export default function InstallGuide() {
  return (
    <div className="row install" title="ホーム画面に追加">
      {isIos() ? (
        <>
          <Share size={22} />
          <span className="muted">→</span>
          <SquarePlus size={22} />
          <span className="small">ホーム画面に追加</span>
        </>
      ) : (
        <>
          <SquarePlus size={22} />
          <span className="small">ホーム画面に追加</span>
        </>
      )}
    </div>
  );
}
