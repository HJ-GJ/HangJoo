import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const target = path.join(root, 'astro-preview');
const input = path.join(root, 'content/posts/2026-10-13-python-day1-basics-and-conditionals.md');
const contentDir = path.join(target, 'src/content/blog');
const visualsDir = path.join(target, 'public/assets/visuals');

function transform(src) {
  // Only the approved article is migrated in this POC. Keep frontmatter and code fences.
  return src
    .replace(/^:::visual\s+([a-z0-9-]+\.svg)\s*\|\s*(.+)$/gm, (_m, file, caption) =>
      '<figure class="study-visual"><img src="/HangJoo/assets/visuals/' + file +
      '" alt="' + caption.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;') +
      '" loading="lazy" /><figcaption>' + caption.replace(/</g, '&lt;') + '</figcaption></figure>'
    )
    .replace(/^:::formula\n([\s\S]*?)^:::$/gm, (_m, rows) =>
      '\n' + rows.trim().split('\n').map(row => {
        const parts = row.split(' | ').map(p => p.trim());
        return '- **' + (parts[0] || '') + '** — ' + (parts[1] || '') + (parts[2] ? ' · ' + parts[2] : '');
      }).join('\n') + '\n'
    )
    .replace(/^:::compare\n([\s\S]*?)^:::$/gm, (_m, block) =>
      '\n' + block.replace(/^---$/gm, '\n**반대로**\n') + '\n'
    )
    .replace(/^:::finding\n([\s\S]*?)^:::$/gm, (_m, block) =>
      '\n> **이번 글의 핵심 정리**\n\n' + block.replace(/^### .*$/gm, '').trim() + '\n'
    );
}

fs.mkdirSync(contentDir, { recursive: true });
fs.mkdirSync(visualsDir, { recursive: true });
const source = fs.readFileSync(input, 'utf8');
fs.writeFileSync(path.join(contentDir, path.basename(input)), transform(source), 'utf8');
for (const file of ['python-day1-input-flow.svg','python-day1-time-flow.svg','python-day1-branch-flow.svg']) {
  fs.copyFileSync(path.join(root, 'assets/visuals', file), path.join(visualsDir, file));
}
console.log('Synced one approved post and three original SVG diagrams; draft content untouched.');
