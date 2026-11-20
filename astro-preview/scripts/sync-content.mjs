import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const target = path.join(root, 'astro-preview');
const input = path.join(root, 'content/posts/2026-10-13-python-day1-basics-and-conditionals.md');
const contentDir = path.join(target, 'src/content/blog');
const visualsDir = path.join(target, 'public/assets/visuals');

// Editorial presentation mapping for the single approved Python post.
// Keep the published source Markdown unchanged until the Astro release is reviewed.
function adaptFirstPostForJournal(src) {
  const replacements = [
    ['title: "[Python] - 파이썬 첫걸음, 변수와 조건문 이해하기"', 'title: "파이썬 공부 첫날: 변수와 조건문"'],
    ['## 1. 이론 — 파이썬 실행 과정과 변수·자료형', '## 개념 · 파이썬 실행 과정과 자료형'],
    ['## 2. 기초 실습 — 시간 계산과 숫자 뒤집기', '## 실습 · 코드로 직접 확인한 것들'],
    ['## 3. 응용 실습 — 조건문으로 문제 해결하기', '**조건문 실습:** 조건에 따라 결과가 달라지는 문제도 확인해 봅니다.'],
    ['## 4. 자주 하는 실수와 디버깅', '## 확인 · 실수하기 쉬운 부분'],
    ['## 5. 실제 활용 — 기초 문법이 개발로 연결되는 순간', '## 정리 · 실제 어디에 활용할까?'],
    ['## 6. 핵심 정리와 복습', '### 이번에 배운 내용과 복습'],
  ];
  for (const [oldText, newText] of replacements) {
    if (!src.includes(oldText)) throw new Error('First post changed; review editorial heading mapping before building: ' + oldText);
    src = src.replace(oldText, newText);
  }
  const sections = [...src.matchAll(/^## (.+)$/gm)].map(match => match[1]);
  if (sections.length !== 4) throw new Error('Expected 4 editorial sections, found ' + sections.length);
  return src;
}

function transform(src) {
  // Only the approved article is migrated in this POC. Keep frontmatter and code fences.
  return adaptFirstPostForJournal(src)
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
