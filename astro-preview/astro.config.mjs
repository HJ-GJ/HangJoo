import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';

export default defineConfig({
  site: 'https://hj-gj.github.io',
  base: '/HangJoo',
  output: 'static',
  build: { format: 'file' },
  integrations: [mdx()],
});
