/* Diagnostic user-journey probes. Findings are printed, not used as passing release assertions. */
const {JSDOM,VirtualConsole}=require('jsdom');
const fs=require('node:fs');
const html=fs.readFileSync('index.html','utf8').replace(/<script src="([^"]+)"><\/script>/g,(_,path)=>`<script>${fs.readFileSync(path,'utf8')}</script>`);
(async()=>{
 const errors=[],console=new VirtualConsole();console.on('jsdomError',error=>errors.push(error.message));
 const dom=new JSDOM(html,{url:'http://localhost/',runScripts:'dangerously',virtualConsole:console,beforeParse(window){window.scrollTo=()=>{};}});
 await new Promise(resolve=>dom.window.addEventListener('load',resolve,{once:true}));
 const w=dom.window,d=w.document;
 try {
  w.switchTab('plan');d.getElementById('coach-name').value='Audit';w.saveCoachProfile();
  const lockedDays=Array.from({length:28},(_,i)=>w.coachDay(i)).filter(day=>!w.eval('gameState.unlockedActs').includes(day.act.id)).length;
  w.openCoachDay(4);const speakingDestination={step:w.eval('gameState.currentQuestStep'),skillsTab:w.eval('skillsTab')};
  w.switchTab('plan');d.getElementById('coach-track').value='book';d.getElementById('coach-rebuild').checked=true;w.saveCoachProfile();
  const monthlyBookUnits=new Set(Array.from({length:28},(_,i)=>w.coachDay(i).unit.id)).size;
  d.getElementById('coach-name').value='Unsubmitted edit';w.setCoachView(28);const nameAfterViewChange=d.getElementById('coach-name').value;
  const oldDetails=d.querySelector('.coach-shell details');oldDetails.open=true;w.switchTab('map');oldDetails.dispatchEvent(new w.Event('toggle'));
  process.stdout.write(JSON.stringify({lockedDays,speakingDestination,monthlyBookUnits,nameAfterViewChange,lateDetailsErrors:errors,companion:{units:w.COMPANION_UNITS.length,choiceItems:w.COMPANION_UNITS.flatMap(unit=>unit.questions).length,optionCounts:[...new Set(w.COMPANION_UNITS.flatMap(unit=>unit.questions.map(q=>q.options.length)))]}},null,2)+'\n');
 } finally {dom.window.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
