const underline = (text) => [...text].map((letter) => letter + '\u0332').join('');

export const BOOK_PHONETIC_LETTERS = [
  ['k', 'ك'], ['q', 'ق'], ['ch', 'ش'], ['dj', 'ج'], ['th', 'ث'],
  ['kh', 'خ'], ['gh', 'غ'], ['w', 'و'], ['y', 'ي'], ['ع', 'ع'],
  ['’', 'ء'], ['t', 'ت'], [underline('t'), 'ط'], ['s ou ç', 'س'],
  [underline('s') + ' ou ' + underline('ç'), 'ص'], ['dh', 'ذ'],
  [underline('dh'), 'ظ'], ['h', 'ه'], [underline('h'), 'ح'],
  ['d', 'د'], [underline('d'), 'ض'],
];

const letters = {
  'ء': '’', 'ٲ': '’', 'ب': 'b', 'ت': 't', 'ث': 'th', 'ج': 'dj',
  'ح': underline('h'), 'خ': 'kh', 'د': 'd', 'ذ': 'dh', 'ر': 'r',
  'ز': 'z', 'س': 's', 'ش': 'ch', 'ص': underline('s'), 'ض': underline('d'),
  'ط': underline('t'), 'ظ': underline('dh'), 'ع': 'ع', 'غ': 'gh',
  'ف': 'f', 'ق': 'q', 'ك': 'k', 'ل': 'l', 'م': 'm', 'ن': 'n',
  'ه': 'h', 'و': 'w', 'ي': 'y',
};

const sounds = {
  'َ': 'a', 'ِ': 'i', 'ُ': 'ou', 'ا': 'â', 'ۦ': 'î', 'ۥ': 'oû',
  'ں': '*', '۾': 'm*', '۪': 'é', 'ـ': 'é',
};

function bookWord(word, next = '') {
  const tokens = word.replace(/َا+/g, 'ا').replace(/ِۦ+/g, 'ۦ')
    .replace(/ُۥ+/g, 'ۥ').replace(/[ڇْۜ]/g, '')
    .match(/(.)\1*/gu) || [];
  return tokens.map((token, index) => {
    const char = token[0];
    const letter = letters[char];
    if (!letter) return sounds[char] || '';
    if (index === 0 && letter === '’' && tokens.length > 1) return '';
    if (token.length === 1) return letter;
    if ((char === 'م' || char === 'ن') && token.length >= 3) {
      return index === tokens.length - 1 && next.startsWith(char)
        ? letter + '*'
        : letter + '*' + letter;
    }
    if ((char === 'و' || char === 'ي') && index === tokens.length - 1 && next.startsWith(char))
      return letter + '*';
    return letter + '-' + letter;
  }).join('').replace(/([aâiî])s([aâiî])/g, '$1ç$2');
}

// Full lines checked against the supplied photos of pages 13 and 14.
const photographed = {
  '1:1': 'Bismi| l-Lâhi| r-Ra' + underline('h') + 'mâni| r-Ra' + underline('h') + 'îm',
  '80:1': 'عabaça| wa tawal-lâ',
  '80:2': 'a*|djâ’ahou|l’aعmâ',
  '80:3': 'wa mâ| youdrîka| laعal-lahoû| yaz-zak-kâ',
  '80:4': 'aw| yadh-dhak-karou| fata*faعahou|dh-dhikrâ',
  '80:5': 'am*mâ| mani|staghnâ',
  '80:6': 'fa a*ta| lahoû| ta' + underline('ç') + 'ad-dâ',
  '80:7': 'wa mâ| عalayka| al-lâ| yaz-zak-kâ',
  '80:8': 'wa am*mâ| ma*|djâ’aka| yasعâ',
  '80:9': 'wa houwa| yakhchâ',
  '80:10': 'fa a*ta| عanhou| talah-hâ',
  '80:11': 'kal-lâ| in*nahâ| tadhkirah',
  '80:12': 'fama*|châ’a| dhakarah',
  '80:13': 'fî| ' + underline('s') + 'ou' + underline('h') + 'oufi|m*moukar-ramah',
  '80:14': 'marfoûعati|m*mou' + underline('t') + 'ah-harah',
  '80:15': 'bi’aydî| safarah',
  '80:16': 'kirâmim*|bararah',
  '80:17': 'qoutila|l-i*sânou| mâ| akfarah',
};

export function bookPhoneticRecord(id, phonemeWords) {
  const words = phonemeWords.map((word, index) => bookWord(word, phonemeWords[index + 1])
    .replace(/l-lâh/g, 'l-Lâh'));
  const source = photographed[id]?.split('|');
  if (source && source.length !== words.length) throw Error('Photographed word alignment: ' + id);
  return {
    words,
    text: source?.join('') ?? words.join(' ').replace(/\* /g, '*'),
    ...(source ? { displayWords: source } : {}),
    reviewStatus: source ? 'source' : 'generated',
  };
}
