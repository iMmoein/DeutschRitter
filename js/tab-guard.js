/* Web Locks elect one writer. Without them, stale-snapshot checks are best-effort, not atomic CAS. */
let tabWriteAccess = navigator.locks?.request ? 'pending' : 'fallback';
let expectedStoredSave;
let releaseTabWriter = null;
let writerRequest = null;
function tabGuardNotice(message) {
  console.warn(message);
  if(typeof document.createElement !== 'function') return;
  let box=document.getElementById('tab-guard-status');
  if(!box) {
    box=document.createElement('section');box.id='tab-guard-status';box.setAttribute('role','alert');
    box.style.cssText='position:sticky;top:0;z-index:10001;background:#78350f;color:white;padding:12px';
    const text=document.createElement('p');text.id='tab-guard-message';box.append(text);
    for(const [label,action] of [
      ['خروجی پیشرفت همین تب',()=>exportSave()],
      ['خواندن آخرین ذخیره',()=>reloadSharedProgress()],
      ['تلاش برای گرفتن دسترسی نوشتن',()=>initializeTabProtection()]
    ]) {const button=document.createElement('button');button.textContent=label;button.addEventListener('click',action);box.append(button);}
    document.body.prepend(box);
  }
  document.getElementById('tab-guard-message').textContent=message;
}
function clearTabGuardNotice() {document.getElementById('tab-guard-status')?.remove?.();}
function rememberStoredSave(raw) {expectedStoredSave=raw;}
function assertTabCanWrite() {
  if(!['writer','fallback'].includes(tabWriteAccess)) {
    tabGuardNotice('این تب اجازه ذخیره ندارد. تب نویسنده دیگر را ببند و دوباره تلاش کن. تمرین این تب تا آن زمان فقط در حافظه است؛ برای نگه‌داشتنش خروجی بگیر.');
    throw Object.assign(new Error('Tab has no writer access'),{name:'ProgressConflictError'});
  }
  const actual=localStorage.getItem(STORAGE_KEY);
  if(expectedStoredSave!==undefined && actual!==expectedStoredSave) {
    tabGuardNotice('ذخیره در تب یا برنامه دیگری تغییر کرده است؛ نوشتن متوقف شد تا پیشرفت دیگری بازنویسی نشود. پیش از خواندن آخرین ذخیره، از این تب خروجی بگیر.');
    throw Object.assign(new Error('Stale progress snapshot'),{name:'ProgressConflictError'});
  }
}
function initializeTabProtection() {
  if(!navigator.locks?.request) {tabWriteAccess='fallback';return true;}
  if(tabWriteAccess==='writer') return true;
  if(writerRequest) return writerRequest;
  writerRequest=new Promise(resolve=>{
    navigator.locks.request('deutschritter-progress-writer', {ifAvailable:true,mode:'exclusive'}, lock=>{
      if(!lock) {
        tabWriteAccess='blocked';
        tabGuardNotice('یک تب دیگر نویسنده پیشرفت است. این تب می‌تواند تمرین کند یا خروجی بگیرد، اما ذخیره/ورود فایل تا بستن تب نویسنده متوقف است.');
        resolve(false);return;
      }
      tabWriteAccess='writer';clearTabGuardNotice();resolve(true);
      return new Promise(release=>{releaseTabWriter=()=>{tabWriteAccess='released';releaseTabWriter=null;release();};});
    }).catch(()=>{
      tabWriteAccess='blocked';tabGuardNotice('گرفتن قفل ذخیره ممکن نشد؛ برای جلوگیری از تداخل، نوشتن در این تب متوقف است.');resolve(false);
    });
  });
  const result=writerRequest;
  result.then(()=>{writerRequest=null;});
  return result;
}
function reloadSharedProgress() {
  if(typeof window.confirm==='function' && !window.confirm('تغییرات ذخیره‌نشده این تب کنار گذاشته می‌شود. قبلاً خروجی گرفته‌ای؟')) return false;
  if(!loadSave()) return false;
  document.body.classList.toggle('de-only',gameState.germanOnly);
  renderActiveView();updateTopBar();
  if(['writer','fallback'].includes(tabWriteAccess)) clearTabGuardNotice();
  return true;
}
if(typeof window.addEventListener==='function') {
  window.addEventListener('storage',event=>{
    let changed=false;
    try {changed=(event.key===STORAGE_KEY || event.key===null) && expectedStoredSave!==undefined && localStorage.getItem(STORAGE_KEY)!==expectedStoredSave;} catch(_) {}
    if(changed) tabGuardNotice('ذخیره در تب دیگری تغییر کرد. این تب آن را خودکار بازنویسی نمی‌کند؛ ابتدا خروجی بگیر و آخرین ذخیره را بخوان.');
  });
  window.addEventListener('pagehide',()=>{if(releaseTabWriter) releaseTabWriter();});
  window.addEventListener('pageshow',event=>{if(event.persisted) initializeTabProtection();});
}
