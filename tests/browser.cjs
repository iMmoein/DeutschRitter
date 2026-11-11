/* Real headless Chromium smoke test. Linux binary is a dev dependency, never a runtime asset. */
const {chromium:playwright}=require('playwright-core');
const chromium=require('@sparticuz/chromium').default;
const http=require('node:http'),fs=require('node:fs/promises'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const mime={'.css':'text/css; charset=utf-8','.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.webmanifest':'application/manifest+json','.jpg':'image/jpeg','.svg':'image/svg+xml','.txt':'text/plain; charset=utf-8'};
const server=http.createServer(async(req,res)=>{
 try {
  const url=new URL(req.url,'http://localhost'),relative=decodeURIComponent(url.pathname);
  const file=path.resolve(root,'.'+(relative.endsWith('/')?relative+'index.html':relative));
  if(!file.startsWith(root+path.sep)||relative.split('/').some(p=>p.startsWith('.'))) {res.writeHead(403);res.end();return;}
  const content=await fs.readFile(file);res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'});res.end(content);
 } catch(_) {res.writeHead(404);res.end('Not found');}
});
(async()=>{
 let browser;
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 try {
  const chromiumPackage=require('@sparticuz/chromium');
  const libraries=await chromiumPackage.inflate(path.join(path.dirname(require.resolve('@sparticuz/chromium')),'..','bin','al2023.tar.br'));
  const args=chromium.args.filter(arg=>!['--single-process','--disable-web-security','--allow-running-insecure-content'].includes(arg));
  browser=await playwright.launch({executablePath:await chromium.executablePath(),args,headless:true,env:{...process.env,LD_LIBRARY_PATH:path.join(libraries,'lib')+(process.env.LD_LIBRARY_PATH?':'+process.env.LD_LIBRARY_PATH:'')}});
  const origin=`http://127.0.0.1:${server.address().port}`;
  const errors=[],context=await browser.newContext();
  context.on('page',page=>page.on('pageerror',error=>errors.push(error.message)));
  const first=await context.newPage();
  await first.goto(origin);
  await first.waitForFunction(()=>typeof gameState!=='undefined' && Object.keys(gameState.srsCards).length===20 && tabWriteAccess==='writer');
  const second=await context.newPage();await second.goto(origin);
  await second.waitForFunction(()=>typeof tabWriteAccess!=='undefined' && tabWriteAccess==='blocked');
  assert.equal(await second.evaluate(()=>saveState()),false);
  await first.evaluate(()=>{gameState.playerName='Real browser writer';saveState();});
  await second.locator('#tab-guard-status').waitFor();
  await first.close();
  assert.equal(await second.evaluate(()=>initializeTabProtection()),true);
  assert.equal(await second.evaluate(()=>saveState()),false);
  second.once('dialog',dialog=>dialog.accept());
  assert.equal(await second.evaluate(()=>reloadSharedProgress()),true);
  assert.equal(await second.evaluate(()=>gameState.playerName),'Real browser writer');
  assert.equal(await second.evaluate(()=>saveState()),true);
  await second.evaluate(()=>openActQuest('act1'));
  await second.getByRole('button',{name:/کارگاه مستقل و شواهد یادگیری/}).click();
  await second.locator('#learning-answer-0').fill('heiße');
  await second.locator('#learning-answer-0').locator('..').getByRole('button',{name:'بررسی',exact:true}).click();
  assert((await second.locator('#learning-feedback-0').textContent()).includes('پاسخ هدف درست'));
  assert.equal(await second.evaluate(()=>GRAMMAR_CLINIC.length),26);
  await second.evaluate(()=>{setQuestStep('reading');answerReading(GAME_DATA.reading.act1.questions[0].ans);switchTab('map');});
  await second.waitForTimeout(1900);
  assert.equal(await second.evaluate(()=>getReadingState('act1').qIdx),1);
  await second.evaluate(()=>switchTab('library'));
  await second.locator('#library-reader').waitFor({state:'attached'});
  await second.evaluate(()=>openLibraryText(22));
  assert((await second.locator('#library-reader').textContent()).includes('Kurs-E-Mail'));
  // Render every shipped act/step/skills tab and each main/arena view in Chromium.
  const visited=await second.evaluate(()=>{
    gameState.unlockedActs=GAME_DATA.acts.map(act=>act.id);let count=0;
    for(const act of GAME_DATA.acts) {
      openActQuest(act.id);
      for(const step of ['phonetics','vocab','grammar','dialogue','skills','reading','boss','learning']) {setQuestStep(step);count++;}
      setQuestStep('skills');
      for(const tab of ['buchstabieren','zahlen','diktat','horen','schreiben','sprechen']) {setSkillsTab(tab);count++;}
    }
    for(const tab of ['map','arena','srs','grammar','dict','test','library','plan','exam','companion','studio']) {switchTab(tab);count++;}
    switchTab('arena');for(const game of ['slasher','puzzle','duell']) {switchArenaGame(game);count++;}
    switchTab('map');return count;
  });
  assert.equal(visited,126);
  await second.evaluate(()=>switchTab('plan'));
  await second.locator('#coach-name').fill('Nora');
  await second.locator('#coach-minutes').selectOption('20');
  await second.locator('#coach-profile button[type="submit"]').click();
  assert.equal(await second.locator('.coach-day').count(),7);
  await second.evaluate(()=>setCoachView(28));
  assert.equal(await second.locator('.coach-day').count(),28);
  await second.keyboard.press('Control+k');
  await second.waitForFunction(()=>document.getElementById('app-navigator').open);
  await second.locator('#destination-search').fill('SRS');
  assert.equal(await second.locator('#destination-results button').count(),1);
  await second.locator('#destination-results button').click();
  assert.equal(await second.evaluate(()=>gameState.activeTab),'srs');
  assert.equal(await second.locator('.nav-tabs [data-tab="srs"]').getAttribute('aria-current'),'page');
  assert.equal(await second.evaluate(()=>document.activeElement.id),'main-view-container');
  await second.locator('#app-focus').click();await second.locator('#app-large').click();
  assert.equal(await second.locator('#app-focus').getAttribute('aria-pressed'),'true');
  await second.keyboard.press('Control+k');
  await second.locator('#destination-search').fill('NO SUCH DESTINATION');
  assert.equal(await second.locator('#destination-results button').count(),0);
  await second.keyboard.press('Escape');
  assert.equal(await second.locator('#app-navigator').evaluate(el=>el.open),false);
  await second.evaluate(()=>{
    openCompanionUnit('companion-13');
    answerCompanion('companion-13',0,COMPANION_UNITS[12].questions[0].answer);
    document.getElementById('companion-draft').value='Am Samstag habe ich gekocht.';
    document.getElementById('companion-save-draft').click();
  });
  assert.equal(await second.locator('#companion-draft').inputValue(),'Am Samstag habe ich gekocht.');
  await second.evaluate(()=>{
    startStudioSession();
    document.getElementById('studio-reflection').value='Morgen übe ich ohne Hilfe.';
    document.getElementById('studio-save').click();
  });
  // Actual Service Worker, cache installation, offline navigation and external JS loading.
  await second.evaluate(()=>navigator.serviceWorker.ready);
  // ready may resolve after activation has claimed existing clients; navigation
  // deterministically attaches this page to the active worker.
  await second.reload({waitUntil:"domcontentloaded"});
  await second.waitForFunction(()=>!!navigator.serviceWorker.controller);
  await context.setOffline(true);
  await second.reload({waitUntil:'domcontentloaded'});
  await second.waitForFunction(()=>typeof gameState!=='undefined' && gameState.playerName==='Nora' && typeof queueAnswerReview==='function');
  await second.evaluate(()=>openCompanionUnit('companion-13'));
  assert.equal(await second.locator('#companion-draft').inputValue(),'Am Samstag habe ich gekocht.');
  assert.equal(await second.evaluate(()=>document.body.classList.contains('app-focus')&&document.body.classList.contains('app-large')),true);
  await second.evaluate(()=>switchTab('studio'));
  assert.equal(await second.locator('#studio-reflection').inputValue(),'Morgen übe ich ohne Hilfe.');
  assert.equal(await second.locator('.studio-hero').evaluate(el=>getComputedStyle(el).display),'flex');
  await second.evaluate(()=>switchTab('plan'));
  assert.equal(await second.locator('#coach-name').inputValue(),'Nora');
  assert.equal(await second.locator('#coach-minutes').inputValue(),'20');
  await context.setOffline(false);
  assert.equal(await second.evaluate(()=>tabWriteAccess),'writer');
  // A narrow mobile viewport is a browser check, not a claim about physical phones.
  const mobile=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  const phone=await mobile.newPage();phone.on('pageerror',e=>errors.push(e.message));
  await phone.goto(origin);await phone.waitForFunction(()=>typeof gameState!=='undefined' && Object.keys(gameState.srsCards).length===20);
  await phone.evaluate(()=>{openActQuest('act1');setQuestStep('learning');});
  const layout=await phone.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth}));
  assert(layout.scroll<=layout.width+1,`Mobile overflow: ${JSON.stringify(layout)}`);
  await phone.evaluate(()=>switchTab('studio'));
  const studioLayout=await phone.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth}));
  assert(studioLayout.scroll<=studioLayout.width+1,`Studio mobile overflow: ${JSON.stringify(studioLayout)}`);
  // Direct file mode remains supported, without claiming Service Worker availability there.
  const direct=await browser.newContext(),filePage=await direct.newPage();filePage.on('pageerror',e=>errors.push(e.message));
  await filePage.goto('file://'+path.join(root,'index.html'));
  await filePage.waitForFunction(()=>typeof gameState!=='undefined' && Object.keys(gameState.srsCards).length===20);
  assert.equal(await filePage.evaluate(()=>location.protocol),'file:');
  assert.deepEqual(errors,[]);
  console.log('PASS real Chromium: startup, exclusive writer/handoff, workshop, reading timer exit, library, real Service Worker offline reload, mobile-width layout and direct file mode.');
 } finally {
  if(browser) await browser.close();
  await new Promise(resolve=>server.close(resolve));
 }
})().catch(error=>{console.error(error);process.exitCode=1;});
