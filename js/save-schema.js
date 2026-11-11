/* Untrusted JSON is allowlisted, never merged directly into runtime state. */
function validateSave(input) {
  const object = v => v && typeof v === 'object' && !Array.isArray(v);
  const fail = () => { throw new Error('Invalid DeutschRitter save'); };
  if (!object(input) || !Object.hasOwn(input,'level')) fail();
  const safe = {};
  if (input.version && !['deutschritter-p2','deutschritter-v5','deutschritter-v6','deutschritter-v7'].includes(input.version)) fail();
  const number = (v,min,max) => { if (typeof v !== 'number' || !Number.isFinite(v) || v<min || v>max) fail(); return v; };
  const string = (v,max) => { if (typeof v !== 'string' || v.length>max) fail(); return v; };
  const actIds = window.GAME_DATA.acts.map(a=>a.id);
  for (const key of ['level','xp','xpNext','gold','hearts','streak']) {
    if (Object.hasOwn(input,key)) safe[key] = number(input[key], key==='level'||key==='xpNext'?1:0, 1e9);
  }
  if (Object.hasOwn(input,'playerName')) safe.playerName=string(input.playerName,100);
  if (Object.hasOwn(input,'heroClass')) {
    if (!['Krieger','Magier','Schütze'].includes(input.heroClass)) fail();
    safe.heroClass=input.heroClass;
  }
  for (const key of ['soundMuted','germanOnly']) if (Object.hasOwn(input,key)) {
    if (typeof input[key] !== 'boolean') fail(); safe[key]=input[key];
  }
  if (Object.hasOwn(input,'ttsSpeed')) safe.ttsSpeed=number(input.ttsSpeed,0.1,3);
  if (Object.hasOwn(input,'lastPlayDate')) safe.lastPlayDate=string(input.lastPlayDate,100);
  for (const key of ['unlockedActs','completedActs']) if (Object.hasOwn(input,key)) {
    if (!Array.isArray(input[key]) || input[key].some(id=>!actIds.includes(id))) fail();
    safe[key]=[...new Set(input[key])];
  }
  if (safe.unlockedActs && !safe.unlockedActs.includes('act1')) safe.unlockedActs.unshift('act1');
  if (Object.hasOwn(input,'daily')) {
    if (!object(input.daily)) fail();
    safe.daily={date:string(input.daily.date,100),xp:number(input.daily.xp,0,1e9),goal:number(input.daily.goal,1,1e6)};
  }
  if (Object.hasOwn(input,'stats')) {
    if (!object(input.stats)) fail();
    safe.stats={reviews:number(input.stats.reviews,0,1e9),correct:number(input.stats.correct,0,1e9)};
    if (safe.stats.correct>safe.stats.reviews) fail();
  }
  if (Object.hasOwn(input,'inventory')) {
    if (!object(input.inventory)) fail(); safe.inventory={};
    for (const key of ['hint','heart','xp']) if (Object.hasOwn(input.inventory,key)) safe.inventory[key]=number(input.inventory[key],0,1e6);
  }
  if (Object.hasOwn(input,'srsCards')) {
    if (!object(input.srsCards) || Object.keys(input.srsCards).length>10000) fail();
    safe.srsCards=Object.create(null);
    for (const [key,card] of Object.entries(input.srsCards)) {
      if (['__proto__','prototype','constructor'].includes(key) || key.length>500 || !object(card)) fail();
      const clean={};
      for (const field of ['de','fa','ex','plural','gender']) if (Object.hasOwn(card,field)) clean[field]=string(card[field],10000);
      if (!clean.de) fail();
      if (!['vocab','grammar','listening',undefined].includes(card.kind)) fail();
      clean.kind=card.kind || 'vocab';
      clean.box=number(card.box,1,5);
      if(!Number.isInteger(clean.box)) fail();
      clean.nextReview=number(card.nextReview,0,8640000000000000);
      if (Object.hasOwn(card,'created')) clean.created=number(card.created,0,8640000000000000);
      if (Object.hasOwn(card,'stability')) clean.stability=number(card.stability,1,36500);
      safe.srsCards[key]=clean;
    }
  }
  if (Object.hasOwn(input,'learningDrafts')) {
    if (!object(input.learningDrafts)) fail(); safe.learningDrafts={};
    for (const id of actIds) if (Object.hasOwn(input.learningDrafts,id)) safe.learningDrafts[id]=string(input.learningDrafts[id],5000);
  }
  if (Object.hasOwn(input,'learningEvidence')) {
    if (!Array.isArray(input.learningEvidence) || input.learningEvidence.length>2000) fail();
    safe.learningEvidence=input.learningEvidence.map(r=>{
      if (!object(r) || !actIds.includes(r.act) || !['exercise-0','exercise-1','exercise-2','listening'].includes(r.task) || typeof r.correct!=='boolean' || !['production','listening-practice','listening-assisted'].includes(r.kind)) fail();
      return {act:r.act,task:r.task,correct:r.correct,kind:r.kind,at:number(r.at,0,8640000000000000)};
    });
  }
  if (Object.hasOwn(input,'transferEvidence')) {
    if (!Array.isArray(input.transferEvidence) || input.transferEvidence.length>500) fail();
    safe.transferEvidence=input.transferEvidence.map(r=>{
      if(!object(r)||!actIds.includes(r.act)||!['A','B'].includes(r.variant)||typeof r.assisted!=='boolean'||!Array.isArray(r.results)||r.results.length!==3||r.results.some(b=>typeof b!=='boolean')) fail();
      return {act:r.act,variant:r.variant,assisted:r.assisted,results:[...r.results],at:number(r.at,0,8640000000000000)};
    });
  }
  if (Object.hasOwn(input,'reviewHistory')) {
    if(!Array.isArray(input.reviewHistory)||input.reviewHistory.length>2000) fail();
    safe.reviewHistory=input.reviewHistory.map(r=>{
      if(!object(r)||!['hard','good','easy'].includes(r.rating)) fail();
      return {key:string(r.key,500),rating:r.rating,at:number(r.at,0,8640000000000000),previousDue:number(r.previousDue,0,8640000000000000)};
    });
  }
  for (const key of ['level','xp','xpNext','gold','hearts','streak']) if (key in safe && !Number.isInteger(safe[key])) fail();
  if(Object.hasOwn(input,'readingProgress')) {
    if(!object(input.readingProgress)) fail();safe.readingProgress={};
    for(const [act,progress] of Object.entries(input.readingProgress)) {
      if(!actIds.includes(act)||!object(progress)) fail();
      const total=window.GAME_DATA.reading[act].questions.length;
      const qIdx=number(progress.qIdx,0,total),score=number(progress.score,0,qIdx);
      if(!Number.isInteger(qIdx)||!Number.isInteger(score)) fail();
      safe.readingProgress[act]={qIdx,score};
    }
  }
  if(Object.hasOwn(input,'rewardLedger')) {
    const ledger=input.rewardLedger;
    if(!object(ledger)||!Array.isArray(ledger.keys)||ledger.keys.length>10000) fail();
    safe.rewardLedger={day:string(ledger.day,100),keys:[...new Set(ledger.keys.map(key=>string(key,2000)))]};
  }
  if(Object.hasOwn(input,'planProgress')) {
    if(!object(input.planProgress)) fail();safe.planProgress={};
    for(const [key,progress] of Object.entries(input.planProgress)) {
      if(!/^(?:[1-9]|[1-8][0-9]|90)$/.test(key)||!object(progress)) fail();
      safe.planProgress[key]={at:number(progress.at,0,8640000000000000)};
    }
  }
  if(Object.hasOwn(input,'answerReviews')) {
    if(!Array.isArray(input.answerReviews)||input.answerReviews.length>200) fail();
    safe.answerReviews=input.answerReviews.map(r=>{
      if(!object(r)||!actIds.includes(r.act)||!Array.isArray(r.targets)||r.targets.length>20) fail();
      return {act:r.act,task:string(r.task,200),answer:string(r.answer,500),targets:r.targets.map(t=>string(t,500)),prompt:string(r.prompt,1000),at:number(r.at,0,8640000000000000)};
    });
  }
  if(Object.hasOwn(input,'companionProgress')) {
    if(!object(input.companionProgress)||Object.keys(input.companionProgress).length>24) fail();
    safe.companionProgress={};
    for(const [id,progress] of Object.entries(input.companionProgress)) {
      if(!/^companion-(0[1-9]|1[0-9]|2[0-4])$/.test(id)||!object(progress)||!object(progress.answers)) fail();
      if(typeof progress.speakingReviewed!=='boolean'||Object.keys(progress.answers).length>3) fail();
      const result={draft:string(progress.draft,2000),speakingReviewed:progress.speakingReviewed,answers:{}};
      for(const [key,answer] of Object.entries(progress.answers)) {
        if(!['0','1','2'].includes(key)||!object(answer)||typeof answer.correct!=='boolean'||typeof answer.firstCorrect!=='boolean')fail();
        const day=string(answer.day,100);if(!day)fail();
        result.answers[key]={response:string(answer.response,300),correct:answer.correct,firstCorrect:answer.firstCorrect,day};
      }
      safe.companionProgress[id]=result;
    }
  }
  if(Object.hasOwn(input,'studioSession')) {
    const session=input.studioSession;
    if(!object(session)||!actIds.includes(session.act)||!Array.isArray(session.done)||session.done.length>3||session.done.some(step=>!['recall','produce','transfer'].includes(step)))fail();
    safe.studioSession={day:string(session.day,100),act:session.act,startedAt:number(session.startedAt,0,8640000000000000),baselineReviews:number(session.baselineReviews,0,1e9),baselinePracticeCount:number(session.baselinePracticeCount,0,2000),baselineTransferCount:number(session.baselineTransferCount,0,500),baselineDraft:string(session.baselineDraft,5000),done:[...new Set(session.done)],reflection:string(session.reflection,1500)};
  }
  return safe;
}
