import { z } from 'astro/zod';

import {
  categories,
  getTaxonomyByName,
  tags,
} from '../config/taxonomy';
import {
  isContentDateString,
  parseContentDate,
} from '../utils/content-date';

type ImageSchemaFactory = () => z.ZodType<ImageMetadata>;

const contentDateSchema = z
  .string()
  .refine(isContentDateString, {
    message:
      'Use YYYY-MM-DD or a complete ISO timestamp with an explicit Z/UTC offset.',
  })
  .transform(parseContentDate);

export function createBlogSchema(image: ImageSchemaFactory) {
  return z
    .strictObject({
      title: z.string().trim().min(1),
      description: z.string().trim().min(1),
      pubDate: contentDateSchema,
      updatedDate: contentDateSchema.optional(),
      category: z
        .string()
        .refine((value) => getTaxonomyByName(categories, value) !== undefined, {
          message: 'Category must be declared in src/config/taxonomy.ts.',
        }),
      tags: z
        .array(
          z
            .string()
            .refine((value) => getTaxonomyByName(tags, value) !== undefined, {
              message: 'Every tag must be declared in src/config/taxonomy.ts.',
            }),
        )
        .default([]),
      cover: image().optional(),
      coverAlt: z.string().trim().min(1).optional(),
      draft: z.boolean().default(false),
      pinned: z.boolean().default(false),
    })
    .superRefine((data, context) => {
      if (data.cover && !data.coverAlt) {
        context.addIssue({
          code: 'custom',
          path: ['coverAlt'],
          message: 'coverAlt is required whenever cover is present.',
        });
      }
    });
}
