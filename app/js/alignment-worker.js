import {StreamingAlignment,wordsStatus} from './alignment.js';
import {ReadingAlignment} from './reading-position.js';
let reference,matcher;
const reading=new ReadingAlignment();
self.onmessage=({data})=>{
 try{
  const next=data.referenceWords.join('');
  if(next!==reference){reference=next;matcher=new StreamingAlignment(next);}
  const result=data.freeReading?reading.compare(data.words,data.referenceWords,data.heard,{startWord:data.startWord,epoch:data.epoch,settled:data.settled}):wordsStatus(data.words,data.referenceWords,data.heard,data.final,data.settled,matcher);
  self.postMessage({id:data.id,result:{words:result.words,covered:result.covered,ratio:result.ratio,limited:result.limited,locating:result.locating,startWord:result.startWord}});
 }catch(error){self.postMessage({id:data.id,error:error.message});}
};
