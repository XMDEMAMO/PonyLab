export interface ReadingTimeResult {
  cjkCharacters: number;
  latinWords: number;
  minutes: number;
  label: string;
}

export interface ReadingTimeOptions {
  cjkCharactersPerMinute?: number;
  latinWordsPerMinute?: number;
}

const CJK_CHARACTER_PATTERN =
  /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/gu;
const LATIN_WORD_PATTERN =
  /[\p{Script=Latin}\p{Number}]+(?:['’\p{Dash_Punctuation}][\p{Script=Latin}\p{Number}]+)*/gu;

function stripFencedCode(markdown: string): string {
  let activeFence: { marker: '`' | '~'; length: number } | undefined;

  return markdown
    .split(/\r?\n/u)
    .map((line) => {
      if (activeFence) {
        const closingFence = /^ {0,3}(`+|~+)\s*$/u.exec(line);

        if (
          closingFence &&
          closingFence[1]?.startsWith(activeFence.marker) &&
          closingFence[1].length >= activeFence.length
        ) {
          activeFence = undefined;
        }

        return '';
      }

      const openingFence = /^ {0,3}(`{3,}|~{3,})[^\n]*$/u.exec(line);

      if (openingFence?.[1]) {
        activeFence = {
          marker: openingFence[1][0] as '`' | '~',
          length: openingFence[1].length,
        };
        return '';
      }

      return line;
    })
    .join('\n');
}

function stripCode(markdown: string): string {
  return stripFencedCode(markdown).replace(/`+[^`\n]*`+/gu, ' ');
}

export function calculateReadingTime(
  markdown: string,
  {
    cjkCharactersPerMinute = 300,
    latinWordsPerMinute = 200,
  }: ReadingTimeOptions = {},
): ReadingTimeResult {
  if (cjkCharactersPerMinute <= 0 || latinWordsPerMinute <= 0) {
    throw new RangeError('Reading speeds must be greater than zero.');
  }

  const prose = stripCode(markdown);
  const cjkCharacters = prose.match(CJK_CHARACTER_PATTERN)?.length ?? 0;
  const latinWords = prose.match(LATIN_WORD_PATTERN)?.length ?? 0;
  const minutes = Math.max(
    1,
    Math.ceil(
      cjkCharacters / cjkCharactersPerMinute +
        latinWords / latinWordsPerMinute,
    ),
  );

  return {
    cjkCharacters,
    latinWords,
    minutes,
    label: `${minutes} 分钟阅读`,
  };
}
