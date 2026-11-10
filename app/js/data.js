import { MATN_SPECS, buildImportedMatn } from "./matn-corpus.js";
import { buildPageUnits, splitPageUnits } from "./page-core.js";
import { buildMacroIndex } from "./macro-plan.js";
export let corpora, phonetics, pageIndex, pageUnits, quranMacroIndex;
let indexes, pageSections;
export async function loadData() {
  const [q, m, p, index, ...imported] = await Promise.all(
    [
      "quran",
      "ibn-ashir",
      "phonemes",
      "page-index",
      ...MATN_SPECS.map((s) => s.file),
    ].map(async (name) => {
      const r = await fetch(`data/${name}.json`);
      if (!r.ok) throw Error("Bibliothèque indisponible");
      return r.json();
    }),
  );
  const quran = q.surahs.map((s) => ({
    id: String(s.n),
    name: s.name,
    ar: s.ar,
    units: s.ayahs.map((a, i) => ({
      id: `${s.n}:${i + 1}`,
      text: a.t,
      page: a.page,
      juz: a.juz,
      n: i + 1,
    })),
  }));
  let n = 0;
  const matn = m.chapters.map((ch, i) => ({
    id: String(i + 1),
    name: i === 0 ? "Introduction" : ch.title,
    ar: ch.title,
    first: n + 1,
    units: ch.abyat.map((parts) => ({
      id: `${i + 1}:${++n}`,
      text: parts.join(" "),
      parts,
      n,
      audio:
        n <= 315 ? `data/ibn-ashir/${String(n).padStart(3, "0")}.mp3` : null,
    })),
  }));
  matn.forEach((s) => (s.last = s.units.at(-1).n));
  corpora = {
    quran: { id: "quran", name: "Le Coran", unit: "verset", sections: quran },
    "ibn-ashir": {
      id: "ibn-ashir",
      name: "Matn Ibn Ashir",
      unit: "vers",
      sections: matn,
    },
  };
  for (let i = 0; i < imported.length; i++) {
    const c = buildImportedMatn(imported[i], MATN_SPECS[i]);
    corpora[c.id] = c;
  }
  phonetics = p.verses;
  pageIndex = index;
  pageUnits = buildPageUnits(index);
  const fragments = splitPageUnits(pageUnits);
  pageSections = new Map();
  for (const u of [...pageUnits, ...fragments]) {
    const prefix = u.id.split(":")[0];
    if (!pageSections.has(prefix))
      pageSections.set(prefix, String(u.wordRefs[0].s));
  }
  const pagesByAyah = new Map(),
    printedWordsByAyah = new Map();
  for (const page of index)
    for (const line of page.lines)
      for (const w of line.words) {
        const id = `${w.s}:${w.a}`;
        if (!pagesByAyah.has(id)) pagesByAyah.set(id, new Set());
        pagesByAyah.get(id).add(page.n);
        if (!printedWordsByAyah.has(id)) printedWordsByAyah.set(id, new Map());
        printedWordsByAyah.get(id).set(w.w, w);
      }
  for (const surah of quran)
    for (const u of surah.units) {
      u.pages = [...(pagesByAyah.get(u.id) || [u.page])];
      u.wordRefs = [...(printedWordsByAyah.get(u.id)?.values() || [])].sort(
        (a, b) => a.w - b.w,
      );
    }

  for (const unit of [...pageUnits, ...fragments]) {
    const refs = unit.wordRefs.map(
      (w) => phonetics[`${w.s}:${w.a}`]?.aya_phonemes_list[w.w - 1] || "",
    );
    phonetics[unit.id] = {
      aya_phoneme: refs.join(""),
      aya_phonemes_list: refs,
    };
  }
  quranMacroIndex = buildMacroIndex(
    quran.flatMap((s) => s.units),
    [...pageUnits, ...fragments],
    index,
  );
  indexes = Object.fromEntries(
    Object.values(corpora).map((c) => [
      c.id,
      new Map(
        [
          ...c.sections.flatMap((s) => s.units),
          ...(c.id === "quran" ? [...pageUnits, ...fragments] : []),
        ].map((u) => [u.id, u]),
      ),
    ]),
  );
}
export const section = (corpus, id) =>
  corpora[corpus].sections.find(
    (s) =>
      s.id ===
      String(
        String(id).startsWith("p")
          ? pageSections.get(String(id).split(":")[0])
          : id,
      ),
  );
export const findUnit = (corpus, id) => indexes[corpus].get(id);
export const sectionLabel = (corpus, s) =>
  corpus === "quran"
    ? s.name
    : `${s.name} · ${corpora[corpus].unit}${corpora[corpus].unit === "passage" ? "s" : ""} ${s.first}–${s.last}`;
export function pageSizes(units) {
  if (units[0]?.size !== undefined)
    return Object.fromEntries(units.map((u) => [u.id, u.size]));
  const totals = {};
  corpora.quran.sections
    .flatMap((s) => s.units)
    .forEach((u) => (totals[u.page] = (totals[u.page] || 0) + u.text.length));
  return Object.fromEntries(
    units.map((u) => [u.id, u.text.length / totals[u.page]]),
  );
}
