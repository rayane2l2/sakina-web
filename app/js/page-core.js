export const wordKey=w=>`${w.s}:${w.a}:${w.w}`;
export function buildPageUnits(index){
 return index.flatMap(page=>page.lines.map((line,i)=>({id:`p${page.n}:${i+1}`,page:page.n,line:line.n,n:i+1,text:line.words.map(w=>w.text).join(' '),wordRefs:line.words,sources:[...new Set(line.words.map(w=>`${w.s}:${w.a}`))],size:1/page.lines.length})));
}
export function selectedWords(units){return new Set(units.flatMap(u=>u.wordRefs?.map(wordKey)||[]));}
export function unitsFromAyah(units,anchor){
 if(!anchor)return units;
 let reached=false;const selected=[];
 for(const unit of units){
  const refs=unit.wordRefs.filter(w=>{if(`${w.s}:${w.a}`===anchor)reached=true;return reached;});
  if(refs.length)selected.push({...unit,text:refs.map(w=>w.text).join(' '),wordRefs:refs,sources:[...new Set(refs.map(w=>`${w.s}:${w.a}`))]});
 }
 return selected.length?selected:units;
}

// Keep printed words and page budgets intact when knowledge is selected by verse.
export function splitPageUnits(units){
 return units.flatMap(unit=>{
  if(!/^p[0-9]+:/.test(unit.id))return [unit];
  const groups=[];
  for(const word of unit.wordRefs){const key=`${word.s}:${word.a}`;let group=groups.at(-1);if(!group||group.key!==key){group={key,words:[]};groups.push(group);}group.words.push(word);}
  return groups.map(({words})=>({...unit,id:`p${unit.page}s${words[0].s}:${unit.line*1000+words[0].a}`,text:words.map(w=>w.text).join(' '),wordRefs:words,sources:[`${words[0].s}:${words[0].a}`],size:unit.size*words.length/unit.wordRefs.length}));
 });
}
