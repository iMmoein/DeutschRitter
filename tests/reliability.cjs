const {JSDOM,VirtualConsole}=require('jsdom');
const {readFileSync}=require('node:fs');
const assert=require('node:assert/strict');
const html=readFileSync('index.html','utf8').replace(/<script src="([^"]+)"><\/script>/g,(_,p)=>`<script>${readFileSync(p,'utf8')}</script>`);
const errors=[];const vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));
(async()=>{
 const dom=new JSDOM(html,{url:'http://localhost/',runScripts:'dangerously',virtualConsole:vc});
 await new Promise(resolve=>dom.window.addEventListener('load',resolve,{once:true}));
 const w=dom.window,d=w.document,key='deutsch_ritter_v3_save';
 try {
  // A malformed primary save is preserved and cannot be overwritten by initialization/autosave.
  w.saveState();w.saveState();
  const good=w.localStorage.getItem(key);
  w.localStorage.setItem(key,'{corrupt');
  assert.equal(w.loadSave(),false);assert.equal(w.saveState(),false);
  assert.equal(w.localStorage.getItem(key),'{corrupt');
  assert(d.getElementById('storage-status'));
  assert.equal(w.restoreBackup(),true);
  assert.equal(w.loadSave(),true);assert.equal(w.eval('storageWriteBlocked'),false);
  // Failed storage commit must leave live and persisted progress unchanged.
  const live=w.eval('JSON.stringify(gameState)'),stored=w.localStorage.getItem(key);
  const original=w.Storage.prototype.setItem;
  w.Storage.prototype.setItem=function(k,v){if(k===key) throw new w.DOMException('full','QuotaExceededError'); return original.call(this,k,v);};
  assert.throws(()=>w.replaceProgress({level:8,playerName:'New'}));
  assert.equal(w.eval('JSON.stringify(gameState)'),live);
  assert.equal(w.localStorage.getItem(key),stored);
  assert.equal(w.saveState(),false);
  w.Storage.prototype.setItem=original;
  assert.throws(()=>w.replaceProgress({level:1.5}));
  assert.throws(()=>w.replaceProgress({level:1,version:'future-unknown'}));
  // Replacement means replacement: omitted legacy fields come from defaults, not another learner.
  w.eval('gameState.learningDrafts={act1:"private draft"}');
  w.replaceProgress({level:2,playerName:'Legacy'});
  assert.equal(w.eval('gameState.learningDrafts?.act1'),undefined);
  assert.equal(w.eval('gameState.playerName'),'Legacy');
  // Held-out variants alternate; same-day retry cannot replace the first result.
  w.eval('gameState.activeTab="quest";gameState.currentActId="act1";gameState.currentQuestStep="learning";renderActiveView()');
  for (const variant of ['A','B','A']) {
   w.startTransfer('act1');assert.equal(w.eval('activeTransfer.variant'),variant);
   const answers=w.TRANSFER_UNITS.act1.find(v=>v.id===variant).items.map(q=>q.answers[0]);
   answers.forEach((a,i)=>d.getElementById('transfer-'+i).value=a);
   w.submitTransfer();w.submitTransfer();
  }
  assert.equal(w.eval('gameState.transferEvidence.length'),2);
  assert.equal(w.eval('gameState.transferEvidence[0].results.every(Boolean)'),true);
  w.saveState();w.loadSave();assert.equal(w.eval('gameState.transferEvidence.length'),2);
  // Capitalization is not silently normalized away; assisted listening is not independent evidence.
  assert.equal(w.matchesGermanTarget('ich wohne in Berlin','Ich wohne in Berlin'),false);
  assert.equal(w.matchesGermanTarget('Ich wohne in Berlin.','Ich wohne in Berlin'),true);
  w.eval('gameState.activeTab="quest";gameState.currentQuestStep="learning";renderActiveView()');
  w.SpeechSynthesisUtterance=function(text){this.text=text;};
  w.speechSynthesis={cancel(){},getVoices(){return [];},speak(utterance){if(utterance.onstart) utterance.onstart();}};
  w.playLearningListening('act1');
  const details=d.getElementById('learning-transcript');details.open=true;details.dispatchEvent(new w.Event('toggle'));
  w.submitLearningListening('act1',w.LEARNING_UNITS.act1.listening.answer);
  assert.equal(w.eval('gameState.learningEvidence.find(r=>r.task==="listening").kind'),'listening-assisted');
  assert.equal(w.learningEvidenceSummary('act1').recent,0);
  // Review ratings cannot be submitted before revealing the answer and history persists.
  w.eval('addActWordsToSrs("act1");gameState.activeTab="srs";renderActiveView()');
  const reviewsBefore=w.eval('gameState.stats.reviews');
  w.rateSrsCard('easy');assert.equal(w.eval('gameState.stats.reviews'),reviewsBefore);
  w.revealSrsCard();w.rateSrsCard('good');
  assert.equal(w.eval('gameState.reviewHistory.length'),1);
  // Writing feedback never manufactures a skill score from keyword stuffing.
  w.eval('gameState.activeTab="exam";startExamSim();examSim.section=2;renderExamView(document.getElementById("main-view-container"))');
  d.getElementById('exam-schreiben-text').value='Ich Und Aber Weil Dass '.repeat(20);
  w.answerExamSchreiben();assert.equal(w.eval('examSim.schreibenScore'),0);
  assert(d.getElementById('exam-schreiben-feedback').textContent.includes('نمرهٔ مهارت محاسبه نشده'));
  w.eval('examSim.deadline=Date.now()-1');
  w.answerExamSchreiben();assert.equal(w.eval('examSim.finished'),true);
  assert.equal(w.eval('examSim.schreibenScore'),0);
  // Shop ignores caller-controlled prices and unknown items.
  w.eval('gameState.gold=100;gameState.activeTab="map"');
  w.buyItem('heart',-999);assert.equal(w.eval('gameState.gold'),70);
  w.buyItem('__proto__',0);assert.equal(w.eval('gameState.gold'),70);
  assert.deepEqual(errors,[]);
  console.log('PASS: corrupt-save preservation, backup restoration, quota failure atomicity, legacy replacement, version/type boundaries, transfer retries, non-grading writing, expired exam and trusted shop prices.');
 } finally {dom.window.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
