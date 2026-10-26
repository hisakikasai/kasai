/**
 * ユーザー入力の URL を検証・正規化する。
 * javascript: などのスキームを弾くため http/https のみ許可する。
 */
export function normalizeUrl(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  const withScheme = /^[a-z][a-z0-9+.-]*:/i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const url = new URL(withScheme);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    if (!url.hostname.includes('.') && url.hostname !== 'localhost') return null;
    return url.toString();
  } catch {
    return null;
  }
}

export function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

export const LINK_PRESETS: { label: string; url: string }[] = [
  { label: 'AWS Skill Builder', url: 'https://skillbuilder.aws/' },
  { label: 'AWS Certification', url: 'https://aws.amazon.com/jp/certification/' },
  { label: 'Microsoft Learn', url: 'https://learn.microsoft.com/ja-jp/training/' },
  { label: 'Google Cloud Skills Boost', url: 'https://www.cloudskillsboost.google/' },
  { label: 'IPA', url: 'https://www.ipa.go.jp/shiken/' },
  { label: 'Udemy', url: 'https://www.udemy.com/' },
];
