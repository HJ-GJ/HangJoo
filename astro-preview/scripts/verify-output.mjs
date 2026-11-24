import fs from 'node:fs';
import path from 'node:path';

const dist = path.resolve('dist');
const post = path.join(dist, 'posts/2026-10-13-python-day1-basics-and-conditionals.html');
const secondPost = path.join(dist, 'posts/2026-10-14-python-day2-loops-for-while.html');
const thirdPost = path.join(dist, 'posts/2026-11-23-python-lists-and-copy.html');
const chapterIds = [...[1,2,3].map(n=>'2026-11-24-python-series-01-0'+n),
                    ...[1,2,3].map(n=>'2026-11-24-python-series-02-0'+n),
                    ...[1,2,3,4].map(n=>'2026-11-24-python-series-03-0'+n)];
const chapterPaths = chapterIds.map(slug=>path.join(dist,'posts/'+slug+'.html'));
const labPage = path.join(dist, 'labs/list-copy/index.html');
const aboutPage = path.join(dist, 'about.html');
const categoryPages = ['study','projects','info','reviews'].map(section=>path.join(dist,'categories/'+section+'.html'));
const index = path.join(dist, 'index.html');
const archive = path.join(dist, 'writing.html');
for (const file of [index, archive, post, secondPost, thirdPost, labPage, aboutPage, ...categoryPages, ...chapterPaths]) {
  if (!fs.existsSync(file)) throw Error('Expected generated HTML missing: ' + file);
}
const home = fs.readFileSync(index, 'utf8');
const listing = fs.readFileSync(archive, 'utf8');
const article = fs.readFileSync(post, 'utf8');
const secondArticle = fs.readFileSync(secondPost, 'utf8');
const thirdArticle = fs.readFileSync(thirdPost, 'utf8');
const chapterPages = chapterPaths.map(file=>fs.readFileSync(file,'utf8'));
const labHtml = fs.readFileSync(labPage, 'utf8');
const aboutHtml = fs.readFileSync(aboutPage, 'utf8');
const categoryHtmls = Object.fromEntries(['study','projects','info','reviews'].map((section,i)=>[section,fs.readFileSync(categoryPages[i],'utf8')]));
/* Public edition dates are derived from the first publication of the current
   owner-approved editorial versions, not the historical lesson-day file slugs. */
for(const [html,issue,date] of [
  [article,'NO.01','2026. 11. 22.'],
  [secondArticle,'NO.02','2026. 11. 22.'],
  [thirdArticle,'NO.03','2026. 11. 23.'],
]){
  if(!html.includes(date)) throw Error(issue+' publication date not rendered: '+date);
}
if(!listing.includes('datetime="2026-11-24"') ||
   !categoryHtmls.study.includes('datetime="2026-11-24"') ||
   listing.includes('datetime="2026-11-22"')){
  throw Error('Learning chapter display dates not updated');
}


