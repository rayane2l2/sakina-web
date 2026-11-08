export const PLAYBACK_SPEEDS=Object.freeze(Array.from({length:16},(_,i)=>(5+i)/10));
export function normalizeSpeed(value){
 const n=Number(value);if(!Number.isFinite(n)||n<=0)return 1;
 return PLAYBACK_SPEEDS[Math.max(0,Math.min(15,Math.round(n*10)-5))];
}
export const speedLabel=value=>`${normalizeSpeed(value).toLocaleString('fr-FR')}×`;
