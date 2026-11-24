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
    takeaway: z.string().optional(),
    archiveOnly: z.boolean().default(false),
    seriesKey: z.string().optional(),
    seriesTitle: z.string().optional(),
    seriesPart: z.number().int().min(0).optional(),
    seriesTotal: z.number().int().min(1).optional(),
    seriesRoot: z.string().optional()
  })
});

export const collections = { blog };
