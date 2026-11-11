const fs = require('node:fs');
const vm = require('node:vm');
const html=fs.readFileSync('index.html','utf8');
const data=JSON.parse(html.match(/window.GAME_DATA = (.*);/)[1]);
const sandbox={window:{}};
vm.runInNewContext(fs.readFileSync('js/learning-data.js','utf8'),sandbox);
vm.runInNewContext(fs.readFileSync('js/transfer-data.js','utf8'),sandbox);
sandbox.window.GAME_DATA=data;
vm.runInNewContext(fs.readFileSync('js/clinic-data.js','utf8'),sandbox);
vm.runInNewContext(fs.readFileSync('js/document-data.js','utf8'),sandbox);
const units=sandbox.window.LEARNING_UNITS;
const words=data.acts.flatMap(a=>a.vocab);
const missing = field => words.filter(w=>!w[field]).length;
let invalid=0;
const check=q=>{if(!Array.isArray(q.options)||!Number.isInteger(q.ans)||q.ans<0||q.ans>=q.options.length)invalid++;};
data.placement.forEach(check);data.placementListening.forEach(check);
data.acts.forEach(a=>a.bossQuestions.forEach(check));
Object.values(data.reading).forEach(t=>t.questions.forEach(check));
data.readingLibrary.forEach(t=>(t.questions||[]).forEach(check));
for(const act of data.acts){
 const unit=units[act.id];
 if(!unit||unit.exercises.length!==3||unit.exercises.some(q=>!q.answers.length)||unit.listening.answer<0||unit.listening.answer>=unit.listening.options.length)invalid++;
}
for(const variants of Object.values(sandbox.window.TRANSFER_UNITS)) for(const variant of variants) if(variant.items.length!==3 || variant.items.some(q=>!q.answers.length)) invalid++;
const coverage=data.acts.map(act=>{
 const titles=[act.grammar.title,...data.grammarExtra[act.id].map(t=>t.title)];
 const topics=sandbox.window.GRAMMAR_CLINIC.filter(t=>t.act===act.id);
 if(titles.length!==topics.length||titles.some((title,i)=>title!==topics[i].title)) invalid++;
 return {act:act.id,topics:titles.length,clinicExercises:topics.reduce((n,t)=>n+t.exercises.length,0),independentReview:false};
});
if(data.grammarExtra.act3.some(t=>t.title.includes('es gibt + Dativ'))) invalid++;
console.log(JSON.stringify({coverage,grammarClinicTopics:sandbox.window.GRAMMAR_CLINIC.length,grammarClinicExercises:sandbox.window.GRAMMAR_CLINIC.reduce((n,t)=>n+t.exercises.length,0),transferVariants:Object.values(sandbox.window.TRANSFER_UNITS).flat().length,transferQuestions:Object.values(sandbox.window.TRANSFER_UNITS).flat().reduce((n,v)=>n+v.items.length,0),acts:data.acts.length,vocabularyEntries:words.length,uniqueVocabulary:new Set(words.map(w=>w.de)).size,missingIPA:missing('ipa'),missingExamples:missing('ex'),readingTexts:Object.keys(data.reading).length+data.readingLibrary.length,independentUnits:Object.keys(units).length,grammarSrs:data.grammarSrs.length,listeningSrs:data.listeningSrs.length,invalidQuestionStructures:invalid,note:'Structure audit only. Not a linguistic or CEFR certification.'},null,2));
if(invalid) process.exitCode=1;
