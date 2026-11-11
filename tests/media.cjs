const {JSDOM,VirtualConsole}=require('jsdom');
const {readFileSync}=require('node:fs');
const assert=require('node:assert/strict');
const html=readFileSync('index.html','utf8').replace(/<script src="([^"]+)"><\/script>/g,(_,p)=>`<script>${readFileSync(p,'utf8')}</script>`);
const errors=[],vc=new VirtualConsole();vc.on('jsdomError',e=>errors.push(e.message));
const tick=()=>new Promise(resolve=>setImmediate(resolve));
(async()=>{
 const dom=new JSDOM(html,{url:'http://localhost/',runScripts:'dangerously',virtualConsole:vc});
 await new Promise(resolve=>dom.window.addEventListener('load',resolve,{once:true}));
 const w=dom.window,d=w.document;
 try {
  w.scrollTo=()=>{};const revoked=[],blobs=[],recorders=[];
  w.URL.createObjectURL=blob=>{blobs.push(blob);return 'blob:test-'+blobs.length;};w.URL.revokeObjectURL=url=>revoked.push(url);
  const makeStream=()=>{const track={stopped:0,stop(){this.stopped++;}};return {track,getTracks:()=>[track]};};
  class Recorder {
   static isTypeSupported(type){return type==='audio/mp4';}
   constructor(stream,options){this.state='inactive';this.mimeType=options?.mimeType||'audio/webm';recorders.push(this);}
   start(){this.state='recording';}
   stop(){this.state='inactive';queueMicrotask(()=>{this.ondataavailable?.({data:new w.Blob(['sound'],{type:this.mimeType})});this.onstop?.();});}
  }
  w.MediaRecorder=Recorder;
  const show=()=>{w.openActQuest('act1');w.setQuestStep('skills');w.setSkillsTab('sprechen');};
  show();let resolvePermission,requests=0;
  Object.defineProperty(w.navigator,'mediaDevices',{configurable:true,value:{getUserMedia:()=>{requests++;return new Promise(resolve=>resolvePermission=resolve);}}});
  const delayed=makeStream(),pending=w.toggleRecording();await w.toggleRecording();assert.equal(requests,1);
  w.switchTab('map');resolvePermission(delayed);await pending;
  assert.equal(delayed.track.stopped,1);assert.equal(recorders.length,0);
  // Constructor failure must stop an already-authorized stream.
  show();const failed=makeStream();w.navigator.mediaDevices.getUserMedia=async()=>failed;
  w.MediaRecorder=class {constructor(){throw Error('unsupported');}};
  await w.toggleRecording();assert.equal(failed.track.stopped,1);assert.equal(w.eval('pendingMicrophone'),false);
  // Successful capture uses the supported MIME and does not enable playback until the blob exists.
  w.MediaRecorder=Recorder;const stream=makeStream();w.navigator.mediaDevices.getUserMedia=async()=>stream;
  await w.toggleRecording();assert.equal(w.eval('speakingState.mediaRecorder.state'),'recording');
  assert.equal(d.getElementById('play-rec-btn').disabled,true);
  await w.toggleRecording();await tick();
  assert.equal(stream.track.stopped,1);assert.equal(blobs.at(-1).type,'audio/mp4');
  assert.equal(d.getElementById('play-rec-btn').disabled,false);
  const saved=w.eval('speakingState.audioUrl');w.switchTab('map');await tick();
  assert(revoked.includes(saved));assert.equal(w.eval('speakingState.audioUrl'),null);
  // Leaving during capture stops the mic, and the old onstop handler cannot create a new blob.
  show();const second=makeStream();w.navigator.mediaDevices.getUserMedia=async()=>second;
  await w.toggleRecording();const oldStop=recorders.at(-1).onstop,blobCount=blobs.length;
  w.switchTab('map');oldStop();await tick();
  assert.equal(second.track.stopped,1);assert.equal(blobs.length,blobCount);
  // Recognition is aborted on navigation; a late result cannot award XP in another view/session.
  const recognitions=[];
  w.SpeechRecognition=class {constructor(){this.aborts=0;recognitions.push(this);}start(){}abort(){this.aborts++;}};
  show();w.startSpeechCheck('Ich wohne hier.');const previous=recognitions.at(-1),xp=w.eval('gameState.xp');
  w.switchTab('map');previous.onresult({results:[[{transcript:'Ich wohne hier.'}]]});
  assert.equal(previous.aborts,1);assert.equal(w.eval('gameState.xp'),xp);
  show();w.startSpeechCheck('Ich wohne hier.');recognitions.at(-1).onresult({results:[[{transcript:'<img src=x onerror=alert(1)>'}]]});
  assert.equal(d.getElementById('speech-result').querySelector('img'),null);
  const before=w.eval('gameState.daily.xp');w.finishSpeaking();w.finishSpeaking();assert.equal(w.eval('gameState.daily.xp'),before+20);
  assert.deepEqual(errors,[]);
  console.log('PASS: late microphone permission cleanup, duplicate-request guard, recorder failure, MIME selection, capture/URL teardown, stale callbacks, recognition abort/output safety and daily speaking reward cap.');
 } finally {w.stopMediaPractice();dom.window.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
