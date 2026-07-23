// @ts-check
import { unified } from '@astrojs/markdown-remark';
import { defineConfig } from 'astro/config';
import rehypeKatex from 'rehype-katex';
import remarkMath from 'remark-math';

// https://astro.build/config
export default defineConfig({
  site: 'https://xmdemamo.github.io',
  base: '/PonyLab',
  trailingSlash: 'always',
  markdown: {
    processor: unified({
      remarkPlugins: [remarkMath],
      rehypePlugins: [[rehypeKatex, { output: 'htmlAndMathml' }]],
    }),
    shikiConfig: {
      themes: {
        light: 'github-light',
        dark: 'github-dark',
      },
      wrap: true,
    },
  },
});
