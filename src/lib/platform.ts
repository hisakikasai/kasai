export function isIos(): boolean {
  const ua = navigator.userAgent;
  // iPadOS 13 以降は Mac として振る舞うのでタッチ対応で判定する
  return /iPhone|iPad|iPod/.test(ua) || (ua.includes('Macintosh') && navigator.maxTouchPoints > 1);
}

/** ホーム画面から起動されているか */
export function isStandalone(): boolean {
  return (
    matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

/** ブラウザによる自動削除の対象外にしてもらうよう要求する（対応ブラウザのみ） */
export function requestPersistentStorage() {
  navigator.storage?.persist?.().catch(() => {});
}
