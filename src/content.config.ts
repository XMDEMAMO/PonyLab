import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';

import { createBlogSchema } from './content/schema';

const blog = defineCollection({
  loader: glob({
    base: './src/content/blog',
    pattern: '**/*.md',
  }),
  schema: ({ image }) => createBlogSchema(image),
});

export const collections = { blog };
