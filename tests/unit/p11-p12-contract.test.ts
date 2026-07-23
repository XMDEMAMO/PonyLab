import { readFile } from 'node:fs/promises';

import { describe, expect, it } from 'vitest';

const projectRoot = new URL('../../', import.meta.url);
const read = (pathname: string) => readFile(new URL(pathname, projectRoot), 'utf8');

describe('P11/P12 floating controls contract', () => {
  it('keeps the native scrollbar and exposes one right-side progress control', async () => {
    const [layout, control] = await Promise.all([
      read('src/layouts/BaseLayout.astro'),
      read('src/components/global/ScrollProgressControl.astro'),
    ]);

    expect(layout.match(/<ScrollProgressControl/g)).toHaveLength(1);
    expect(control).toContain('data-scroll-progress');
    expect(control).toContain('aria-valuenow');
    expect(control).not.toContain('overflow: hidden');
  });

  it('provides a reduced-motion-aware back-to-top button', async () => {
    const [layout, backToTop] = await Promise.all([
      read('src/layouts/BaseLayout.astro'),
      read('src/components/global/BackToTop.astro'),
    ]);

    expect(layout.match(/<BackToTop/g)).toHaveLength(1);
    expect(backToTop).toContain("prefers-reduced-motion: reduce");
    expect(backToTop).toContain("behavior: reducedMotion.matches ? 'auto' : 'smooth'");
  });
});
