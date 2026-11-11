/* A transparent learning coach: recommendations, not proficiency certification. */
function studioRecommendation(now=Date.now()) {
  const candidates=window.GAME_DATA.acts.filter(act=>gameState.unlockedActs.includes(act.id));
  const ranked=candidates.map(act=>{
    const transfers=(gameState.transferEvidence||[]).filter(r=>r.act===act.id&&!r.assisted&&r.at<=now).sort((a,b)=>b.at-a.at);
    const latest=transfers[0],practice=(gameState.learningEvidence||[]).filter(r=>r.act===act.id&&r.at<=now);
    const failures=practice.filter(r=>!r.correct).length;
    let priority,reason;
    if(latest&&latest.results.some(result=>!result)) {priority=300+latest.results.filter(result=>!result).length;reason='آخرین تلاش انتقالِ بدون کمک، پاسخ نامطابق داشت؛ بازبینی را از اینجا شروع کن.';}
    else if(!practice.length) {priority=200;reason='هنوز شاهدی از تمرین این پرده ثبت نشده؛ از تمرین هدایت‌شده شروع کن.';}
    else if(!latest) {priority=150;reason='تمرین ثبت شده، اما ارزیابی انتقال بدون کمک نداریم.';}
    else if(now-latest.at>=7*86400000) {priority=100;reason='از آخرین تلاش انتقال یک هفته گذشته؛ بازیابی فاصله‌دار پیشنهاد می‌شود.';}
    else {priority=50;reason='شواهد اخیر محدودند؛ مرور و تولید مستقل را ادامه بده.';}
    return {act,priority,reason,latest,failures};
  }).sort((a,b)=>b.priority-a.priority);
  return ranked[0]||null;
}
function studioSession() {const session=gameState.studioSession;return session&&session.day===todayStr()?session:null;}
function startStudioSession() {
  if(studioSession()) {switchTab('studio');return;}
  const recommendation=studioRecommendation();if(!recommendation)return;
  const act=recommendation.act.id;
  gameState.studioSession={day:todayStr(),act,startedAt:Date.now(),baselineReviews:(gameState.stats?.reviews||0),baselinePracticeCount:(gameState.learningEvidence||[]).filter(r=>r.act===act).length,baselineTransferCount:(gameState.transferEvidence||[]).filter(r=>r.act===act).length,baselineDraft:gameState.learningDrafts?.[act]||'',done:[],reflection:''};
  saveState();switchTab('studio');
}
function studioStepEvidence(step,session=studioSession()) {
  if(!session)return false;
  if(step==='recall')return (gameState.stats?.reviews||0)>session.baselineReviews || (gameState.learningEvidence||[]).filter(r=>r.act===session.act).some((r,index)=>r.at>=session.startedAt&&(r.at>session.startedAt||index>=session.baselinePracticeCount));
  if(step==='produce') {const draft=gameState.learningDrafts?.[session.act]||'';return draft.trim().length>0&&draft!==session.baselineDraft;}
  if(step==='transfer')return (gameState.transferEvidence||[]).filter(r=>r.act===session.act).some((r,index)=>r.at>=session.startedAt&&!r.assisted&&(r.at>session.startedAt||index>=session.baselineTransferCount));
  return false;
}
function openStudioStep(step) {
  const session=studioSession();if(!session||!['recall','produce','transfer'].includes(step))return;
  if(step==='recall'&&Object.values(gameState.srsCards||{}).some(card=>card.nextReview<=Date.now())) {switchTab('srs');return;}
  openActQuest(session.act);setQuestStep('learning');
  if(step==='transfer')startTransfer(session.act);
}
function completeStudioStep(step) {
  const session=studioSession();if(!session||!studioStepEvidence(step,session)||session.done.includes(step))return;
  session.done.push(step);saveState();renderActiveView();
}
function renderStudioView(container) {
  const esc=companionText,recommendation=studioRecommendation(),session=studioSession();
  const due=Object.values(gameState.srsCards||{}).filter(card=>card.nextReview<=Date.now()).length;
  const reviews=(gameState.answerReviews||[]).length;
  const steps=[['recall','01','بازیابی فعال','۵ دقیقه','چند کارت سررسیدشده را مرور کن؛ اگر کارتی نیست، در کارگاه یک تمرین پاسخ بده. ثبت تلاش کافی است، نه الزام پاسخ درست.'],['produce','02','از فهمیدن به ساختن','۱۰ دقیقه','در تکلیف نوشتن کارگاه، بدون کپی مثال یک متن تازه بنویس و پیش‌نویس را ذخیره کن. طول یا ثبت متن، نمره کیفیت نیست.'],['transfer','03','آزمایش مستقل','۵ دقیقه','ارزیابی انتقال همان پرده را بدون راهنما انجام بده. تلاش ثبت می‌شود؛ نتیجه، تأیید سطح نیست.']];
  container.innerHTML=`<div class="studio-shell"><header class="studio-hero"><div><span class="studio-eyebrow">DEUTSCHRITTER · LERNSTUDIO</span><h2>امروز فقط بازی نکن.<br>چیزی به آلمانی بساز.</h2><p>یک مسیر کوتاه: به‌یاد بیاور، تولید کن، مستقل امتحان کن. زمان‌ها پیشنهادند، نه تایمر یا تضمین یادگیری.</p></div><div class="studio-orbit" aria-label="چرخه یادگیری">یادآوری<br>↓<br>تولید<br>↓<br>بازبینی</div></header>
    <div class="studio-metrics"><div><strong>${due}</strong><span>کارت سررسیدشده</span></div><div><strong>${reviews}</strong><span>پاسخ در صف بازبینی انسانی</span></div><div><strong>${session?.done.length||0}/3</strong><span>گام ثبت‌شده امروز</span></div></div>
    <section class="studio-panel"><span class="studio-eyebrow">YOUR NEXT MOVE</span><h3>${session?'مسیر امروزت آماده است':'پیشنهاد شفاف، بر اساس سابقه خودت'}</h3><p>${esc(recommendation?.reason||'ابتدا پرده اول را باز کن.')}</p><p>پرده پیشنهادی: <b>${esc(recommendation?.act.title||recommendation?.act.id||'—')}</b>. کمک‌گرفته‌ها در پیشنهاد انتقال مستقل محسوب نمی‌شوند؛ نبود داده یعنی نامعلوم، نه ضعف.</p>${session?`<p>جلسه امروز برای <b>${esc(session.act)}</b> ثابت است؛ پیشنهاد تازه، هدف جلسه را عوض نمی‌کند.</p><progress aria-label="گام‌های ثبت‌شده" value="${session.done.length}" max="3"></progress>`:'<button class="rpg-btn-primary" onclick="startStudioSession()">ساخت مسیر ۲۰ دقیقه‌ای امروز ←</button>'}</section>
    <div class="studio-step-grid">${steps.map(([id,num,title,time,description])=>`<section class="studio-panel"><span class="studio-step-number">${num}</span><span class="studio-time">${time}</span><h3>${title}</h3><p>${description}</p>${session?`<button class="rpg-btn-secondary" onclick="openStudioStep('${id}')">رفتن به تمرین</button> <button class="rpg-btn-primary" onclick="completeStudioStep('${id}')" ${session.done.includes(id)||!studioStepEvidence(id,session)?'disabled':''}>${session.done.includes(id)?'✓ ثبت شد':'ثبت انجام گام'}</button>`:'<p>اول مسیر امروز را بساز.</p>'}</section>`).join('')}</div>
    ${session?`<section class="studio-panel"><h3>یک جمله برای فردای خودت</h3><label for="studio-reflection">چه چیزی سخت بود؟ دفعه بعد چه چیزی را بدون کمک امتحان می‌کنی؟</label><textarea id="studio-reflection" maxlength="1500" rows="3"></textarea><button class="rpg-btn-secondary" id="studio-save">ذخیره یادداشت</button><p id="studio-status" role="status"></p><p>این گام‌ها ثبت فعالیت‌اند، نه اثبات تسلط. تکمیل مسیر XP اضافی ندارد تا انگیزه ثبت صوری ایجاد نشود.</p></section>`:''}
    <section class="studio-panel"><h3>اطلس شواهد · نه نمره سطح</h3><p>تلاش‌های همراه کمک از شواهد مستقل جدا هستند. پاسخ متفاوت از کلید را برای بازبینی مدرس نگه دار.</p><div class="studio-evidence">${window.GAME_DATA.acts.map(act=>{
      const records=(gameState.learningEvidence||[]).filter(r=>r.act===act.id),transfers=(gameState.transferEvidence||[]).filter(r=>r.act===act.id&&!r.assisted),latest=transfers.at(-1),unlocked=gameState.unlockedActs.includes(act.id);
      return `<article><h4>${esc(act.title||act.id)}</h4><p>${records.length} مشاهده تمرین · ${transfers.length} تلاش انتقال بدون کمک</p><p>${latest?`آخرین تطابق با کلید: ${latest.results.filter(Boolean).length}/3`:'هنوز داده انتقال مستقل نداریم'}</p><button class="rpg-btn-secondary" onclick="openStudioAct('${act.id}')" ${unlocked?'':'disabled'}>${unlocked?'ورود به کارگاه':'هنوز باز نشده'}</button></article>`;
    }).join('')}</div></section>
    <footer class="studio-panel"><h3>دو مسیر، یک یادگیرنده</h3><p>مسیر اصلی را با کارگاه‌ها دنبال کن؛ اگر با کتاب درس می‌خوانی، مسیر مکمل مستقل A1/A2 را انتخاب کن.</p><button class="rpg-btn-secondary" onclick="switchTab('companion')">📚 مسیر همراه کتاب</button> <button class="rpg-btn-secondary" onclick="switchTab('map')">🗺️ نقشه بازی</button><p>ابزار تمرین غیررسمی؛ نه دوره تأییدشده یا جایگزین مدرس. صدای مرورگر هم ممکن است آنلاین باشد.</p></footer></div>`;
  if(session) {
    const textarea=container.querySelector('#studio-reflection');textarea.value=session.reflection;
    container.querySelector('#studio-save').onclick=()=>{
      if(studioSession()!==session||gameState.activeTab!=='studio')return;
      session.reflection=textarea.value.slice(0,1500);const success=saveState();container.querySelector('#studio-status').textContent=success?'یادداشت ذخیره شد.':'ذخیره ناموفق بود؛ از مدیریت پیشرفت خروجی بگیر.';
    };
  }
}
function openStudioAct(id) {if(!gameState.unlockedActs.includes(id))return;openActQuest(id);setQuestStep('learning');}
