/* Rule-based personal study companion. No external AI, grades or promises. */
let coachView=7,coachWeek=0;
function coachName(){const name=(gameState.playerName||'').trim();return name&&name!=='قهرمان زبان‌آموز'?name:'دوست زبان‌آموز من';}
function coachGreeting(){
 const name=coachName(),done=Object.keys(gameState.coachPlan?.done||{}).length;
 if(done)return `${name}، تا حالا ${done} روز از برنامه‌ات را انجام‌شده ثبت کرده‌ای. امروز یک قدم کوچک و واقعی بردار؛ لازم نیست بی‌نقص باشی.`;
 return `${name}، خوش آمدی! با هم از یک تمرین کوچک شروع می‌کنیم. اشتباه بخشی از یادگیری است، نه شکست.`;
}
function coachDate(start,index){const d=new Date(start);return new Date(d.getFullYear(),d.getMonth(),d.getDate()+index);}
function coachDay(index){
 const plan=gameState.coachPlan;if(!plan||!Number.isInteger(index)||index<0||index>27)return null;
 const week=Math.floor(index/7),phase=index%7;
 const acts=window.GAME_DATA.acts,act=acts[Math.min(7,plan.startAct+week)];
 const unit=window.COMPANION_UNITS[(plan.level==='A2'?12:0)+Math.min(11,plan.startUnit+week)];
 const tasks=[
  ['کشف و فهم','یک قاعده را بخوان و دو مثال خودت بساز.','learning'],
  ['بازیابی و جمله‌سازی','پنج واژه را بدون نگاه‌کردن یادآوری کن و در سه جمله به کار ببر.','vocab'],
  ['شنیدن و خواندن','به مثال گوش کن، سپس متن را بخوان و دو اطلاعات کلیدی را یادداشت کن. پخش ناموفق را شنیدن حساب نکن.','reading'],
  ['نوشتن کاربردی','به تکلیف نوشتن پاسخ بده؛ سپس جای فعل، خواسته‌های تکلیف و وضوح متن را بررسی کن.','learning'],
  ['گفتن و بازگویی','یک دقیقه بدون متن آماده درباره موضوع صحبت کن. دوباره بگو و یک مورد را بهتر کن.','skills'],
  ['آزمایش مستقل','بدون راهنما تمرین انتقال را انجام بده؛ پاسخ نامطابق را با مثال مقایسه کن.','learning'],
  ['مرور سبک و انعطاف','دو نکته را از حافظه بگو، یک اشتباه را بازنویسی کن و برای هفته بعد یک هدف بنویس. اگر خسته‌ای استراحت کن؛ بدهکار برنامه نیستی.','learning']
 ];
 let [title,task,step]=tasks[phase];
 if(plan.track==='book'&&phase===5)task='مثال را بپوشان و سه تمرین همین واحد را پاسخ بده؛ سؤال‌ها ممکن است تکراری باشند و آزمون انتقال ندیده نیستند.';
 return {index,week,phase,title,task,step,act,unit,date:coachDate(plan.startedAt,index),done:!!plan.done[String(index)]};
}
function saveCoachProfile(){
 const name=document.getElementById('coach-name').value.trim(),minutes=Number(document.getElementById('coach-minutes').value),track=document.getElementById('coach-track').value,level=document.getElementById('coach-level').value;
 const status=document.getElementById('coach-profile-status');
 if(!name||name.length>60||![10,20,30,45].includes(minutes)||!['main','book'].includes(track)||!['A1','A2'].includes(level)){status.textContent='نامی بین ۱ تا ۶۰ نویسه و گزینه‌های معتبر انتخاب کن.';return;}
 const existing=gameState.coachPlan;
 if(existing&&(existing.track!==track||existing.level!==level)&&!document.getElementById('coach-rebuild').checked){status.textContent='برای تغییر مسیر یا سطح، گزینه ساخت برنامه تازه را تأیید کن؛ سوابق برنامه قبلی جایگزین می‌شوند.';return;}
 gameState.playerName=name;
 if(!existing||document.getElementById('coach-rebuild').checked){
  const current=Math.max(0,window.GAME_DATA.acts.findIndex(a=>a.id===gameState.currentActId));
  gameState.coachPlan={startedAt:Date.now(),minutes,track,level,startAct:current,startUnit:0,done:{}};
  coachWeek=0;
 }else existing.minutes=minutes;
 const saved=saveState();renderActiveView();document.getElementById('coach-profile-status').textContent=saved?'نام و برنامه‌ات ذخیره شد. خوشحالم که شروع کردی!':'ذخیره روی دستگاه ناموفق بود؛ پیش از خروج، از مدیریت پیشرفت فایل پشتیبان بگیر.';
}
function setCoachView(days,week=0){if(![7,28].includes(days)||!Number.isInteger(week)||week<0||week>3)return;coachView=days;coachWeek=week;renderActiveView();}
function setCoachDay(index,done){const day=coachDay(index);if(!day||typeof done!=='boolean')return;if(done)gameState.coachPlan.done[String(index)]={at:Date.now()};else delete gameState.coachPlan.done[String(index)];saveState();renderActiveView();}
function openCoachDay(index){
 const day=coachDay(index);if(!day)return;
 if(gameState.coachPlan.track==='book'){openCompanionUnit(day.unit.id);return;}
 if(!gameState.unlockedActs.includes(day.act.id)){showLockedNotice();return;}
 openActQuest(day.act.id);setQuestStep(day.step);
 if(day.phase===5)startTransfer(day.act.id);
}
function renderCoachPlan(container){
 const h=companionText,plan=gameState.coachPlan;
 container.innerHTML=`<div class="coach-shell"><section class="coach-hero"><div><span class="studio-eyebrow">DEIN LERNBEGLEITER · A1 / A2</span><h2>${h(coachName())}، این مسیر توست.</h2><p>${h(coachGreeting())}</p><p>برنامه شخصی و قاعده‌محور است؛ نه گفت‌وگو با انسان یا هوش مصنوعی آنلاین. نامت برای خطاب‌کردن توست، نه حدس‌زدن توانایی‌ات.</p></div><div class="coach-emblem" aria-hidden="true">✦<small>قدم‌های کوچک<br>یادگیری ماندگار</small></div></section>
 <section class="studio-panel"><h3>اول با هم آشنا شویم</h3><form id="coach-profile"><div class="coach-fields"><label>دوست داری چه صدایت کنم؟<input id="coach-name" maxlength="60" autocomplete="nickname" placeholder="نام یا لقب دلخواه"></label><label>زمان روزانه<select id="coach-minutes">${[10,20,30,45].map(n=>`<option value="${n}">${n} دقیقه</option>`).join('')}</select></label><label>مسیر<select id="coach-track"><option value="main">سفر اصلی بازی</option><option value="book">همراه مستقل Starten wir!</option></select></label><label>سطح مسیر کتاب<select id="coach-level"><option>A1</option><option>A2</option></select></label></div><label class="coach-reset"><input id="coach-rebuild" type="checkbox"> برنامه تازه بساز؛ تیک‌های برنامه قبلی جایگزین می‌شوند (سوابق تمرین‌ها حذف نمی‌شوند).</label><button class="rpg-btn-primary" type="submit">${plan?'ذخیره نام و تنظیمات':'شروع برنامه من'} ←</button><p id="coach-profile-status" role="status"></p></form></section>
 <div id="coach-schedule"></div><details class="studio-panel"><summary>برنامه قدیمی ۹۰ روزه و سوابق آن</summary><p>این برنامه جداست؛ تیک‌های آن به برنامه شخصی منتقل نمی‌شوند.</p><div id="coach-legacy"></div></details></div>`;
 document.getElementById('coach-name').value=gameState.playerName==='قهرمان زبان‌آموز'?'':gameState.playerName||'';
 document.getElementById('coach-minutes').value=plan?.minutes||20;document.getElementById('coach-track').value=plan?.track||'main';document.getElementById('coach-level').value=plan?.level||'A1';
 document.getElementById('coach-profile').onsubmit=e=>{e.preventDefault();saveCoachProfile();};
 const legacy=container.querySelector('details');legacy.addEventListener('toggle',()=>{if(legacy.open&&!document.getElementById('coach-legacy').hasChildNodes())renderLegacyPlanView(document.getElementById('coach-legacy'));});
 if(!plan)return;
 const schedule=document.getElementById('coach-schedule'),completed=Object.keys(plan.done).length,recall=Math.max(2,Math.round(plan.minutes*.25)),core=Math.max(4,Math.round(plan.minutes*.5)),finish=plan.minutes-recall-core;
 const days=Array.from({length:28},(_,i)=>coachDay(i)).filter(day=>coachView===28||day.week===coachWeek);
 schedule.innerHTML=`<section class="studio-panel"><h3>چهار هفته برای تمرین منظم؛ نه وعده تکمیل سطح</h3><p>${h(coachName())}، روزانه ${plan.minutes} دقیقه: ${recall} دقیقه بازیابی، ${core} دقیقه تمرین اصلی، ${finish} دقیقه جمع‌بندی. زمان پیشنهادی است. روز جاافتاده را بدون فشار ادامه بده.</p><p>${completed} از ۲۸ روز انجام‌شده به گزارش خودت؛ این شمارنده نمره تسلط نیست.</p><progress value="${completed}" max="28" aria-label="روزهای انجام‌شده برنامه"></progress><div class="coach-controls"><button class="shell-button" onclick="downloadCoachPlan()">دانلود برنامه متنی</button><button class="shell-button" onclick="setCoachView(28)" aria-pressed="${coachView===28}">نمای ماهانه · ۲۸ روز</button>${[0,1,2,3].map(w=>`<button class="shell-button" onclick="setCoachView(7,${w})" aria-pressed="${coachView===7&&coachWeek===w}">هفته ${w+1}</button>`).join('')}</div></section><div class="coach-days">${days.map(day=>{
 const locked=plan.track==='main'&&!gameState.unlockedActs.includes(day.act.id);
 return `<article class="coach-day ${day.done?'coach-day-done':''}"><div class="coach-day-top"><span>روز ${day.index+1} · هفته ${day.week+1}</span><time datetime="${day.date.getFullYear()}-${String(day.date.getMonth()+1).padStart(2,'0')}-${String(day.date.getDate()).padStart(2,'0')}">${h(day.date.toLocaleDateString('fa-IR'))}</time></div><h3>${h(day.title)}</h3><p class="coach-topic">${h(plan.track==='book'?day.unit.level+' · '+day.unit.title:day.act.titleFa)}</p><p>${h(day.task)}</p><button class="rpg-btn-secondary" onclick="openCoachDay(${day.index})" ${locked?'disabled':''}>${locked?'اول این پرده را در نقشه باز کن':'رفتن به تمرین ←'}</button><label><input type="checkbox" ${day.done?'checked':''} onchange="setCoachDay(${day.index},this.checked)"> انجام دادم · خوداظهاری، بدون XP</label></article>`;
 }).join('')}</div>`;
}

function downloadCoachPlan(){
 const plan=gameState.coachPlan;if(!plan)return;
 const lines=[`${coachName()} — برنامه ۲۸ روزه`,`${plan.minutes} دقیقه در روز؛ پیشنهادی و بدون تضمین تکمیل سطح.`,`مسیر: ${plan.track==='book'?'همراه مستقل کتاب':'بازی اصلی'}`, 'علامت انجام، خوداظهاری است؛ نه نمره تسلط.',''];
 for(let index=0;index<28;index++){const day=coachDay(index);lines.push(`${day.done?'[x]':'[ ]'} روز ${index+1} | ${day.date.toLocaleDateString('fa-IR')} | ${day.title}`,plan.track==='book'?day.unit.title:day.act.titleFa,day.task,'');}
 const url=URL.createObjectURL(new Blob([lines.join('\n')],{type:'text/plain;charset=utf-8'}));const link=document.createElement('a');link.href=url;link.download='DeutschRitter-my-study-plan.txt';document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
