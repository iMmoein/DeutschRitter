/* Browser voice availability is not a promise of offline or human-recorded audio. */
let audioGeneration=0,activeWordAudio=null,audioStartTimer=null;
function showAudioStatus(message) {
  if(typeof document.createElement!=='function') return;
  let box=document.getElementById('audio-status');
  if(!box) {box=document.createElement('div');box.id='audio-status';box.setAttribute('role','status');box.setAttribute('aria-live','polite');box.style.cssText='padding:8px;background:#0f172a;color:#e2e8f0';document.body.append(box);}
  box.textContent=message;
}
function stopGermanAudio() {
  audioGeneration++;
  if(audioStartTimer!==null) clearTimeout(audioStartTimer);
  audioStartTimer=null;
  if(activeWordAudio) {activeWordAudio.pause();activeWordAudio=null;}
  window.speechSynthesis?.cancel();
}
function speakGerman(text,speed=null,onStart=null) {
  stopGermanAudio();
  const generation=audioGeneration;
  let announced=false, fallbackStarted=false;
  const started=()=>{if(generation!==audioGeneration || announced) return;announced=true;clearTimeout(audioStartTimer);showAudioStatus('پخش آلمانی آغاز شد؛ شنیده‌شدن واقعی به دستگاه بستگی دارد.');if(onStart) onStart();};
  const failure=()=>{if(generation===audioGeneration) showAudioStatus('پخش صدا ناموفق بود؛ صدای آلمانی مرورگر، دسترسی و اتصال را بررسی کن. این تلاش شنیداری محسوب نمی‌شود.');};
  showAudioStatus('در انتظار شروع پخش آلمانی…');
  audioStartTimer=setTimeout(failure,8000);
  const fallback=()=>{
    if(generation!==audioGeneration || fallbackStarted) return;fallbackStarted=true;
    if(!window.speechSynthesis || typeof SpeechSynthesisUtterance==='undefined') {clearTimeout(audioStartTimer);failure();return;}
    try {
      const utter=new SpeechSynthesisUtterance(String(text));utter.lang='de-DE';utter.rate=speed||gameState.ttsSpeed||1;
      const voice=window.speechSynthesis.getVoices().find(v=>v.lang.toLowerCase().startsWith('de'));
      if(voice) utter.voice=voice;
      utter.onstart=started;utter.onerror=failure;
      utter.onend=()=>{if(generation===audioGeneration)showAudioStatus('پخش تمام شد. صدا سنتز مرورگر است؛ ضبط انسانی یا آفلاین‌بودن تضمین نمی‌شود.');};
      window.speechSynthesis.speak(utter);
    } catch(_) {failure();}
  };
  const file=window.DEUTSCHRITTER_AUDIO_INSTALLED===true && (window.AUDIO_MAP||{})[text];
  if(file) {
    try {
      const audio=new Audio(file);activeWordAudio=audio;audio.playbackRate=speed||gameState.ttsSpeed||1;
      audio.addEventListener('playing',started,{once:true});
      audio.addEventListener('error',fallback,{once:true});
      audio.play().catch(fallback);return;
    } catch(_) {}
  }
  fallback();
}
