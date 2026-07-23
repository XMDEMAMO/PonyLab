import { access, readFile } from 'node:fs/promises';

import { describe, expect, it } from 'vitest';

const projectRoot = new URL('../../', import.meta.url);
const read = (pathname: string) => readFile(new URL(pathname, projectRoot), 'utf8');
const exists = async (pathname: string) => {
  try {
    await access(new URL(pathname, projectRoot));
    return true;
  } catch {
    return false;
  }
};

describe('P10 ClientRouter and music contract', () => {
  it('uses Astro ClientRouter with one persistent global audio element', async () => {
    const [layout, player] = await Promise.all([
      read('src/layouts/BaseLayout.astro'),
      read('src/components/global/GlobalMusicPlayer.astro'),
    ]);

    expect(layout).toContain('ClientRouter');
    expect(layout).toContain('GlobalMusicPlayer');
    expect(player).toContain('transition:persist');
    expect(player.match(/<audio/g)).toHaveLength(1);
    expect(player).not.toContain('autoplay');
  });

  it('provides lifecycle and typed playlist boundaries', async () => {
    await expect(
      Promise.all([
        exists('src/utils/client-lifecycle.ts'),
        exists('src/data/playlist.ts'),
        exists('src/types/music.ts'),
      ]),
    ).resolves.toEqual([true, true, true]);
  });
});
