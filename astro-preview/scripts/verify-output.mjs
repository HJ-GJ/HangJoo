import fs from 'node:fs';
import path from 'node:path';

const dist = path.resolve('dist');
const post = path.join(dist, 'posts/2026-10-13-python-day1-basics-and-conditionals.html');
const secondPost = path.join(dist, 'posts/2026-10-14-python-day2-loops-for-while.html');
const index = path.join(dist, 'index.html');
const archive = path.join(dist, 'writing.html');
for (const file of [index, archive, post, secondPost]) {
  if (!fs.existsSync(file)) throw Error('Expected generated HTML missing: ' + file);
}
const home = fs.readFileSync(index, 'utf8');
const listing = fs.readFileSync(archive, 'utf8');
const article = fs.readFileSync(post, 'utf8');
const secondArticle = fs.readFileSync(secondPost, 'utf8');

for (const text of ['새로 배운 것들을','차근차근 모아두는 공간','공부 기록','프로젝트와 자료','notebook-interactive','notebook-inside','writing.html','파이썬 기초 공부: 변수와 조건문']) {
  if (!home.includes(text)) throw Error('Homepage missing: ' + text);
}
for (const text of [
  '배운 것을 다시 찾아보고, 질문하며, 조금씩 내 것으로 만들어 가는 기록입니다.',
  'Cho Hyeong Joo',
  '배우고, 다시 공부하며, 내 것으로 만드는 기록.',
  'notebook-inside-name',
  '직접 만든 것과 개발 기록',
  '게임과 도구 사용 기록',
  '참고 자료와 링크 모음'
]) {
  if (!home.includes(text)) throw Error('Missing approved v3.3 homepage content: ' + text);
}
const closedCover = home.split('<summary aria-label="HJ 노트를 펼쳐 소개 보기">')[1]?.split('</summary>')[0] ?? '';
if (!closedCover.includes('notebook-monogram')) throw Error('Closed notebook missing HJ mark');
for (const hiddenUntilOpen of ['Cho Hyeong Joo', 'AI와 함께 배우고', 'notebook-identity-name', 'PERSONAL ARCHIVE', 'The Notebook']) {
  if (closedCover.includes(hiddenUntilOpen)) throw Error('Closed notebook should show only HJ, not: ' + hiddenUntilOpen);
}
const openedNotebook = home.split('<div class="notebook-inside">')[1]?.split('<span class="notebook-inside-title">')[0] ?? '';
for (const required of ['Cho Hyeong Joo','배우고, 다시 공부하며, 내 것으로 만드는 기록.','notebook-inside-profile']) {
  if (!openedNotebook.includes(required)) throw Error('Opened notebook profile missing: ' + required);
}
for (const outdated of ['모을 예정입니다.', '기록할 예정입니다.', '모을 예정']) {
  if (home.includes(outdated)) throw Error('Planned-content copy remains on home: ' + outdated);
}
if (home.includes('기록의 서랍') || home.includes('최근에 남긴 기록') || home.includes('class="notebook-drawer"')) {
  throw Error('Deprecated homepage terminology or course-like drawer layout found');
}
if (!home.includes('notebook-inside-close') || !home.includes('aria-label="노트 닫기"')) throw Error('Mobile notebook lacks accessible close button');
if (!home.includes('<svg') || !home.includes('notebook-cover-symbol')) {
  throw Error('Expected vector-only notebook decoration');
}
if (home.includes('✳') || home.includes('📗') || home.includes('📓')) {
  throw Error('Emoji-style notebook ornament found');
}
if (home.includes('class="primary-link"')) {
  throw Error('Owner removed hero CTA buttons');
}

for (const text of ['All Posts','공개된 글 주제별 보기','EXPLORE','studio-menu-links','data-side-category','writing-quick-categories','writing-entry','writing.html','파이썬 기초 공부: 변수와 조건문']) {
  if (!listing.includes(text)) throw Error('Archive missing: '+text);
}
if (!listing.includes('href="/HangJoo/posts/2026-10-13-python-day1-basics-and-conditionals.html"')) {
  throw Error('Original article permalink missing on archive page');
}
if (!listing.includes('writing-result-count')) throw Error('Expected visible result count');
// v3.8 global workspace remains shared between Home, All Posts and both articles.
for(const [page,name] of [[home,'Home'],[listing,'Archive'],[article,'NO.01'],[secondArticle,'NO.02']]){
  for(const marker of ['class="studio-app"','class="studio-sidebar"','class="studio-menu"','class="studio-profile"','class="studio-avatar"','aria-label="블로그 전체 메뉴"']){
    if(!page.includes(marker))throw Error(name+' missing global navigation: '+marker);
  }
}
if(home.includes('>최근 글</h2>')||home.includes('RECENT POSTS'))throw Error('Outdated home heading');
for(const phrase of ['혼자 다시 공부하고 자료를 찾아보며','AI에게 다시 질문하면서','그렇게 배우고 확인한 과정']){
  if(!home.includes(phrase))throw Error('Owner learning philosophy missing from About: '+phrase);
}
if(listing.includes('class="writing-sidebar"'))throw Error('Duplicate archive navigation was reintroduced');
const layoutCSS=fs.readFileSync(path.resolve('src/styles/studio-v3-8.css'),'utf8');
for(const marker of ['.studio-app','.notebook-cover.notebook-interactive[open]','@keyframes hj-page-flip','prefers-reduced-motion','.article-grid','.writing-quick-categories']){
  if(!layoutCSS.includes(marker))throw Error('Studio CSS missing: '+marker);
}

