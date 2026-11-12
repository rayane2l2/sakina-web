// Bounded Quran workload: last three acquired lessons + at most one older task.
const dayMs=86400000,wordKey=w=>`${w.s}:${w.a}:${w.w}`;
export const QURAN_PLAN_VERSION='bounded-monthly-v2';
export function nextMonth(date){const [y,m,d]=date.split('-').map(Number),last=new Date(Date.UTC(y,m+1,0)).getUTCDate();return new Date(Date.UTC(y,m,Math.min(d,last))).toISOString().slice(0,10);}
const addDays=(d,n)=>new Date(Date.parse(d+'T12:00:00Z')+n*dayMs).toISOString().slice(0,10);
const doneOn=(state,date)=>new Set(state.log.filter(e=>e.date===date&&['learn','review'].includes(e.kind)).flatMap(e=>e.ids||[]));
function groups(state,sections,resolve){const known=state.units.filter(id=>state.items[id]),knownWords=new Set(),bySurah=new Map();for(const id of known){const u=resolve(id);if(!u)continue;for(const w of u.wordRefs||[])knownWords.add(wordKey(w));const sid=String(u.wordRefs?.[0]?.s||u.id.split(':')[0]);if(!bySurah.has(sid))bySurah.set(sid,[]);bySurah.get(sid).push(id);}
 return sections.map(s=>{const ids=bySurah.get(String(s.id))||[],complete=s.units.every(u=>state.items[u.id]||(u.wordRefs?.length&&u.wordRefs.every(w=>knownWords.has(wordKey(w)))));return {sid:String(s.id),ids,section:s,pages:[...new Set(s.units.flatMap(u=>u.pages||[u.page]))],complete};}).filter(g=>g.ids.length);}
export function seedLongSurahs(state,sections,resolve,date){const registry={...state.longSurahs};for(const g of groups(state,sections,resolve))if(g.complete&&g.pages.length>=2&&!registry[g.sid])registry[g.sid]={completedOn:date,nextWhole:nextMonth(date),completionPending:false};return {...state,longSurahs:registry};}
export function registerLongCompletion(before,after,sections,resolve,date){const previous=new Set(groups(before,sections,resolve).filter(g=>g.complete).map(g=>g.sid)),registry={...after.longSurahs};for(const g of groups(after,sections,resolve))if(g.complete&&g.pages.length>=2&&!previous.has(g.sid))registry[g.sid]={completedOn:date,nextWhole:date,completionPending:true};return {...after,longSurahs:registry};}
export function completeQuranRotation(state,rotation,date){if(!rotation||rotation.kind!=='bounded-consolidation')return state;const done=doneOn(state,date);if(!rotation.ids.every(id=>done.has(id)))return state;const next={...state,consolidationDate:date,consolidationKey:rotation.key};if(rotation.wholeLong)next.longSurahs={...state.longSurahs,[rotation.sid]:{...state.longSurahs?.[rotation.sid],completedOn:state.longSurahs?.[rotation.sid]?.completedOn||date,nextWhole:nextMonth(date),completionPending:false}};return next;}
export function completionReview(state,sections,resolve){const group=groups(state,sections,resolve).find(g=>state.longSurahs?.[g.sid]?.completionPending);if(!group)return null;return {ids:group.ids,kind:'review',test:true,label:'Récitation complète · '+group.section.name,macroRotation:{kind:'bounded-consolidation',key:'whole:'+group.sid,sid:group.sid,wholeLong:true,ids:group.ids}};}
export function boundedQuranPlan(state,date,M,{sections,resolve}){
 const fresh=M.nextNew(state,date),knownGroups=groups(state,sections,resolve),knownIds=new Set(state.units.filter(id=>state.items[id])),done=doneOn(state,date);
 const lessons=state.log.filter(e=>e.kind==='learn'&&e.source!=='import-recent').map(e=>e.ids||state.units.filter(id=>state.items[id]?.first===e.date)).filter(ids=>ids.length).slice(-3);
 const recent=new Set(lessons.flat().filter(id=>knownIds.has(id))),active=fresh[0]&&resolve(fresh[0]),activeSid=String(active?.wordRefs?.[0]?.s||active?.id.split(':')[0]||'');
 // Short surahs accumulate their entire acquired prefix, not just three portions.
 for(const g of knownGroups)if(g.pages.length<2&&(g.sid===activeSid||g.ids.some(id=>recent.has(id))))for(const id of g.ids)recent.add(id);
 const candidates=[];
 if(state.consolidationDate!==date)for(const g of knownGroups){
  // A finished long surah leaves the page rotation. Its monthly task includes the entire surah.
  if(g.complete&&g.pages.length>=2){
   const latest=g.ids.map(id=>state.items[id].learned||state.items[id].first).sort().at(-1)||date;
   const meta=state.longSurahs?.[g.sid]||{nextWhole:nextMonth(latest)};
   if(meta.nextWhole<=date&&!g.ids.every(id=>done.has(id))){
    candidates.push({key:'whole:'+g.sid,sid:g.sid,ids:g.ids,wholeLong:true,due:meta.nextWhole,priority:meta.completionPending?0:1});
   }
   continue;
  }
  const ids=g.ids.filter(id=>!recent.has(id)&&!done.has(id));
  if(!ids.length)continue;
  if(g.pages.length<2){const due=ids.map(id=>state.items[id].due||date).sort()[0];if(due<=date)candidates.push({key:'surah:'+g.sid,sid:g.sid,ids,due,priority:2});}
  else{const pages=new Map();for(const id of ids){const u=resolve(id),page=u.pages?.[0]||u.page;if(!pages.has(page))pages.set(page,[]);pages.get(page).push(id);}for(const [page,pageIds] of pages){const latest=state.log.filter(e=>e.kind==='review'&&e.ids?.some(id=>pageIds.includes(id))).map(e=>e.date).sort().at(-1),learned=pageIds.map(id=>state.items[id].learned||state.items[id].first).sort().at(-1)||date,due=addDays(latest||learned,7);if(due<=date)candidates.push({key:`page:${g.sid}:${page}`,sid:g.sid,ids:pageIds,due,priority:3,page});}}
 }
 candidates.sort((a,b)=>a.priority-b.priority||a.due.localeCompare(b.due)||Number(a.sid)-Number(b.sid)||(a.page||0)-(b.page||0));const chosen=candidates[0];
 const recentIds=state.units.filter(id=>recent.has(id)&&!done.has(id));const revision=chosen?[{ids:chosen.ids,label:chosen.wholeLong?'Révision complète mensuelle':'Consolidation du jour',macroRotation:{...chosen,kind:'bounded-consolidation'}}]:[];
 return {fresh,recent:recentIds.length?[{ids:recentIds,label:'Révisions récentes'}]:[],revision};
}
