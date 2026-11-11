const {JSDOM,VirtualConsole}=require('jsdom');
const {readFileSync}=require('node:fs');
const assert=require('node:assert/strict');
const html=readFileSync('index.html','utf8').replace(/<script src="([^"]+)"><\/script>/g,(_,p)=>`<script>${readFileSync(p,'utf8')}</script>`);
const timers=[],errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));
(async()=>{
 const dom=new JSDOM(html,{url:'http://localhost/',runScripts:'dangerously',virtualConsole:vc,beforeParse(w){w.setTimeout=(fn,delay)=>{timers.push({fn,delay});return timers.length;};w.clearTimeout=()=>{};w.scrollTo=()=>{};}});
 await new Promise(resolve=>dom.window.addEventListener('load',resolve,{once:true}));const w=dom.window,d=w.document;
 try {
  const run=code=>w.eval(code),xp=()=>run('gameState.daily.xp');
  w.openActQuest('act1');w.setQuestStep('skills');
  const letter=w.GAME_DATA.buchstabieren[0].letter;
  w.answerBuchstabieren(letter,'forged',null);w.answerBuchstabieren(letter,letter,null);
  assert.equal(run('buchstabState.total'),1);assert.equal(run('buchstabState.score'),1);
  w.setSkillsTab('zahlen');const number=w.GAME_DATA.numbers[0].n;
  w.answerZahlen(number,-999,null);w.answerZahlen(number,number,null);
  assert.equal(run('numbersState.total'),1);
  w.setSkillsTab('diktat');const dictation=w.GAME_DATA.dictation[0].de;
  d.getElementById('diktat-input').value=dictation;const before=xp();w.checkDiktat();w.checkDiktat();
  assert.equal(xp(),before+15);assert.equal(run('dictationState.total'),1);
  w.nextDiktat();w.showDiktatHint();d.getElementById('diktat-input').value=w.GAME_DATA.dictation[1].de;
  const hinted=xp();w.checkDiktat();assert.equal(xp(),hinted);
  w.setSkillsTab('horen');const selected=run('horenMcState.options.findIndex(o=>o.ok)');
  w.answerHoren(selected,d.getElementById('horen-opt-'+selected));w.answerHoren(selected,d.getElementById('horen-opt-'+selected));
  assert.equal(run('horenMcState.total'),1);
  w.nextHoren();assert.equal(run('horenMcState.locked'),false);
  // Slasher: one submission per rendered round; stale callback cannot change another game.
  w.switchTab('arena');const article=run('gameState.slasher.currentNoun.art');
  const originalScore=run('gameState.slasher.score');w.submitSlasherArticle(article);const earned=xp();
  w.submitSlasherArticle(article);assert.equal(xp(),earned);assert.equal(run('gameState.slasher.score'),originalScore+10);
  const stale=timers.filter(t=>t.delay===1400).at(-1).fn;
  w.switchArenaGame('duell');stale();assert.equal(run('currentArenaGame'),'duell');
  const correct=w.GAME_DATA.minimalPairs[0].correct;
  w.submitDuellAnswer(correct);const duelIndex=run('gameState.duell.currentIdx'),duelXp=xp();
  w.submitDuellAnswer(correct);assert.equal(run('gameState.duell.currentIdx'),duelIndex);assert.equal(xp(),duelXp);
  const late=timers.filter(t=>t.delay===2200).at(-1).fn;w.switchTab('map');late();
  assert.equal(run('gameState.activeTab'),'map');
  w.switchTab('arena');w.switchArenaGame('puzzle');
  run('gameState.puzzle.placedTokens=[...GAME_DATA.puzzles[0].tokens];gameState.puzzle.remainingTokens=[]');
  w.checkPuzzleAnswer();const puzzleIndex=run('gameState.puzzle.currentIdx'),puzzleXp=xp();
  w.checkPuzzleAnswer();assert.equal(xp(),puzzleXp);assert.equal(run('gameState.puzzle.currentIdx'),puzzleIndex);
  const afterPuzzle=timers.filter(t=>t.delay===2000).at(-1).fn;
  w.replaceProgress({level:1,playerName:'New save'});afterPuzzle();assert.equal(run('gameState.puzzle.currentIdx'),0);
  assert.deepEqual(errors,[]);
  console.log('PASS: letters/numbers render, first-attempt counters, trusted answer keys, dictation hint/retry protection, listening unlock, arena submission locks, reward caps and stale game callbacks.');
 } finally {dom.window.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
