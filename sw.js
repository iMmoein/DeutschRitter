/* Local app shell only. TTS voices and optional media are not guaranteed offline. */
const CACHE = 'deutschritter-shell-v17';
const CORE = ['./', './index.html', './studio.css', './ui-shell.css', './hero.jpg', './README.txt', './manifest.webmanifest', './icon.svg', './js/save-schema.js', './js/tab-guard.js', './js/persistence.js', './js/progress.js', './js/writing-feedback.js', './js/learning-data.js', './js/learning-lab.js', './js/transfer-data.js', './js/transfer-lab.js', './js/clinic-data.js', './js/clinic.js', './js/document-data.js', './js/audio.js', './js/media-practice.js', './js/companion-data.js', './js/companion.js', './js/studio.js', './js/ui-shell.js', './js/coach.js'];
const CORE_URLS = new Set(CORE.map(path => new URL(path, self.location.href).href));
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => (key.startsWith('deutschritter-shell-') || key === 'deutschritter-v4') && key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const url=new URL(event.request.url);
  if(event.request.method!=='GET' || url.origin!==self.location.origin) return;
  url.search='';url.hash='';
  if(!CORE_URLS.has(url.href) && event.request.mode!=='navigate') return;
  event.respondWith((async()=>{
    // Cache failures must never turn a successful network response into an offline error.
    let cache;
    try {cache=await caches.open(CACHE);} catch(_) {}
    try {
      const response=await fetch(event.request);
      if(cache && response.ok && response.type==='basic' && CORE_URLS.has(url.href)) {
        event.waitUntil(cache.put(url.href,response.clone()).catch(()=>{}));
      }
      return response;
    } catch(_) {
      try {
        const cached=cache && (await cache.match(url.href) || (event.request.mode==='navigate' ? await cache.match(new URL('./index.html', self.location.href).href) : null));
        if(cached) return cached;
      } catch(_) {}
      return new Response('Offline: resource unavailable',{status:503,headers:{'Content-Type':'text/plain; charset=utf-8'}});
    }
  })());
});
