// A model emits many snapshots for one utterance: only distinct spoken
// attempts can increase the streak. A pause is a conservative retry boundary.
export class SpeechAttempts {
 constructor(){this.id=0;this.baseline='';this.silence=null;}
 begin(text=''){this.id++;this.baseline=text;this.silence=null;}
 level(rms,time,text){
  if(rms<.012){this.silence??=time;return false;}
  const fresh=this.silence!==null&&time-this.silence>=800;
  this.silence=null;if(fresh){this.id++;this.baseline=text;}
  return fresh;
 }
 hasEvidence(text){return Boolean(text)&&text!==this.baseline;}
}
export class ErrorStreak {
 constructor(){this.reset();}
 reset(){this.key=null;this.count=0;this.lastAttempt=null;this.alerted=false;}
 inspect(key,status,attempt,evidence,hasEvidence=true){
  if(!hasEvidence||!evidence)return false;
  if(status==='heard'){this.reset();return false;}
  if(status!=='check')return false;
  if(this.key!==key){this.reset();this.key=key;}
  if(this.lastAttempt===attempt)return false;
  this.lastAttempt=attempt;this.count++;
  if(this.count>3&&!this.alerted){this.alerted=true;return true;}
  return false;
 }
}
