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
  server=spawn('npm',['run','preview','--','--host','127.0.0.1'],{
    cwd:process.cwd(),
    stdio:['ignore','pipe','pipe'],
    detached:process.platform!=='win32'
  });
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
  await check('Closed cover shows HJ and excludes About text',async()=>{
    const txt=await home.locator('.hj-book-cover').innerText();
    assert.ok(txt.includes('HJ')&&!txt.includes('Cho Hyeong Joo'));
    assert.equal(await home.locator('.hj-book-pages').getAttribute('aria-hidden'),'true');
  });
  await check('Desktop layout has clean grouped sidebar',async()=>{
    const m=await home.evaluate(()=>{
      const side=document.querySelector('.studio-sidebar').getBoundingClientRect();
      const main=document.querySelector('.notebook-home').getBoundingClientRect();
      return {left:side.left,width:side.width,mainWidth:main.width,menuOpen:document.querySelector('.studio-menu').open};
    });
    assert.ok(m.left>=-1&&m.width>=175&&m.width<=230&&m.mainWidth>=1040&&m.menuOpen,JSON.stringify(m));
    assert.deepEqual(await home.locator('.studio-menu-heading').allInnerTexts(),['CATEGORIES','OTHER']);
    assert.equal(await home.locator('.studio-side-note').count(),0);
    const categories=await home.locator('.studio-navigation-group [aria-label="Categories"] a').count();
    assert.equal(categories,4);
    assert.equal(await home.locator('.studio-navigation-group [aria-label="Categories"] .studio-nav-icon').count(),4);
    const brand=home.locator('.studio-profile');
    assert.equal(await brand.getAttribute('href'),'/HangJoo/');
    assert.equal(await home.locator('.studio-primary-nav a').count(),1);
    assert.equal(await home.locator('.studio-visitor').count(),1);

    assert.equal(await home.locator('.studio-menu-links a[href^="https://github.com/"]').first().getAttribute('href'),'https://github.com/HJ-GJ');
    assert.equal(await home.locator('.site-header').count(),0);
  });
  await check('Home text, categories and Recent remain intact',async()=>{
    const txt=await home.locator('#about').innerText();
    assert.ok(txt.includes('혼자 다시 공부하고')&&txt.includes('AI에게 다시 질문'));
    assert.equal(await home.locator('#recent-heading').innerText(),'최신 글');
    assert.deepEqual(await home.locator('.home-categories .home-explore-item h3').allInnerTexts(),['공부 기록','프로젝트','유용한 정보','리뷰']);
    const counts=await home.locator('.home-categories .home-category-footer').allInnerTexts();
    assert.ok(counts[0].includes('2편')&&counts.slice(1).every(t=>t.includes('0편')),JSON.stringify(counts));
    assert.equal(await home.locator('.studio-sidebar a[href$="#recent"]').count(),0);
  });
  await check('Home category icons use exactly the sidebar glyphs',async()=>{
    const iconPairs=await home.evaluate(()=>{
      return ['study','projects','info','reviews'].map(key=>{
        const side=document.querySelector('.studio-sidebar nav[aria-label="Categories"] a[href$="section='+key+'"] svg');
        const card=document.querySelector('#'+key+' .home-explore-icon svg');
        return {key,sidebar:side?.querySelector('path')?.getAttribute('d'),
          card:card?.querySelector('path')?.getAttribute('d'),
          sidebarStroke:side?.getAttribute('stroke-width'),cardStroke:card?.getAttribute('stroke-width'),
          sideCap:side?.getAttribute('stroke-linecap'),cardCap:card?.getAttribute('stroke-linecap'),
          sideJoin:side?.getAttribute('stroke-linejoin'),cardJoin:card?.getAttribute('stroke-linejoin')};
      });
    });
    assert.equal(iconPairs.length,4);
    for(const icon of iconPairs){
      assert.ok(icon.sidebar&&icon.card,JSON.stringify(icon));
      assert.equal(icon.card,icon.sidebar,JSON.stringify(icon));
      assert.equal(icon.cardStroke,icon.sidebarStroke,JSON.stringify(icon));
      assert.equal(icon.cardCap,icon.sideCap,JSON.stringify(icon));
      assert.equal(icon.cardJoin,icon.sideJoin,JSON.stringify(icon));
    }
  });
  await check('Notebook uses one original-concept book instead of layered squares',async()=>{
    assert.equal(await home.locator('.hj-book-cover').count(),1);
    assert.equal(await home.locator('.hj-book-pages').count(),1);
    assert.equal(await home.locator('.notebook-cover').count(),0);
  });
  await check('Reduced motion disables notebook background animation',async()=>{
    const css=await home.locator('.hj-book-backdrop').evaluate(el=>({
      animation:getComputedStyle(el).animationName,
      transition:getComputedStyle(el.parentElement.querySelector('.hj-book-cover')).transitionDuration
    }));
    assert.equal(css.animation,'none',JSON.stringify(css));
    assert.ok(parseFloat(css.transition)<=.001,JSON.stringify(css));
  });
  const closedBook=await home.locator('.hj-book-scene').boundingBox();
  await check('Home menu begins just below hero eyebrow and stays sticky',async()=>{
    const start=await home.evaluate(()=>{
      const side=document.querySelector('.studio-sidebar').getBoundingClientRect();
      const eyebrow=document.querySelector('.notebook-eyebrow').getBoundingClientRect();
      return {sideTop:side.top, eyebrowTop:eyebrow.top};
    });
    assert.ok(Math.abs(start.sideTop-(start.eyebrowTop+14))<=3,JSON.stringify(start));
    await home.evaluate(()=>window.scrollTo(0,600));
    await home.waitForTimeout(120);
    const scrolled=await home.locator('.studio-sidebar').evaluate(el=>el.getBoundingClientRect().top);
    assert.ok(Math.abs(scrolled-20)<=3,JSON.stringify({scrolled}));
    await home.evaluate(()=>window.scrollTo(0,0));
  });
  await shot(home,'01-home-desktop-1440.png','Home / Desktop 1440','단정한 메뉴와 원본 노트 표지');
  const normalMotion=await browser.newPage({viewport:{width:1440,height:900},reducedMotion:'no-preference'});
  await normalMotion.goto(base,{waitUntil:'networkidle'});
  await check('Original reference: single-sided mint cover vanishes after the left hinge swing',async()=>{
    const info=await normalMotion.locator('.hj-book-cover').evaluate(el=>({
      origin:getComputedStyle(el).transformOrigin,
      backface:getComputedStyle(el).backfaceVisibility,
      duration:parseFloat(getComputedStyle(el).transitionDuration)
    }));
    assert.ok(parseFloat(info.origin)<=1,JSON.stringify(info));
    assert.equal(info.backface,'hidden',JSON.stringify(info));
    assert.ok(Math.abs(info.duration-.9)<.02,JSON.stringify(info));
    assert.equal(await normalMotion.locator('.hj-book-cover-front').count(),0);
    assert.equal(await normalMotion.locator('.hj-book-cover-back').count(),0);
    await normalMotion.locator('.hj-book-cover').click();
    await normalMotion.waitForTimeout(170);
    const mid=await normalMotion.locator('.hj-book-cover').evaluate(el=>({
      transform:getComputedStyle(el).transform,
      backface:getComputedStyle(el).backfaceVisibility
    }));
    assert.notEqual(mid.transform,'none',JSON.stringify(mid));
    await normalMotion.screenshot({path:path.join(imgDir,'02-original-page-turn-midframe-1440.png'),animations:'allow'});
    shots.push({filename:'screenshots/02-original-page-turn-midframe-1440.png',label:'Original cover-turn moment / Desktop',note:'Only a single mint cover rotates, with no backside or left-hand leaf',width:1440,height:900});
    await normalMotion.waitForTimeout(950);
    assert.equal(await normalMotion.locator('.hj-book').getAttribute('data-open'),'true');
    const openState=await normalMotion.evaluate(()=>{
      const cover=document.querySelector('.hj-book-cover');
      const paper=document.querySelector('.hj-book-pages');
      const rect=paper.getBoundingClientRect();
      const leftPageX=rect.left-65;
      const leftPageY=rect.top+rect.height/2;
      const covering=document.elementsFromPoint(leftPageX,leftPageY)
        .filter(el=>el.classList?.contains('hj-book-cover'));
      return {
        backface:getComputedStyle(cover).backfaceVisibility,
        coverInert:cover.inert,
        hiddenCoverAtLeft:covering.length===0,
        frontLeafCount:document.querySelectorAll('.hj-book-cover-front,.hj-book-cover-back').length,
        paperVisible:rect.width>150,
        bookTransform:getComputedStyle(document.querySelector('.hj-book')).transform
      };
    });
    assert.equal(openState.backface,'hidden',JSON.stringify(openState));
    assert.ok(openState.coverInert&&openState.hiddenCoverAtLeft,JSON.stringify(openState));
    assert.equal(openState.frontLeafCount,0);
    assert.ok(openState.paperVisible,JSON.stringify(openState));
  });
  await normalMotion.close();

  // Capture a real full open/close cycle for human approval of the motion.
  const clipContext=await browser.newContext({
    viewport:{width:1440,height:900},
    deviceScaleFactor:1,
    reducedMotion:'no-preference',
    recordVideo:{dir:out,size:{width:1440,height:900}}
  });
  const clip=await clipContext.newPage();
  await clip.goto(base,{waitUntil:'networkidle'});
  await clip.evaluate(async()=>await document.fonts.ready);
  await clip.waitForTimeout(300);
  await clip.locator('.hj-book-cover').click();
  await clip.waitForTimeout(1100);
  await clip.locator('.hj-book-close').click();
  await clip.waitForTimeout(950);
  await clipContext.close();
  fs.copyFileSync(await clip.video().path(),path.join(out,'notebook-swish-open-close.webm'));
  await check('Notebook open-close animation video is recorded',async()=>{
    assert.ok(fs.statSync(path.join(out,'notebook-swish-open-close.webm')).size>20000);
  });
  await home.locator('.hj-book-cover').click();
  await check('Notebook reveals original lined note and closes by touching paper',async()=>{
    assert.equal(await home.locator('.hj-book').getAttribute('data-open'),'true');
    assert.equal(await home.locator('.hj-book-cover').getAttribute('aria-expanded'),'true');
    assert.equal(await home.locator('.hj-book-pages').getAttribute('aria-hidden'),'false');
    assert.equal(await home.locator('.hj-book-pages').getAttribute('inert'),null);
    const txt=await home.locator('.hj-book-pages').innerText();
    assert.ok(txt.includes('A PAGE OF NOTES')&&txt.includes('새로 이해한 개념')&&txt.includes('직접 확인한 코드')&&txt.includes('다음에 알아볼 내용'));
    assert.equal(await home.locator('.hj-book-checklist li').count(),3);
    assert.equal(await home.locator('.hj-book-caption').innerText(),'다시 누르면 노트를 덮습니다');
    assert.ok(await home.locator('.hj-book-close').isVisible());
    const onlySheet=await home.evaluate(()=>({
      backface:getComputedStyle(document.querySelector('.hj-book-cover')).backfaceVisibility,
      hasSecondLeaf:!!document.querySelector('.hj-book-cover-front,.hj-book-cover-back'),
      pageText:document.querySelector('.hj-book-pages').innerText
    }));
    assert.equal(onlySheet.backface,'hidden',JSON.stringify(onlySheet));
    assert.equal(onlySheet.hasSecondLeaf,false);
    assert.ok(onlySheet.pageText.includes('A PAGE OF NOTES'));
  });
  await check('Notebook scene retains size before/after opening',async()=>{
    const opened=await home.locator('.hj-book-scene').boundingBox();
    assert.ok(Math.abs(closedBook.width-opened.width)<=1&&Math.abs(closedBook.height-opened.height)<=1);
  });
  await shot(home,'02-note-open-1440.png','Notebook Open / Desktop','종이가 한 장 넘어간 실제 노트');
  await home.locator('.hj-book-close').click();
  await check('Notebook close',async()=>{
    assert.equal(await home.locator('.hj-book').getAttribute('data-open'),'false');
    assert.equal(await home.locator('.hj-book-cover').getAttribute('inert'),null);
    const opacity=await home.locator('.hj-book-cover').evaluate(el=>Number(getComputedStyle(el).opacity));
    assert.ok(opacity>.99,JSON.stringify({opacity}));
  });
  await home.locator('.studio-sidebar a[href$="writing.html#archive-search"]').click();
  await home.waitForURL('**/writing.html#archive-search');
  await check('Sidebar Search destination',async()=>assert.ok(home.url().endsWith('#archive-search')));
  await home.locator('#archive-search-input').fill('파이썬');
  await shot(home,'03-search-open-1440.png','Search / Desktop','글 목록 검색 폼');
  await home.locator('.archive-search button[type=submit]').click();
  await home.waitForURL('**/writing.html?q=*');
  await check('Search query navigation',async()=>assert.ok(home.url().includes('q=')));
  await check('Search result count',async()=>assert.match(await home.locator('#writing-result-count').innerText(),/2 posts/));
  await home.close();

  const archive=await pageAt(1440,900,'writing.html');
  await shot(archive,'04-all-posts-desktop-1440.png','All Posts / Desktop 1440','공통 좌측 메뉴와 간결한 카테고리 필터');
  await check('Global study navigation and category controls',async()=>{
    assert.ok(await archive.locator('.studio-sidebar .studio-profile').isVisible());
    assert.equal(await archive.locator('.writing-quick-categories [data-side-category]').count(),1);
  });
  await check('Archive has four content sections with factual counts',async()=>{
    assert.equal(await archive.locator('.writing-section-tabs [data-section-link]').count(),4);
    const labels=await archive.locator('.writing-section-tabs [data-section-link]').allInnerTexts();
    assert.ok(labels[0].includes('공부 기록')&&labels[0].includes('2'));
    assert.ok(labels.slice(1).every(t=>t.trim().endsWith('0')));
  });
  await archive.goto(base+'writing.html?section=study',{waitUntil:'networkidle'});
  await check('Study section shows exactly two published Python articles',async()=>{
    assert.equal(await archive.locator('#writing-result-count').innerText(),'2 posts');
    assert.equal(await archive.locator('.writing-entry:not([hidden])').count(),2);
  });
  for (const section of ['projects','info','reviews']) {
    await archive.goto(base+'writing.html?section='+section,{waitUntil:'networkidle'});
    await check('Empty '+section+' section is explicit and honest',async()=>{
      assert.equal(await archive.locator('#writing-result-count').innerText(),'0 posts');
      assert.ok(await archive.locator('#writing-no-results').isVisible());
      assert.ok((await archive.locator('#writing-no-results p').innerText()).includes('아직 없습니다'));
    });
  }
  await archive.goto(base+'writing.html?category=Python',{waitUntil:'networkidle'});
  await check('Category filter',async()=>assert.match(await archive.locator('#writing-result-count').innerText(),/2 posts/));
  await archive.goto(base+'writing.html?q=zzzz-no-match-xyz',{waitUntil:'networkidle'});
  await check('Empty search state',async()=>{
    assert.equal(await archive.locator('#writing-result-count').innerText(),'0 posts');
    assert.ok(await archive.locator('#writing-no-results').isVisible());
  });
  await archive.close();

  const article=await pageAt(1440,900,'posts/2026-10-13-python-day1-basics-and-conditionals.html');
  await check('Article metadata hides reading-time estimate',async()=>{
    assert.ok(!(await article.locator('.article-heading .meta').innerText()).includes('15분'));
  });
  await check('Wide article reading region and independent right-hand TOC',async()=>{
    const m=await article.evaluate(()=>{
      const main=document.querySelector('.prose').getBoundingClientRect();
      const toc=document.querySelector('.toc').getBoundingClientRect();
      const side=document.querySelector('.studio-sidebar').getBoundingClientRect();
      return {mainWidth:main.width,tocWidth:toc.width,gap:toc.left-main.right,sideWidth:side.width};
    });
    assert.ok(m.mainWidth>690 && m.tocWidth>=195 && m.gap>=20 && m.sideWidth>=175,JSON.stringify(m));
  });
  await check('Article sidebar aligns with TOC and follows sticky scroll',async()=>{
    const before=await article.evaluate(()=>{
      const a=document.querySelector('.studio-sidebar').getBoundingClientRect();
      const b=document.querySelector('.toc').getBoundingClientRect();
      return {sidebarTop:a.top,tocTop:b.top};
    });
    assert.ok(Math.abs(before.sidebarTop-before.tocTop)<=3,JSON.stringify(before));
    await article.evaluate(()=>window.scrollTo(0,500));
    await article.waitForTimeout(160);
    const after=await article.evaluate(()=>{
      const a=document.querySelector('.studio-sidebar').getBoundingClientRect();
      const b=document.querySelector('.toc').getBoundingClientRect();
      return {sidebarTop:a.top,tocTop:b.top};
    });
    assert.ok(Math.abs(after.sidebarTop-after.tocTop)<=3,JSON.stringify(after));
    assert.ok(after.sidebarTop>=19&&after.tocTop>=19,JSON.stringify(after));
    await article.evaluate(()=>window.scrollTo(0,0));
  });
  await shot(article,'05-article-desktop-1440.png','Article / Desktop 1440','첫 글의 목차와 코드/이미지');
  await check('Four TOC entries',async()=>assert.equal(await article.locator('.toc-entry').count(),4));
  await check('Numbered notebook outline',async()=>{
    const chapters=await article.locator('.prose h2').allInnerTexts();
    assert.ok(chapters.length===4 && chapters.every((v,i)=>v.startsWith((i+1)+'. ')),JSON.stringify(chapters));
    const firstSub=await article.locator('.prose h3').first().innerText();
    assert.ok(firstSub.startsWith('1-1.'),firstSub);
  });
  await check('Original issue number remains NO. 01 in newest-first archive',async()=>{
    const a=await pageAt(1440,900,'writing.html');
    const labels=await a.locator('.writing-entry .entry-index').allInnerTexts();
    assert.deepEqual(labels,['02','01']);
    await a.close();
  });

  await check('Two relevant first-post SVG diagrams',async()=>assert.equal(await article.locator('.study-visual img').count(),2));
  await article.close();
  const nextArticle=await pageAt(1440,900,'posts/2026-10-14-python-day2-loops-for-while.html');
  await check('Second post numbered chapters and subsection titles',async()=>{
    const titles=await nextArticle.locator('.prose h2').allInnerTexts();
    assert.equal(titles.length,4);
    assert.ok(titles.every((v,i)=>v.startsWith((i+1)+'. ')));
  });
  await check('Second post is routed and has 4 reading stages',async()=>{
    assert.match(await nextArticle.locator('h1').innerText(),/반복문 for와 while/);
    assert.equal(await nextArticle.locator('.toc-entry').count(),4);
    assert.equal(await nextArticle.locator('.study-visual img').count(),1);
  });
  await shot(nextArticle,'14-article-no02-desktop-1440.png','Article 02 / Desktop 1440','for·while 학습 기록과 원본 반복문 도식');
  await nextArticle.close();

  const secondMobile=await pageAt(412,915,'posts/2026-10-14-python-day2-loops-for-while.html');
  await check('Second post mobile TOC initially collapsed',async()=>{
    assert.equal(await secondMobile.locator('.toc-details').getAttribute('open'),null);
  });
  await shot(secondMobile,'15-article-no02-mobile-412.png','Article 02 / Mobile 412','짧은 본문과 도식의 모바일 가독성');
  await secondMobile.close();


  for(const [w,hh,label] of [[768,1024,'iPad Portrait 768'],[820,1050,'Fold / iPad 820'],[1024,768,'iPad Landscape 1024'],[1180,820,'Wide iPad 1180'],[412,915,'Mobile 412'],[360,780,'Small Mobile 360']]){
    const pg=await pageAt(w,hh);
    await shot(pg,'06-home-'+w+'.png','Home / '+label,'작아진 본문·좌측 카드 및 책장 애니메이션');
    if ([768,820,1024,1180].includes(w)) {
      await check('Tablet hero layout / '+w,async()=>{
        const data=await pg.evaluate(()=>{
          const hero=document.querySelector('.notebook-hero');
          const intro=document.querySelector('.notebook-intro').getBoundingClientRect();
          const card=document.querySelector('.hj-book-scene').getBoundingClientRect();
          return {display:getComputedStyle(hero).display,introBottom:intro.bottom,cardTop:card.top};
        });
        if (w<=900) {
          assert.equal(data.display,'flex');
          assert.ok(data.cardTop>=data.introBottom-1,JSON.stringify(data));
        }
      });
      const beforeTablet=await pg.locator('.hj-book-scene').boundingBox();
      await pg.locator('.hj-book-cover').click();
      await check('Book opens and frame remains stable / '+w,async()=>{
        const afterTablet=await pg.locator('.hj-book-scene').boundingBox();
        assert.ok(Math.abs(beforeTablet.width-afterTablet.width)<=1 &&
          Math.abs(beforeTablet.height-afterTablet.height)<=1,
          JSON.stringify({beforeTablet,afterTablet}));
        assert.equal(await pg.locator('.hj-book').getAttribute('data-open'),'true');
        assert.equal(await pg.locator('.hj-book-pages').getAttribute('aria-hidden'),'false');
      });
      await check('Original notebook uses a single real page / '+w,async()=>{
        assert.equal(await pg.locator('.hj-book-pages').count(),1);
        assert.equal(await pg.locator('.notebook-cover').count(),0);
      });
      await shot(pg,'07-note-open-'+w+'.png','Opened Notebook / '+label,'실제 책장과 태블릿 가독성');
      await pg.locator('.hj-book-close').click();
      await check('Book closes / '+w,async()=>{
        assert.equal(await pg.locator('.hj-book').getAttribute('data-open'),'false');
      });
    }

    if(w===412){
      const beforeMobile=await pg.locator('.hj-book-scene').boundingBox();
      await pg.locator('.hj-book-cover').click();
      await check('Mobile book frame stays stable',async()=>{
        const afterMobile=await pg.locator('.hj-book-scene').boundingBox();
        assert.ok(Math.abs(beforeMobile.width-afterMobile.width)<=1 &&
          Math.abs(beforeMobile.height-afterMobile.height)<=1,
          JSON.stringify({beforeMobile,afterMobile}));
        assert.equal(await pg.locator('.hj-book').getAttribute('data-open'),'true');
      });
      await shot(pg,'07-note-open-412.png','Notebook / Mobile 412','작은 화면에서도 열리는 원본형 노트');
      await pg.locator('.hj-book-close').click();
      await check('Mobile notebook closes',async()=>assert.equal(await pg.locator('.hj-book').getAttribute('data-open'),'false'));
    }
    await pg.close();
  }

  const fold=await pageAt(820,1050,'writing.html');
  await shot(fold,'08-all-posts-820.png','All Posts / Fold 820','폭 820의 전역 메뉴 접기/펼치기');
  await fold.close();

  const mobile=await pageAt(412,915,'writing.html');
  await check('Mobile global navigation defaults closed',async()=>assert.equal(await mobile.locator('.studio-menu').getAttribute('open'),null));
  await shot(mobile,'09-all-posts-412.png','All Posts / Mobile 412','접힌 사이드바와 글 목록');
  await mobile.locator('.studio-menu-toggle').click();
  await check('Mobile global navigation expands and reveals profile',async()=>{
    assert.equal(await mobile.locator('.studio-menu').getAttribute('open'),'');
    assert.ok(await mobile.locator('.studio-menu-panel .studio-profile').isVisible());
  });
  await shot(mobile,'10-all-posts-menu-open-412.png','Sidebar / Mobile 412','전체 메뉴에서 프로필과 실제 공개 카테고리 확인');
  await mobile.close();

  const mini=await pageAt(360,780,'writing.html');
  await shot(mini,'11-all-posts-360.png','All Posts / Mobile 360','작은 스마트폰에서 메뉴·목록');
  await mini.close();

  const artMobile=await pageAt(412,915,'posts/2026-10-13-python-day1-basics-and-conditionals.html');
  await check('Mobile TOC defaults closed',async()=>assert.equal(await artMobile.locator('.toc-details').getAttribute('open'),null));
  await check('Mobile badges are visible and nonoverlapping',async()=>{
    const measurements=await artMobile.evaluate(()=>{
      const labels=[...document.querySelectorAll('.article-labels .tag, .article-labels .pill')].map(el=>{
        const r=el.getBoundingClientRect();
        return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height};
      });
      const overlap=(a,b)=>Math.min(a.right,b.right)-Math.max(a.left,b.left)>1 &&
        Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top)>1;
      return {labels,overlap:labels.some((a,i)=>labels.some((b,j)=>j>i&&overlap(a,b))),
        viewport:document.documentElement.clientWidth};
    });
    assert.ok(measurements.labels.length>=5);
    assert.ok(!measurements.overlap,JSON.stringify(measurements));
    assert.ok(measurements.labels.every(r=>r.left>=0&&r.right<=measurements.viewport+1));
  });
  await artMobile.locator('.toc-details > summary').click();
  await shot(artMobile,'12-article-toc-open-412.png','Article / Mobile 412','목차 펼친 상태 및 본문');
  await artMobile.close();

  const artSmall=await pageAt(360,780,'posts/2026-10-13-python-day1-basics-and-conditionals.html');
  await shot(artSmall,'13-article-360.png','Article / Mobile 360','좁은 화면에서 코드 및 그림');
  await artSmall.close();

  const data={builtFrom:'Actual Astro output, localhost preview',createdAt:new Date().toISOString(),
    basePath:'/HangJoo/',shots,checks,errors,passed:checks.filter(x=>x.status==='PASS').length,failed:errors.length};
  fs.writeFileSync(path.join(out,'qa-results.json'),JSON.stringify(data,null,2));
  const checklist=['# HangJoo v4.0 | Visual QA','',
    'Source: actual Astro build, GitHub PR for Wide Studio redesign, not public Pages','',
    '## 확인 사항','- [ ] PC: 대문 두 줄, 부제, 민트색 강조가 자연스럽다',
    '- [ ] 412px: 노트 주변 작은 아이콘이 이모지처럼 보이지 않는다',
    '- [ ] 360px: 접이식 좌측 메뉴와 로고가 잘리지 않는다',
    '- [ ] 820px: 전역 좌측 메뉴를 펼치고 접을 수 있다',
    '- [ ] 노트 펼침과 닫기 전후 외부 프레임의 가로·세로 크기가 같다',
    '- [ ] 좌측 Search → All Posts 검색, 카테고리 필터, 검색 결과가 정상이다',
    '- [ ] All Posts: 카테고리 필터/글 목록/날짜/요약을 한눈에 읽을 수 있다',
    '- [ ] Article: 개념/실습/확인/정리 목차가 명확하다',
    '- [ ] 모바일에서 코드 블록과 2개 핵심 개념도가 잘리지 않는다',
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
  const html='<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>HangJoo v4.0 QA</title><style>body{margin:0;background:#f7faf9;color:#202b2a;font:15px/1.7 system-ui,sans-serif}header,main{max-width:1280px;margin:auto;padding:28px 22px}header{border-bottom:1px solid #dfe9e5}h1{font-size:30px;letter-spacing:-.04em;margin:0 0 8px}h2{font-size:17px;margin:0}p{margin:2px 0 12px;color:#64736e}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:16px}article{background:#fff;border:1px solid #dfe9e5;border-radius:14px;padding:16px;min-width:0}img{width:100%;max-height:550px;object-fit:contain;object-position:top;border:1px solid #dfe9e5;border-radius:8px}small{display:block;color:#64736e;font-size:12px}a{color:#168574}</style></head><body><header><h1>HangJoo v4.0 · Visual QA</h1><p>Astro actual build · '+shots.length+' screenshots · '+data.passed+' pass / '+data.failed+' fail</p><p><a href="QA_CHECKLIST.md">검수 체크리스트</a> · <a href="qa-results.json">자동 검사 결과</a></p></header><main class="grid">'+tiles+'</main></body></html>';
  fs.writeFileSync(path.join(out,'index.html'),html);
  console.log('Visual QA: '+shots.length+' screenshots; '+data.passed+' PASS / '+data.failed+' FAIL.');
  if(errors.length)process.exitCode=1;
}catch(e){
  errors.push(String(e?.stack||e));
  fs.writeFileSync(path.join(out,'qa-results.json'),JSON.stringify({errors,shots,checks},null,2));
  console.error(e);process.exitCode=1;
}finally{
  try{await browser?.close();}catch{}
  if(server?.pid && process.platform!=='win32'){
    try{process.kill(-server.pid,'SIGTERM');}catch{try{server.kill('SIGTERM')}catch{}}
  }else{
    try{server?.kill('SIGTERM');}catch{}
  }
  // Prevent an orphaned preview descendant from retaining the parent's pipes.
  try{server?.stdout?.destroy();server?.stderr?.destroy();}catch{}
}
