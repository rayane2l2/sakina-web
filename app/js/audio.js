import {findUnit} from './data.js';
import {normalizeSpeed} from './playback-speed.js';
const expand=(corpus,units)=>{const seen=new Set();return units.flatMap(u=>u.sources?u.sources.map(id=>findUnit(corpus,id)):[u]).filter(u=>u&&!seen.has(u.id)&&seen.add(u.id));};
const folders={minshawi:'Minshawy_Murattal_128kbps',husary:'Husary_128kbps',alafasy:'Alafasy_128kbps'};
let active,loading,run=0,speed=1;
export function setSpeed(value){
 speed=normalizeSpeed(value);
 if(active){active.preservesPitch=true;active.playbackRate=speed;}
 return speed;
}
export function stop(){run++;loading?.abort();loading=null;if(active){active.pause();active.src='';active=null;}}
async function loadAudio(url){
 const controller=new AbortController();loading=controller;
 const timer=setTimeout(()=>controller.abort(),25000);
 try{const response=await fetch(url,{signal:controller.signal});const body=await response.blob();return new Response(body,{status:response.status,statusText:response.statusText,headers:response.headers});}
 catch(error){if(error.name==='AbortError')throw Error('L’audio n’a pas pu être chargé. Réessaie ou télécharge-le pour l’écouter hors connexion.');throw error;}
 finally{clearTimeout(timer);if(loading===controller)loading=null;}
}
export function audioURL(corpus,unit,reciter='minshawi'){
 if(corpus!=='quran'){if(!unit.audio)return null;const url=new URL(unit.audio,location.href);if(unit.audioRevision)url.searchParams.set('v',unit.audioRevision);return url.href;}
 const [s,n]=unit.id.split(':');return `https://everyayah.com/data/${folders[reciter]||folders.minshawi}/${s.padStart(3,'0')}${n.padStart(3,'0')}.mp3`;
}
export async function download(corpus,units,reciter,onProgress=()=>{}){
 units=expand(corpus,units);const cache=await caches.open('sakina-audio-v1');let i=0;
 for(const unit of units){const url=audioURL(corpus,unit,reciter);if(url&&!(await cache.match(url))){const r=await fetch(url);if(!r.ok)throw Error('Audio indisponible. Vérifie la connexion.');await cache.put(url,r);}onProgress(++i,units.length);}
}
export async function play(corpus,units,reciter,repeats=1,onStep=()=>{},onCycleComplete=()=>{},onTime=()=>{}){
 stop();units=expand(corpus,units);const token=run;
 try{
  // A live target lets the learner extend the current batch without restarting.
  for(let r=0;r<(typeof repeats==='function'?repeats():repeats);r++){
   for(const unit of units){
   if(token!==run)return;const url=audioURL(corpus,unit,reciter);if(!url)throw Error('Ce passage ne dispose pas d’audio dans l’enregistrement fourni.');
   const cache=await caches.open('sakina-audio-v1');let response=await cache.match(url);
   if(!response){response=await loadAudio(url);if(!response.ok)throw Error('Télécharge l’audio avec une connexion avant de l’écouter hors ligne.');await cache.put(url,response.clone());}
   if(token!==run)return;
   const blob=URL.createObjectURL(await response.blob()),player=new Audio(blob);active=player;setSpeed(speed);
   player.onplaying=()=>{if(token===run){onStep(unit,r+1);onTime(unit,player.currentTime,player.duration);}};
   player.ontimeupdate=()=>{if(token===run)onTime(unit,player.currentTime,player.duration);};
   try{await new Promise((resolve,reject)=>{player.onended=resolve;player.onerror=()=>reject(Error('Lecture audio impossible'));player.onpause=()=>{if(token!==run)resolve();};player.play().catch(reject);});}
   catch(error){if(token===run)throw error;return;}
   finally{player.onended=player.onpause=player.onerror=player.onplaying=player.ontimeupdate=null;URL.revokeObjectURL(blob);}
   }
   if(token!==run)return;onCycleComplete(r+1);
  }
 }catch(error){if(token===run)throw error;}
 finally{if(token===run){active=null;onStep(null,0);}}
}
