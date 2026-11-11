// French reading convention observed in the supplied Le But des étudiants.
// Generated transcriptions are explicitly distinguished from printed source transcriptions.
export const PHONETIC_PROFILE='fr-distinct-v2';
export const MATN_BOOK_PROFILE = 'fr-book-matn-v1';
const letters={'ء':'ʾ','أ':'ʾ','إ':'ʾ','ؤ':'ʾ','ئ':'ʾ','ب':'b','ت':'t','ث':'ṯ','ج':'j','ح':'ḥ','خ':'ḫ','د':'d','ذ':'ḏ','ر':'r','ز':'z','س':'s','ش':'š','ص':'ṣ','ض':'ḍ','ط':'ṭ','ظ':'ẓ','ع':'ʿ','غ':'ġ','ف':'f','ق':'q','ك':'k','ل':'l','م':'m','ن':'n','ه':'h','و':'w','ي':'y','ى':'y','ة':'t'};
const vowels={'َ':'a','ِ':'i','ُ':'ou','ً':'an','ٍ':'in','ٌ':'oun','ٰ':'a'};
export function phonemesToFrench(value){
 let s=String(value||'').replace(/َا+/g,'â').replace(/ِۦ+/g,'î').replace(/ُۥ+/g,'oû').replace(/ا+/g,'â').replace(/ۦ+/g,'î').replace(/ۥ+/g,'oû').replace(/ں+/g,'n').replace(/۾+/g,'m').replace(/[ڇۜ]/g,'').replace(/[۪ـ]+/g,'é').replace(/ٲ/g,'ʾ');
 let out='';for(const c of s)out+=letters[c]??vowels[c]??(/[ʿʾéâîûaiou]/.test(c)?c:'');
 out=out.replace(/aâ|âa|ââ/g,'â').replace(/ii+/g,'i').replace(/ouou/g,'ou');
 out=out.replace(/llâh([ia]|ou)?/g,(_,ending)=>'l-Lâh'+(ending||''));
 return frenchS(out).replace(/^ʾal-Lâh/,'Allâh').replace(/([bl]i)l-Lâh/,'$1 l-Lâh');
}
function frenchS(text){return text;}

export function frenchPhonemeWords(list,arabicWords=[]){return list.map((word,i)=>{let text=phonemesToFrench(word);const raw=String(arabicWords[i]||'').replace(/[\u064b-\u065f\u0670]/g,'');if(/^[اأإٱ]ل/.test(raw)&&!text.includes('l-Lâh')){text=text.replace(/^ʾ?al/,'al-');if(!/^al-/.test(text))for(const consonant of ['š','ṯ','ḏ','ṣ','ḍ','ṭ','ẓ','s','d','t','n','r','z','l'])if(text.startsWith(consonant+consonant)){text=consonant+'-'+text.slice(consonant.length);break;}}return text;});}
export function vocalizedArabicToFrench(value){
 const words=String(value||'').normalize('NFC').split(/\s+/);return words.map((raw,wordIndex)=>{
  if(!/[\u0621-\u064a]/.test(raw))return raw;
  const bare=raw.replace(/[\u064b-\u065f\u0670ـ]/g,'');const ending=raw.match(/[َُِ]$/)?.[0],caseEnding=ending?vowels[ending]:'';if(bare==='لله')return 'li l-Lah'+caseEnding;if(bare==='الله')return (wordIndex?'l-Lah':'Allah')+caseEnding;if(/^[وفبت]الله$/.test(bare))return ({'و':'wa ','ف':'fa ','ب':'bi ','ت':'ta '}[bare[0]])+'l-Lah'+caseEnding;
  const chars=[...raw.replace(/ـ/g,'')],tokens=[];for(const c of chars){if(/[\u064b-\u0652\u0670]/.test(c)){if(tokens.length)tokens.at(-1).marks+=c;}else if(/[\u0621-\u064a\u0671]/.test(c))tokens.push({letter:c,marks:''});}
  const article=/^[اأإٱ]ل/.test(bare),sun=article&&tokens[2]?.marks.includes('ّ')&&Boolean(letters[tokens[2]?.letter]);let out='';for(let i=0;i<tokens.length;i++){if(sun&&i===1)continue;const t=tokens[i],next=tokens[i+1],previous=tokens[i-1];let base=letters[t.letter]||'';
   if(t.letter==='ٱ'||t.letter==='ا'){if(i===0)base='a';else if(previous?.marks.includes('ً')&&i===tokens.length-1)continue;else if(previous?.marks.includes('َ'))continue;else base='a';}
   if(t.letter==='ى'&&!t.marks){if(previous?.marks.includes('َ'))continue;base='a';}
   if(t.letter==='و'&&!t.marks&&previous?.marks.includes('ُ'))continue;
   if(t.letter==='ي'&&!t.marks&&previous?.marks.includes('ِ'))continue;
   if(t.letter==='ة')base=t.marks.match(/[ًٌٍَُِ]/)?'t':'h';
   if(t.marks.includes('ّ'))base+=base;
   out+=base;for(const m of t.marks)out+=vowels[m]||'';
  }
  const plain=raw.replace(/[\u064b-\u065f\u0670]/g,'');if(article){if(sun){out=out.replace(/^a/,'');const onset=letters[tokens[2].letter];out='a'+onset+'-'+out.slice(onset.length);}else out=out.replace(/^a?l/,'al-');}
  return frenchS(out.replace(/aâ|âa|ââ/g,'â').replace(/ll?ah([ia]|ou)?/g,(_,ending)=>'l-Lâh'+(ending||'')));
 }).join(' ');
}
let dataset={quran:{},corpora:{},citations:{}};
let matnReadings = {};
export function setTransliterations(data){if(data?.schema!==1||data.profile!==PHONETIC_PROFILE)throw Error('Phonétique incompatible');dataset=data;}
export function setMatnTransliterations(data) {
  matnReadings = data?.schema === 1 && data.profile === MATN_BOOK_PROFILE ? data.corpora || {} : {};
}
export function quranPhonetic(id){return dataset.quran[id]||null;}
export function unitPhonetic(corpus, unit) {
  const record = unit.transliteration || dataset.corpora[corpus]?.[unit.id];
  if (typeof record === 'string') return {text: record, reviewStatus: 'source'};
  if (record && (!record.profile || [PHONETIC_PROFILE, MATN_BOOK_PROFILE].includes(record.profile)) &&
    ['source', 'reviewed'].includes(record.reviewStatus)) return record;
  if (record?.profile === MATN_BOOK_PROFILE && record.reviewStatus === 'generated' && record.text?.trim())
    return record;
  return matnReadings[corpus]?.[unit.id] || null;
}
export function citationPhonetic(id){return dataset.citations[id]||null;}
export function phoneticUnit(corpus, unit) {
  const record = unitPhonetic(corpus, unit);
  return {
    ...unit,
    text: record?.text || 'Phonétique à compléter',
    parts: record?.parts || [],
    titleAr: record?.title,
    attribution: record?.attribution,
    phonetic: true,
  };
}
export function phoneticCorpus(corpus){return {...corpus,sections:corpus.sections.map(s=>({...s,units:s.units.map(u=>phoneticUnit(corpus.id,u))}))};}
