/**
 * Port of dashboard/lib/normalize.ts with added www-stripping.
 * @param {string} url
 * @returns {string | null}
 */
function normalizeLinkedInUrl(url) {
  const trimmed = url.trim();
  if (!trimmed) return null;

  return trimmed
    .replace(/^http:\/\//i, 'https://')
    .replace(/^(https:\/\/)www\./i, '$1')
    .split('?')[0]
    .replace(/\/+$/, '')
    .toLowerCase();
}

module.exports = { normalizeLinkedInUrl };
