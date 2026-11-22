import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const target = path.join(root, 'astro-preview');
const originalInput = path.join(root, 'content/posts/2026-10-13-python-day1-basics-and-conditionals.md');
const editorialInput = path.join(target, 'editorial/python-day1-from-zero.md');
const secondEditorialInput = path.join(target, 'editorial/python-day2-loops-for-while.md');
const secondPublishedFilename = '2026-10-14-python-day2-loops-for-while.md';
const contentDir = path.join(target, 'src/content/blog');
const visualsDir = path.join(target, 'public/assets/visuals');

// Published editorial adaptation stays separate from the immutable original source.
// The owner-approved learning note follows the real Python 01 lecture's topic order.
function adaptFirstPostForJournal(src) {
  if (!src.includes('title: "파이썬 기초 공부: 변수와 조건문"')) throw Error('Editorial article title changed');
  if (!src.includes('Python이 무엇인지')) throw Error('First-principles introduction missing');
  const sections = [...src.matchAll(/^## (.+)$/gm)].map(match => match[1]);
  const prefixes = ['개념 ·','실습 ·','확인 ·','정리 ·'];
  if (sections.length !== 4 || prefixes.some((prefix, i) => !sections[i].startsWith(prefix))) {
    throw Error('Expected 4 beginner editorial sections in concept/practice/check/summary order');
  }
  if (/Day\s*03|Day\s*3|윤년|삼각형|시간 계산/.test(src.split('## 정리 ·')[0])) {
    throw Error('Advanced Day 03 topics leaked into body of first beginner post');
  }
  return src;
}

function transform(src) {
  // Apply only local Markdown visual block transformations; preserve frontmatter and fences.
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
const original = fs.readFileSync(originalInput, 'utf8');
if (!original.startsWith('---') || !original.includes('2026-10-13')) throw Error('Original archival article missing');
const editorial = fs.readFileSync(editorialInput, 'utf8');
fs.writeFileSync(
  path.join(contentDir, path.basename(originalInput)),
  transform(adaptFirstPostForJournal(editorial)),
  'utf8'
);
const secondEditorial = fs.readFileSync(secondEditorialInput, 'utf8');
if (!secondEditorial.includes('title: "파이썬 기초 공부: 반복문 for와 while"')) throw Error('Second title changed');
const secondSections = [...secondEditorial.matchAll(/^## (.+)$/gm)].map(m => m[1]);
if (secondSections.length !== 4 || ['개념 ·','실습 ·','확인 ·','정리 ·'].some((p,i)=>!secondSections[i].startsWith(p))) {
  throw Error('Second post must preserve 4 learning-stage sections');
}
if (!secondEditorial.includes(':::visual python-day2-loop-flow.svg')) throw Error('Second post diagram missing');
fs.writeFileSync(path.join(contentDir, secondPublishedFilename), transform(secondEditorial), 'utf8');
for (const file of ['python-day1-input-flow.svg','python-day1-time-flow.svg','python-day1-branch-flow.svg']) {
  fs.copyFileSync(path.join(root, 'assets/visuals', file), path.join(visualsDir, file));
}
console.log('Synced 2 owner-approved editorial articles and preserved diagrams; archival Markdown/drafts untouched.');
