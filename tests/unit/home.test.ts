import { describe, expect, it } from 'vitest';

import { homeConfig } from '../../src/config/home';
import { getHomePostStats, selectHomePosts } from '../../src/utils/home';
import { postFixtures } from '../fixtures/posts';

describe('homeConfig', () => {
  it('keeps all replaceable homepage copy and both scene definitions typed', () => {
    expect(homeConfig.title).toBe('PonyLab');
    expect(homeConfig.titleLines).toEqual(['Pony', 'Lab']);
    expect(homeConfig.subtitle.length).toBeGreaterThan(0);
    expect(homeConfig.typingLines.length).toBeGreaterThan(0);
    expect(homeConfig.latestPostCount).toBe(4);
    expect(Object.keys(homeConfig.heroScenes)).toEqual(['light', 'dark']);

    for (const scene of Object.values(homeConfig.heroScenes)) {
      expect(scene.alt.length).toBeGreaterThan(0);
      expect(scene.desktopObjectPosition).toMatch(/%/);
      expect(scene.mobileObjectPosition).toMatch(/%/);
      expect(scene.desktopCrop.top).toMatch(/%/);
      expect(scene.desktopCrop.bottom).toMatch(/%/);
      expect(scene.mobileCrop.top).toMatch(/%/);
      expect(scene.mobileCrop.bottom).toMatch(/%/);
      expect(scene.maskStrength).toBeGreaterThanOrEqual(0);
      expect(scene.maskStrength).toBeLessThanOrEqual(1);
    }

    expect(homeConfig.heroScenes.light.desktopCrop).toEqual({
      top: '0%',
      bottom: '0%',
    });
    expect(homeConfig.heroScenes.light.maskStrength).toBe(0.24);
    expect(homeConfig.heroScenes.dark.desktopCrop).toEqual({
      top: '11%',
      bottom: '10%',
    });
  });
});

describe('homepage post selection', () => {
  it('filters drafts, keeps canonical order, and limits the homepage result', () => {
    expect(selectHomePosts(postFixtures, 4).map((post) => post.id)).toEqual([
      'notes/pinned-newer',
      'notes/pinned-older',
      'astro/same-date-alpha',
      'astro/same-date-beta',
    ]);
  });

  it('counts only published posts and their unique tags', () => {
    expect(getHomePostStats(postFixtures)).toEqual({
      postCount: 5,
      tagCount: 2,
    });
  });

  it('rejects an invalid homepage limit', () => {
    expect(() => selectHomePosts(postFixtures, -1)).toThrow(/non-negative integer/i);
    expect(() => selectHomePosts(postFixtures, 1.5)).toThrow(/non-negative integer/i);
  });
});
