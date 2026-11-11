/* Recording is local and temporary. Navigation revokes resources; ASR may use a browser service. */
let mediaGeneration=0,pendingMicrophone=false,practiceStream=null,practicePlayback=null,activeRecognition=null;
function releasePracticeStream() {
  if(practiceStream) {practiceStream.getTracks().forEach(track=>track.stop());practiceStream=null;}
}
function stopMediaPractice() {
  mediaGeneration++;pendingMicrophone=false;
  if(activeRecognition) {try{activeRecognition.abort();}catch(_){}activeRecognition=null;}
  const recorder=speakingState.mediaRecorder;
  if(recorder) {
    recorder.onstop=null;recorder.ondataavailable=null;recorder.onerror=null;
    try {if(recorder.state!=='inactive') recorder.stop();}catch(_){}
  }
  releasePracticeStream();speakingState.mediaRecorder=null;speakingState.audioChunks=[];
  if(practicePlayback) {practicePlayback.pause();practicePlayback=null;}
  if(speakingState.audioUrl) {URL.revokeObjectURL(speakingState.audioUrl);speakingState.audioUrl=null;}
}
async function toggleRecording() {
  const button=document.getElementById('rec-btn'),status=document.getElementById('rec-status'),play=document.getElementById('play-rec-btn');
  if(!button||!status||!play||pendingMicrophone) return;
  const existing=speakingState.mediaRecorder;
  if(existing && existing.state==='recording') {
    button.disabled=true;status.textContent='در حال آماده‌کردن ضبط…';
    try {existing.stop();}catch(_) {stopMediaPractice();button.disabled=false;status.textContent='توقف ضبط ناموفق بود؛ دوباره تلاش کن.';}
    releasePracticeStream();return;
  }
  if(existing && existing.state!=='inactive') return;
  if(!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder==='undefined') {status.textContent='مرورگر یا محیط اجرا از ضبط پشتیبانی نمی‌کند؛ تمرین را بدون ضبط انجام بده.';return;}
  stopMediaPractice();
  const generation=mediaGeneration;
  pendingMicrophone=true;button.disabled=true;play.disabled=true;status.textContent='منتظر اجازهٔ میکروفون…';
  try {
    const stream=await navigator.mediaDevices.getUserMedia({audio:true});
    if(generation!==mediaGeneration || !button.isConnected) {stream.getTracks().forEach(track=>track.stop());return;}
    practiceStream=stream;
    const supported=['audio/webm;codecs=opus','audio/mp4'].find(type=>MediaRecorder.isTypeSupported?.(type));
    const recorder=new MediaRecorder(stream,supported?{mimeType:supported}:undefined),chunks=[];
    speakingState.mediaRecorder=recorder;
    recorder.ondataavailable=event=>{if(generation===mediaGeneration && event.data?.size) chunks.push(event.data);};
    recorder.onerror=()=>{if(generation!==mediaGeneration)return;stopMediaPractice();button.disabled=false;status.textContent='ضبط خطا داشت؛ میکروفون متوقف شد.';};
    recorder.onstop=()=>{
      if(generation!==mediaGeneration) return;
      releasePracticeStream();
      if(!button.isConnected) return;
      button.disabled=false;button.textContent='🔴 شروع ضبط';
      if(!chunks.length) {status.textContent='صدایی ضبط نشد؛ دوباره تلاش کن.';return;}
      const blob=new Blob(chunks,{type:recorder.mimeType || chunks[0].type || 'audio/webm'});
      speakingState.audioUrl=URL.createObjectURL(blob);play.disabled=false;
      status.textContent='ضبط آماده است؛ فقط موقت در همین تب نگه داشته می‌شود و با خروج از بخش حذف می‌شود.';
    };
    recorder.start();button.disabled=false;button.textContent='⏹️ توقف ضبط';status.textContent='در حال ضبط؛ برای پایان، توقف را بزن.';
  } catch(_) {
    if(generation===mediaGeneration) {stopMediaPractice();button.disabled=false;status.textContent='میکروفون در دسترس نیست یا ضبط شروع نشد؛ هر دسترسی باز متوقف شد.';}
  } finally {if(generation===mediaGeneration) pendingMicrophone=false;}
}
function playRecording() {
  if(!speakingState.audioUrl) return;
  if(practicePlayback) practicePlayback.pause();
  practicePlayback=new Audio(speakingState.audioUrl);
  practicePlayback.play().catch(()=>{const status=document.getElementById('rec-status');if(status) status.textContent='پخش ضبط ممکن نشد؛ قالب صوت یا دسترسی مرورگر را بررسی کن.';});
}
function finishSpeaking() {
  const awarded=rewardOnce('speaking-completion:'+gameState.currentActId,20);
  showToast(`تمرین گفتن به گزارش خودت کامل شد؛ +${awarded} XP. این امتیاز، نمره مهارت نیست.`);
}
function startSpeechCheck(targetText,resultId) {
  const box=document.getElementById(resultId||'speech-result');
  const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
  if(!box) return;
  if(!SR) {box.textContent='مرورگر بازشناسی گفتار ندارد؛ تمرین را بدون آن انجام بده.';return;}
  if(!targetText) {box.textContent='متن هدف پیدا نشد.';return;}
  stopMediaPractice();const generation=mediaGeneration;
  const recognition=new SR();activeRecognition=recognition;
  recognition.lang='de-DE';recognition.interimResults=false;recognition.maxAlternatives=1;
  box.textContent='منتظر گفتار آلمانی… این سرویس مرورگر ممکن است صدا را آنلاین پردازش کند. هدف: '+targetText;
  recognition.onresult=event=>{
    if(generation!==mediaGeneration || !box.isConnected) return;
    const said=event.results?.[0]?.[0]?.transcript;
    if(typeof said!=='string') return;
    const percentage=Math.round(wordAccuracy(normDict(targetText).split(' ').filter(Boolean),normDict(said).split(' ').filter(Boolean))*100);
    box.textContent=`رونویسی: ${said} — تطابق متن: ${percentage}٪. این نمره تلفظ یا مکالمه نیست.`;
    if(percentage>=80) rewardOnce('speech:'+targetText,10);
  };
  recognition.onerror=()=>{if(generation===mediaGeneration && box.isConnected)box.textContent='بازشناسی گفتار ممکن نشد؛ میکروفون، اجازه یا اتصال را بررسی کن.';};
  recognition.onend=()=>{if(activeRecognition===recognition)activeRecognition=null;};
  try {recognition.start();}catch(_) {activeRecognition=null;box.textContent='شروع بازشناسی ممکن نشد.';}
}
if(typeof window.addEventListener==='function')window.addEventListener('pagehide',stopMediaPractice);
