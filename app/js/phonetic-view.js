import {quranPhonetic} from './transliteration.js';
import {BOOK_PHONETIC_LETTERS} from './quran-book-phonetics.js';
const E = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[c]);

const bookText = (text) => E(text).replace(/ع/g, '<bdi class="book-ain" lang="ar">ع</bdi>');
const signs = [['*', 'Son nasal'], ['â', 'a prolongé'], ['î', 'i prolongé'], ['oû', 'ou prolongé']];

export function phoneticKeyHTML() {
  const rows = [...signs, ...BOOK_PHONETIC_LETTERS].map(([symbol, meaning], index) =>
    '<div class="phonetic-key-row"><dt>' + bookText(symbol) + '</dt><dd' +
    (index >= signs.length ? ' lang="ar"' : '') + '>' + E(meaning) + '</dd></div>',
  ).join('');
  return '<dl class="phonetic-key">' + rows + '</dl>';
}

export function displaySwitch(button, {left, right, active, label, action, attrs = ''}) {
  return button(
    '<span class="' + (!active ? 'is-current' : '') + '">' + left + '</span>' +
    '<span class="display-switch-track" aria-hidden="true"><i></i></span>' +
    '<span class="' + (active ? 'is-current' : '') + '">' + right + '</span>',
    action, 'display-switch', 'role="switch" aria-checked="' + active + '" aria-label="' + label + '" ' + attrs,
  );
}

export function readingTabs(mode, button, corpus = 'quran') {
  if (corpus === 'quran') {
    return '<div class="quran-display" role="group" aria-label="Affichage du Coran">' +
      [['mushaf', 'Mushaf'], ['verses', 'Arabe + phonétique']].map(([value, title]) =>
        button(title, 'quran-reading-mode', 'quran-display-option',
          'data-mode="' + value + '" aria-pressed="' + (mode === value) + '"'),
      ).join('') + '</div>';
  }
  const active = mode === 'phonetic';
  return displaySwitch(button, {
    left: 'Arabe',
    right: 'Phonétique',
    active,
    label: 'Afficher la phonétique',
    action: 'matn-reading-mode',
    attrs: 'data-mode="' + (active ? 'text' : 'phonetic') + '"',
  });
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
