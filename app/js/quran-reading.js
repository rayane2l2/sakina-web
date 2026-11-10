import {versePhoneticHTML,phoneticLegend} from './phonetic-view.js';
import {
  RECITER_AUDIO_FOLDERS,
  playbackWord,
  wordRecordings,
  printedPositions,
  canonicalPositions,
} from "./quran-audio-sync.js";
import { tajweedWord, tajweedLegend } from "./tajweed.js";
export const quranReadingMode = (value) =>
  ["verses","phonetic"].includes(value) ? value : "mushaf";
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
  if (unit.wordRefs?.length)
    return { ...unit, text: unit.wordRefs.map((w) => w.text).join(" ") };
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
    showHint = true,
    tajweed = null,
  },
  escape,
) {
  const e = escape;
  return `<div class="quran-verse-scroll" tabindex="0" aria-label="Lecture du Coran, verset par verset" style="--quran-text-size:${quranTextSize(size)}px">${tajweed ? tajweedLegend(e) : ""}${phoneticLegend()}${showHint ? '<p class="quran-verse-help">Touche un mot pour l’écouter. ▶ lit le verset.</p>' : ""}${units
    .map((u) => {
      const [sid, n] = u.id.split(":"),
        name = sections.find((s) => String(s.id) === sid)?.name || sid;
      return `<article class="quran-verse-block" data-verse-key="${e(u.id)}"><header><span>${e(name)} · verset ${e(n)}</span><button type="button" class="verse-listen" data-action="listen-reading-verse" data-id="${e(u.id)}" aria-label="Écouter le verset ${e(n)} de ${e(name)}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg></button></header><p dir="rtl" lang="ar">${verseTokens(
        u,
        resolve(u.id),
      )
        .map((w) =>
          w.position
            ? `<button type="button" class="quran-word ${wordPlaying === u.id + ":" + w.position ? "is-speaking" : ""}" data-action="listen-word" data-id="${e(u.id)}" data-position="${w.position}" data-coordinate="${u !== resolve(u.id) && u.wordRefs?.length ? "printed" : "canonical"}" aria-label="Écouter le mot ${e(w.text)}">${tajweedWord(w.text, u.id, w.position, u !== resolve(u.id) && u.wordRefs?.length ? "printed" : "canonical", tajweed, e)}</button>`
            : `<span class="quran-pause">${e(w.text)}</span>`,
        )
        .join(" ")}</p>${versePhoneticHTML(u)}</article>`;
    })
    .join(
      "",
    )}${pageNavigation ? `<div class="verse-page-navigation"><button class="btn secondary" data-action="previous" ${pageNavigation.first ? "disabled" : ""}>Page précédente</button><button class="btn secondary" data-action="next" ${pageNavigation.last ? "disabled" : ""}>Page suivante</button></div>` : ""}</div>`;
}
export class QuranWordAudio {
  constructor(fetcher = (...args) => fetch(...args)) {
    this.fetcher = fetcher;
    this.chapters = new Map();
    this.loaded = new Map();
  }
  async chapter(id, reciter = "minshawi") {
    if (!/^\d{1,3}:\d{1,3}$/.test(id) || !RECITER_AUDIO_FOLDERS[reciter])
      return null;
    const chapter = Number(id.split(":")[0]);
    if (chapter < 1 || chapter > 114) return null;
    const key = reciter + ":" + chapter;
    if (!this.chapters.has(key))
      this.chapters.set(
        key,
        this.fetcher(
          `data/word-audio/${reciter}/${String(chapter).padStart(3, "0")}.json`,
        )
          .then((r) => {
            if (!r.ok)
              throw Error(
                "Télécharge les fichiers de lecture pour utiliser ces repères hors connexion.",
              );
            return r.json();
          })
          .then((data) => {
            if (
              data.audioFolder &&
              data.audioFolder !== RECITER_AUDIO_FOLDERS[reciter]
            )
              throw Error(
                "Ces repères ne correspondent pas au récitateur choisi.",
              );
            this.loaded.set(key, data);
            return data;
          })
          .catch((e) => {
            this.chapters.delete(key);
            throw e;
          }),
      );
    return this.chapters.get(key);
  }
  async prepare(units, reciter = "minshawi") {
    const ids = [
      ...new Set(
        units
          .flatMap((u) => u.sources || [u.id])
          .filter((id) => /^\d+:\d+$/.test(id))
          .map((id) => id.split(":")[0] + ":1"),
      ),
    ];
    await Promise.all(ids.map((id) => this.chapter(id, reciter)));
  }
  cursor(id, time, reciter = "minshawi") {
    const data = this.loaded.get(reciter + ":" + Number(id.split(":")[0]));
    return data
      ? playbackWord(data, id, time)
      : { canonical: null, printed: null };
  }
  async recordings(id, position, coordinate = "canonical") {
    const data = await this.chapter(id);
    return data ? wordRecordings(data, id, position, coordinate) : [];
  }
  printedFor(id, position) {
    const data = this.loaded.get("minshawi:" + Number(id.split(":")[0]));
    return data ? printedPositions(data, id, position) : null;
  }
  async positions(id, position, coordinate = "canonical") {
    const data = await this.chapter(id);
    if (!data) return { canonical: null, printed: null };
    const c =
        coordinate === "printed"
          ? canonicalPositions(data, id, position)
          : [position],
      p =
        coordinate === "printed"
          ? [position]
          : printedPositions(data, id, position);
    return {
      canonical: c.length === 1 ? c[0] : null,
      printed: p.length === 1 ? p[0] : null,
    };
  }
  async range(id, position) {
    if (!Number.isInteger(position) || position < 1) return null;
    const data = await this.chapter(id),
      range = data?.verses?.[id]?.[position - 1];
    return Array.isArray(range) && range.length === 2 && range[1] > range[0]
      ? { start: range[0] / 1000, end: range[1] / 1000 }
      : null;
  }
}
