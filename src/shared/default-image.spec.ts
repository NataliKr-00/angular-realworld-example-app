import { describe, expect, it } from 'vitest';
import { defaultImage } from './default-image';

describe('defaultImage', () => {
  it('falls back to the default avatar', () => {
    expect(defaultImage(null)).toBe('/assets/default-avatar.svg');
    expect(defaultImage(undefined)).toBe('/assets/default-avatar.svg');
    expect(defaultImage('')).toBe('/assets/default-avatar.svg');
  });

  it('keeps a provided image URL', () => {
    expect(defaultImage('https://example.com/me.png')).toBe('https://example.com/me.png');
  });
});
