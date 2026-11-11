const vm=require('node:vm'),fs=require('node:fs'),assert=require('node:assert/strict');
const handlers={},entries=new Map(),deleted=[],keys=['deutschritter-shell-v6','deutschritter-shell-v14','deutschritter-other-app','other-cache'];
let cacheFails=false,networkFails=false,openFails=false;
const cache={addAll:async()=>{},put:async(k,v)=>{if(cacheFails)throw Error('quota');entries.set(k,v);},match:async k=>entries.get(k)};
const response=()=>{const r=new Response('network');Object.defineProperty(r,'type',{value:'basic'});return r;};
const context=vm.createContext({URL,Response,Set,self:{location:{href:'https://example.test/app/sw.js',origin:'https://example.test'},addEventListener:(k,fn)=>handlers[k]=fn,skipWaiting:async()=>{},clients:{claim:async()=>{}}},caches:{open:async()=>{if(openFails)throw Error('cache disabled');return cache;},keys:async()=>keys,delete:async k=>deleted.push(k)},fetch:async()=>{if(networkFails)throw Error('offline');return response();}});
vm.runInContext(fs.readFileSync('sw.js','utf8'),context);
async function request(path,options={}) {
 let result;const pending=[];
 handlers.fetch({request:{url:new URL(path,'https://example.test').href,method:options.method||'GET',mode:options.mode||'cors'},respondWith:r=>result=r,waitUntil:p=>pending.push(p)});
 const value=await result;await Promise.all(pending);return value;
}
(async()=>{
 const promises=[];handlers.activate({waitUntil:p=>promises.push(p)});await Promise.all(promises);
 assert.deepEqual(deleted,['deutschritter-shell-v6']);
 assert.equal(await request('/app/index.html',{method:'POST'}),undefined);
 assert.equal(await request('https://other.test/index.html'),undefined);
 assert.equal(await request('/app/not-a-core-resource.mp3'),undefined);
 assert.equal((await request('/app/index.html')).status,200);
 cacheFails=true;assert.equal((await request('/app/index.html')).status,200);
 openFails=true;assert.equal((await request('/app/index.html')).status,200);openFails=false;cacheFails=false;
 networkFails=true;assert.equal((await request('/app/anything',{mode:'navigate'})).status,200);
 entries.clear();assert.equal((await request('/app/index.html')).status,503);
 console.log('PASS: service-worker cache ownership, request scope, offline navigation, unavailable response and network success despite cache/quota failures.');
})().catch(e=>{console.error(e);process.exitCode=1;});
