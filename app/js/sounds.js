let context,enabled=true,last=0;
export function setSound(value){enabled=value;}
export async function unlockSound(){context??=new AudioContext();if(context.state==='suspended')await context.resume();}
export function mistakeSound(strong=false){
 if(!enabled||!context||context.state!=='running'||(!strong&&performance.now()-last<1800))return;
 last=performance.now();
 if(strong){
  for(let i=0;i<3;i++){
   const now=context.currentTime+i*.22,osc=context.createOscillator(),gain=context.createGain();
   osc.type='sine';osc.frequency.setValueAtTime(i===1?480:780,now);
   gain.gain.setValueAtTime(0,now);gain.gain.linearRampToValueAtTime(.14,now+.015);gain.gain.exponentialRampToValueAtTime(.001,now+.18);
   osc.connect(gain);gain.connect(context.destination);osc.start(now);osc.stop(now+.19);
  }
  return;
 }
 const now=context.currentTime,osc=context.createOscillator(),gain=context.createGain();
 osc.type='sine';osc.frequency.setValueAtTime(620,now);osc.frequency.exponentialRampToValueAtTime(460,now+.1);
 gain.gain.setValueAtTime(0,now);gain.gain.linearRampToValueAtTime(.035,now+.01);gain.gain.exponentialRampToValueAtTime(.001,now+.15);
 osc.connect(gain);gain.connect(context.destination);osc.start(now);osc.stop(now+.16);
}
export class StableMistakes{
 constructor(){this.reset();}
 reset(){this.candidates=new Map();this.signaled=new Set();}
 inspect(words,time=performance.now(),final=false){let newError=false;
  words.forEach((word,i)=>{
   if(word.status!=='check'){this.candidates.delete(i);return;}
   if(this.signaled.has(i))return;
   const previous=this.candidates.get(i);if(!previous){this.candidates.set(i,{since:time,count:1});if(!final)return;}
   else previous.count++;
   const candidate=this.candidates.get(i);
   if(final||(candidate.count>=3&&time-candidate.since>=700)){this.signaled.add(i);newError=true;}
  });return newError;
 }
}
