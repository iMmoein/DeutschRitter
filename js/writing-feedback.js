/* Observations, not a grammar score. Rules intentionally cover only explicit patterns. */
function analyzeGermanDraft(text) {
  const words=String(text).trim().split(/\s+/).filter(Boolean);
  const sentences=String(text).split(/[.!?]+/).filter(s=>s.trim()).length;
  const hints=[];
  for(const [pattern,description] of [
    [/\bich haben\b/i,'برای ich در زمان حال: ich habe.'],
    [/\bich kommen\b/i,'برای ich در زمان حال: ich komme.'],
    [/\bmit den Bus\b/i,'در این ترکیب: mit dem Bus؛ mit حالت Dativ می‌خواهد.'],
    [/\bweil ich (bin|habe|kann|muss)\b/i,'در جمله وابسته با weil، جای فعل صرف‌شده را بررسی کن؛ معمولاً در پایان جمله وابسته است.']
  ]) if(pattern.test(text)) hints.push(description);
  return {words:words.length,sentences,capitalizedTokens:words.filter(w=>/^[A-ZÄÖÜ]/.test(w)).length,hints};
}
function writingObservationsHtml(text) {
  const result=analyzeGermanDraft(text);
  return `<p>${result.words} کلمه؛ ${result.sentences} قطعهٔ جمله؛ ${result.capitalizedTokens} واژه با حرف بزرگ.</p>
    <p>این شمارش‌ها صحت جمله، بزرگ‌نویسی اسم‌ها یا انجام تکلیف را اثبات نمی‌کنند. نمرهٔ مهارت محاسبه نشده است.</p>
    ${result.hints.map(h=>`<p>🔎 ${escapeHtml(h)}</p>`).join('')}
    <p>بازبینی: انجام همهٔ خواسته‌ها، قابل‌فهم‌بودن، انسجام، واژگان و دستور. نبودن هشدار به معنی نبودن خطا نیست.</p>`;
}
function checkWriting() {
  const text=document.getElementById('writing-text').value.trim();
  const feedback=document.getElementById('writing-feedback');
  if(!text) { feedback.textContent='اول متن را بنویس.';return; }
  feedback.innerHTML=writingObservationsHtml(text);
}
