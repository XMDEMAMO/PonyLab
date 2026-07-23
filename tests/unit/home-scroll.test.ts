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

describe('home scroll intent threshold', () => {
  it('commits a direction only after the accumulated wheel intent crosses the threshold', async () => {
    const module = await import('../../src/utils/home-scroll') as Record<string, unknown>;
    const advance = module.advanceHomeScrollIntent;

    expect(advance).toBeTypeOf('function');
    if (typeof advance !== 'function') return;

    const advanceIntent = advance as (
      state: { amount: number; direction: 'forward' | 'backward' | null },
      deltaY: number,
      threshold?: number,
    ) => {
      amount: number;
      direction: 'forward' | 'backward' | null;
      committed: 'forward' | 'backward' | null;
    };

    const first = advanceIntent({ amount: 0, direction: null }, 70, 260);
    const second = advanceIntent(first, 110, 260);
    const committed = advanceIntent(second, 90, 260);

    expect(first).toEqual({ amount: 70, direction: 'forward', committed: null });
    expect(second).toEqual({ amount: 180, direction: 'forward', committed: null });
    expect(committed).toEqual({ amount: 260, direction: 'forward', committed: 'forward' });
  });

  it('restarts intent accumulation when the wheel direction reverses', async () => {
    const module = await import('../../src/utils/home-scroll') as Record<string, unknown>;
    const advance = module.advanceHomeScrollIntent;

    expect(advance).toBeTypeOf('function');
    if (typeof advance !== 'function') return;

    const advanceIntent = advance as (
      state: { amount: number; direction: 'forward' | 'backward' | null },
      deltaY: number,
      threshold?: number,
    ) => {
      amount: number;
      direction: 'forward' | 'backward' | null;
      committed: 'forward' | 'backward' | null;
    };

    expect(
      advanceIntent({ amount: 180, direction: 'forward' }, -40, 260),
    ).toEqual({ amount: 40, direction: 'backward', committed: null });
  });
});
