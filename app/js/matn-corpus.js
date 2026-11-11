import {cleanMatnText} from './matn-format.js';
export const MATN_SPECS = Object.freeze([
  {id:'mukhtasar-al-harari',name:'Moukhtassar al-Harari',file:'mukhtasar-al-harari',unit:'passage',audioRevision:'0de7a6279891'},
  {id:'nawawi-ar', name:'الأربعون النووية', file:'nawawi-ar', unit:'hadith'},
]);
export const supportedCorpus=id=>id==='quran'||id==='ibn-ashir'||MATN_SPECS.some(c=>c.id===id);
export function buildImportedMatn(source,spec){
 let n=0;
 const sections=source.chapters.map((chapter,index)=>{
  const first=n+1;
  const units = chapter.units.map((unit) => ({
    ...unit,
    text: spec.unit === 'hadith' ? unit.text : cleanMatnText(unit.text),
    parts: unit.parts?.map(cleanMatnText) || [],
    n: ++n,
    sourceAudio: unit.audio,
    audioRevision: unit.audioRevision || spec.audioRevision,
    audio: unit.audio ? `data/${spec.id}/${unit.audioFile || unit.id.replace(':', '-') + '.mp3'}` : null,
  }));
  return {id:String(chapter.id),name:chapter.name || (chapter.title?`Chapitre ${index+1} · ${chapter.title}`:'Introduction'),ar:chapter.title||'',first,last:n,units};
 });
 return {...spec,titleAr:source.titleAr,type:source.type,reviewStatus:source.reviewStatus,sections};
}
export const hasUnitAudio=(corpus,unit)=>corpus==='quran'||Boolean(unit?.audio);
