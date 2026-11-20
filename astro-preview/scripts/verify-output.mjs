import fs from 'node:fs';
import path from 'node:path';
const dist = path.resolve('dist');
const post = path.join(dist, 'posts/2026-10-13-python-day1-basics-and-conditionals.html');
const index = path.join(dist, 'index.html');
if (!fs.existsSync(post) || !fs.existsSync(index)) throw Error('Expected original index and article URL');
const home = fs.readFileSync(index, 'utf8');
for (const item of [
  '새로 배운 것들을', '차근차근 모아두는 공간', 'notebook-hero',
  'notebook-cover', '기록의 서랍', 'notebook-drawer',
  '최근에 남긴 기록', 'notebook-entry', '써보고 발견한 것들'
]) {
  if (!home.includes(item)) throw Error('Missing unique notebook homepage element: ' + item);
}
if (home.includes('learning-panel')) throw Error('Old study-progress panel remains in notebook home');
if (home.includes('class="post-card"')) throw Error('Old thumbnail card-grid remains');
if (!home.includes('파이썬 기초 공부: 변수와 조건문')) throw Error('Latest approved article title missing on homepage');
if (!home.includes('posts/2026-10-13-python-day1-basics-and-conditionals.html')) throw Error('Old public permalink lost');
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
console.log('PASS: unique notebook homepage, journal title, four-part TOC, preserved URL and 3 SVG visuals, 1 published post.');
