import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {chromium} from 'playwright';

const base = 'http://127.0.0.1:4321/HangJoo/';
const out = path.resolve('qa-output');
const imgDir = path.join(out, 'screenshots');
fs.mkdirSync(imgDir, {recursive:true});
const shots=[], checks=[], errors=[];
let server, browser;
const pause = ms => new Promise(resolve => setTimeout(resolve,ms));
const h = v => String(v).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
async function ready() {
  for(let n=0;n<65;n++){
    try{const r=await fetch(base, {signal:AbortSignal.timeout(1500)});if(r.ok)return;}catch{}
    await pause(700);
  }
  throw Error('Astro localhost preview not responding');
}
async function pageAt(width,height,p=''){
  const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1,reducedMotion:'reduce',locale:'ko-KR'});
  await page.goto(base+p,{waitUntil:'networkidle'});
  await page.evaluate(async()=>{await document.fonts.ready;});
  return page;
}
async function check(name,fn){
  try{await fn();checks.push({name,status:'PASS'});}
  catch(err){const msg=String(err?.message||err);checks.push({name,status:'FAIL',message:msg});errors.push(name+': '+msg);}
}
async function shot(page,name,label,note){
  await page.screenshot({path:path.join(imgDir,name),fullPage:true,animations:'disabled'});
  shots.push({filename:'screenshots/'+name,label,note,width:page.viewportSize().width,height:page.viewportSize().height});
  await check(label+' - no horizontal overflow',async()=>{
    const m=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,width:innerWidth}));
    assert.ok(m.scroll<=m.width+1,JSON.stringify(m));
  });
}
try{
  server=spawn('npm',['run','preview','--','--host','127.0.0.1'],{cwd:process.cwd(),stdio:['ignore','pipe','pipe']});
  let serverLog='';
  server.stdout.on('data',data=>{serverLog+=data.toString();});
  server.stderr.on('data',data=>{serverLog+=data.toString();});
  await ready();
  browser=await chromium.launch({headless:true});

  const home=await pageAt(1440,900);
  await check('Owner-approved headline',async()=>{
    const s=await home.locator('#home-heading').innerText();
    assert.ok(s.includes('새로 배운 것들을')&&s.includes('차근차근 모아두는 공간'));
  });
  await check('Vector notebook symbol',async()=>{
    assert.ok(await home.locator('svg.notebook-cover-symbol').count()===1);
  });
  await check('Closed HJ cover has no name/intro',async()=>{
    const summary=await home.locator('.notebook-interactive > summary').innerText();
    assert.ok(summary.includes('HJ'));
    assert.ok(!summary.includes('Cho Hyeong Joo')&&!summary.includes('AI와 함께'));
  });
  await shot(home,'01-home-desktop-1440.png','Home / Desktop 1440','대문과 노트, 최근 글, 프로젝트 영역');
  await home.locator('.notebook-interactive > summary').click();
  await check('Notebook open',async()=>assert.equal(await home.locator('.notebook-interactive').getAttribute('open'),''));
  await check('Opened notebook reveals exact profile',async()=>{
    const opened=await home.locator('.notebook-inside').innerText();
    assert.ok(opened.includes('Cho Hyeong Joo'));
    assert.ok(opened.includes('AI와 함께 배우고, 만들고, 일합니다.'));
  });

  await shot(home,'02-note-open-1440.png','Notebook Open / Desktop','실제 공개 글 링크와 닫기');
  await home.locator('.notebook-inside-close').click();
  await check('Notebook close',async()=>assert.equal(await home.locator('.notebook-interactive').getAttribute('open'),null));
  await home.locator('.header-search > summary').click();
  await shot(home,'03-search-open-1440.png','Search / Desktop','헤더 돋보기 클릭시 검색 폼');
  await home.locator('#global-search').fill('파이썬');
  await home.locator('.header-search button[type=submit]').click();
  await home.waitForURL('**/writing.html?q=*');
  await check('Search query navigation',async()=>assert.ok(home.url().includes('q=')));
  await check('Search result count',async()=>assert.match(await home.locator('#writing-result-count').innerText(),/1 posts/));
  await home.close();

  const archive=await pageAt(1440,900,'writing.html');
  await shot(archive,'04-all-posts-desktop-1440.png','All Posts / Desktop 1440','영문 왼쪽 사이드바와 실제 게시글 목록');
  await check('Sidebar BROWSE heading',async()=>assert.equal(await archive.locator('.writing-side-heading').first().innerText(),'BROWSE'));
  await archive.goto(base+'writing.html?category=Python',{waitUntil:'networkidle'});
  await check('Category filter',async()=>assert.match(await archive.locator('#writing-result-count').innerText(),/1 posts/));
  await archive.goto(base+'writing.html?q=zzzz-no-match-xyz',{waitUntil:'networkidle'});
  await check('Empty search state',async()=>{
    assert.equal(await archive.locator('#writing-result-count').innerText(),'0 posts');
    assert.ok(await archive.locator('#writing-no-results').isVisible());
  });
  await archive.close();

  const article=await pageAt(1440,900,'posts/2026-10-13-python-day1-basics-and-conditionals.html');
  await shot(article,'05-article-desktop-1440.png','Article / Desktop 1440','첫 글의 목차와 코드/이미지');
  await check('Four TOC entries',async()=>assert.equal(await article.locator('.toc-entry').count(),4));
  await check('All three SVG diagrams',async()=>assert.equal(await article.locator('.study-visual img').count(),3));
  await article.close();

  for(const [w,hh,label] of [[820,1050,'Fold 820'],[412,915,'Mobile 412'],[360,780,'Small Mobile 360']]){
    const pg=await pageAt(w,hh);
    await shot(pg,'06-home-'+w+'.png','Home / '+label,'상단 메뉴·제목 줄바꿈·벡터 노트');
    if(w===412){
      await pg.locator('.notebook-interactive > summary').click();
      await shot(pg,'07-note-open-412.png','Notebook / Mobile 412','펼친 노트의 링크·닫기 버튼');
      await pg.locator('.notebook-inside-close').click();
      await check('Mobile notebook closes',async()=>assert.equal(await pg.locator('.notebook-interactive').getAttribute('open'),null));
    }
    await pg.close();
  }

  const fold=await pageAt(820,1050,'writing.html');
  await shot(fold,'08-all-posts-820.png','All Posts / Fold 820','폭 820의 메뉴 접기/펼치기');
  await fold.close();

  const mobile=await pageAt(412,915,'writing.html');
  await check('Mobile sidebar defaults closed',async()=>assert.equal(await mobile.locator('#writing-side-details').getAttribute('open'),null));
  await shot(mobile,'09-all-posts-412.png','All Posts / Mobile 412','접힌 사이드바와 글 목록');
  await mobile.locator('.writing-mobile-toggle').click();
  await shot(mobile,'10-all-posts-menu-open-412.png','Sidebar / Mobile 412','영문 사이드바를 펼친 상태');
  await mobile.close();

  const mini=await pageAt(360,780,'writing.html');
  await shot(mini,'11-all-posts-360.png','All Posts / Mobile 360','작은 스마트폰에서 메뉴·목록');
  await mini.close();

  const artMobile=await pageAt(412,915,'posts/2026-10-13-python-day1-basics-and-conditionals.html');
  await check('Mobile TOC defaults closed',async()=>assert.equal(await artMobile.locator('.toc-details').getAttribute('open'),null));
  await artMobile.locator('.toc-details > summary').click();
  await shot(artMobile,'12-article-toc-open-412.png','Article / Mobile 412','목차 펼친 상태 및 본문');
  await artMobile.close();

  const artSmall=await pageAt(360,780,'posts/2026-10-13-python-day1-basics-and-conditionals.html');
  await shot(artSmall,'13-article-360.png','Article / Mobile 360','좁은 화면에서 코드 및 그림');
  await artSmall.close();

  const data={builtFrom:'Actual Astro output, localhost preview',createdAt:new Date().toISOString(),
    basePath:'/HangJoo/',shots,checks,errors,passed:checks.filter(x=>x.status==='PASS').length,failed:errors.length};
  fs.writeFileSync(path.join(out,'qa-results.json'),JSON.stringify(data,null,2));
  const checklist=['# HangJoo v3.2 | Visual QA','',
    'Source: actual Astro build, GitHub PR #3, not public Pages','',
    '## 확인 사항','- [ ] PC: 대문 두 줄, 부제, 민트색 강조가 자연스럽다',
    '- [ ] 412px: 노트 주변 작은 아이콘이 이모지처럼 보이지 않는다',
    '- [ ] 360px: 상단 메뉴와 로고가 잘리지 않는다',
    '- [ ] 820px: 접이식 전체 글 메뉴가 사용하기 편하다',
    '- [ ] 노트 펼침과 닫기 및 링크 터치가 편리하다',
    '- [ ] 상단 돋보기 검색, 카테고리 필터, 검색 결과가 정상이다',
    '- [ ] All Posts: 영어 메뉴/글 목록/날짜/요약을 한눈에 읽을 수 있다',
    '- [ ] Article: 개념/실습/확인/정리 목차가 명확하다',
    '- [ ] 모바일에서 코드 블록과 3개 개념도가 잘리지 않는다',
    '- [ ] 글/아이콘/버튼 간격과 터치 영역에 불편함이 없다',
    '',
    '## Screenshot index',
    ...shots.map(s=>'- [ ] '+s.label+' — '+s.filename),
    '',
    '## 의견 기록',
    '| 위치 | 현재 문제 | 원하는 변경 | 우선순위(P0/P1/P2) |',
    '|---|---|---|---|',
    '| 예: Home / Mobile 412 | 닫기 버튼이 작음 | 버튼 확대 | P1 |',
    '| | | | |','| | | | |','',
    'P0 화면 깨짐/사용 불가, P1 탐색·가독성 문제, P2 간격·색상 등 미감'];
  fs.writeFileSync(path.join(out,'QA_CHECKLIST.md'),checklist.join('\n'));
  const tiles=shots.map(s=>'<article><h2>'+h(s.label)+'</h2><p>'+h(s.note)+'</p><a href="'+h(s.filename)+'" target="_blank"><img loading="lazy" src="'+h(s.filename)+'" alt="'+h(s.label)+'"></a><small>'+s.width+'×'+s.height+' viewport · 누르면 확대</small></article>').join('');
  const html='<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>HangJoo v3.2 QA</title><style>body{margin:0;background:#f7faf9;color:#202b2a;font:15px/1.7 system-ui,sans-serif}header,main{max-width:1280px;margin:auto;padding:28px 22px}header{border-bottom:1px solid #dfe9e5}h1{font-size:30px;letter-spacing:-.04em;margin:0 0 8px}h2{font-size:17px;margin:0}p{margin:2px 0 12px;color:#64736e}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:16px}article{background:#fff;border:1px solid #dfe9e5;border-radius:14px;padding:16px;min-width:0}img{width:100%;max-height:550px;object-fit:contain;object-position:top;border:1px solid #dfe9e5;border-radius:8px}small{display:block;color:#64736e;font-size:12px}a{color:#168574}</style></head><body><header><h1>HangJoo v3.2 · Visual QA</h1><p>Astro actual build · '+shots.length+' screenshots · '+data.passed+' pass / '+data.failed+' fail</p><p><a href="QA_CHECKLIST.md">검수 체크리스트</a> · <a href="qa-results.json">자동 검사 결과</a></p></header><main class="grid">'+tiles+'</main></body></html>';
  fs.writeFileSync(path.join(out,'index.html'),html);
  console.log('Visual QA: '+shots.length+' screenshots; '+data.passed+' PASS / '+data.failed+' FAIL.');
  if(errors.length)process.exitCode=1;
}catch(e){
  errors.push(String(e?.stack||e));
  fs.writeFileSync(path.join(out,'qa-results.json'),JSON.stringify({errors,shots,checks},null,2));
  console.error(e);process.exitCode=1;
}finally{
  try{await browser?.close();}catch{}
  try{server?.kill('SIGTERM');}catch{}
}
