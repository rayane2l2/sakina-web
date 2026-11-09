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
  { sid, index = 0, hidden = false, revealed = [], playing = null },
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
      : `<button type="button" class="matn-lyric-neighbor ${side}" data-action="matn-focus" data-id="${escape(entry.unit.id)}" data-corpus="${escape(corpus.id)}" aria-label="Lire le passage ${side === "before" ? "précédent" : "suivant"}"><span dir="rtl" lang="ar">${escape(entry.unit.text)}</span></button>`;
  const text = masked(current.unit)
    ? '<span class="matn-lyric-blank" aria-label="Texte caché"></span>'
    : current.unit.parts
      ? current.unit.parts.map(escape).join("<br>")
      : escape(current.unit.text);
  return `<div class="matn-lyrics" data-focus="${escape(current.unit.id)}">${neighbor(sequence[focus - 1], "before")}<div class="matn-lyric-current ${playing === current.unit.id ? "is-playing" : ""}" dir="rtl" lang="ar" tabindex="0" aria-label="Passage en cours">${text}</div>${neighbor(sequence[focus + 1], "after")}</div>`;
}
