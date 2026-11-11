/* Evidence is deliberately independent of XP and never certifies CEFR proficiency. */
function normalizeLearningAnswer(text) {
  return String(text).normalize('NFC').toLocaleLowerCase('de-DE').replace(/[.,!?;:]/g, '').replace(/\s+/g, ' ').trim();
}
function matchesGermanTarget(answer, expected) {
  // Compare spelling/capitalization; punctuation is deliberately not graded here.
  const surface = value => String(value).normalize('NFC').replace(/[.,!?;:]/g, '').replace(/\s+/g, ' ').trim();
  return surface(answer) === surface(expected);
}
function learningRecords(actId) {
  return (gameState.learningEvidence || []).filter(r => r.act === actId);
}
function recordLearningEvidence(act, task, correct, kind) {
  const records = gameState.learningEvidence || [];
  const now = Date.now();
  // Multiple clicks/reloads cannot create multiple observations of one item in a day.
  if (records.some(r => r.act === act && r.task === task && new Date(r.at).toDateString() === new Date(now).toDateString())) return false;
  gameState.learningEvidence = [...records, {act, task, correct, kind, at: now}].slice(-2000);
  saveState();
  return true;
}
function learningEvidenceSummary(actId) {
  const records = learningRecords(actId);
  const tasks = window.LEARNING_UNITS[actId].exercises.map((_,i) => 'exercise-' + i).concat('listening');
  const recent = tasks.filter(task => {
    const observations = records.filter(r => r.task === task && r.kind !== 'listening-assisted').sort((a,b)=>a.at-b.at);
    return observations.length && observations[observations.length-1].correct;
  }).length;
  const spaced = tasks.filter(task => {
    const observations = records.filter(r=>r.task === task && r.correct && r.kind !== 'listening-assisted').sort((a,b)=>a.at-b.at);
    return observations.length > 1 && observations[observations.length-1].at-observations[0].at >= 3*86400000;
  }).length;
  return {recent, spaced, count: tasks.length};
}
function renderLearningLab(container, act) {
  const unit = window.LEARNING_UNITS[act.id];
  const summary = learningEvidenceSummary(act.id);
  const h = escapeHtml;
  container.innerHTML = `<section class="gr-card">
    <h3>کارگاه کاربرد مستقل — ${h(unit.goal)}</h3>
    <p>این بخش XP نمی‌دهد. پاسخ روز اول و مرورِ حداقل سه روز بعد جدا ثبت می‌شوند؛ این شواهد محدود، مدرک تسلط یا سطح CEFR نیستند.</p>
    <p role="status">آخرین پاسخ درست: ${summary.recent}/${summary.count} | پاسخ درست با فاصلهٔ سه روز: ${summary.spaced}/${summary.count}</p>
    <p>سؤال‌ها ثابت‌اند؛ برای سنجش انتقال یادگیری، تکلیف آزاد و سؤال جدید با مدرس لازم است. امروز فقط اولین پاسخ هر سؤال ثبت می‌شود.</p>
    ${unit.exercises.map((q,i)=>`<div class="gr-card"><h4 dir="ltr">${h(q.prompt)}</h4>
      <label for="learning-answer-${i}">پاسخ آلمانی بدون گزینه (بزرگ‌نویسی مهم است؛ نشانه‌گذاری سنجیده نمی‌شود)</label>
      <input id="learning-answer-${i}" dir="ltr" autocomplete="off" style="width:100%;padding:12px;color:#fff;background:#0f172a" maxlength="500">
      <button class="rpg-btn-primary" onclick="submitLearningExercise('${act.id}',${i})">بررسی</button>
      <div id="learning-feedback-${i}" aria-live="polite"></div></div>`).join('')}
    ${renderGrammarClinic(act.id)}
    ${renderAnswerReviews(act.id)}
    <div class="gr-card"><h4>Hören: Informationen verstehen</h4>
      <button class="rpg-btn-primary" onclick="playLearningListening('${act.id}')">🔊 Anhören</button>
      <p dir="ltr">${h(unit.listening.question)}</p>
      ${unit.listening.options.map((o,i)=>`<button class="opt-btn" onclick="submitLearningListening('${act.id}',${i})">${h(o)}</button>`).join('')}
      <div id="learning-listening-feedback" aria-live="polite"></div>
      <details id="learning-transcript" ontoggle="if(this.open) learningListeningAssisted.add('${act.id}')"><summary>متن کمکی — بازکردن یعنی تمرین با راهنما</summary><p dir="ltr">${h(unit.listening.text)}</p><p>اگر متن را دیده‌ای، نتیجه را شنیداری مستقل محسوب نکن.</p></details>
    </div>
    <div class="gr-card"><h4>Schreiben — کاربرد جدید</h4><p dir="ltr">${h(unit.writing)}</p>
      <label for="learning-writing">پیش‌نویس آلمانی (در همین دستگاه ذخیره می‌شود)</label>
      <textarea id="learning-writing" dir="ltr" rows="7" maxlength="5000" style="width:100%"></textarea>
      <button class="rpg-btn-secondary" onclick="saveLearningDraft('${act.id}')">ذخیرهٔ پیش‌نویس، بدون نمره</button>
      <div id="learning-draft-feedback" aria-live="polite"></div>
      <p>بازبینی: آیا همهٔ خواسته‌ها انجام شده؟ متن قابل‌فهم و منسجم است؟ فعل‌ها و حالت‌ها درست‌اند؟ بررسی این موارد انسانی است، نه شمارش کلمات.</p>
    </div>
    <div class="gr-card"><h4>Sprechen — بدون متن آماده</h4><p dir="ltr">${h(unit.speaking)}</p>
      <p>بار اول بدون متن پاسخ بده. سپس با مدرس بررسی کن: انجام تکلیف، قابل‌فهم‌بودن، تعامل، واژگان و دستور. بازشناسی گفتار نمرهٔ تلفظ نیست.</p>
    </div>
    <div class="gr-card"><h4>ارزیابی انتقال — جدا از تمرین</h4><p>در دو نسخه با جمله‌ها و اطلاعات متفاوت. سابقه: ${(gameState.transferEvidence || []).filter(r=>r.act===act.id).length} تلاش ثبت‌شده؛ مستقل از XP.</p><button class="rpg-btn-primary" onclick="startTransfer('${act.id}')">شروع نسخه بعدی</button><div id="transfer-content"></div></div>
    <button class="rpg-btn-secondary" onclick="downloadLearningWork('${act.id}')">دانلود متن و تکلیف برای بازبینی مدرس</button>
  </section>`;
  document.getElementById('learning-writing').value = (gameState.learningDrafts || {})[act.id] || '';
}
function submitLearningExercise(actId, index) {
  const task = window.LEARNING_UNITS[actId]?.exercises[index];
  if (!task) return;
  const value = document.getElementById(`learning-answer-${index}`).value;
  if (!value.trim()) return;
  const correct = task.answers.some(a=>matchesGermanTarget(value, a));
  const recorded = recordLearningEvidence(actId, 'exercise-'+index, correct, 'production');
  if(!correct) queueAnswerReview(actId,'exercise-'+index,value,task.answers,task.prompt);
  document.getElementById(`learning-feedback-${index}`).textContent = `${correct ? 'پاسخ هدف درست است.' : 'با پاسخ هدف یکسان نیست؛ پاسخ متفاوتِ درست ممکن است نیاز به بررسی مدرس داشته باشد.'} ${task.model} — ${task.explanation} ${recorded ? 'اولین پاسخ امروز ثبت شد.' : 'تمرین مجدد؛ سابقه امروز تغییر نکرد.'}`;
}
const learningAudioPlayed = new Set();
const learningListeningAssisted = new Set();
function playLearningListening(actId) {
  speakGerman(window.LEARNING_UNITS[actId].listening.text, null, () => learningAudioPlayed.add(actId));
}
function submitLearningListening(actId, index) {
  const task = window.LEARNING_UNITS[actId]?.listening;
  if (!task || !Number.isInteger(index) || index<0 || index>=task.options.length) return;
  const feedback = document.getElementById('learning-listening-feedback');
  if (!learningAudioPlayed.has(actId)) { feedback.textContent='اول صدا را پخش کن. اگر صدای آلمانی در دسترس نیست، این فعالیت ارزیابی شنیداری محسوب نمی‌شود.'; return; }
  const correct = index === task.answer;
  const assisted = learningListeningAssisted.has(actId);
  const recorded = recordLearningEvidence(actId, 'listening', correct, assisted ? 'listening-assisted' : 'listening-practice');
  feedback.textContent = `${correct ? 'Richtig.' : 'Noch einmal üben.'} ${assisted ? 'متن راهنما باز شده؛ پاسخ مستقل محسوب نمی‌شود.' : ''} ${task.explanation} ${recorded ? 'پاسخ ثبت شد؛ پخش صدا به‌تنهایی تضمین نمی‌کند که صدا شنیده شده است.' : 'تمرین مجدد، بدون تغییر سابقه امروز.'}`;
}
function saveLearningDraft(actId) {
  gameState.learningDrafts = gameState.learningDrafts || {};
  gameState.learningDrafts[actId] = document.getElementById('learning-writing').value.slice(0,5000);
  const saved=saveState();
  document.getElementById('learning-draft-feedback').textContent=saved ? 'ذخیره شد؛ تصحیح یا نمره‌دهی انجام نشده است.' : 'ذخیره نشد؛ پیش از بستن برنامه متن را کپی یا دانلود کن.';
}
function downloadLearningWork(actId) {
  saveLearningDraft(actId);
  const unit = window.LEARNING_UNITS[actId];
  const text = `${unit.goal}\n\nSchreiben:\n${unit.writing}\n\n${gameState.learningDrafts[actId]}\n\nReview requests:\n${JSON.stringify((gameState.answerReviews||[]).filter(r=>r.act===actId),null,2)}\n\nSprechen:\n${unit.speaking}\n\nTeacher review: task completion, comprehensibility, coherence, vocabulary, grammar.\nNot automatically graded.`;
  const url = URL.createObjectURL(new Blob([text],{type:'text/plain;charset=utf-8'}));
  const link = document.createElement('a'); link.href=url; link.download=`deutschritter-${actId}-review.txt`; link.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
}
