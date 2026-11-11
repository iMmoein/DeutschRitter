const {JSDOM,VirtualConsole}=require('jsdom');
const fs=require('node:fs'),assert=require('node:assert/strict');
const html=fs.readFileSync('index.html','utf8').replace(/<script src="([^"]+)"><\/script>/g,(_,p)=>`<script>${fs.readFileSync(p,'utf8')}</script>`);
(async()=>{
 const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));
 const dom=new JSDOM(html,{url:'http://localhost/',runScripts:'dangerously',virtualConsole:vc,beforeParse(w){w.scrollTo=()=>{};}});
 await new Promise(resolve=>dom.window.addEventListener('load',resolve,{once:true}));const w=dom.window,d=w.document,run=code=>w.eval(code);
 try{
  w.switchTab('studio');assert(d.querySelector('.studio-hero'));assert.equal(w.studioRecommendation().act.id,'act1');
  run('gameState.unlockedActs=["act1","act2"];gameState.transferEvidence=[{act:"act2",variant:"A",results:[false,true,false],assisted:true,at:Date.now()}]');
  assert.equal(w.studioRecommendation().act.id,'act1');
  run('gameState.transferEvidence[0].assisted=false');assert.equal(w.studioRecommendation().act.id,'act2');
  w.startStudioSession();const session=w.studioSession();assert.equal(session.act,'act2');
  const start=session.startedAt;w.startStudioSession();assert.equal(w.studioSession().startedAt,start);
  const xp=run('gameState.xp');
  for(const step of ['recall','produce','transfer','forged'])w.completeStudioStep(step);
  assert.equal(session.done.length,0);
  run('gameState.stats.reviews++');w.completeStudioStep('recall');w.completeStudioStep('recall');assert.equal(session.done.length,1);
  run('gameState.learningDrafts={act2:"Heute schreibe ich selbst."}');w.completeStudioStep('produce');assert.equal(session.done.length,2);
  run('gameState.transferEvidence.push({act:"act2",variant:"B",results:[true,true,false],assisted:true,at:Date.now()})');w.completeStudioStep('transfer');assert.equal(session.done.length,2);
  run('gameState.transferEvidence.push({act:"act2",variant:"B",results:[true,true,false],assisted:false,at:Date.now()})');w.completeStudioStep('transfer');assert.equal(session.done.length,3);assert.equal(run('gameState.xp'),xp);
  const note=d.getElementById('studio-reflection');note.value='<img src=x onerror=alert(1)> Nicht kopieren.';d.getElementById('studio-save').click();
  const snapshot=run('createSaveSnapshot()');w.replaceProgress(snapshot);w.switchTab('studio');assert(d.getElementById('studio-reflection').value.startsWith('<img'));assert.equal(d.querySelectorAll('.studio-shell img').length,0);
  assert.equal(w.studioSession().done.length,3);
  const bad=JSON.parse(JSON.stringify(snapshot));bad.studioSession.done=['forged'];assert.throws(()=>w.validateSave(bad));
  bad.studioSession.done=[];bad.studioSession.reflection='x'.repeat(1501);assert.throws(()=>w.validateSave(bad));
  w.openStudioStep('produce');assert.equal(run('gameState.currentActId'),'act2');assert.equal(run('gameState.currentQuestStep'),'learning');
  run('gameState.studioSession.day="old day"');assert.equal(w.studioSession(),null);w.startStudioSession();assert.equal(w.studioSession().done.length,0);
  assert.deepEqual(errors,[]);console.log('PASS studio: transparent recommendation, assisted-evidence exclusion, stable daily plan, evidence-gated steps, no extra XP, safe reflection, persistence, limits, navigation and daily reset.');
 }finally{dom.window.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
