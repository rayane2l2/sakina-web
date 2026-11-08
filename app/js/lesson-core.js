// Listening is guided; memorisation itself remains the learner's decision.
export const listeningGoal=repeat=>Math.max(1,Math.min(20,Number(repeat)||5));
export const canRecite=()=>true;
export const canCompleteLesson=options=>!options.busy;
export const recognitionAvailable=(corpus,step=null)=>corpus==='quran'&&(!step||step.kind==='review');
export function lessonInstruction(kind,phase,needsAudio=true,voiceAllowed=false){
 if(phase==='listen')return needsAudio?'Écoute en suivant le texte. Passe à la récitation quand tu es prêt.':'Lis cette petite portion, puis essaie de la redire de mémoire.';
 return ({single:'Récite ce passage de mémoire, autant que tu veux. Vérifie le texte si besoin.',group:'Récite ces passages ensemble pour travailler leur enchaînement.',link:'Repars du début et relie les passages déjà appris.',test:'Récite toute la nouvelle portion de mémoire. Continue quand tu la maîtrises.',review:'Essaie de mémoire avant de regarder.'+(voiceAllowed?' Le micro est une aide facultative.':'')})[kind]||'Récite à ton rythme. Tu décides quand tu maîtrises.';
}
export function learningTargets(corpus,units){
 if(corpus!=='quran'||!units.some(u=>u.id.startsWith('p')))return units;
 const targets=[];
 for(const unit of units)for(const w of unit.wordRefs){
  const id=`${w.s}:${w.a}`;let target=targets.at(-1);
  if(!target||target.id!==id){target={id,n:w.a,page:unit.page,pages:[],wordRefs:[],sources:[id],text:''};targets.push(target);}
  if(!target.pages.includes(unit.page))target.pages.push(unit.page);target.wordRefs.push(w);
 }
 for(const target of targets)target.text=target.wordRefs.map(w=>w.text).join(' ');
 return targets;
}
// Text-only corpora paginate instead of overflowing the fixed reading viewport.
export function textSheets(units,width=350,height=350){
 const charsPerLine=Math.max(12,Math.floor((width-30)/13)),maxLines=Math.max(2,Math.floor((height-22)/36));
 const budget=Math.max(20,charsPerLine*maxLines),sheets=[];let sheet=[],used=0;
 const push=()=>{if(sheet.length){sheets.push(sheet);sheet=[];used=0;}};
 for(const unit of units){
  let words=[],length=0;
  const fragment=()=>{if(!words.length)return;if(used+length>budget)push();sheet.push({...unit,text:words.join(' ')});used+=length+charsPerLine;words=[];length=0;};
  for(const word of unit.text.split(/\s+/)){if(length+word.length+1>budget)fragment();words.push(word);length+=word.length+1;}
  fragment();
 }
 push();return sheets;
}
