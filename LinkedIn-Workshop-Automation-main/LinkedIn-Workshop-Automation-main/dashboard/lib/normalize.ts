export function normalizeLinkedInUrl(url: string): string | null {
  const trimmed = url.trim();
  if (!trimmed) return null;

  return trimmed
    .replace(/^http:\/\//i, 'https://')
    .split('?')[0]
    .replace(/\/+$/, '')
    .toLowerCase();
}
