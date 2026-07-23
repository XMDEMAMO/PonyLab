import { describe, expect, it } from 'vitest';

import {
  deriveHomeScrollProgress,
  getHomeScrollState,
  shouldUseNaturalHomeScroll,
} from '../../src/utils/home-scroll';

describe('home scroll progress', () => {
  it('maps geometry to a clamped, viewport-independent progress value', () => {
    const geometry = {
      rootHeight: 2700,
      stickyHeight: 828,
      stickyTop: 72,
    };

    expect(deriveHomeScrollProgress({ ...geometry, rootTop: 72 })).toBe(0);
    expect(deriveHomeScrollProgress({ ...geometry, rootTop: -864 })).toBe(0.5);
    expect(deriveHomeScrollProgress({ ...geometry, rootTop: -1800 })).toBe(1);
    expect(deriveHomeScrollProgress({ ...geometry, rootTop: 400 })).toBe(0);
    expect(deriveHomeScrollProgress({ ...geometry, rootTop: -2400 })).toBe(1);
  });

  it('keeps the three narrative stages ordered and only exits the hero in stage three', () => {
    const stageOne = getHomeScrollState(0.1);
    const stageTwo = getHomeScrollState(0.5);
    const stageThree = getHomeScrollState(0.86);

    expect(stageOne).toMatchObject({
      stage: 1,
      heroExit: 0,
      profileEnter: 0,
    });
    expect(stageOne.titleExit).toBe(0);

    expect(stageTwo.stage).toBe(2);
    expect(stageTwo.titleExit).toBe(1);
    expect(stageTwo.profileEnter).toBe(1);
    expect(stageTwo.heroExit).toBe(0);

    expect(stageThree.stage).toBe(3);
    expect(stageThree.titleExit).toBe(1);
    expect(stageThree.profileEnter).toBe(1);
    expect(stageThree.heroExit).toBeGreaterThan(0);
    expect(stageThree.heroExit).toBeLessThan(1);

    expect(getHomeScrollState(-1).progress).toBe(0);
    expect(getHomeScrollState(2)).toMatchObject({ progress: 1, heroExit: 1 });
  });

  it('derives identical states from progress regardless of sampling frequency', () => {
    const sixtyHertzSamples = [0, 0.25, 0.5, 0.75, 1];
    const oneTwentyHertzSamples = [0, 0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875, 1];

    expect(sixtyHertzSamples.map(getHomeScrollState)).toEqual(
      oneTwentyHertzSamples.filter((_, index) => index % 2 === 0).map(getHomeScrollState),
    );
  });
});

describe('home scroll device fallback', () => {
  it('uses natural flow for reduced motion, short viewports, and constrained devices', () => {
    expect(shouldUseNaturalHomeScroll({ reducedMotion: true })).toBe(true);
    expect(shouldUseNaturalHomeScroll({ shortViewport: true })).toBe(true);
    expect(shouldUseNaturalHomeScroll({ hardwareConcurrency: 2 })).toBe(true);
    expect(shouldUseNaturalHomeScroll({ deviceMemory: 2 })).toBe(true);
    expect(
      shouldUseNaturalHomeScroll({
        reducedMotion: false,
        shortViewport: false,
        hardwareConcurrency: 8,
        deviceMemory: 8,
      }),
    ).toBe(false);
  });
});
