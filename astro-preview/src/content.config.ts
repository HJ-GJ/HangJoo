import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ base: './src/content/blog', pattern: '**/*.{md,mdx}' }),
  schema: z.object({
    issue: z.string(),
    title: z.string(),
    date: z.coerce.date(),
    category: z.string(),
    section: z.enum(['study','projects','info','reviews']).default('study'),
    readTime: z.string(),
    tags: z.array(z.string()).default([]),
    summary: z.string(),
    coverType: z.string().optional(),
    takeaway: z.string().optional()
  })
});

export const collections = { blog };
