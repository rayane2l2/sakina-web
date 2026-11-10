export const quranReadingMode = (value) =>
  value === "verses" ? "verses" : "mushaf";
export const quranTextSize = (value) =>
  Math.max(28, Math.min(56, Number(value) || 40));
const spoken = (text) => /[\u0621-\u064a\u0671]/u.test(text);
export function verseTokens(unit, canonical = unit) {
  if (unit !== canonical && unit.wordRefs?.length)
    return unit.wordRefs.map((w) => ({
      text: w.text,
      position: spoken(w.text) ? w.w : null,
    }));
  let position = 0;
  return unit.text
    .trim()
    .split(/\s+/)
    .map((text) => ({ text, position: spoken(text) ? ++position : null }));
}
export function pageVerseUnits(sections, page) {
  return sections
    .flatMap((s) => s.units)
    .filter((u) => (u.pages || [u.page]).includes(page));
}
export function spokenVerseUnit(unit) {
  const [s, a] = unit.id.split(":").map(Number),
    words = verseTokens(unit).filter((w) => w.position);
  return {
    ...unit,
    text: words.map((w) => w.text).join(" "),
    wordRefs: words.map((w) => ({ s, a, w: w.position, text: w.text })),
  };
}
export function verseReadingHTML(
  {
    units,
    sections,
    resolve,
    size = 40,
    pageNavigation = null,
    wordPlaying = null,
  },
  escape,
) {
  const e = escape;
  return `<div class="quran-verse-scroll" tabindex="0" aria-label="Lecture du Coran, verset par verset" style="--quran-text-size:${quranTextSize(size)}px"><div class="quran-verse-help"><p>Touche un mot pour l’écouter. Le bouton Écouter lit le verset entier.</p><div class="verse-size-controls"><span>Taille du texte</span><button type="button" data-action="quran-font" data-delta="-4" aria-label="Réduire la taille du texte" ${quranTextSize(size) <= 28 ? "disabled" : ""}>A−</button><button type="button" data-action="quran-font" data-delta="4" aria-label="Agrandir le texte" ${quranTextSize(size) >= 56 ? "disabled" : ""}>A+</button></div></div>${units
    .map((u) => {
      const [sid, n] = u.id.split(":"),
        name = sections.find((s) => String(s.id) === sid)?.name || sid;
      return `<article class="quran-verse-block" data-verse-key="${e(u.id)}"><header><span>${e(name)} · verset ${e(n)}</span><button type="button" class="verse-listen" data-action="listen-reading-verse" data-id="${e(u.id)}" aria-label="Écouter le verset ${e(n)} de ${e(name)}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg> Écouter</button></header><p dir="rtl" lang="ar">${verseTokens(
        u,
        resolve(u.id),
      )
        .map((w) =>
          w.position
            ? `<button type="button" class="quran-word ${wordPlaying === u.id + ":" + w.position ? "is-speaking" : ""}" data-action="listen-word" data-id="${e(u.id)}" data-position="${w.position}" aria-label="Écouter le mot ${e(w.text)}">${e(w.text)}</button>`
            : `<span class="quran-pause">${e(w.text)}</span>`,
        )
        .join(" ")}</p></article>`;
    })
    .join(
      "",
    )}${pageNavigation ? `<div class="verse-page-navigation"><button class="btn secondary" data-action="previous" ${pageNavigation.first ? "disabled" : ""}>Page précédente</button><button class="btn secondary" data-action="next" ${pageNavigation.last ? "disabled" : ""}>Page suivante</button></div>` : ""}</div>`;
}
export class QuranWordAudio {
  constructor(fetcher = (...args) => fetch(...args)) {
    this.fetcher = fetcher;
    this.chapters = new Map();
  }
  async range(id, position) {
    if (
      !/^\d{1,3}:\d{1,3}$/.test(id) ||
      !Number.isInteger(position) ||
      position < 1
    )
      return null;
    const chapter = Number(id.split(":")[0]);
    if (chapter < 1 || chapter > 114) return null;
    if (!this.chapters.has(chapter))
      this.chapters.set(
        chapter,
        this.fetcher(
          `data/word-audio/minshawi/${String(chapter).padStart(3, "0")}.json`,
        )
          .then((r) => {
            if (!r.ok)
              throw Error(
                "Les repères audio ne sont pas disponibles hors connexion. Télécharge les fichiers avec une connexion.",
              );
            return r.json();
          })
          .catch((e) => {
            this.chapters.delete(chapter);
            throw e;
          }),
      );
    const data = await this.chapters.get(chapter),
      range = data.verses?.[id]?.[position - 1];
    return Array.isArray(range) && range.length === 2 && range[1] > range[0]
      ? { start: range[0] / 1000, end: range[1] / 1000 }
      : null;
  }
}
