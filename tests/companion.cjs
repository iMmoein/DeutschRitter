const {JSDOM,VirtualConsole}=require('jsdom');
const fs=require('node:fs'),assert=require('node:assert/strict');
const html=fs.readFileSync('index.html','utf8').replace(/<script src="([^"]+)"><\/script>/g,(_,p)=>`<script>${fs.readFileSync(p,'utf8')}</script>`);
(async()=>{
 const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));
 const dom=new JSDOM(html,{url:'http://localhost/',runScripts:'dangerously',virtualConsole:vc,beforeParse(w){w.scrollTo=()=>{};}});
 await new Promise(resolve=>dom.window.addEventListener('load',resolve,{once:true}));const w=dom.window,d=w.document,run=code=>w.eval(code);
 try{
  assert.equal(w.COMPANION_UNITS.length,24);assert.equal(w.COMPANION_UNITS.filter(u=>u.level==='A1').length,12);assert.equal(w.COMPANION_UNITS.filter(u=>u.level==='A2').length,12);
  assert.equal(new Set(w.COMPANION_UNITS.map(u=>u.id)).size,24);
  for(const unit of w.COMPANION_UNITS){
   assert(unit.rule&&unit.reading&&unit.writing&&unit.speaking);
   w.openCompanionUnit(unit.id);assert(d.getElementById('companion-lesson').textContent.includes(unit.title));
   assert.equal(d.querySelectorAll('#companion-units button').length,12);
   const start=run('gameState.daily.xp');
   w.answerCompanion(unit.id,0,unit.questions[0].answer);w.answerCompanion(unit.id,0,unit.questions[0].answer);
   assert.equal(run('gameState.daily.xp'),start+10);
   w.answerCompanion(unit.id,1,1-unit.questions[1].answer);w.answerCompanion(unit.id,1,unit.questions[1].answer);
   assert.equal(run('gameState.daily.xp'),start+10);assert.equal(run(`gameState.companionProgress['${unit.id}'].answers['1'].firstCorrect`),false);
   w.answerCompanion(unit.id,2,unit.gap.answers[0]);assert.equal(run('gameState.daily.xp'),start+20);
   const draft=d.getElementById('companion-draft');draft.value='<img src=x onerror=alert(1)> Mein Text.';d.getElementById('companion-save-draft').click();
   const checkbox=d.getElementById('companion-speaking');checkbox.checked=true;checkbox.dispatchEvent(new w.Event('change'));
   assert.equal(run(`gameState.companionProgress['${unit.id}'].speakingReviewed`),true);
  }
  const snapshot=JSON.parse(JSON.stringify(run('createSaveSnapshot()')));assert.equal(Object.keys(snapshot.companionProgress).length,24);
  w.replaceProgress(snapshot);w.openCompanionUnit('companion-01');assert(d.getElementById('companion-draft').value.startsWith('<img'));assert.equal(d.querySelectorAll('#companion-lesson img').length,0);
  const xp=run('gameState.daily.xp');w.answerCompanion('companion-01',0,999);w.answerCompanion('companion-02',0,0);w.answerCompanion('companion-01',2,'x'.repeat(301));assert.equal(run('gameState.daily.xp'),xp);
  w.switchTab('map');w.answerCompanion('companion-01',0,0);assert.equal(run('gameState.daily.xp'),xp);
  for(const bad of [ {...snapshot,companionProgress:{'__bad':{}}}, {...snapshot,companionProgress:{'companion-01':{answers:{},draft:'x'.repeat(2001),speakingReviewed:false}}}, {...snapshot,companionProgress:{'companion-01':{answers:{'__proto__':{},'4':{}},draft:'',speakingReviewed:false}}}])assert.throws(()=>w.validateSave(bad));
  assert.deepEqual(errors,[]);console.log('PASS companion: 24 authored A1/A2 units, render/answer paths, first-attempt rewards, bounded drafts, safe output, self-review, persistence roundtrip and invalid-input guards.');
 }finally{dom.window.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
