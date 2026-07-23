import { readFile } from 'node:fs/promises';

import { describe, expect, it } from 'vitest';

const projectRoot = new URL('../../', import.meta.url);

async function readProjectFile(pathname: string): Promise<string> {
  return readFile(new URL(pathname, projectRoot), 'utf8');
}

describe('P5 profile motion correction', () => {
  it('uses a threshold-driven motion state instead of scrubbing the profile per scroll pixel', async () => {
    const [scrollScene, homepage] = await Promise.all([
      readProjectFile('src/components/home/HomeScrollScene.astro'),
      readProjectFile('src/pages/index.astro'),
    ]);

    expect(scrollScene).toContain('data-home-motion-state');
    expect(scrollScene).toContain('advanceHomeScrollIntent');
    expect(scrollScene).toContain('data-home-scroll-intent');
    expect(homepage).not.toContain('--home-profile-enter');
  });

  it('separates the circular avatar dock, terminal expansion, and typing sequence', async () => {
    const profileCard = await readProjectFile('src/components/home/ProfileCard.astro');

    expect(profileCard).toContain('data-profile-avatar');
    expect(profileCard).toContain('data-profile-terminal');
    expect(profileCard).toContain('data-terminal-typing');
    expect(profileCard).toContain('profile-card__terminal-bar');
  });
});
