import fs from 'node:fs';
import path from 'node:path';
const dist = path.resolve('dist');
const post = path.join(dist, 'posts/2026-10-13-python-day1-basics-and-conditionals.html');
const index = path.join(dist, 'index.html');
if (!fs.existsSync(post) || !fs.existsSync(index)) throw Error('Expected original index and article URL');
const html = fs.readFileSync(post, 'utf8');
for (const item of ['파이썬 기초 공부: 변수와 조건문','개념 ·','실습 ·','확인 ·','정리 ·','python-day1-input-flow.svg','python-day1-time-flow.svg','python-day1-branch-flow.svg']) {
  if (!html.includes(item)) throw Error('Missing article item: ' + item);
}
if ((html.match(/class="study-visual"/g) || []).length !== 3) throw Error('Expected 3 visuals');
const nav = html.match(/<aside class="toc"[\s\S]*?<\/aside>/)?.[0] ?? '';
if (!nav.includes('<summary>목차</summary>')) throw Error('Expected simplified TOC title');
if ((nav.match(/class="toc-entry"/g) || []).length !== 4) throw Error('Expected four conceptual TOC links');
if (nav.includes('개 절')) throw Error('Removed count leaked into article TOC');
for (const f of ['python-day1-input-flow.svg','python-day1-time-flow.svg','python-day1-branch-flow.svg']) {
  if (!fs.existsSync(path.join(dist, 'assets/visuals', f))) throw Error('Missing diagram: ' + f);
}
if (fs.readdirSync(path.join(dist, 'posts')).filter(x => x.endsWith('.html')).length !== 1)
  throw Error('Unexpected draft publication');
console.log('PASS: journal title, four-part TOC, preserved URL and three SVG visuals, one published post.');