for (const [page, phrase] of [[home,'파이썬 기초 공부: 반복문 for와 while'],[listing,'파이썬 기초 공부: 반복문 for와 while']]) {
  if (!page.includes(phrase)) throw Error('New post missing from homepage/archive');
}
if (!listing.includes('href="/HangJoo/posts/2026-10-14-python-day2-loops-for-while.html"')) {
  throw Error('New article archive permalink missing');
}

for (const text of ['header-search','header-search-panel','name="q"','aria-label="검색 열기"']) {
  if (!home.includes(text) || !listing.includes(text) || !article.includes(text)) {
    throw Error('Top-search control missing on one page: '+text);
  }
}

for (const text of ['파이썬 기초 공부: 변수와 조건문','개념 ·','실습 ·','확인 ·','정리 ·',
                    'Python은 어떤 언어일까?', '프로그래밍 언어란 무엇일까?',
                    'Hello World!', 'Python과 VS Code',
                    'python-day1-input-flow.svg','python-day1-branch-flow.svg']) {
  if (!article.includes(text)) throw Error('Article item missing: '+text);
}
for (const phrase of [
  '컴퓨터에게',
  '사람의 말을 그대로 명령으로 받아 실행하지는 못합니다.',
  '프로그래밍 언어로 작업 순서를 코드에 적고',
  '이 코드 한 줄을 작게 나눠 볼까요?'
]) {
  if (!article.includes(phrase)) throw Error('Beginner-first programming explanation is missing: ' + phrase);
}
for (const phrase of [
  '참고 자료와 설명 범위',
  '이 글은 수업 자료',
  '저도 처음부터 배우는 입장이었기에'
]) {
  if (article.includes(phrase)) throw Error('Editorial/process disclaimer leaked into reader article: ' + phrase);
}
if (article.includes('15분') || listing.includes('15분')) {
  throw Error('Unwanted reading-time estimate is still displayed');
}
if (!article.includes('class="article-labels"') || !article.includes('class="article-tools"')) {
  throw Error('Unified article topic/badge layout missing');
}
if (article.includes('Day 03') || article.includes('Day03')) throw Error('Advanced-day label leaked into entry article');
if (home.includes('Click to open / 펼쳐보기') || home.includes('class="notebook-open-hint"')) {
  throw Error('Owner requested a visual cue instead of written open instruction');
}
if (!home.includes('class="notebook-about-link"') || !home.includes('소개글 보기')) {
  throw Error('Opened notebook should link to About introduction');
}
if (!article.includes('href="/HangJoo/writing.html"')) throw Error('Article back navigation is not archive');
const nav = article.match(/<aside class="toc"[\s\S]*?<\/aside>/)?.[0] ?? '';
if (!nav.includes('<summary>목차</summary>')) throw Error('Expected simple TOC title');
if ((nav.match(/class="toc-entry"/g) || []).length !== 4) throw Error('Expected four TOC links');
if (nav.includes('개 절')) throw Error('Section count leaked into article TOC');
if ((article.match(/class="study-visual"/g) || []).length !== 2) throw Error('Expected 2 beginner-relevant study diagrams');

for (const img of ['python-day1-input-flow.svg','python-day1-time-flow.svg','python-day1-branch-flow.svg']) {
  if (!fs.existsSync(path.join(dist, 'assets/visuals', img))) throw Error('Missing SVG diagram: '+img);
}
for (const phrase of ['파이썬 기초 공부: 반복문 for와 while','반복문은 왜 필요할까?', 'range(3)', 'for', 'while', 'break', 'continue', 'python-day2-loop-flow.svg']) {
  if (!secondArticle.includes(phrase)) throw Error('Second post missing: '+phrase);
}
if (secondArticle.includes('읽는 시간') || secondArticle.includes('12분')) throw Error('Unwanted read time in second article');
const secondNav = secondArticle.match(/<aside class="toc"[\s\S]*?<\/aside>/)?.[0] ?? '';
if ((secondNav.match(/class="toc-entry"/g) || []).length !== 4) throw Error('Second post requires four TOC entries');
if ((secondArticle.match(/class="study-visual"/g) || []).length !== 1) throw Error('Second post should include one original SVG flow diagram');
if (!fs.existsSync(path.join(dist, 'assets/visuals/python-day2-loop-flow.svg'))) throw Error('Second post flow image missing');
const actualPosts=fs.readdirSync(path.join(dist,'posts')).filter(file=>file.endsWith('.html')).sort();
const expectedPosts=['2026-10-13-python-day1-basics-and-conditionals.html','2026-10-14-python-day2-loops-for-while.html'];
if (JSON.stringify(actualPosts)!==JSON.stringify(expectedPosts)) throw Error('Unapproved drafts published or permalink changed: '+actualPosts.join(','));
console.log('PASS: v3.8 global wide layout, reflective About, approved NO.01/02, original permalinks, diagrams and no extra drafts.');
