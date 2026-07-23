export type ClientCleanup = () => void;
export type ClientInitializer = () => ClientCleanup | void;

interface LifecycleRecord {
  initialize: ClientInitializer;
  cleanup?: ClientCleanup;
}

interface PonyLabWindow extends Window {
  __ponylabLifecycleRegistry?: Map<string, LifecycleRecord>;
  __ponylabLifecycleBound?: boolean;
}

const browserWindow = window as PonyLabWindow;
const registry =
  browserWindow.__ponylabLifecycleRegistry ?? new Map<string, LifecycleRecord>();
browserWindow.__ponylabLifecycleRegistry = registry;

function cleanupRecord(record: LifecycleRecord): void {
  try {
    record.cleanup?.();
  } finally {
    record.cleanup = undefined;
  }
}

function runRecord(record: LifecycleRecord): void {
  cleanupRecord(record);
  const cleanup = record.initialize();
  record.cleanup = typeof cleanup === 'function' ? cleanup : undefined;
}

function runAll(): void {
  registry.forEach(runRecord);
}

function cleanupAll(): void {
  registry.forEach(cleanupRecord);
}

if (!browserWindow.__ponylabLifecycleBound) {
  browserWindow.__ponylabLifecycleBound = true;
  document.addEventListener('astro:before-swap', cleanupAll);
  document.addEventListener('astro:page-load', runAll);
}

export function registerClientLifecycle(
  key: string,
  initialize: ClientInitializer,
): void {
  const existing = registry.get(key);

  if (existing) {
    existing.initialize = initialize;
    return;
  }

  const record: LifecycleRecord = { initialize };
  registry.set(key, record);
}
