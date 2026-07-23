import type { Page } from '@playwright/test';

export async function installClipboardMock(page: Page): Promise<void> {
  await page.addInitScript(() => {
    let clipboardText = '';

    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        readText: async () => clipboardText,
        writeText: async (text: string) => {
          clipboardText = text;
        },
      },
    });
  });
}
