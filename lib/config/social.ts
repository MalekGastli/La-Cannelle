const normalizeTrailingSlash = (value?: string) => {
  const trimmed = (value || '').trim();
  if (!trimmed) return '';
  return trimmed.endsWith('/') ? trimmed : `${trimmed}/`;
};

export const INSTAGRAM_PROFILE_URL = normalizeTrailingSlash(process.env.NEXT_PUBLIC_INSTAGRAM_PROFILE_URL)
  || 'https://www.instagram.com/lacannellecatering/';

const deriveInstagramHandle = (profileUrl: string) => {
  try {
    const url = new URL(profileUrl);
    const path = url.pathname.replace(/^\/+/, '').split('/')[0] || '';
    return path.replace(/^@/, '').trim();
  } catch {
    const cleaned = String(profileUrl || '').trim();
    const match = cleaned.match(/instagram\.com\/([^/?#]+)/i);
    return (match?.[1] || '').replace(/^@/, '').trim();
  }
};

export const INSTAGRAM_HANDLE = (process.env.NEXT_PUBLIC_INSTAGRAM_HANDLE || '').trim()
  || deriveInstagramHandle(INSTAGRAM_PROFILE_URL)
  || 'lacannellecatering';

export const INSTAGRAM_HANDLE_DISPLAY = `@${INSTAGRAM_HANDLE}`;