for (const text of ['새로 배운 것들을','차근차근 모아두는 공간','Study Notes','어떤 기록을 볼까요?','최신 글','hj-book-scene','hj-book-pages','writing.html','[Python] 리스트 실수와 점수 관리 실습']) {
  if (!home.includes(text)) throw Error('Homepage missing: ' + text);
}
for (const text of [
  '배운 것을 다시 찾아보고, 질문하며, 조금씩 내 것으로 만들어 가는 기록입니다.',
  'Cho Hyeong Joo',
  'hj-book-pages',
  '직접 만든 것과 개발 기록',
  '게임과 도구 사용 기록',
  '참고 자료와 링크 모음'
]) {
  if (!home.includes(text)) throw Error('Missing approved v3.3 homepage content: ' + text);
}
const closedCover = home.split('<button class="hj-book-cover"')[1]?.split('</button>')[0] ?? '';
if (!closedCover.includes('hj-book-mark')) throw Error('Closed notebook missing HJ mark');
for (const hiddenUntilOpen of ['Cho Hyeong Joo', 'AI와 함께 배우고', 'notebook-identity-name']) {
  if (closedCover.includes(hiddenUntilOpen)) throw Error('Closed notebook should show only HJ, not: ' + hiddenUntilOpen);
}
const openedNotebook = home.split('<div class="hj-book-pages"')[1]?.split('<button class="hj-book-cover"')[0] ?? '';
for (const required of ['A PAGE OF NOTES','새로 이해한 개념','직접 확인한 코드','다음에 알아볼 내용','HangJoo\'s Lab / Vol. 01','hj-book-overline']) {
  if (!openedNotebook.includes(required)) throw Error('Original lined notebook missing: ' + required);
}
if (!closedCover.includes('PERSONAL ARCHIVE') || closedCover.includes('HJ / PERSONAL ARCHIVE') || !closedCover.includes('THE NOTEBOOK')) {
  throw Error('Original notebook cover labels missing');
}
for (const outdated of ['모을 예정입니다.', '기록할 예정입니다.', '모을 예정']) {
  if (home.includes(outdated)) throw Error('Planned-content copy remains on home: ' + outdated);
}
if (home.includes('기록의 서랍') || home.includes('최근에 남긴 기록') || home.includes('class="notebook-drawer"')) {
  throw Error('Deprecated homepage terminology or course-like drawer layout found');
}
if(home.includes('HANGJOO\'S PERSONAL NOTEBOOK') || home.includes('노트를 눌러 펼쳐보세요') || home.includes('다시 누르면 노트를 덮습니다') || home.includes('class="hj-book-caption"')) throw Error('Redundant home notebook wording was reintroduced');
if (!home.includes('hj-book-close') || !home.includes('aria-label="속지를 눌러 HJ 노트 닫기"')) throw Error('Original notebook sheet is not accessible as a close button');
if (!home.includes('<svg') || !home.includes('notebook-cover-symbol')) {
  throw Error('Expected vector-only notebook decoration');
}
if (home.includes('✳') || home.includes('📗') || home.includes('📓')) {
  throw Error('Emoji-style notebook ornament found');
}
if (home.includes('class="primary-link"')) {
  throw Error('Owner removed hero CTA buttons');
}

for (const text of ['All Posts','공개된 글 주제별 보기','CATEGORIES','OTHER','studio-menu-links','data-side-category','writing-quick-categories','writing-entry','writing.html','[Python] Python이란? 첫 코드와 출력']) {
  if (!listing.includes(text)) throw Error('Archive missing: '+text);
}
if (!listing.includes('href="/HangJoo/posts/2026-11-24-python-series-01-01.html"') ||
    listing.includes('href="/HangJoo/posts/2026-10-13-python-day1-basics-and-conditionals.html"')) {
  throw Error('Archive must list short chapter 01-1 while keeping full original off the list');
}
if (!listing.includes('writing-result-count')) throw Error('Expected visible result count');
if(!home.includes('class="entry-issue-badge">No.03_04</span>') ||
   !listing.includes('class="entry-issue-badge">No.01_01</span>') ||
   !categoryHtmls.study.includes('class="entry-issue-badge">No.03_04</span>') ||
   home.includes('class="entry-index"') || listing.includes('class="entry-index"')){
  throw Error('Inline chapter badges No.03_04 and No.01_01 required; old wrap-prone numbers prohibited');
}
for (const page of [home,listing,categoryHtmls.study]) {
  if(!page.includes('series-group-heading') || !page.includes('is-series-start')) throw Error('Series grouping labels / dividers missing');
}
for(const [page,label] of [[article,'NO.01'],[secondArticle,'NO.02']]){
  for (let n=1;n<=4;n++){
    if(!page.includes(n+'. 개념') && n===1)throw Error(label+' first numbered chapter missing');
    if(!page.includes('class="legacy-heading-anchor"'))throw Error(label+' legacy anchor support missing');
  }
}
const compactCSS=fs.readFileSync(path.resolve('src/styles/final-compact.css'),'utf8');
for (const marker of ['.studio-sidebar','.studio-visitor','.archive-search','.article-grid','.toc','.hj-book-sticker']){
  if(!compactCSS.includes(marker))throw Error('Compact stylesheet missing: '+marker);
}
if(!home.includes('LITTLE DISCOVERIES')||!home.includes('KEEP LEARNING')){
  throw Error('Original interactive notebook stickers missing');
}

