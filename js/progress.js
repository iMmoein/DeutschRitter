/* Isolated reading sessions, shared daily SRS budget, and durable reward ledger. */
const readingSessions = new Map();
let readingTimer = null;
let readingGeneration = 0;
function getReadingState(actId) {
  if (!readingSessions.has(actId)) readingSessions.set(actId, {...((gameState.readingProgress || {})[actId] || {qIdx:0,score:0}),locked:false});
  return readingSessions.get(actId);
}
function cancelReadingTransition() {
  if (readingTimer !== null) clearTimeout(readingTimer);
  readingTimer=null; readingGeneration++;
  for(const state of readingSessions.values()) state.locked=false;
}
function persistReadingState(actId, state) {
  gameState.readingProgress=gameState.readingProgress || {};
  gameState.readingProgress[actId]={qIdx:state.qIdx,score:state.score};
  saveState();
}
function answerReading(index) {
  const actId=gameState.currentActId;
  if(gameState.activeTab!=='quest' || gameState.currentQuestStep!=='reading') return;
  const state=getReadingState(actId), question=window.GAME_DATA.reading[actId]?.questions[state.qIdx];
  if(!question||state.locked||!Number.isInteger(index)||index<0||index>=question.options.length) return;
  const feedback=document.getElementById('reading-feedback');
  if(!feedback) return;
  const answeredIndex=state.qIdx;
  state.locked=true;
  const correct=index===question.ans;
  if(correct) {state.score++;rewardOnce(`reading:${actId}:${answeredIndex}`,10);sounds.playCorrect();} else sounds.playWrong();
  document.querySelectorAll('#quest-step-content .opt-btn').forEach((button,i)=>{
    button.disabled=true;
    if(i===question.ans) button.classList.add('correct');
    else if(i===index) button.classList.add('wrong');
  });
  feedback.textContent=(correct?'✅ ':'❌ ')+(question.explain || '');
  // Commit advancement now; leaving the page must not make a correct answer count twice.
  state.qIdx++;
  persistReadingState(actId,state);
  const generation=++readingGeneration;
  readingTimer=setTimeout(()=>{
    if(generation!==readingGeneration || readingSessions.get(actId)!==state) return;
    readingTimer=null;state.locked=false;
    if(gameState.activeTab==='quest' && gameState.currentActId===actId && gameState.currentQuestStep==='reading') renderActiveView();
  },1800);
}
function resetReading() {
  cancelReadingTransition();
  const actId=gameState.currentActId;
  readingSessions.set(actId,{qIdx:0,score:0,locked:false});
  persistReadingState(actId,getReadingState(actId));
  renderActiveView();
}
// Remains in memory if storage fails; included in the same save snapshot as XP.
const sessionRewardKeys = new Set();
function rewardOnce(key, amount) {
  if(typeof key!=='string'||!Number.isInteger(amount)||amount<=0) return 0;
  const day=todayStr(), sessionKey=day+':'+key;
  if(!gameState.rewardLedger || gameState.rewardLedger.day!==day) gameState.rewardLedger={day,keys:[]};
  if(sessionRewardKeys.has(sessionKey)||gameState.rewardLedger.keys.includes(key)) return 0;
  // Migrate the old separate ledger when available; storage denial must not disable the memory guard.
  try {
    const legacy=JSON.parse(localStorage.getItem('deutschritter-rewards')||'null');
    if(legacy?.day===day && Array.isArray(legacy.keys) && legacy.keys.includes(key)) {
      sessionRewardKeys.add(sessionKey);gameState.rewardLedger.keys.push(key);return 0;
    }
  } catch(_) {}
  sessionRewardKeys.add(sessionKey);
  gameState.rewardLedger.keys.push(key);
  addXp(amount);
  return amount;
}
function fillSrsDailyQueue(actId) {
  const today=todayStr(), cards=gameState.srsCards;
  let budget=Math.max(0,20-Object.values(cards).filter(c=>c.created && new Date(c.created).toDateString()===today).length);
  const ids=[...new Set([actId,...gameState.unlockedActs])];
  const vocab=ids.flatMap(id=>window.GAME_DATA.acts.find(a=>a.id===id)?.vocab || []);
  const vocabByKey=new Map(vocab.map(w=>[w.de,w]));
  const groups=[
    [...vocabByKey.values()].map(w=>[w.de,{de:w.de,plural:w.plural||w.pl||'',gender:w.gender,fa:w.fa,ex:w.ex,kind:'vocab'}]),
    (window.GAME_DATA.grammarSrs||[]).map((g,i)=>['G:'+(g.id||'grammar-'+i),{de:g.front,plural:'',gender:'',fa:g.back,ex:g.fa,kind:'grammar'}]),
    (window.GAME_DATA.listeningSrs||[]).map((l,i)=>['L:'+(l.id||'listening-'+i),{de:l.de,plural:'',gender:'',fa:l.fa,ex:'',kind:'listening'}])
  ].map(group=>group.filter(([key])=>!Object.hasOwn(cards,key)));
  // 2 vocabulary, 1 grammar, 1 listening, with unused shares redistributed.
  const pattern=[0,1,0,2];let cursor=0;
  while(budget>0 && groups.some(group=>group.length)) {
    const group=groups[pattern[cursor++ % pattern.length]];
    if(!group.length) continue;
    const [key,card]=group.shift();
    cards[key]={...card,box:1,nextReview:Date.now(),created:Date.now()};budget--;
  }
  return groups.reduce((sum,group)=>sum+group.length,0);
}
function setPlanDay(day, completed) {
  if(!Number.isInteger(day)||day<1||day>90||typeof completed!=='boolean') return;
  gameState.planProgress=gameState.planProgress || {};
  if(completed) gameState.planProgress[day]={at:Date.now()}; else delete gameState.planProgress[day];
  if(!saveState()) showToast('ثبت روز فقط در این جلسه انجام شد؛ ذخیره مرورگر ناموفق است.');
}
