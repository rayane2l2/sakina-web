import {versePartsHTML} from './matn-format.js';
export function matnSequence(corpus) {
  return corpus.sections.flatMap((ch) =>
    ch.units.map((unit, index) => ({
      unit,
      sid: ch.id,
      index,
      chapter: ch.name,
    })),
  );
}
export function fullMatnAudio(corpus) {
  return matnSequence(corpus).filter((x) => Boolean(x.unit.audio));
}
export function matnLyrics(
  corpus,
  { sid, index = 0, hidden = false, revealed = [], playing = null, phonetic=false },
  escape,
) {
  const sequence = matnSequence(corpus),
    focus = sequence.findIndex(
      (x) => String(x.sid) === String(sid) && x.index === index,
    );
  const current = sequence[focus];
  if (!current) return "";
  const masked = (unit) => hidden && !revealed.includes(unit.id);
  const neighbor = (entry, side) =>
    !entry || masked(entry.unit)
      ? `<div class="matn-lyric-neighbor ${side}" aria-hidden="true"></div>`
      : `<button type="button" class="matn-lyric-neighbor ${side}" data-action="matn-focus" data-id="${escape(entry.unit.id)}" data-corpus="${escape(corpus.id)}" aria-label="Lire le passage ${side === "before" ? "précédent" : "suivant"}"><span dir="${phonetic?'ltr':'rtl'}" lang="${phonetic?'fr':'ar'}">${entry.unit.parts?.length===2?versePartsHTML(entry.unit.parts,escape,phonetic):escape(entry.unit.text)}</span></button>`;
  const text = masked(current.unit)
    ? '<span class="matn-lyric-blank" aria-label="Texte caché"></span>'
    : current.unit.parts?.length
      ? versePartsHTML(current.unit.parts,escape,phonetic)
      : escape(current.unit.text);
  return `<div class="matn-lyrics ${phonetic?'phonetic-matn':''}" data-focus="${escape(current.unit.id)}">${neighbor(sequence[focus - 1], "before")}<div class="matn-lyric-current ${playing === current.unit.id ? "is-playing" : ""}" dir="${phonetic?'ltr':'rtl'}" lang="${phonetic?'fr':'ar'}" tabindex="0" aria-label="Passage en cours">${text}</div>${neighbor(sequence[focus + 1], "after")}</div>`;
}

// Library browsing is a continuous document; the lyrics surface is reserved for active audio.
export function matnLibraryHTML(corpus,{sid,index=0,hidden=false,revealed=[]},escape){const current=corpus.sections.find(ch=>String(ch.id)===String(sid))?.units[index]?.id;return `<div class="matn-library-scroll" tabindex="0" aria-label="${escape(corpus.name)}, lecture continue">${corpus.sections.map(ch=>`<section class="matn-library-chapter"><h2><bdi>${escape(ch.name)}</bdi></h2>${ch.units.map(u=>{const masked=hidden&&!revealed.includes(u.id);return `<button type="button" class="matn-library-unit ${masked?'masked':''}" data-action="matn-select" data-id="${escape(u.id)}" data-matn-unit="${escape(u.id)}" data-corpus="${escape(corpus.id)}" aria-pressed="${u.id===current}" aria-label="Sélectionner ${corpus.unit==='vers'?'le vers '+u.n:'ce passage'}"><span class="matn-library-text" lang="${u.phonetic?'fr':'ar'}" dir="${u.phonetic?'ltr':'rtl'}">${u.parts?.length?versePartsHTML(u.parts,escape,Boolean(u.phonetic)):escape(u.text)}</span>${corpus.unit==='vers'?`<span class="matn-library-number">${u.n}</span>`:''}</button>`;}).join('')}</section>`).join('')}</div>`;}
