// Display-only cleanup: preserve parenthetical content except the requested wa baʿdu marker.
export function cleanMatnText(text){return String(text??'').replace(/[（(]([^()（）]*)[）)]/g,(full,inner)=>{const arabic=inner.normalize('NFC').replace(/[\u064b-\u065f\u0670\sـ]/g,'');const latin=inner.toLowerCase().replace(/[\s‘’'ʿ^’-]/g,'');return arabic==='وبعد'||['wabadou','wabadu'].includes(latin)?inner.trim():full;});}
export function matnTextHTML(text, escape, phonetic = false) {
  const safe = escape(cleanMatnText(text));
  return phonetic ? safe.replace(/ع/g, '<bdi class="book-ain" lang="ar">ع</bdi>') : safe;
}

export function versePartsHTML(parts, escape, phonetic = false) {
  const lang = phonetic ? 'fr' : 'ar';
  const dir = phonetic ? 'ltr' : 'rtl';
  return `<span class="bayt-parts" dir="rtl">${parts.map((part) =>
    `<span class="bayt-half" lang="${lang}" dir="${dir}">${matnTextHTML(part, escape, phonetic)}</span>`,
  ).join('')}</span>`;
}
