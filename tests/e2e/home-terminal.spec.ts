import { expect, test } from '@playwright/test';

const fixedPrompt = 'ponylab:~$';

const firstSession = {
  command: 'whoami',
  output: 'Developer · Learner · Dreamer',
};

const secondSession = {
  command: 'cat current-focus.txt',
  output: 'Astro · TypeScript · Frontend',
};

test('cycles the terminal through the exact second session', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto('./');

  const terminal = page.locator('[data-terminal-typing-root]');
  const content = terminal.locator('.terminal__content');
  const prompt = terminal.locator('[data-terminal-prompt]');
  const command = terminal.locator('[data-terminal-command]');
  const output = terminal.locator('[data-terminal-output]');
  await expect(prompt).toHaveText(fixedPrompt);
  await expect(terminal).toHaveAttribute('data-terminal-state', /typing-command|typing-output|holding/);
  await expect(terminal).toHaveAttribute('data-terminal-state', 'holding', {
    timeout: 8_000,
  });
  const firstSessionHeight = await content.evaluate((element) => element.getBoundingClientRect().height);
  await expect(terminal).toHaveAttribute('data-terminal-session-index', '1', {
    timeout: 8_000,
  });
  await expect(terminal).toHaveAttribute('data-terminal-state', 'holding', {
    timeout: 8_000,
  });
  expect(await content.evaluate((element) => element.getBoundingClientRect().height)).toBe(
    firstSessionHeight,
  );
  await expect(command).toHaveText(secondSession.command, { timeout: 8_000 });
  await expect(output).toHaveText(secondSession.output, { timeout: 8_000 });
  await expect(prompt).toHaveText(fixedPrompt);
});

test('switching theme keeps the terminal loop on its current session', async ({ page }) => {
  await page.goto('./');

  const terminal = page.locator('[data-terminal-typing-root]');
  const command = terminal.locator('[data-terminal-command]');
  await expect(terminal).toHaveAttribute('data-terminal-session-index', '1', {
    timeout: 8_000,
  });
  await expect(command).toHaveText(secondSession.command, { timeout: 8_000 });

  await page.getByRole('button', { name: /主题：/ }).click();

  await expect(terminal).toHaveAttribute('data-terminal-session-index', '1');
  await expect(command).toHaveText(secondSession.command);
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('keeps the complete first terminal session', async ({ page }) => {
    await page.goto('./');

    const terminal = page.locator('[data-terminal-typing-root]');
    const prompt = terminal.locator('[data-terminal-prompt]');
    const command = terminal.locator('[data-terminal-command]');
    const output = terminal.locator('[data-terminal-output]');
    await expect(terminal).toHaveAttribute('data-terminal-state', 'fallback');
    await expect(prompt).toHaveText(fixedPrompt);
    await expect(command).toHaveText(firstSession.command);
    await expect(output).toHaveText(firstSession.output);
  });
});

test.describe('reduced motion', () => {
  test.use({ contextOptions: { reducedMotion: 'reduce' } });

  test('keeps the complete first terminal session static', async ({ page }) => {
    await page.goto('./');

    const terminal = page.locator('[data-terminal-typing-root]');
    const prompt = terminal.locator('[data-terminal-prompt]');
    const command = terminal.locator('[data-terminal-command]');
    const output = terminal.locator('[data-terminal-output]');
    await expect(terminal).toHaveAttribute('data-terminal-state', 'static');
    await expect(prompt).toHaveText(fixedPrompt);
    await expect(command).toHaveText(firstSession.command);
    await expect(output).toHaveText(firstSession.output);
  });
});

test('has no horizontal overflow at 320px', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto('./');

  expect(await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }))).toEqual({ clientWidth: 320, scrollWidth: 320 });
});
