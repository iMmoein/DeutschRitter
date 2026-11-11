/* Independent, original A1/A2 companion. Not affiliated with a publisher. */
let companionLevel = 'A1', companionUnitId = null;
function companionUnit(id) { return window.COMPANION_UNITS.find(unit=>unit.id===id); }
function companionProgress(id) {
  gameState.companionProgress ||= {};
  return gameState.companionProgress[id] ||= {answers:{},draft:'',speakingReviewed:false};
}
function openCompanionUnit(id) {
  const unit=companionUnit(id);if(!unit) return;
  companionUnitId=id;companionLevel=unit.level;switchTab('companion');
}
function selectCompanionLevel(level) {
  if(!['A1','A2'].includes(level)) return;
  companionLevel=level;companionUnitId=null;renderActiveView();
}
function companionText(value) {return String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function renderCompanionView(container) {
  const esc=companionText;
  container.innerHTML=`<section class="gr-card"><h2>📚 همراه Starten wir! · A1–A2</h2>
    <p>مسیر مستقل با تمرین‌های تألیفی برای زبان‌آموزان این کتاب؛ وابسته به ناشر نیست. متن، تصویر و صوت کتاب بازنشر نشده است. ترتیب و شماره درس‌ها هنوز با ویرایش مشخص کتاب تطبیق داده نشده؛ این‌ها فصل‌های رسمی کتاب نیستند.</p>
    <p>۲۴ واحد موضوعی: ۱۲ واحد A1 و ۱۲ واحد A2. این مجموعه مکمل است، نه پوشش تأییدشده تمام اهداف سطح یا جایگزین کتاب.</p>
    <button class="rpg-btn-secondary" onclick="exportCompanionReview()">خروجی تکالیف برای مدرس</button><div><button class="rpg-btn-secondary" onclick="selectCompanionLevel('A1')">A1</button> <button class="rpg-btn-secondary" onclick="selectCompanionLevel('A2')">A2</button></div>
    <div id="companion-units" style="display:flex;flex-wrap:wrap;gap:8px;margin-top:16px;"></div><div id="companion-lesson"></div></section>`;
  const list=container.querySelector('#companion-units');
  for(const unit of window.COMPANION_UNITS.filter(u=>u.level===companionLevel)) {
    const progress=gameState.companionProgress?.[unit.id], attempted=Object.keys(progress?.answers||{}).length;
    const button=document.createElement('button');button.className='rpg-btn-secondary';
    button.textContent=`${unit.level} · ${unit.title} · ${attempted}/3`;
    button.onclick=()=>openCompanionUnit(unit.id);button.setAttribute('aria-pressed',String(unit.id===companionUnitId));list.append(button);
  }
  const unit=companionUnit(companionUnitId);if(!unit) return;
  const progress=companionProgress(unit.id),body=container.querySelector('#companion-lesson');
  body.innerHTML=`<h3 class="de">${esc(unit.title)}</h3><p>مسیر: قاعده و مثال ← تمرین هدایت‌شده ← خواندن ← بازگویی جمله ← نوشتن و گفتن مستقل. مشاهده پاسخ صحیح اثبات تسلط نیست.</p>
    <div class="gr-card" lang="de" dir="ltr"><p>${esc(unit.rule)}</p><p><strong>${esc(unit.example)}</strong></p><button class="rpg-btn-secondary" id="companion-audio">🔊 مثال · صدای مرورگر</button></div>
    <div id="companion-questions"></div>
    <h4>✍️ Schreiben · بدون نمره خودکار</h4><p lang="de" dir="ltr">${esc(unit.writing)}</p>
    <label for="companion-draft">پیش‌نویس شخصی (حداکثر ۲۰۰۰ نویسه)</label><textarea id="companion-draft" maxlength="2000" dir="ltr" lang="de" style="width:100%;min-height:120px;box-sizing:border-box"></textarea>
    <button class="rpg-btn-secondary" id="companion-save-draft">ذخیره پیش‌نویس</button>
    <h4>🎙️ Sprechen · خودبازبینی، نه نمره تلفظ</h4><p lang="de" dir="ltr">${esc(unit.speaking)}</p>
    <p>برای ضبط از ابزار ضبط دستگاه استفاده کن؛ فایل صوتی اینجا بارگذاری نمی‌شود. بررسی کن: آیا منظور روشن بود؟ فعل در جای درست بود؟ آیا بدون خواندن مثال صحبت کردی؟</p>
    <label><input type="checkbox" id="companion-speaking"> تمرین گفتاری را انجام دادم و خودم بازبینی کردم (خوداظهاری)</label>
    <p>برای بازخورد معتبر، پیش‌نویس و گفتارت را به مدرس نشان بده. پاداش فقط برای اولین پاسخ صحیح هر تمرین در روز است؛ شمارنده صرفاً تعداد تمرین‌های پاسخ‌داده‌شده است.</p><p id="companion-save-status" role="status"></p>`;
  body.querySelector('#companion-audio').onclick=()=>speakGerman(unit.example);
  const questions=body.querySelector('#companion-questions');
  unit.questions.forEach((q,i)=>{
    const card=document.createElement('section');card.className='gr-card';
    if(i===1) {const reading=document.createElement('p');reading.textContent=unit.reading;reading.lang='de';reading.dir='ltr';card.append(reading);}
    const prompt=document.createElement('h4');prompt.textContent=q.prompt;prompt.lang='de';prompt.dir='ltr';card.append(prompt);
    q.options.forEach((option,index)=>{const button=document.createElement('button');button.className='rpg-btn-secondary';button.textContent=option;button.lang='de';button.onclick=()=>answerCompanion(unit.id,i,index);card.append(button);});
    const feedback=document.createElement('p');feedback.id='companion-feedback-'+i;feedback.setAttribute('role','status');
    const result=progress.answers[String(i)];if(result) feedback.textContent=(result.correct?'✅ ':'↩️ ')+q.explanation+' · آخرین پاسخ: '+result.response;
    card.append(feedback);questions.append(card);
  });
  const recall=document.createElement('section');recall.className='gr-card';recall.innerHTML=`<h4 lang="de">${esc(unit.gap.prompt)}</h4><p>این بازگویی هدایت‌شده است، نه آزمون ندیده؛ ابتدا مثال بالا را بپوشان.</p><label for="companion-recall">جمله آلمانی</label><input id="companion-recall" maxlength="300" dir="ltr" style="max-width:100%;box-sizing:border-box"><button class="rpg-btn-secondary" id="companion-check-recall">بررسی جمله</button><p id="companion-feedback-2" role="status"></p>`;questions.append(recall);
  if(progress.answers['2']) recall.querySelector('#companion-feedback-2').textContent=(progress.answers['2'].correct?'✅ ':'↩️ ')+unit.example;
  recall.querySelector('#companion-check-recall').onclick=()=>answerCompanion(unit.id,2,recall.querySelector('input').value);
  const draft=body.querySelector('#companion-draft');draft.value=progress.draft;
  body.querySelector('#companion-save-draft').onclick=()=>{
    if(gameState.activeTab!=='companion'||companionUnitId!==unit.id)return;
    progress.draft=draft.value.slice(0,2000);const ok=saveState();body.querySelector('#companion-save-status').textContent=ok?'پیش‌نویس ذخیره شد.':'ذخیره انجام نشد؛ از مدیریت پیشرفت خروجی بگیر.';
  };
  const speaking=body.querySelector('#companion-speaking');speaking.checked=progress.speakingReviewed;
  speaking.onchange=()=>{progress.speakingReviewed=speaking.checked;saveState();};
}
function answerCompanion(id,index,response) {
  if(gameState.activeTab!=='companion'||companionUnitId!==id) return;
  const unit=companionUnit(id);if(!unit||!Number.isInteger(index)||index<0||index>2)return;
  let correct,text;
  if(index<2) {const question=unit.questions[index];if(!Number.isInteger(response)||!question.options[response])return;correct=response===question.answer;text=question.options[response];}
  else {if(typeof response!=='string'||response.length>300||!response.trim())return;text=response.trim();const norm=s=>s.normalize('NFC').toLocaleLowerCase('de').replace(/[.!?]+$/,'').replace(/\s+/g,' ').trim();correct=unit.gap.answers.some(answer=>norm(answer)===norm(text));}
  const progress=companionProgress(id),previous=progress.answers[String(index)],day=todayStr();
  // Preserve first-attempt evidence and prevent wrong→right farming on the same day.
  const firstToday=!previous||previous.day!==day;
  progress.answers[String(index)]={response:text,correct,day,firstCorrect:firstToday?correct:previous.firstCorrect};
  if(correct&&firstToday)rewardOnce(`companion:${id}:${index}`,10);
  saveState();renderActiveView();
}

function exportCompanionReview() {
  const lines=['# Independent A1/A2 companion — teacher review','Original prompts; no publisher endorsement or verified textbook chapter mapping.','Review rubric (human feedback, not automated CEFR certification): task fulfilment, comprehensibility, vocabulary, grammar and sentence order.','For each category record: needs support / partly independent / independent, plus an example and one next step.',''];
  for(const unit of window.COMPANION_UNITS) {
    const progress=gameState.companionProgress?.[unit.id];if(!progress)continue;
    lines.push(`${unit.level} — ${unit.title}`,`Writing task: ${unit.writing}`,`Learner draft: ${progress.draft || '(empty)'}`,`Speaking task: ${unit.speaking}`,`Speaking self-review (not teacher verified): ${progress.speakingReviewed?'yes':'no'}`);
    for(const [index,answer] of Object.entries(progress.answers))lines.push(`Exercise ${Number(index)+1}: ${answer.response} | latest match: ${answer.correct} | first match on ${answer.day}: ${answer.firstCorrect}`);
    lines.push('Teacher feedback:','Next task:','');
  }
  const url=URL.createObjectURL(new Blob([lines.join('\n')],{type:'text/plain;charset=utf-8'}));
  const anchor=document.createElement('a');anchor.href=url;anchor.download='deutschritter-companion-review.txt';document.body.append(anchor);anchor.click();anchor.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
