import { isIos } from '../lib/platform';

export default function InstallGuide() {
  if (!isIos()) {
    return <p className="small">ブラウザのメニューから「ホーム画面に追加」（または「アプリをインストール」）すると、アプリのように起動でき、オフラインでも記録できます。</p>;
  }
  return (
    <div className="small">
      <ol className="ios-steps">
        <li>Safari の下部（または上部）にある共有ボタン（□↑）をタップ</li>
        <li>「ホーム画面に追加」をタップ（見つからなければ一覧を下にスクロール）</li>
        <li>「Webアプリとして開く」が表示されたらオンにして「追加」</li>
      </ol>
      <p className="muted">
        ※ Safari で入力したデータとホーム画面アプリのデータは別々に保存されます。先にホーム画面に追加してから使い始めてください。
        Safari 側にデータがある場合は、バックアップ → ホーム画面アプリで復元すると移せます。
      </p>
    </div>
  );
}
