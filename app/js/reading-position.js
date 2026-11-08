import {phones,StreamingAlignment,wordsStatus} from './alignment.js';

// Search only the displayed passage. A free reference prefix is a position,
// never a series of missed words. Once located, keep ordinary strict tracking.
function locate(referenceWords,heard){
 const lengths=referenceWords.map(w=>phones(w).length),a=phones(referenceWords.join('')),b=phones(heard);
 if(b.length<14||a.length>2500||b.length>5000)return null;
 const boundaries=new Map();let cursor=0;
 lengths.forEach((n,i)=>{if(n)boundaries.set(cursor,i);cursor+=n;});
 let costs=new Uint16Array(a.length+1),origins=new Uint16Array(a.length+1),last=0;
 for(let i=0;i<=a.length;i++){if(boundaries.has(i))last=i;costs[i]=i-last;origins[i]=last;}
 for(let j=1;j<=b.length;j++){
  const next=new Uint16Array(a.length+1),starts=new Uint16Array(a.length+1);next[0]=j;
  for(let i=1;i<=a.length;i++){
   const diagonal=costs[i-1]+(a[i-1]===b[j-1]?0:1),drop=next[i-1]+1,extra=costs[i]+1;
   if(diagonal<=drop&&diagonal<=extra){next[i]=diagonal;starts[i]=origins[i-1];}
   else if(drop<=extra){next[i]=drop;starts[i]=starts[i-1];}
   else{next[i]=extra;starts[i]=origins[i];}
  }
  costs=next;origins=starts;
 }
 const candidates=new Map();
 for(let end=1;end<=a.length;end++){
  const start=origins[end];if(!boundaries.has(start))continue;
  const old=candidates.get(start),score=costs[end];
  if(!old||score<old.score)candidates.set(start,{start,score,end});
 }
 const sorted=[...candidates.values()].sort((x,y)=>x.score-y.score),best=sorted[0];
 if(!best||best.score/b.length>.24)return null;
 // Repeated phrases remain undecided until enough following words distinguish them.
 if(sorted[1]&&sorted[1].score-best.score<Math.max(2,Math.floor(b.length*.08)))return null;
 const word=boundaries.get(best.start);let sum=0,count=0;
 for(const len of lengths.slice(word)){sum+=len;if(sum>best.end-best.start)break;if(len)count++;}
 return count>=2?word:null;
}

export function nextReadingWord(units,revealed=[]){
 const known=new Set(revealed),refs=units.flatMap(u=>u.wordRefs||[]);
 const index=refs.findIndex(w=>!known.has(`${w.s}:${w.a}`));return index<0?refs.length:index;
}

export class ReadingAlignment {
 compare(words,referenceWords,heard,{startWord=null,epoch=0,settled=false}={}){
  const key=JSON.stringify([referenceWords,startWord,epoch]);
  if(this.key!==key){this.key=key;this.start=null;this.matcher=null;}
  if(this.start===null){
   const explicit=Number.isInteger(startWord)&&startWord>=0&&startWord<=words.length;
   this.start=explicit?startWord:locate(referenceWords,heard);
   if(this.start!==null)this.matcher=new StreamingAlignment(referenceWords.slice(this.start).join(''));
  }
  if(this.start===null)return {words:words.map(word=>({word,status:'waiting'})),covered:0,ratio:0,locating:true};
  const start=this.start,result=wordsStatus(words.slice(start),referenceWords.slice(start),heard,false,settled,this.matcher);
  return {...result,startWord:start,locating:false,words:[...words.slice(0,start).map(word=>({word,status:'waiting'})),...result.words]};
 }
}
