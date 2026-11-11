const {JSDOM,VirtualConsole}=require('jsdom');
const {readFileSync}=require('node:fs');
const assert=require('node:assert/strict');
const html=readFileSync('index.html','utf8').replace(/<script src="([^"]+)"><\/script>/g,(_,p)=>`<script>${readFileSync(p,'utf8')}</script>`);
const errors=[],timers=new Map();let id=0;
const vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));
(async()=>{
 const dom=new JSDOM(html,{url:'http://localhost/',runScripts:'dangerously',virtualConsole:vc,beforeParse(w){w.setTimeout=(fn,delay)=>{timers.set(++id,{fn,delay});return id;};w.clearTimeout=id=>timers.delete(id);w.HTMLElement.prototype.scrollIntoView=()=>{};w.scrollTo=()=>{};}});
 await new Promise(resolve=>dom.window.addEventListener('load',resolve,{once:true}));
 const w=dom.window,d=w.document;
 try {
  assert.equal(w.GRAMMAR_CLINIC.length,26);
  assert.equal(w.GAME_DATA.readingLibrary.length,22); // 14 original + 8 practical documents
  assert.equal(w.GAME_DATA.grammarExtra.act3[0].title,'es gibt + Akkusativ (وجود دارد)');
  w.openActQuest('act1');w.setQuestStep('learning');
  for(const topic of w.GRAMMAR_CLINIC.filter(t=>t.act==='act1')) topic.exercises.forEach((q,i)=>{
   d.getElementById(topic.id+'-'+i).value=q.answers[0];w.checkClinic(topic.id,i);
   assert(d.getElementById(topic.id+'-'+i+'-feedback').textContent.startsWith('مطابق'));
  });
  // Valid alternate word order, review queue deduplication, escaping and persistence.
  d.getElementById('learning-answer-1').value='In Berlin wohne ich';w.submitLearningExercise('act1',1);
  assert(d.getElementById('learning-feedback-1').textContent.includes('پاسخ هدف درست'));
  const unsafe='<img src=x onerror=alert(1)>';
  w.queueAnswerReview('act1','example',unsafe,['Ich wohne hier.'],'Review request');
  w.queueAnswerReview('act1','example',unsafe,['Ich wohne hier.'],'Review request');
  assert.equal(w.eval('gameState.answerReviews.length'),1);
  const fragment=d.createElement('div');fragment.innerHTML=w.renderAnswerReviews('act1');assert.equal(fragment.querySelector('img'),null);
  w.saveState();w.loadSave();assert.equal(w.eval('gameState.answerReviews.length'),1);
  assert.throws(()=>w.validateSave({level:1,answerReviews:[{act:'act99'}]}));
  // Missing audio cannot become a successful listening observation.
  w.eval('gameState.activeTab="quest";gameState.currentQuestStep="learning";renderActiveView();learningAudioPlayed.clear()');
  w.playLearningListening('act1');
  assert.equal(w.eval('learningAudioPlayed.has("act1")'),false);
  assert(d.getElementById('audio-status').textContent.includes('ناموفق'));
  w.submitLearningListening('act1',w.LEARNING_UNITS.act1.listening.answer);
  assert.equal(w.eval('(gameState.learningEvidence||[]).filter(r=>r.task==="listening").length'),0);
  // Library double clicks and stale callbacks cannot inflate a new text's score.
  w.switchTab('library');w.openLibraryText(22);
  const first=w.currentLibraryText.questions[0];w.answerLibraryQuiz(first.ans);w.answerLibraryQuiz(first.ans);
  assert.equal(w.eval('libraryScore'),1);
  const stale=[...timers.values()].filter(t=>t.delay===1200).at(-1).fn;
  w.openLibraryText(23);stale();assert.equal(w.eval('libraryQIdx'),0);assert.equal(w.eval('libraryScore'),0);
  const text=w.currentLibraryText;
  text.questions.forEach(q=>{w.answerLibraryQuiz(q.ans);[...timers.values()].filter(t=>t.delay===1200).at(-1).fn();});
  const xp=w.eval('gameState.daily.xp');w.renderLibraryQuiz(text);w.renderLibraryQuiz(text);
  assert.equal(w.eval('gameState.daily.xp'),xp);
  assert.deepEqual(errors,[]);
  console.log('PASS: all-topic clinic, es-gibt correction, alternate answers, durable safe review queue, unavailable audio evidence, practical documents and library retry/timer/reward guards.');
 } finally {dom.window.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
