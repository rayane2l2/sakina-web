export function listeningProgress(completed=0,target=5){
 const done=Math.max(0,Math.floor(Number(completed)||0)),total=Math.max(done,Math.floor(Number(target)||0));
 const count=Math.max(1,Math.min(10,total));
 return {completed:done,target:total,remaining:total-done,dots:Array.from({length:count},(_,i)=>i<Math.floor(done/Math.max(1,total)*count))};
}
export const addListeningRound=(completed,target)=>Math.max(Number(completed)||0,Number(target)||0)+1;
export function followUnit(units,audioId){
 return units.find(u=>u.id===audioId||u.sources?.includes(audioId))||null;
}
