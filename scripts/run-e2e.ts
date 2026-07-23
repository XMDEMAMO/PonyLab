import { spawn, type ChildProcess } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const projectRoot = fileURLToPath(new URL('../', import.meta.url));
const previewUrl = 'http://127.0.0.1:4321/PonyLab/';
const astroCli = fileURLToPath(
  new URL('../node_modules/astro/bin/astro.mjs', import.meta.url),
);
const playwrightCli = fileURLToPath(
  new URL('../node_modules/@playwright/test/cli.js', import.meta.url),
);
const externalPreview = process.env.PONYLAB_E2E_EXTERNAL_PREVIEW === '1';

function waitForExit(child: ChildProcess): Promise<number> {
  return new Promise((resolve, reject) => {
    child.once('error', reject);
    child.once('close', (code, signal) => {
      resolve(code ?? (signal ? 1 : 0));
    });
  });
}

async function waitForPreview(child: ChildProcess): Promise<void> {
  const timeoutAt = Date.now() + 30_000;

  while (Date.now() < timeoutAt) {
    if (child.exitCode !== null) {
      throw new Error(`Astro preview exited before becoming ready (${child.exitCode}).`);
    }

    try {
      const response = await fetch(previewUrl);
      await response.body?.cancel();
      if (response.ok) return;
    } catch {
      // The preview process is still starting.
    }

    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  throw new Error(`Astro preview did not become ready at ${previewUrl} within 30 seconds.`);
}

async function stopPreview(child: ChildProcess): Promise<void> {
  if (child.exitCode !== null || child.signalCode !== null) return;

  const closed = new Promise<boolean>((resolve) => {
    child.once('close', () => resolve(true));
  });
  child.kill();

  const closedInTime = await Promise.race([
    closed,
    new Promise<false>((resolve) => setTimeout(() => resolve(false), 5_000)),
  ]);

  if (!closedInTime && child.exitCode === null) {
    child.kill('SIGKILL');
    await closed;
  }
}

async function runPlaywright(): Promise<number> {
  const child = spawn(
    process.execPath,
    [playwrightCli, 'test', ...process.argv.slice(2)],
    {
      cwd: projectRoot,
      env: {
        ...process.env,
        PONYLAB_E2E_EXTERNAL_PREVIEW: '1',
      },
      stdio: 'inherit',
      windowsHide: true,
    },
  );

  return waitForExit(child);
}

async function main(): Promise<void> {
  if (externalPreview) {
    process.exitCode = await runPlaywright();
    return;
  }

  const preview = spawn(
    process.execPath,
    [astroCli, 'preview', '--host', '127.0.0.1', '--port', '4321'],
    {
      cwd: projectRoot,
      stdio: ['ignore', 'inherit', 'inherit'],
      windowsHide: true,
    },
  );

  try {
    await waitForPreview(preview);
    process.exitCode = await runPlaywright();
  } finally {
    await stopPreview(preview);
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
