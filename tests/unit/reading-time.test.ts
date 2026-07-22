import { describe, expect, it } from 'vitest';

import { calculateReadingTime } from '../../src/utils/reading-time';

describe('calculateReadingTime', () => {
  it('counts CJK characters without relying on spaces', () => {
    const result = calculateReadingTime('文'.repeat(600));

    expect(result.cjkCharacters).toBe(600);
    expect(result.latinWords).toBe(0);
    expect(result.minutes).toBe(2);
  });

  it('counts English words', () => {
    const result = calculateReadingTime('word '.repeat(400));

    expect(result.cjkCharacters).toBe(0);
    expect(result.latinWords).toBe(400);
    expect(result.minutes).toBe(2);
  });

  it('combines CJK and English reading time', () => {
    const result = calculateReadingTime(`${'文'.repeat(300)} ${'word '.repeat(200)}`);

    expect(result.minutes).toBe(2);
  });

  it('ignores punctuation and fenced or inline code when estimating prose', () => {
    const markdown = `${'文，'.repeat(300)}\n\n\`inlineIdentifier\`\n\n\`\`\`ts\n${'const value = 1;\n'.repeat(500)}\`\`\``;
    const result = calculateReadingTime(markdown);

    expect(result.cjkCharacters).toBe(300);
    expect(result.latinWords).toBe(0);
    expect(result.minutes).toBe(1);
  });

  it('returns at least one minute for empty or code-only content', () => {
    expect(calculateReadingTime('').minutes).toBe(1);
    expect(calculateReadingTime('```ts\nconst value = 1;\n```').minutes).toBe(1);
  });

  it('accepts a longer matching closing fence as valid Markdown', () => {
    const markdown = `${'文'.repeat(300)}\n\n\`\`\`ts\n${'word '.repeat(400)}\n\`\`\`\``;
    const result = calculateReadingTime(markdown);

    expect(result.cjkCharacters).toBe(300);
    expect(result.latinWords).toBe(0);
    expect(result.minutes).toBe(1);
  });
});
