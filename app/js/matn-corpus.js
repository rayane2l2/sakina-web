export const MATN_SPECS=Object.freeze([{id:'mukhtasar-al-harari',name:'Moukhtassar al-Harari',file:'mukhtasar-al-harari',unit:'passage',audioRevision:'0de7a6279891'}]);
export const supportedCorpus=id=>id==='quran'||id==='ibn-ashir'||MATN_SPECS.some(c=>c.id===id);
export function buildImportedMatn(source,spec){
 let n=0;
 const sections=source.chapters.map((chapter,index)=>{
  const first=n+1;
  const units=chapter.units.map(u=>({...u,n:++n,sourceAudio:u.audio,audioRevision:spec.audioRevision,audio:u.audio?`data/${spec.id}/${u.id.replace(':','-')}.mp3`:null}));
  return {id:String(chapter.id),name:chapter.title?`Chapitre ${index+1} · ${chapter.title}`:'Introduction',ar:chapter.title||'',first,last:n,units};
 });
 return {...spec,titleAr:source.titleAr,type:source.type,reviewStatus:source.reviewStatus,sections};
}
export const hasUnitAudio=(corpus,unit)=>corpus==='quran'||Boolean(unit?.audio);
