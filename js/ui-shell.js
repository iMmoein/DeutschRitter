/* Accessible navigation shell; no learning data is changed by visual preferences. */
const APP_DESTINATIONS = [
 ['studio','✨','مرکز یادگیری','Lernstudio','پیشنهاد امروز، مسیر سه‌گامی و شواهد پیشرفت'],
 ['map','🗺️','نقشه سفر','Weltkarte','هشت پرده؛ مسیر اصلی تمرین آلمانی'],
 ['quest','📖','پرده فعال','Quest','درس و تمرین مرحله‌ای که باز کرده‌ای'],
 ['companion','📚','همراه Starten wir!','A1 · A2','مسیر مستقل کتاب با ۲۴ واحد تألیفی'],
 ['srs','🏰','مرور حافظه','Wiederholen','مرور کارت‌های سررسیدشده'],
 ['grammar','📜','مرجع گرامر','Grammatik','قواعد و مثال‌ها برای مراجعه سریع'],
 ['dict','🔎','واژه‌نامه','Wörterbuch','جست‌وجوی واژه‌ها و مثال‌ها'],
 ['library','📚','کتابخانه','Lesen','متن‌های کوتاه و کاربردی'],
 ['arena','⚔️','میدان تمرین','Arena','بازی‌های کوتاه حروف تعریف و جمله‌سازی'],
 ['plan','📅','برنامه تمرین','Lernplan','برنامه و تکالیف روزانه'],
 ['test','🧭','تعیین مسیر اولیه','Einstufung','آزمون محدود محلی؛ نه تعیین سطح رسمی'],
 ['exam','🎓','تمرین قالب آزمون','Prüfung','تمرین غیررسمی؛ نه آزمون معتبر گوته']
];
let navigatorReturnFocus=null;
function syncAppShell() {
  const destination=APP_DESTINATIONS.find(item=>item[0]===gameState.activeTab);
  const title=document.getElementById('workspace-title'),description=document.getElementById('workspace-description');
  if(title)title.textContent=destination?destination[1]+' '+destination[2]:'DeutschRitter';
  if(description)description.textContent=destination?.[4]||'تمرین زبان آلمانی';
  document.querySelectorAll('.nav-tabs .tab-btn').forEach(button=>{
    const active=button.dataset.tab===gameState.activeTab;button.classList.toggle('active',active);
    if(active)button.setAttribute('aria-current','page');else button.removeAttribute('aria-current');
  });
}
function appNavigatorResults() {
  const query=document.getElementById('destination-search').value.trim().toLocaleLowerCase();
  const results=document.getElementById('destination-results');results.replaceChildren();
  const matches=APP_DESTINATIONS.filter(item=>item.join(' ').toLocaleLowerCase().includes(query));
  for(const [id,icon,title,german,description] of matches) {
    const button=document.createElement('button');button.type='button';button.className='destination-card';
    const heading=document.createElement('strong');heading.textContent=icon+' '+title;
    const subtitle=document.createElement('span');subtitle.textContent=german+' · '+description;
    button.append(heading,subtitle);button.onclick=()=>{
      closeAppNavigator();switchTab(id);document.getElementById('main-view-container').focus({preventScroll:true});
    };results.append(button);
  }
  document.getElementById('destination-count').textContent=matches.length?`${matches.length} بخش پیدا شد`:'بخشی پیدا نشد؛ مثلاً «گرامر»، «کتاب» یا SRS را جست‌وجو کن.';
}
function openAppNavigator() {
  const dialog=document.getElementById('app-navigator');if(!dialog||dialog.open)return;
  navigatorReturnFocus=document.activeElement;
  if(dialog.showModal)dialog.showModal();else dialog.setAttribute('open','');
  const input=document.getElementById('destination-search');input.value='';appNavigatorResults();input.focus();
}
function closeAppNavigator() {
  const dialog=document.getElementById('app-navigator');if(!dialog)return;
  if(dialog.close)dialog.close();else dialog.removeAttribute('open');
  if(navigatorReturnFocus?.isConnected)navigatorReturnFocus.focus();
}
function setAppPreference(name,value) {
  if(!['focus','large'].includes(name))return;
  const enabled=Boolean(value);document.body.classList.toggle('app-'+name,enabled);
  const button=document.getElementById('app-'+name);if(button)button.setAttribute('aria-pressed',String(enabled));
  try{localStorage.setItem('deutschritter-ui-'+name,enabled?'1':'0');}catch(_){}
}
document.addEventListener('DOMContentLoaded',()=>{
  const input=document.getElementById('destination-search');if(!input)return;
  input.addEventListener('input',appNavigatorResults);
  input.addEventListener('keydown',event=>{if(event.key==='ArrowDown'){event.preventDefault();document.querySelector('#destination-results button')?.focus();}});
  document.getElementById('app-navigator').addEventListener('cancel',event=>{event.preventDefault();closeAppNavigator();});
  for(const name of ['focus','large']) {
    let enabled=false;try{enabled=localStorage.getItem('deutschritter-ui-'+name)==='1';}catch(_){}
    setAppPreference(name,enabled);
    document.getElementById('app-'+name).onclick=()=>setAppPreference(name,!document.body.classList.contains('app-'+name));
  }
  document.addEventListener('keydown',event=>{
    const editing=event.target?.matches?.('input,textarea,select,[contenteditable="true"]');
    if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='k'){event.preventDefault();openAppNavigator();}
    else if(event.key==='/'&&!editing&&!event.ctrlKey&&!event.metaKey&&!event.altKey){event.preventDefault();openAppNavigator();}
    else if(event.key==='Escape'&&document.getElementById('app-navigator').open)closeAppNavigator();
  });
  syncAppShell();
});