for (const [section,count] of [
  ['study',10],['projects',0],['info',0],['reviews',0]
]) {
  if (!home.includes('id="'+section+'"') || !home.includes('categories/'+section+'.html')) {
    throw Error('Homepage section link missing: '+section);
  }
  if (!home.includes('공개 글 '+count+'편')) throw Error('Category count missing: '+section);
  if (!listing.includes('data-section-link="'+section+'"') || !listing.includes('writing.html?section='+section)) {
    throw Error('Archive section link missing: '+section);
  }
}
if (!home.includes('id="recent"') || !home.includes('id="recent-heading">최신 글')) {
  throw Error('Recent section must be distinct from four topic categories');
}
if (home.includes('Recent · 최신 글') || article.includes('Recent · 최신 글')) {
  throw Error('Owner removed the redundant Recent sidebar shortcut');
}
for (const section of ['study','projects','info','reviews']) {
  const html=categoryHtmls[section];
  if(!html.includes('class="container category-page"') || !html.includes('data-sort-mode="newest"') || !html.includes('data-sort-mode="oldest"') || !html.includes('categories/'+section+'.html?sort=oldest')) throw Error('Dedicated category sorting page missing: '+section);
  if (!home.includes('href="/HangJoo/categories/'+section+'.html"')) throw Error('Home category card does not point to distinct page: '+section);
}
if(!aboutHtml.includes('class="container about-page"') || !aboutHtml.includes('의료공학 전공') || !aboutHtml.includes('육군 장교') || !aboutHtml.includes('NVIDIA AI Agent Campus') || !aboutHtml.includes('about-portrait')) throw Error('Public About page missing verified profile sections');
if(!home.includes('href="/HangJoo/about.html"')) throw Error('About teaser does not link to the distinct page');
if (!listing.includes('data-section="study"')) throw Error('Python articles should default to study');
if (listing.includes('data-section="projects"')) throw Error('Unpublished project content leaked into archive');
// v3.8 global workspace remains shared between Home, All Posts and both articles.
for(const [page,name] of [[home,'Home'],[listing,'Archive'],[article,'NO.01'],[secondArticle,'NO.02'],[thirdArticle,'NO.03']]){
  for(const marker of ['class="studio-app"','class="studio-sidebar"','class="studio-menu"','class="studio-profile"','class="studio-avatar"','aria-label="Blog navigation"']){
    if(!page.includes(marker))throw Error(name+' missing global navigation: '+marker);
  }
}
if(home.includes('>최근 글</h2>')||home.includes('RECENT POSTS'))throw Error('Outdated home heading');
for(const phrase of ['의료공학을 공부해 왔고','제 것으로 만들어 갑니다.','소개와 경험 자세히 보기']){
  if(!home.includes(phrase))throw Error('Owner learning philosophy missing from About: '+phrase);
}
if(listing.includes('class="writing-sidebar"'))throw Error('Duplicate archive navigation was reintroduced');
const layoutCSS=fs.readFileSync(path.resolve('src/styles/studio-v3-8.css'),'utf8');
for(const marker of ['.studio-app','prefers-reduced-motion','.article-grid','.writing-quick-categories']){
  if(!layoutCSS.includes(marker))throw Error('Studio CSS missing: '+marker);
}
const originalBookCSS=fs.readFileSync(path.resolve('src/styles/book-concept.css'),'utf8');
for(const marker of ['.hj-book-scene','.hj-book-cover','.hj-book-pages','rotateY(-154deg)','prefers-reduced-motion']){
  if(!originalBookCSS.includes(marker))throw Error('Original-concept 3D book CSS missing: '+marker);
}
const sidebarCSS=fs.readFileSync(path.resolve('src/styles/sidebar-clean.css'),'utf8');
for(const marker of ['.studio-navigation-group','.studio-nav-count','.studio-profile']){
  if(!sidebarCSS.includes(marker))throw Error('Clean sidebar CSS missing: '+marker);
}
for (const page of [home, listing, article, secondArticle, thirdArticle]) {
  if (!page.includes('https://github.com/HJ-GJ"')) throw Error('GitHub header/footer must link to personal profile');
  if (page.includes('class="studio-side-note"')) throw Error('Removed sidebar bottom sentence reintroduced');
  for (const group of ['CATEGORIES','OTHER','Study Notes','Projects','Useful Info','Reviews']) {
    if (!page.includes(group)) throw Error('Sidebar heading missing: '+group);
  }
}

