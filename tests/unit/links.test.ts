import { describe, expect, it } from 'vitest';

import { isSafeExternalUrl } from '../../src/utils/links';

describe('external link safety', () => {
  it.each([
    'https://github.com/XMDEMAMO/PonyLab',
    'http://localhost:4321/PonyLab/',
  ])('accepts an HTTP(S) URL: %s', (url) => {
    expect(isSafeExternalUrl(url)).toBe(true);
  });

  it.each([null, '', 'javascript:alert(1)', 'data:text/html,test', 'not a url'])(
    'rejects a non-HTTP(S) external value: %s',
    (url) => {
      expect(isSafeExternalUrl(url)).toBe(false);
    },
  );
});
