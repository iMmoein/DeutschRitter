/* Versioned, allowlisted persistence. Never report success after a failed write. */
const DEFAULT_GAME_STATE = JSON.parse(JSON.stringify(gameState));
let storageWriteBlocked = false;
function storageNotice(message) {
  console.warn(message);
  if (typeof document.createElement !== 'function') return;
  let box = document.getElementById('storage-status');
  if (!box) {
    box = document.createElement('div'); box.id='storage-status'; box.setAttribute('role','alert');
    box.style.cssText='position:sticky;top:0;z-index:9999;background:#7f1d1d;color:white;padding:12px;text-align:center';
    document.body.prepend(box);
  }
  box.textContent=message;
}
function clearStorageNotice() { const box=document.getElementById('storage-status'); if(box && box.remove) box.remove(); }
function createSaveSnapshot(state=gameState) {
  return { ...validateSave(state), version:'deutschritter-v7', exportedAt:new Date().toISOString() };
}
function rolloverDailyState() {
  const today=todayStr();
  if(gameState.daily.date!==today) {
    const yesterday=new Date(); yesterday.setDate(yesterday.getDate()-1);
    if(gameState.lastPlayDate && ![today,yesterday.toDateString()].includes(gameState.lastPlayDate)) gameState.streak=1;
    gameState.daily={date:today,xp:0,goal:gameState.daily.goal};
  }
}
function resetTransientProgress() {
  if(typeof companionUnitId!=='undefined') companionUnitId=null;
  cancelArenaTransition();
  stopExamTimer(); examSim.active=false;
  currentSrsCard=null;
  cancelLibraryQuizTransition();window.currentLibraryText=null;
  cancelReadingTransition();readingSessions.clear();
  answeredPractice.clear();
  learningAudioPlayed.clear();learningListeningAssisted.clear();activeTransfer=null;
  if(typeof stopGermanAudio==='function') stopGermanAudio();
  if(typeof stopMediaPractice==='function') stopMediaPractice();
}
function loadSave() {
  try {
    const raw=localStorage.getItem(STORAGE_KEY);
    rememberStoredSave(raw);
    const data=raw ? validateSave(JSON.parse(raw)) : {};
    gameState={...JSON.parse(JSON.stringify(DEFAULT_GAME_STATE)),...data};
    resetTransientProgress();
    storageWriteBlocked=false;
    rolloverDailyState();
    return true;
  } catch(error) {
    storageWriteBlocked=true;
    storageNotice('ذخیره خوانده نشد. برای جلوگیری از ازبین‌رفتن داده، ذخیره خودکار متوقف شد. از «بازیابی پشتیبان» استفاده کن یا فایل خروجی قبلی را وارد کن.');
    return false;
  }
}
function persistSnapshot(snapshot, mode='save') {
  assertTabCanWrite();
  const serialized=JSON.stringify(snapshot);
  const previous=localStorage.getItem(STORAGE_KEY);
  // Only preserve a previous save if it is valid; never replace a good backup with corrupt JSON.
  if(previous) {
    let valid=false;
    try { validateSave(JSON.parse(previous)); valid=true; } catch(_) {}
    if(valid && mode !== 'restore') localStorage.setItem(STORAGE_KEY + (mode === 'import' ? '_before_import' : '_backup'),previous);
  }
  localStorage.setItem(STORAGE_KEY,serialized);
  rememberStoredSave(serialized);
}
function saveState() {
  if(storageWriteBlocked) return false;
  try { persistSnapshot(createSaveSnapshot()); clearStorageNotice(); return true; }
  catch(error) { if(error.name==='ProgressConflictError') return false; storageNotice('ذخیره انجام نشد؛ فضای مرورگر یا دسترسی ذخیره‌سازی را بررسی کن. پیش از بستن برنامه خروجی JSON بگیر.'); return false; }
}
function replaceProgress(input, mode='import') {
  if (!['import','restore'].includes(mode)) throw new Error('Invalid replacement mode');
  const data=validateSave(input);
  const candidate={...JSON.parse(JSON.stringify(DEFAULT_GAME_STATE)),...data};
  const snapshot=createSaveSnapshot(candidate);
  // Commit storage before changing live progress; failed imports leave the session unchanged.
  persistSnapshot(snapshot, mode);
  resetTransientProgress();
  gameState=candidate;
  storageWriteBlocked=false;
  rolloverDailyState();
  document.body.classList.toggle('de-only',gameState.germanOnly);
  clearStorageNotice();
  renderActiveView(); updateTopBar();
}
function restoreBackup(source='backup') {
  if(!['backup','before_import','recovery_point'].includes(source)) return false;
  try {
    assertTabCanWrite();
    const raw=localStorage.getItem(STORAGE_KEY+'_'+source);
    if(!raw) { showToast('این نوع پشتیبان موجود نیست؛ فایل خروجی قبلی را وارد کن.'); return false; }
    const snapshot=createSaveSnapshot({...JSON.parse(JSON.stringify(DEFAULT_GAME_STATE)),...validateSave(JSON.parse(raw))});
    // Freeze the recovery source independently of rolling autosaves.
    if(source !== 'recovery_point') localStorage.setItem(STORAGE_KEY+'_recovery_point',JSON.stringify(snapshot));
    replaceProgress(snapshot,'restore');
    showToast('پشتیبان بازیابی شد؛ نقطه بازیابی ثابت نگه داشته شد.'); return true;
  } catch(error) { storageNotice('بازیابی انجام نشد؛ پشتیبان نامعتبر است یا مرورگر اجازه ذخیره نمی‌دهد.'); return false; }
}
function backupDate(source) {
  try {
    const data=JSON.parse(localStorage.getItem(STORAGE_KEY+'_'+source)||'null');
    if(!data) return 'موجود نیست';
    validateSave(data);
    const date=new Date(data.exportedAt);
    return Number.isFinite(date.getTime()) ? date.toLocaleString('fa-IR') : 'نسخه قدیمی؛ بدون تاریخ';
  } catch(_) {return 'نامعتبر یا غیرقابل‌دسترسی';}
}
function exportSave() {
  try {
    const blob=new Blob([JSON.stringify(createSaveSnapshot(),null,2)],{type:'application/json'});
    const url=URL.createObjectURL(blob), link=document.createElement('a');
    link.href=url;link.download=`deutschritter-save-${new Date().toISOString().slice(0,10)}.json`;link.click();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
    showToast('خروجی پیشرفت دانلود شد.');
  } catch(error) { storageNotice('ساخت خروجی ممکن نشد؛ پیشرفت فعلی را نبند و خطا را بررسی کن.'); }
}
function importSave(event) {
  const file=event.target.files[0];
  if(!file) return;
  event.target.value='';
  if(file.size>5*1024*1024) { showToast('فایل ذخیره باید کمتر از ۵ مگابایت باشد.'); return; }
  const reader=new FileReader();
  reader.onerror=()=>storageNotice('خواندن فایل ممکن نشد؛ پیشرفت تغییر نکرد.');
  reader.onload=()=>{
    try { replaceProgress(JSON.parse(reader.result)); showToast('پیشرفت وارد شد؛ پیشرفت قبلیِ معتبر در پشتیبان پیش از ورود فایل است.'); }
    catch(error) { storageNotice('ورود فایل انجام نشد: داده نامعتبر است یا ذخیره‌سازی مرورگر در دسترس نیست. پیشرفت فعلی تغییر نکرد.'); }
  };
  reader.readAsText(file);
}
