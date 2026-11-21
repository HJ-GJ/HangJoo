import fs from 'node:fs';
import path from 'node:path';

const dist = path.resolve('dist');
const post = path.join(dist, 'posts/2026-10-13-python-day1-basics-and-conditionals.html');
const index = path.join(dist, 'index.html');
const archive = path.join(dist, 'writing.html');
for (const file of [index, archive, post]) {
  if (!fs.existsSync(file)) throw Error('Expected generated HTML missing: ' + file);
}
const home = fs.readFileSync(index, 'utf8');
const listing = fs.readFileSync(archive, 'utf8');
const article = fs.readFileSync(post, 'utf8');

for (const text of ['새로 배운 것들을','차근차근 모아두는 공간','최근 글','프로젝트와 자료','notebook-interactive','notebook-inside','writing.html','파이썬 기초 공부: 변수와 조건문']) {
  if (!home.includes(text)) throw Error('Homepage missing: ' + text);
}
if (home.includes('기록의 서랍') || home.includes('최근에 남긴 기록') || home.includes('class="notebook-drawer"')) {
  throw Error('Deprecated homepage terminology or course-like drawer layout found');
}
if (!home.includes('<svg') || !home.includes('notebook-cover-symbol')) {
  throw Error('Expected vector-only notebook decoration');
}
if (home.includes('✳') || home.includes('📗') || home.includes('📓')) {
  throw Error('Emoji-style notebook ornament found');
}
if (home.includes('class="primary-link"')) {
  throw Error('Owner removed hero CTA buttons');
}

for (const text of ['All Posts','Browse Categories','CATEGORIES','EXPLORE','writing-side-link','data-side-category','writing-entry','writing.html','파이썬 기초 공부: 변수와 조건문']) {
  if (!listing.includes(text)) throw Error('Archive missing: '+text);
}
if (!listing.includes('href="/HangJoo/posts/2026-10-13-python-day1-basics-and-conditionals.html"')) {
  throw Error('Original article permalink missing on archive page');
}
if (!listing.includes('writing-result-count')) throw Error('Expected visible result count');

for (const text of ['header-search','header-search-panel','name="q"','aria-label="검색 열기"']) {
  if (!home.includes(text) || !listing.includes(text) || !article.includes(text)) {
    throw Error('Top-search control missing on one page: '+text);
  }
}

for (const text of ['파이썬 기초 공부: 변수와 조건문','개념 ·','실습 ·','확인 ·','정리 ·',
                    'python-day1-input-flow.svg','python-day1-time-flow.svg','python-day1-branch-flow.svg']) {
  if (!article.includes(text)) throw Error('Article item missing: '+text);
}
if (!article.includes('href="/HangJoo/writing.html"')) throw Error('Article back navigation is not archive');
const nav = article.match(/<aside class="toc"[\s\S]*?<\/aside>/)?.[0] ?? '';
if (!nav.includes('<summary>목차</summary>')) throw Error('Expected simple TOC title');
if ((nav.match(/class="toc-entry"/g) || []).length !== 4) throw Error('Expected four TOC links');
if (nav.includes('개 절')) throw Error('Section count leaked into article TOC');
if ((article.match(/class="study-visual"/g) || []).length !== 3) throw Error('Expected 3 study diagrams');

for (const img of ['python-day1-input-flow.svg','python-day1-time-flow.svg','python-day1-branch-flow.svg']) {
  if (!fs.existsSync(path.join(dist, 'assets/visuals', img))) throw Error('Missing SVG diagram: '+img);
}
if (fs.readdirSync(path.join(dist, 'posts')).filter(file => file.endsWith('.html')).length !== 1) {
  throw Error('Unapproved drafts were published');
}
console.log('PASS: homepage, All Posts+sidebar, top search, SVG notebook, canonical URL and 4-part TOC.');
