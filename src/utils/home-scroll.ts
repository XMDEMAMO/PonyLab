export type HomeScrollStage = 1 | 2 | 3;

export interface HomeScrollGeometry {
  rootTop: number;
  rootHeight: number;
  stickyTop: number;
  stickyHeight: number;
}

export interface HomeScrollState {
  progress: number;
  stage: HomeScrollStage;
  titleExit: number;
  profileEnter: number;
  heroExit: number;
}

export interface HomeScrollCapabilities {
  reducedMotion?: boolean;
  shortViewport?: boolean;
  hardwareConcurrency?: number;
  deviceMemory?: number;
}

export type HomeScrollIntentDirection = 'forward' | 'backward';

export interface HomeScrollIntentState {
  amount: number;
  direction: HomeScrollIntentDirection | null;
}

export interface HomeScrollIntentResult extends HomeScrollIntentState {
  committed: HomeScrollIntentDirection | null;
}

export function advanceHomeScrollIntent(
  state: HomeScrollIntentState,
  deltaY: number,
  threshold = 260,
): HomeScrollIntentResult {
  const normalizedThreshold = Math.max(1, Math.abs(threshold));

  if (!Number.isFinite(deltaY) || deltaY === 0) {
    return { ...state, committed: null };
  }

  const direction: HomeScrollIntentDirection = deltaY > 0 ? 'forward' : 'backward';
  const previousAmount = state.direction === direction ? state.amount : 0;
  const amount = Math.min(
    normalizedThreshold,
    Math.max(0, previousAmount) + Math.abs(deltaY),
  );

  return {
    amount,
    direction,
    committed: amount >= normalizedThreshold ? direction : null,
  };
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, Number.isFinite(value) ? value : 0));
}

function smoothRange(progress: number, start: number, end: number): number {
  const range = end - start;
  const normalized = range > 0 ? clamp01((progress - start) / range) : 0;

  return normalized * normalized * (3 - (2 * normalized));
}

export function deriveHomeScrollProgress({
  rootTop,
  rootHeight,
  stickyTop,
  stickyHeight,
}: HomeScrollGeometry): number {
  const travel = rootHeight - stickyHeight;

  if (travel <= 0) {
    return 0;
  }

  return clamp01((stickyTop - rootTop) / travel);
}

export function getHomeScrollState(progress: number): HomeScrollState {
  const normalizedProgress = clamp01(progress);

  return {
    progress: normalizedProgress,
    stage: normalizedProgress < 0.3 ? 1 : normalizedProgress < 0.72 ? 2 : 3,
    titleExit: smoothRange(normalizedProgress, 0.18, 0.45),
    profileEnter: smoothRange(normalizedProgress, 0.28, 0.5),
    heroExit: smoothRange(normalizedProgress, 0.72, 0.96),
  };
}

export function shouldUseNaturalHomeScroll({
  reducedMotion = false,
  shortViewport = false,
  hardwareConcurrency,
  deviceMemory,
}: HomeScrollCapabilities): boolean {
  return Boolean(
    reducedMotion ||
    shortViewport ||
    (hardwareConcurrency !== undefined && hardwareConcurrency <= 2) ||
    (deviceMemory !== undefined && deviceMemory <= 2)
  );
}