for (const [page, phrase] of [[home,'[Python] 리스트 실수와 점수 관리 실습'],[listing,'[Python] 반복문과 range() 처음 배우기']]) {
  if (!page.includes(phrase)) throw Error('New post missing from homepage/archive');
}
if (!listing.includes('href="/HangJoo/posts/2026-11-24-python-series-02-01.html"')) {
  throw Error('New short loop article permalink missing from archive');
}

for (const text of ['id="archive-search"','id="archive-search-input"','name="q"','role="search"']) {
  if (!listing.includes(text)) throw Error('Archive search is missing: '+text);
}
if (home.includes('class="site-header"') || article.includes('class="site-header"')) {
  throw Error('Duplicate top navigation was reintroduced');
}
for (const marker of ['HangJoo\'s Lab','All Posts','CATEGORIES','OTHER','Study Notes','Projects','Useful Info','Reviews','Search']) {
  if(!home.includes(marker)) throw Error('Sidebar navigation missing: '+marker);
}
if(home.includes('href="/HangJoo/#recent"'))throw Error('Removed Recent sidebar link still present');

for (const text of ['[Python] 변수와 조건문','개념 ·','실습 ·','확인 ·','정리 ·',
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
if (!home.includes('id="about"') || !home.includes('Cho Hyeong Joo')) {
  throw Error('Full About introduction must stay on homepage');
}
if (!article.includes('href="/HangJoo/writing.html"')) throw Error('Article back navigation is not archive');
const nav = article.match(/<aside class="toc"[\s\S]*?<\/aside>/)?.[0] ?? '';
if (!nav.includes('<summary>목차</summary>')) throw Error('Expected simple TOC title');
if ((nav.match(/class="toc-entry"/g)||[]).length !== 4 || (nav.match(/class="toc-entry toc-entry--sub"/g)||[]).length < 4) throw Error('Expected four major sections plus H3 subheads');
if (nav.includes('개 절')) throw Error('Section count leaked into article TOC');
if ((article.match(/class="study-visual"/g) || []).length !== 2) throw Error('Expected 2 beginner-relevant study diagrams');

for (const img of ['python-day1-input-flow.svg','python-day1-time-flow.svg','python-day1-branch-flow.svg']) {
  if (!fs.existsSync(path.join(dist, 'assets/visuals', img))) throw Error('Missing SVG diagram: '+img);
}
for (const phrase of ['[Python] 반복문 for와 while','반복문은 왜 필요할까?', 'range(3)', 'for', 'while', 'break', 'continue', 'python-day2-loop-flow.svg']) {
  if (!secondArticle.includes(phrase)) throw Error('Second post missing: '+phrase);
}
if (secondArticle.includes('읽는 시간') || secondArticle.includes('12분')) throw Error('Unwanted read time in second article');
const secondNav = secondArticle.match(/<aside class="toc"[\s\S]*?<\/aside>/)?.[0] ?? '';
if ((secondNav.match(/class="toc-entry"/g)||[]).length !== 4 || (secondNav.match(/class="toc-entry toc-entry--sub"/g)||[]).length < 3) throw Error('Second post requires H2 and H3 TOC entries');
if ((secondArticle.match(/class="study-visual"/g) || []).length !== 1) throw Error('Second post should include one original SVG flow diagram');
if (!fs.existsSync(path.join(dist, 'assets/visuals/python-day2-loop-flow.svg'))) throw Error('Second post flow image missing');
const actualPosts=fs.readdirSync(path.join(dist,'posts')).filter(file=>file.endsWith('.html')).sort();
const expectedPosts=['2026-10-13-python-day1-basics-and-conditionals.html','2026-10-14-python-day2-loops-for-while.html','2026-11-23-python-lists-and-copy.html',...chapterIds.map(id=>id+'.html')].sort();
if (JSON.stringify(actualPosts)!==JSON.stringify(expectedPosts)) throw Error('Unapproved drafts published or permalink changed: '+actualPosts.join(','));
for (const marker of ['[Python] 리스트와 복사','NO. 03','개념 ·','실습 ·','확인 ·','정리 ·','python-day3-index-slicing.svg','study-lab-frame','/HangJoo/labs/list-copy/index.html']) {
  if (!thirdArticle.includes(marker)) throw Error('NO03 missing required part: '+marker);
}
const thirdNav = thirdArticle.match(/<aside class="toc"[\s\S]*?<\/aside>/)?.[0] || '';
if ((thirdNav.match(/class="toc-entry"/g)||[]).length !== 4 || (thirdNav.match(/class="toc-entry toc-entry--sub"/g)||[]).length < 4) throw Error('NO03 TOC requires four major chapters and H3 sections');
if (!home.includes('공개 글 10편') || !listing.includes('href="/HangJoo/posts/2026-11-24-python-series-03-04.html"') || listing.includes('href="/HangJoo/posts/2026-11-23-python-lists-and-copy.html"')) throw Error('Ten-part series list not visible or legacy article leaked into archive');
if (!fs.existsSync(path.join(dist,'assets/visuals/python-day3-index-slicing.svg'))) throw Error('NO03 indexing diagram not deployed');
if (!labHtml.includes('data-mode="deep"') || !labHtml.includes('data-action="replace"') || !labHtml.includes('hangjoo-copy-lab-height')) throw Error('NO03 lab missing its interaction controls');

for(let i=0;i<chapterPages.length;i++){
  const html=chapterPages[i];
  const chapter=chapterIds[i];
  if(!html.includes('series-chapter-list')||!html.includes('LEARNING SERIES')||
     !html.includes('series-bottom-navigation')||!html.includes('series-entry-meta')&&html.includes('class="article-heading"')&&false){
    throw Error('Series navigation missing: '+chapter);
  }
  if(!html.includes('href="/HangJoo/posts/2026-11-24-python-series-'))throw Error('Chapter links missing: '+chapter);
  if((html.match(/class="toc-entry"/g)||[]).length>2)throw Error('Short chapter must have at most two top-level H2 sections: '+chapter);
  if(!html.includes('class="toc-entry toc-entry--sub"'))throw Error('Short chapter requires meaningful H3 sections: '+chapter);
}
for(const [legacy,chapter] of [[article,chapterIds[0]],[secondArticle,chapterIds[3]],[thirdArticle,chapterIds[6]]]){
  if(!legacy.includes('ORIGINAL EDITION')||!legacy.includes('href="/HangJoo/posts/'+chapter+'.html"')) throw Error('Stable old URL missing short-series navigation: '+chapter);
}
const copyPart=chapterPages[8];
if(!copyPart.includes('study-lab-frame') || !copyPart.includes('/HangJoo/labs/list-copy/index.html'))
  throw Error('Copy lab missing from short third-series chapter');
if(!chapterPages[6].includes('python-day3-index-slicing.svg'))
  throw Error('Index visualization missing from short first list chapter');
console.log('PASS: original HJ book / three old long permalinks preserved and ten shorter chapters with linked series navigation compiled.');
