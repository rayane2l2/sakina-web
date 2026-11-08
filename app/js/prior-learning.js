import {splitPageUnits} from './page-core.js';
// Self-declared recent learning: not old mastered knowledge and not an ASR verdict.
export function importRecent(state,ids,today,M,daysAgo=2){
 const allowed=new Set(state.units),fresh=[...new Set(ids)].filter(id=>allowed.has(id)&&!state.items[id]);
 if(!fresh.length)return state;
 const age=Math.max(1,Math.min(state.recentDays||7,Math.round(Number(daysAgo)||2))),d=new Date(today+'T12:00:00Z');
 d.setUTCDate(d.getUTCDate()-age);const learned=d.toISOString().slice(0,10);
 const next=M.learn(state,fresh,learned);
 for(const id of fresh)next.items[id]={...next.items[id],importedRecent:true,interval:1,due:today};
 next.log=next.log.map((event,i)=>i===next.log.length-1?{...event,source:'import-recent'}:event).sort((a,b)=>a.date.localeCompare(b.date));
 return next;
}

export function knowledgeGroups(units,corpus,sections){
 const names=new Map(sections.map(s=>[s.id,s.name])),totals=new Map(sections.map(s=>[s.id,s.units?.length])),groups=new Map();
 const add=(id,n)=>{id=String(id);if(!groups.has(id))groups.set(id,{id,name:names.get(id)||id,total:totals.get(id),numbers:new Set()});groups.get(id).numbers.add(Number(n));};
 for(const unit of units){if(corpus==='quran')for(const w of unit.wordRefs||[])add(w.s,w.a);else add(unit.id.split(':')[0],unit.n);}
 return [...groups.values()].map(g=>({...g,numbers:[...g.numbers].sort((a,b)=>a-b)}));
}
export const defaultKnownRange=group=>({section:group.id,whole:true,from:group.numbers[0],to:group.numbers.at(-1),days:2});
export function readKnownRanges(values,draft,groups){
 const previous=draft.knownRanges?.length?draft.knownRanges:(groups[0]?[defaultKnownRange(groups[0])]:[]);
 return previous.map((old,i)=>{
  const id=values[`knownSection_${i}`]??old.section,group=groups.find(g=>g.id===id);if(!group)return null;
  if(id!==old.section)return defaultKnownRange(group);
  if(values[`knownSection_${i}`]===undefined)return old;
  return {section:id,whole:Boolean(values[`knownWhole_${i}`]),from:Number(values[`knownFrom_${i}`]??old.from),to:Number(values[`knownTo_${i}`]??old.to),days:Number(values[`knownDays_${i}`]||old.days||2)};
 }).filter(Boolean);
}
export function validateKnowledgeRows(rows,groups){
 for(const row of rows){const group=groups.find(g=>g.id===row.section);if(!group)throw Error('Choisis une sourate ou un chapitre du programme.');
  if(!row.whole&&(!Number.isInteger(row.from)||!Number.isInteger(row.to)||row.from>row.to||!group.numbers.includes(row.from)||!group.numbers.includes(row.to)))throw Error('Vérifie les limites des passages déjà appris.');
 }
}
function pageMemoryByVerse(state,lookup){
 if(!state.units.some(id=>/^p[0-9]+:/.test(id)))return state;
 const replacement=new Map(state.units.map(id=>[id,splitPageUnits([lookup(id)])])),items={},sizes={};
 const expand=ids=>[...new Set(ids.flatMap(id=>replacement.has(id)?replacement.get(id).map(u=>u.id):[id]))];
 for(const [id,parts] of replacement)for(const part of parts){if(state.items[id])items[part.id]={...state.items[id]};sizes[part.id]=part.size??state.sizes?.[id]??1;}
 return {...state,units:expand(state.units),queue:expand(state.queue),items,sizes,log:state.log.map(event=>Array.isArray(event.ids)?{...event,ids:expand(event.ids)}:event)};
}
export function applyKnowledgeRows(state,rows,corpus,sections,lookup,today,M){
 const groups=knowledgeGroups(state.units.map(lookup),corpus,sections);validateKnowledgeRows(rows,groups);
 let next=corpus==='quran'&&state.measure==='page'?pageMemoryByVerse(state,lookup):state;
 for(const row of rows){const group=groups.find(g=>g.id===row.section),chosen=new Set(group.numbers.filter(n=>row.whole||(n>=row.from&&n<=row.to)).map(n=>`${group.id}:${n}`));
  const ids=next.units.filter(id=>{const u=lookup(id);return corpus==='quran'?(u.wordRefs||[]).length>0&&u.wordRefs.every(w=>chosen.has(`${w.s}:${w.a}`)):chosen.has(`${id.split(':')[0]}:${u.n}`);});
  next=importRecent(next,ids,today,M,row.days);
 }
 return next;
}
export function priorLearningFields(units,corpus,draft,escape,sections=[]){
 const active=draft.knownRecent===true||draft.knownRecent==='on',groups=knowledgeGroups(units,corpus,sections),ranges=readKnownRanges({},draft,groups),quran=corpus==='quran';
 const cards=ranges.map((row,i)=>{const group=groups.find(g=>g.id===row.section),label=quran?'verset':corpus==='ibn-ashir'?'vers':'passage';return `<section class="known-range"><div class="known-range-head"><label>${quran?'Sourate':'Chapitre'}<select name="knownSection_${i}">${groups.map(g=>`<option value="${escape(g.id)}" ${g.id===row.section?'selected':''}>${escape(g.name)}</option>`).join('')}</select></label><button type="button" class="btn known-remove" data-action="known-remove" data-index="${i}" aria-label="Retirer ${escape(group.name)}">×</button></div><label class="prior-check"><input type="checkbox" name="knownWhole_${i}" ${row.whole?'checked':''}>${group.total&&group.numbers.length<group.total?'Toute la portion du programme':quran?'Sourate entière':'Chapitre entier'}</label>${row.whole?'':`<div class="two-fields"><label>Du ${label}<input type="number" name="knownFrom_${i}" min="${group.numbers[0]}" max="${group.numbers.at(-1)}" value="${row.from}" required></label><label>Au ${label}<input type="number" name="knownTo_${i}" min="${group.numbers[0]}" max="${group.numbers.at(-1)}" value="${row.to}" required></label></div>`}<label>Dernier apprentissage<select name="knownDays_${i}">${[1,2,3,4,5,6,7].map(n=>`<option value="${n}" ${n===Number(row.days||2)?'selected':''}>${n===1?'Hier':'Il y a '+n+' jours'}</option>`).join('')}</select></label></section>`;}).join('');
 return `<details class="prior-learning" ${active?'open':''}><summary>Déjà commencé ?</summary><div class="prior-fields"><label class="prior-check"><input type="checkbox" name="knownRecent" ${active?'checked':''}>J’ai déjà appris certains passages</label>${active?`${cards}<button type="button" class="btn secondary known-add" data-action="known-add">+ Ajouter ${quran?'une sourate':'un chapitre'}</button><p class="small muted">Les passages choisis rejoignent les révisions récentes. Les autres restent à apprendre.</p>`:''}</div></details>`;
}
