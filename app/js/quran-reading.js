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
  value === "verses" || value === "phonetic" ? "verses" : "mushaf";
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
  return verseIndex(sections).byPage.get(page) || [];
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
export function verseRowsHTML({ units, sections, resolve, wordPlaying, printedPlaying, tajweed }, e) {
  return units.map((u) => {
  const [sid, n] = u.id.split(":"),
    section = sections.find((s) => String(s.id) === sid),
    name = section?.name || sid;
  const printed = Boolean(u !== resolve(u.id) && u.wordRefs?.length);
  const chapterHeading = n === "1" && (!u.wordRefs?.length || u.wordRefs[0].w === 1)
    ? `<div data-book-heading-for="${e(u.id)}"><div class="quran-book-title"><strong>Sourate ${e(name)}</strong>${section?.ar ? `<span lang="ar" dir="rtl">${e(section.ar)}</span>` : ""}</div>${sid === "1" || sid === "9" ? "" : `<div class="quran-book-basmala"><span lang="ar" dir="rtl">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</span>${versePhoneticHTML({id: "1:1"})}</div>`}</div>`
    : "";
  return `${chapterHeading}<article class="quran-verse-block" data-verse-key="${e(u.id)}"><button type="button" class="verse-listen" data-action="listen-reading-verse" data-id="${e(u.id)}" aria-label="Écouter le verset ${e(n)} de ${e(name)}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg></button><p dir="rtl" lang="ar">${verseTokens(
    u,
    resolve(u.id),
  )
    .map((w) =>
      w.position
        ? `<button type="button" class="quran-word ${(printed ? printedPlaying : wordPlaying) === u.id + ":" + w.position ? "is-speaking" : ""}" data-action="listen-word" data-id="${e(u.id)}" data-position="${w.position}" data-coordinate="${printed ? "printed" : "canonical"}" aria-label="Écouter le mot ${e(w.text)}">${tajweedWord(w.text, u.id, w.position, printed ? "printed" : "canonical", tajweed, e)}</button>`
        : `<span class="quran-pause">${e(w.text)}</span>`,
    )
    .join(" ")} <span class="quran-book-marker" aria-label="Verset ${e(n)}">${e(n)}</span></p>${versePhoneticHTML(u, { playing: printedPlaying })}</article>`;
  }).join('');
}

export function verseReadingHTML(config, escape) {
  const { size = 40, showHint = true, tajweed } = config;
  return `<div class="quran-verse-scroll quran-book-reading" tabindex="0" aria-label="Lecture du Coran en arabe et en phonétique" style="--quran-text-size:${quranTextSize(size)}px"><div class="quran-book-tools">${tajweed ? tajweedLegend(escape) : ''}${phoneticLegend()}${showHint ? '<p class="quran-verse-help">Touche un mot pour l’écouter. ▶ lit le verset.</p>' : ''}</div><div class="quran-book-sheet">${verseRowsHTML(config, escape)}</div></div>`;
}

const bookChunkSize = 24;
const verseIndexes = new WeakMap();

function verseIndex(sections) {
  let index = verseIndexes.get(sections);
  if (index) return index;
  const units = sections.flatMap((section) => section.units);
  const byId = new Map(units.map((unit, i) => [unit.id, i]));
  const byPage = new Map();
  for (const unit of units) {
    for (const page of new Set(unit.pages || [unit.page])) {
      if (!byPage.has(page)) byPage.set(page, []);
      byPage.get(page).push(unit);
    }
  }
  index = { units, byId, byPage };
  verseIndexes.set(sections, index);
  return index;
}

function visibleBookRow(sheet, top) {
  const children = sheet.children;
  let lo = 0, hi = children.length;
  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (children[mid].getBoundingClientRect().bottom <= top) lo = mid + 1;
    else hi = mid;
  }
  return children[Math.min(lo, children.length - 1)];
}

export function verseBookViewportTop(scroller) {
  return scroller.querySelector('.quran-book-tools')?.getBoundingClientRect().bottom ?? scroller.getBoundingClientRect().top;
}

export function verseBookPosition(scroller) {
  const sheet = scroller?.querySelector('.quran-book-sheet');
  if (!sheet?.children.length) return null;
  const top = verseBookViewportTop(scroller);
  const row = visibleBookRow(sheet, top + 1);
  return {
    id: row.dataset.verseKey || row.dataset.bookHeadingFor,
    heading: Boolean(row.dataset.bookHeadingFor),
    offset: row.getBoundingClientRect().top - top,
    top: scroller.scrollTop,
  };
}

export function mountVerseBook(scroller, config, escape) {
  const { sections, anchorId, page, restore, onVerse } = config;
  const { units, byId, byPage } = verseIndex(sections);
  const sheet = scroller.querySelector('.quran-book-sheet');
  const wanted = byId.get(anchorId);
  const at = wanted !== undefined && (units[wanted].pages || [units[wanted].page]).includes(page)
    ? wanted
    : byId.get(byPage.get(page)?.[0]?.id) ?? 0;
  let start = Math.max(0, at - bookChunkSize);
  let end = Math.min(units.length, at + bookChunkSize);
  const renderRows = (from, to) => verseRowsHTML({
    ...config,
    ...config.playback?.(),
    units: units.slice(from, to),
  }, escape);
  sheet.innerHTML = renderRows(start, end);
  const restored = restore?.id === units[at].id ? restore : null;
  const id = CSS.escape(units[at].id);
  const target = (restored?.heading !== false && sheet.querySelector(`[data-book-heading-for="${id}"]`))
    || sheet.querySelector(`[data-verse-key="${id}"]`);
  if (restored?.top === 0 && start === 0) scroller.scrollTop = 0;
  else if (target && (at > 0 || restored))
    scroller.scrollTop += target.getBoundingClientRect().top - verseBookViewportTop(scroller) - (restored?.offset ?? 8);

  let frame = 0;
  scroller.addEventListener('scroll', () => {
    if (frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      if (!scroller.isConnected) return;
      const position = verseBookPosition(scroller);
      if (position) onVerse?.(units[byId.get(position.id)]);
      if (scroller.scrollTop < 350 && start > 0) {
        const first = sheet.firstElementChild;
        const before = first.getBoundingClientRect().top;
        const next = Math.max(0, start - bookChunkSize);
        sheet.insertAdjacentHTML('afterbegin', renderRows(next, start));
        scroller.scrollTop += first.getBoundingClientRect().top - before;
        start = next;
      }
      if (scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight < 500 && end < units.length) {
        const next = Math.min(units.length, end + bookChunkSize);
        sheet.insertAdjacentHTML('beforeend', renderRows(end, next));
        end = next;
      }
    });
  }, { passive: true });
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
