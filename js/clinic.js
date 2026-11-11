/* Topic coverage is explicit, not a CEFR certification. */
function renderGrammarClinic(actId) {
 return `<section class="gr-card"><h3>کارگاه موضوع‌به‌موضوع گرامر</h3><p>برای هر عنوان موجود: بازیابی، بازنویسی و کاربرد آزاد. این محتوای جدید هنوز تأیید مستقل مدرس ندارد.</p>${window.GRAMMAR_CLINIC.filter(t=>t.act===actId).map(t=>`<details><summary>${escapeHtml(t.title)}</summary><p dir="ltr">${escapeHtml(t.explanation)}</p>${t.exercises.map((q,i)=>`<label dir="ltr" style="display:block" for="${t.id}-${i}">${escapeHtml(q.prompt)}</label><input id="${t.id}-${i}" dir="ltr" maxlength="500"><button onclick="checkClinic('${t.id}',${i})">بررسی پاسخ هدف</button><p id="${t.id}-${i}-feedback" aria-live="polite"></p>`).join('')}<h4>Freie Anwendung</h4><p dir="ltr">${escapeHtml(t.production)}</p><p>بدون دیدن مثال، دو جملهٔ جدید بساز؛ سپس با مدرس انجام تکلیف، جای فعل، حالت و واژگان را بررسی کن. نمرهٔ خودکار ندارد.</p></details>`).join('')}</section>`;
}
function checkClinic(id,index) {
 const topic=window.GRAMMAR_CLINIC.find(t=>t.id===id),task=topic?.exercises[index];
 if(!task) return;
 const value=document.getElementById(id+'-'+index).value.trim();if(!value) return;
 const match=task.answers.some(a=>matchesGermanTarget(value,a));
 document.getElementById(id+'-'+index+'-feedback').textContent=(match?'مطابق پاسخ هدف. ':'نیازمند مقایسه یا بازبینی؛ تفاوت با کلید به‌تنهایی اثبات خطا نیست. ')+task.answers[0]+' — '+topic.explanation;
 if(!match) queueAnswerReview(topic.act,'clinic:'+id+':'+index,value,task.answers,task.prompt);
}
function queueAnswerReview(act,task,answer,targets,prompt) {
 gameState.answerReviews=gameState.answerReviews || [];
 if(gameState.answerReviews.some(r=>r.act===act&&r.task===task&&r.answer===answer)) return;
 gameState.answerReviews.push({act,task,answer:answer.slice(0,500),targets:targets.map(a=>a.slice(0,500)),prompt:prompt.slice(0,1000),at:Date.now()});
 gameState.answerReviews=gameState.answerReviews.slice(-200);saveState();
}
function renderAnswerReviews(actId) {
 const records=(gameState.answerReviews||[]).filter(r=>r.act===actId);
 return `<section class="gr-card"><h4>پاسخ‌های نیازمند بازبینی: ${records.length}</h4><p>این فهرست به معنی غلط‌بودن پاسخ‌ها نیست. همراه تکلیف برای مدرس دانلود می‌شود؛ تأیید خودکار یا نشان تسلط ایجاد نمی‌کند.</p>${records.map(r=>`<details><summary>${escapeHtml(r.prompt)}</summary><p dir="ltr">${escapeHtml(r.answer)}</p><p dir="ltr">Ziel: ${escapeHtml(r.targets.join(' / '))}</p></details>`).join('')}</section>`;
}
