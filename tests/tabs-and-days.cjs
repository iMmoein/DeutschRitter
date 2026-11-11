const {JSDOM,VirtualConsole}=require('jsdom');
const {readFileSync}=require('node:fs');
const assert=require('node:assert/strict');
const html=readFileSync('index.html','utf8').replace(/<script src="([^"]+)"><\/script>/g,(_,p)=>`<script>${readFileSync(p,'utf8')}</script>`);
const key='deutsch_ritter_v3_save',doms=[],errors=[];
const tick=()=>new Promise(resolve=>setImmediate(resolve));
function lockManager(){
 const held=new Set();return {request(name,options,callback){
  if(held.has(name)) return Promise.resolve().then(()=>callback(null));
  held.add(name);return Promise.resolve().then(()=>callback({name})).finally(()=>held.delete(name));
 }};
}
async function openTab(store,locks,clock={now:Date.parse('2026-11-10T12:00:00Z')}) {
 const vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));
 let window;
 const dom=new JSDOM(html,{url:'https://deutschritter.test/',runScripts:'dangerously',virtualConsole:vc,beforeParse(w){
  window=w;const NativeDate=w.Date;
  w.Date=class extends NativeDate {constructor(...args){super(...(args.length?args:[clock.now]));}static now(){return clock.now;}};
  Object.defineProperty(w,'localStorage',{value:{
   getItem:k=>store.get(k)??null,
   setItem(k,v){const old=store.get(k)??null;store.set(k,String(v));
    for(const other of doms) if(other.window!==w) queueMicrotask(()=>{if(!other.window.closed)other.window.dispatchEvent(new other.window.StorageEvent('storage',{key:k,oldValue:old,newValue:String(v)}));});},
   removeItem(k){store.delete(k);}
  }});
  if(locks)Object.defineProperty(w.navigator,'locks',{value:locks});
  w.confirm=()=>true;w.scrollTo=()=>{};
 }});
 doms.push(dom);
 await new Promise(resolve=>window.addEventListener('load',resolve,{once:true}));await tick();
 return window;
}
(async()=>{
 try {
  const store=new Map(),locks=lockManager();
  const a=await openTab(store,locks),b=await openTab(store,locks);
  assert.equal(a.eval('tabWriteAccess'),'writer');assert.equal(b.eval('tabWriteAccess'),'blocked');
  b.eval('gameState.playerName="Unsaved secondary tab"');const prior=store.get(key);
  assert.equal(b.saveState(),false);assert.equal(store.get(key),prior);
  a.eval('gameState.playerName="Writer progress"');assert.equal(a.saveState(),true);await tick();
  assert(b.document.getElementById('tab-guard-status'));
  assert.throws(()=>b.replaceProgress({level:9,playerName:'Blocked import'}));
  assert.equal(JSON.parse(store.get(key)).playerName,'Writer progress');
  // A secondary tab can export its own state, not the other tab's state.
  assert.equal(b.createSaveSnapshot().playerName,'Unsaved secondary tab');
  a.dispatchEvent(new a.Event('pagehide'));await tick();
  assert.equal(await b.initializeTabProtection(),true);
  assert.equal(b.saveState(),false); // Access alone must not overwrite a newer primary.
  assert.equal(b.reloadSharedProgress(),true);
  assert.equal(b.eval('gameState.playerName'),'Writer progress');
  b.eval('gameState.playerName="New writer"');assert.equal(b.saveState(),true);
  assert.equal(a.saveState(),false);assert.equal(JSON.parse(store.get(key)).playerName,'New writer');
  // No Web Locks: stale-snapshot guard is still exercised, including missed storage events.
  const fallback=new Map(),c=await openTab(fallback),d=await openTab(fallback);
  c.eval('gameState.gold=777');assert.equal(c.saveState(),true);
  d.eval('gameState.gold=1');assert.equal(d.saveState(),false);
  const backupBefore=fallback.get(key+'_recovery_point');
  assert.equal(d.restoreBackup(),false);assert.equal(fallback.get(key+'_recovery_point'),backupBefore);
  assert.equal(JSON.parse(fallback.get(key)).gold,777);
  assert.equal(d.reloadSharedProgress(),true);assert.equal(d.saveState(),true);
  fallback.delete(key); // A cleared primary must not resurrect this tab's old state.
  assert.equal(d.saveState(),false);
  assert.equal(d.reloadSharedProgress(),true);
  assert.equal(d.eval('gameState.gold'),50);
  assert.equal(d.eval('gameState.playerName'),'قهرمان زبان‌آموز');
  // Day rollover reopens grammar attempts without a page reload and preserves one reward per day.
  const clock={now:Date.parse('2026-11-10T12:00:00Z')},e=await openTab(new Map(),null,clock);
  e.openActQuest('act1');e.setQuestStep('grammar');
  const answer=e.GAME_DATA.grammarPractice.act1[0].ans;
  e.answerGrammarPractice('act1',0,answer);const xp=e.eval('gameState.xp');
  e.answerGrammarPractice('act1',0,answer);assert.equal(e.eval('gameState.xp'),xp);
  clock.now+=86400000;e.answerGrammarPractice('act1',0,answer);
  assert.equal(e.eval('gameState.xp'),xp+10);assert.equal(e.eval('gameState.daily.xp'),10);
  e.answerGrammarPractice('act1',0,answer);assert.equal(e.eval('gameState.xp'),xp+10);
  // Reloading a shared save invalidates active timers and speech callbacks from the old state.
  e.eval('examSim.active=true;learningAudioPlayed.add("act1");activeTransfer={act:"act1"}');
  assert.equal(e.loadSave(),true);
  assert.equal(e.eval('examSim.active'),false);assert.equal(e.eval('learningAudioPlayed.size'),0);assert.equal(e.eval('activeTransfer'),null);
  assert.deepEqual(errors,[]);
  console.log('PASS: single writer/handoff, read-only export, stale-save rejection, import/restore guards, fallback conflict detection, midnight grammar retry and transient-state reset.');
 } finally {
  for(const dom of doms){dom.window.dispatchEvent(new dom.window.Event('pagehide'));dom.window.close();}
 }
})().catch(error=>{console.error(error);process.exitCode=1;});
