// Macro structure from the user's supplied video transcript. No ASR score is used.
const key=w=>`${w.s}:${w.a}:${w.w}`;

// Four rotation portions per juz, sized by their share of the printed pages.
// These are working quarters, not claimed to be canonical rubʿ/hizb boundaries.
export function buildMacroIndex(ayahs,pageUnits,pages){
 const ayahJuz=new Map(ayahs.map(u=>[u.id,u.juz])),words=new Map(),totals=new Map();
 for(const page of pages)for(const line of page.lines)for(const w of line.words){
  const juz=ayahJuz.get(`${w.s}:${w.a}`),size=1/page.lines.length/line.words.length;
  if(!juz)continue;words.set(key(w),{juz,size});totals.set(juz,(totals.get(juz)||0)+size);
 }
 const positions=new Map();
 for(const word of words.values()){
  const at=positions.get(word.juz)||0;word.quarter=Math.min(3,Math.floor(at/totals.get(word.juz)*4));positions.set(word.juz,at+word.size);
 }
 const units=new Map();
 for(const unit of [...ayahs,...pageUnits]){
  const refs=(unit.wordRefs||[]).map(key).filter(k=>words.has(k));if(!refs.length)continue;
  const first=words.get(refs[0]);units.set(unit.id,{juz:first.juz,quarter:first.quarter,refs});
 }
 return {units,words,totals};
}

function lastLessons(state){
 const events=(state.log||[]).filter(e=>e.kind==='learn'),lessons=[],legacyDates=new Set();
 for(const event of events){
  if(Array.isArray(event.ids)){if(event.ids.length)lessons.push({ids:event.ids,approximate:false});}
  else if(!legacyDates.has(event.date)){
   // Older releases did not store lesson IDs. One day's learning is the only
   // recoverable grouping; do not invent multiple lessons on that same day.
   legacyDates.add(event.date);const ids=state.units.filter(id=>state.items[id]?.first===event.date);
   if(ids.length)lessons.push({ids,approximate:true});
  }
 }
 const selected=lessons.slice(-3);
 return {ids:[...new Set(selected.flatMap(l=>l.ids))].filter(id=>state.items[id]),approximate:selected.some(l=>l.approximate)};
}
function reviewedToday(state,date){
 return new Set((state.log||[]).filter(e=>e.date===date&&['learn','review'].includes(e.kind)).flatMap(e=>Array.isArray(e.ids)?e.ids:[]));
}
const choose=(buckets,cursor)=>buckets.find(b=>b.order>=cursor)||buckets[0];
function blocks(M,state,ids,label,rotation=null){
 return M.toBlocks(state.units,ids,state.blockSize).map(block=>({...block,label,macroRotation:rotation}));
}
export function macroPlan(state,date,index,M){
 const fresh=M.nextNew(state,date),known=state.units.filter(id=>state.items[id]&&index.units.has(id));
 const recent=lastLessons(state);
 const imported=known.filter(id=>{const item=state.items[id],age=(Date.parse(date)-Date.parse(item.learned))/86400000;return item.importedRecent&&age>=0&&age<=(state.recentDays||7);});
 recent.ids=[...new Set([...recent.ids,...imported])];
 const lastSet=new Set(recent.ids),done=reviewedToday(state,date),macro=state.macro||{};
 const anchor=fresh[0]||recent.ids.at(-1)||known.at(-1),activeJuz=index.units.get(anchor)?.juz;
 const lastThree=recent.ids.filter(id=>!done.has(id)),quarters=[];
 for(let q=0;q<4;q++){
  const ids=known.filter(id=>{const u=index.units.get(id);return u.juz===activeJuz&&u.quarter===q&&!lastSet.has(id)&&!done.has(id);});
  if(ids.length)quarters.push({order:q,ids});
 }
 const sabqi=blocks(M,state,lastThree,'Sabqi · les trois derniers sabaq');
 if(macro.sabqiDate!==date&&quarters.length){
  const part=choose(quarters,Number(macro.sabqiCursor)||0),rotation={kind:'sabqi',ids:part.ids,next:(part.order+1)%4};
  sabqi.push(...blocks(M,state,part.ids,`Sabqi · juz ${activeJuz} · portion ${part.order+1}/4`,rotation));
 }
 // Count each printed word once, including when imported knowledge overlaps.
 const knownWords=new Set(known.flatMap(id=>index.units.get(id).refs));let learnedJuz=0;
 for(const word of knownWords){const w=index.words.get(word);learnedJuz+=w.size/index.totals.get(w.juz);}
 const fullJuz=learnedJuz>10+1e-8,buckets=[];
 for(const juz of [...new Set(known.map(id=>index.units.get(id).juz))].sort((a,b)=>a-b)){
  if(juz===activeJuz)continue;
  for(let part=0;part<(fullJuz?1:2);part++){
   const ids=known.filter(id=>{const u=index.units.get(id);return u.juz===juz&&(fullJuz||Math.floor(u.quarter/2)===part)&&!lastSet.has(id)&&!done.has(id);});
   if(ids.length)buckets.push({order:(juz-1)*4+part*2,ids,juz,part});
  }
 }
 const dawr=[];
 if(macro.dawrDate!==date&&buckets.length){
  const part=choose(buckets,Number(macro.dawrCursor)||0),rotation={kind:'dawr',ids:part.ids,next:(part.order+(fullJuz?4:2))%120};
  const label=`Dawr · acquis du juz ${part.juz}${fullJuz?'':` · moitié ${part.part+1}/2`}`;
  dawr.push(...blocks(M,state,part.ids,label,rotation));
 }
 return {fresh,recent:sabqi,revision:dawr,macro:{activeJuz,learnedJuz,fullJuz,legacyApproximation:recent.approximate}};
}
export function completeMacroReview(state,rotation,date){
 if(!rotation)return state;const done=reviewedToday(state,date);
 if(!rotation.ids.every(id=>done.has(id)))return state;
 const name=rotation.kind;if(!['sabqi','dawr'].includes(name))return state;
 return {...state,macro:{...state.macro,[name+'Date']:date,[name+'Cursor']:rotation.next}};
}
