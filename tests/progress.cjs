const {JSDOM,VirtualConsole}=require('jsdom');
const {readFileSync}=require('node:fs');
const assert=require('node:assert/strict');
const html=readFileSync('index.html','utf8').replace(/<script src="([^"]+)"><\/script>/g,(_,p)=>`<script>${readFileSync(p,'utf8')}</script>`);
const timers=new Map(),errors=[];let timerId=0;
const vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));
(async()=>{
 const dom=new JSDOM(html,{url:'http://localhost/',runScripts:'dangerously',virtualConsole:vc,beforeParse(w){
  w.setTimeout=(fn,delay)=>{timers.set(++timerId,{fn,delay});return timerId;};w.clearTimeout=id=>timers.delete(id);w.scrollTo=()=>{};
 }});
 await new Promise(resolve=>dom.window.addEventListener('load',resolve,{once:true}));
 const w=dom.window,d=w.document,key='deutsch_ritter_v3_save';
 try {
  const run=code=>w.eval(code);
  // Shared daily limit: repeated calls, other acts and reload cannot add beyond 20.
  assert.equal(run('Object.keys(gameState.srsCards).length'),20);
  assert.equal(run('Object.values(gameState.srsCards).filter(c=>c.kind==="vocab").length'),10);
  assert.equal(run('Object.values(gameState.srsCards).filter(c=>c.kind==="grammar").length'),5);
  run('gameState.unlockedActs=window.GAME_DATA.acts.map(a=>a.id);addActWordsToSrs("act2");addActWordsToSrs("act1")');
  assert.equal(run('Object.keys(gameState.srsCards).length'),20);
  w.loadSave();w.addActWordsToSrs('act1');assert.equal(run('Object.keys(gameState.srsCards).length'),20);
  for(let day=0;day<5;day++) {
   run('Object.values(gameState.srsCards).forEach(c=>c.created-=86400000);addActWordsToSrs("act1")');
   assert.equal(run('Object.values(gameState.srsCards).filter(c=>new Date(c.created).toDateString()===todayStr()).length'),20);
  }
  assert.equal(run('Object.keys(gameState.srsCards).filter(k=>k.startsWith("G:")).length'),20);
  assert.equal(run('Object.keys(gameState.srsCards).filter(k=>k.startsWith("L:")).length'),24);
  // Opening acts exercises the real UI path (including boss question generation).
  w.openActQuest('act1');w.setQuestStep('reading');
  const q=w.GAME_DATA.reading.act1.questions[0],xp=run('gameState.daily.xp');
  w.answerReading(-1);assert.equal(w.getReadingState('act1').qIdx,0);
  w.answerReading(q.ans);w.answerReading(q.ans);
  assert.equal(w.getReadingState('act1').score,1);
  assert.equal(run('gameState.daily.xp'),xp+10);
  const stale=[...timers.values()].find(t=>t.delay===1800).fn;
  w.openActQuest('act2');w.setQuestStep('reading');stale();
  assert.equal(w.getReadingState('act2').qIdx,0);
  assert.equal(w.getReadingState('act1').qIdx,1);
  w.openActQuest('act1');w.setQuestStep('reading');
  assert(d.getElementById('quest-step-content').textContent.includes('سوال 2'));
  w.resetReading();w.answerReading(q.ans);
  assert.equal(run('gameState.daily.xp'),xp+10); // Replay is practice, not a new reward.
  const staleAfterReset=[...timers.values()].filter(t=>t.delay===1800).at(-1).fn;
  w.resetReading();staleAfterReset();assert.equal(w.getReadingState('act1').qIdx,0);
  // Actual tab exit cancels pending callback but retains the committed answer.
  w.answerReading(q.ans);const staleAfterExit=[...timers.values()].filter(t=>t.delay===1800).at(-1).fn;
  w.switchTab('map');staleAfterExit();assert.equal(w.getReadingState('act1').qIdx,1);
  w.loadSave();assert.equal(w.getReadingState('act1').qIdx,1);
  // A failed ledger save cannot grant the same reward repeatedly within the session.
  const original=w.Storage.prototype.setItem;
  w.Storage.prototype.setItem=function(){throw new w.DOMException('full','QuotaExceededError');};
  const before=run('gameState.daily.xp');
  assert.equal(w.rewardOnce('quota-test',7),7);assert.equal(w.rewardOnce('quota-test',7),0);
  assert.equal(run('gameState.daily.xp'),before+7);
  w.Storage.prototype.setItem=original;assert.equal(w.saveState(),true);w.loadSave();
  assert.equal(w.rewardOnce('quota-test',7),0);
  assert(JSON.parse(w.localStorage.getItem(key)).rewardLedger.keys.includes('quota-test'));
  // Backup sources stay separate, including across repeated restores and autosaves.
  run('gameState.playerName="Before import";saveState()');
  w.replaceProgress({level:2,playerName:'Imported'});
  const preImport=w.localStorage.getItem(key+'_before_import');
  assert.equal(JSON.parse(preImport).playerName,'Before import');
  w.saveState();w.saveState();assert.equal(w.localStorage.getItem(key+'_before_import'),preImport);
  assert.equal(w.restoreBackup('before_import'),true);const fixed=w.localStorage.getItem(key+'_recovery_point');
  run('gameState.playerName="After recovery";saveState();saveState()');
  assert.equal(w.localStorage.getItem(key+'_recovery_point'),fixed);
  assert.equal(w.restoreBackup('recovery_point'),true);assert.equal(run('gameState.playerName'),'Before import');
  assert.equal(w.restoreBackup('recovery_point'),true);assert.equal(w.localStorage.getItem(key+'_recovery_point'),fixed);
  // A pending boss callback belongs to its original session, never an imported save.
  w.openActQuest('act1');
  run('gameState.bossExam.qList=[window.GAME_DATA.acts[0].bossQuestions[0]]');
  w.setQuestStep('boss');
  w.submitBossAnswer(w.GAME_DATA.acts[0].bossQuestions[0].ans);
  const staleBoss=[...timers.values()].filter(t=>t.delay===1800).at(-1).fn;
  w.replaceProgress({level:1,playerName:'New session'});
  const importedXp=run('gameState.xp');staleBoss();
  assert.equal(run('gameState.xp'),importedXp);assert.equal(run('gameState.completedActs.length'),0);
  // Invalid and inactive placement input cannot advance a question.
  w.startPlacementTest();const idx=run('gameState.placement.currentQIdx');
  for(const value of [-1,999,NaN,1.2,'0']) w.submitPlacementAnswer(value);
  assert.equal(run('gameState.placement.currentQIdx'),idx);
  run('gameState.placement.active=false');w.submitPlacementAnswer(0);assert.equal(run('gameState.placement.currentQIdx'),idx);
  // Plan day completion is independent of bosses, persistent and reversible.
  run('gameState.completedActs=["act1"];gameState.activeTab="plan";renderActiveView()');
  assert.equal(d.querySelectorAll('#main-view-container input:checked').length,0);
  w.setPlanDay(1,true);w.setPlanDay(90,true);w.setPlanDay(91,true);w.saveState();w.loadSave();
  assert.equal(run('Object.keys(gameState.planProgress).length'),2);
  w.setPlanDay(1,false);assert.equal(run('gameState.planProgress[1]'),undefined);
  assert.throws(()=>w.validateSave({level:1,readingProgress:{act1:{qIdx:1,score:2}}}));
  assert.throws(()=>w.validateSave({level:1,planProgress:{91:{at:1}}}));
  assert.deepEqual(errors,[]);
  console.log('PASS: shared SRS cap and backlog, real act navigation, isolated reading and stale timers, replay/failed-storage reward protection, persisted progress, independent backup sources, placement guards and per-day plan completion.');
 } finally {dom.window.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
