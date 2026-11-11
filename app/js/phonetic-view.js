import {versePartsHTML} from './matn-format.js';
import {quranPhonetic,unitPhonetic,phoneticUnit} from './transliteration.js';
import {BOOK_PHONETIC_LETTERS} from './quran-book-phonetics.js';
const E = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[c]);

const bookText = (text) => E(text).replace(/ع/g, '<bdi class="book-ain" lang="ar">ع</bdi>');
const signs = [['*', 'Son nasal'], ['â', 'a prolongé'], ['î', 'i prolongé'], ['oû', 'ou prolongé']];

export function phoneticLegend() {
  const rows = [...signs, ...BOOK_PHONETIC_LETTERS].map(([symbol, meaning], index) =>
    '<div class="phonetic-key-row"><dt>' + bookText(symbol) + '</dt><dd' +
    (index >= signs.length ? ' lang="ar"' : '') + '>' + E(meaning) + '</dd></div>',
  ).join('');
  return '<details class="phonetic-legend"><summary>Lire la phonétique</summary><dl>' + rows + '</dl></details>';
}

export function readingTabs(mode, button, corpus = 'quran') {
  const tabs = corpus === 'quran'
    ? [['mushaf', 'Mushaf'], ['verses', 'Arabe + phonétique']]
    : [['text', 'Texte'], ['phonetic', 'Phonétique']];
  const action = corpus === 'quran' ? 'quran-reading-mode' : 'matn-reading-mode';
  return '<div class="seg reading-layout phonetic-tabs" aria-label="Affichage du texte">' + tabs.map(([id, title]) =>
    button(title, action, mode === id ? 'selected' : '', 'data-mode="' + id + '" aria-pressed="' + (mode === id) + '"'),
  ).join('') + '</div>';
}

export function versePhoneticHTML(unit, options) {
  const record = quranPhonetic(unit.id);
  if (!record) return '';
  const refs = unit.wordRefs?.filter((word) => Number.isInteger(word.w));
  const positions = refs?.length ? refs.map((word) => word.w) : record.words.map((_, index) => index + 1);
  if (!options) {
    const text = refs?.length ? positions.map((position) => record.words[position - 1]).join(' ') : record.text;
    return '<p class="verse-phonetic" lang="fr" dir="ltr">(' + bookText(text) + ')</p>';
  }
  const content = positions.map((position, index) => {
    const word = record.displayWords?.[position - 1] ?? record.words[position - 1];
    if (!word) return '';
    const previous = positions[index - 1];
    const space = index && (previous !== position - 1 ||
      (record.displayWords ? /^\s/.test(word) : !record.words[previous - 1].endsWith('*'))) ? ' ' : '';
    const active = options.playing === unit.id + ':' + position ? ' is-speaking' : '';
    return space + `<button type="button" class="quran-word phonetic-audio-word${active}" data-action="listen-word" data-id="${E(unit.id)}" data-position="${position}" data-coordinate="printed">${bookText(word.trim())}</button>`;
  }).join('');
  return '<p class="verse-phonetic" lang="fr" dir="ltr">(' + content + ')</p>';
}
export const phoneticPendingHTML=()=>`<div class="phonetic-pending"><h2>Phonétique en préparation</h2><p>La transcription relue de ce passage n’est pas encore disponible.</p><button type="button" class="btn secondary" data-action="matn-reading-mode" data-mode="text">Lire le texte arabe</button></div>`;
export function matnPhoneticHTML(corpus,unit,hidden=false){const record=unitPhonetic(corpus,unit),text=hidden?'':(record?.parts?.length?versePartsHTML(record.parts,E,true):null)||E(record?.text||'Phonétique à compléter');return `<div class="verse phonetic-matn-unit" data-verse="${E(unit.id)}"><p lang="fr" dir="ltr">${text}</p><small>${E(unit.n)}</small></div>`;}
