import { describe, it, expect } from 'vitest';
import { normalizeLinkedInUrl } from './normalize';

const CANONICAL = 'https://linkedin.com/in/test-user';

describe('normalizeLinkedInUrl', () => {
  it('returns null for empty string', () => {
    expect(normalizeLinkedInUrl('')).toBeNull();
  });

  it('lowercases the URL', () => {
    expect(normalizeLinkedInUrl('https://LinkedIn.com/in/Test-User')).toBe(CANONICAL);
  });

  it('strips a trailing slash', () => {
    expect(normalizeLinkedInUrl('https://linkedin.com/in/test-user/')).toBe(CANONICAL);
  });

  it('removes query params and normalises the rest (full messy example)', () => {
    expect(normalizeLinkedInUrl('https://LinkedIn.com/in/Test-User/?ref=x')).toBe(CANONICAL);
  });
});
