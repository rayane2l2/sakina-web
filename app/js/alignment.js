// Conservative phoneme comparison. No religious verdict is derived from it.
export const phones=text=>Array.from(String(text).replace(/[\s\u200b-\u200f\ufeff▁]/g,'').replace(/<[^>]*>/g,''));
// Retain DP columns while streaming; recompute only new/revised acoustic suffixes.
export class StreamingAlignment {
 constructor(reference){this.a=phones(reference);this.b=[];this.columns=[Uint16Array.from({length:this.a.length+1},(_,i)=>i)];this.cells=0;}
 compare(heard,final=false){
  const a=this.a,b=phones(heard);this.cells=0;
  if(a.length>2500||b.length>5000)return {covered:0,ratio:0,edits:[],limited:true};
  let shared=0;while(shared<Math.min(b.length,this.b.length)&&b[shared]===this.b[shared])shared++;
  this.columns.length=shared+1;
  for(let j=shared+1;j<=b.length;j++){
   const previous=this.columns[j-1],column=new Uint16Array(a.length+1);column[0]=j;
   for(let i=1;i<=a.length;i++)column[i]=Math.min(column[i-1]+1,previous[i]+1,previous[i-1]+(a[i-1]===b[j-1]?0:1));
   this.columns.push(column);this.cells+=a.length;
  }
  this.b=b;const last=this.columns[b.length];let end=a.length;
  if(!final){end=0;for(let i=1;i<=a.length;i++)if(last[i]<last[end]||(last[i]===last[end]&&i<=b.length))end=i;}
  let i=end,j=b.length;const edits=[];
  while(i||j){
   if(i&&j&&this.columns[j][i]===this.columns[j-1][i-1]+(a[i-1]===b[j-1]?0:1)){edits.push({at:i-1,kind:a[i-1]===b[j-1]?'same':'different',expected:a[i-1],heard:b[j-1]});i--;j--;}
   else if(i&&this.columns[j][i]===this.columns[j][i-1]+1){edits.push({at:i-1,kind:'missing',expected:a[--i],heard:''});}
   else{edits.push({at:i,kind:'extra',expected:'',heard:b[--j]});}
  }
  edits.reverse();const matched=edits.reduce((n,e)=>n+(e.kind==='same'),0);
  return {edits,covered:b.length?end:0,ratio:end?matched/Math.max(end,b.length):0,empty:!b.length};
 }
}
export function align(reference,heard,final=false){return new StreamingAlignment(reference).compare(heard,final);}
export function wordsStatus(words,referenceWords,heard,final=false,settled=final,matcher){
 const result=matcher?matcher.compare(heard,final):align(referenceWords.join(''),heard,final);
 let cursor=0,index=0;const edits=result.edits;
 return {...result,words:words.map((word,n)=>{
  const length=phones(referenceWords[n]||'').length,from=cursor;cursor+=length;
  while(index<edits.length&&edits[index].at<from)index++;
  let same=false,different=false;
  for(;index<edits.length&&edits[index].at<cursor;index++){same||=edits[index].kind==='same';different||=edits[index].kind!=='same';}
  const seen=cursor<=result.covered&&length>0,partlyHeard=settled&&from<result.covered&&same;
  return {word,status:!seen?(partlyHeard?'check':'waiting'):different?'check':'heard'};
 })};
}
