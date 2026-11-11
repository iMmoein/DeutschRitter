/* Separate assessment pool, not a secure or standardized exam. */
let activeTransfer=null;
function startTransfer(actId) {
  const variants=window.TRANSFER_UNITS[actId];
  if(!variants) return;
  const history=(gameState.transferEvidence||[]).filter(r=>r.act===actId);
  const latest=history[history.length-1];
  const variant=variants.find(v=>!latest||v.id!==latest.variant)||variants[0];
  activeTransfer={act:actId,variant:variant.id,submitted:false};
  const container=document.getElementById('transfer-content');
  container.innerHTML=`<h4>ارزیابی جدا از مثال‌های درس — نسخه ${escapeHtml(variant.id)}</h4>
    <p>این بانک محدود و محلی است؛ ادعای سؤال همیشه‌ندیده، آزمون امن یا تأیید CEFR ندارد. پیش از پاسخ از راهنما استفاده نکن.</p>
    ${variant.items.map((q,i)=>`<label style="display:block;margin-top:14px" dir="ltr" for="transfer-${i}">${escapeHtml(q.prompt)}</label><input style="width:100%;padding:10px" dir="ltr" id="transfer-${i}" maxlength="500" autocomplete="off">`).join('')}
    <label><input type="checkbox" id="transfer-assisted"> از کمک/پاسخ قبلی استفاده کردم</label>
    <button class="rpg-btn-primary" onclick="submitTransfer()">ثبت اولین تلاش امروز این نسخه</button><div id="transfer-feedback" aria-live="polite"></div>`;
}
function submitTransfer() {
  if(!activeTransfer||activeTransfer.submitted) return;
  const variant=window.TRANSFER_UNITS[activeTransfer.act].find(v=>v.id===activeTransfer.variant);
  const answers=variant.items.map((_,i)=>document.getElementById('transfer-'+i).value.trim());
  const feedback=document.getElementById('transfer-feedback');
  if(answers.some(a=>!a)) {feedback.textContent='به همه سؤال‌ها پاسخ بده؛ سپس ثبت کن.';return;}
  const assisted=document.getElementById('transfer-assisted').checked;
  const results=variant.items.map((q,i)=>q.answers.some(a=>matchesGermanTarget(answers[i],a)));
  variant.items.forEach((q,i)=>{if(!results[i]) queueAnswerReview(activeTransfer.act,'transfer:'+variant.id+':'+i,answers[i],q.answers,q.prompt);});
  const records=gameState.transferEvidence||[], at=Date.now();
  const duplicate=records.some(r=>r.act===activeTransfer.act && r.variant===variant.id && new Date(r.at).toDateString()===new Date(at).toDateString());
  activeTransfer.submitted=true;
  if(!duplicate) {gameState.transferEvidence=[...records,{act:activeTransfer.act,variant:variant.id,assisted,results,at}].slice(-500); saveState();}
  feedback.innerHTML=`<p>${results.filter(Boolean).length}/${results.length} پاسخ مطابق کلید هدف؛ ${assisted?'با کمک — نه شواهد مستقل':'بدون کمک به گزارش خودت'}. ${duplicate?'تلاش جدید در سابقه ثبت نشد؛ اولین تلاش امروز حفظ شد.':'اولین تلاش امروز ثبت شد.'}</p>
    ${variant.items.map((q,i)=>`<p dir="ltr">${results[i]?'✓':'↻'} ${escapeHtml(q.answers[0])} — ${escapeHtml(q.explanation)}</p>`).join('')}
    <p>پاسخ متفاوت ممکن است درست باشد؛ مدرس باید آن را بررسی کند. این نتیجه نمرهٔ گفتن/نوشتن یا گواهی تسلط نیست.</p>`;
}
