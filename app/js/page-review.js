import { wordKey } from "./page-core.js";
import { PAGE_REVIEW as rules } from "./revision-settings.js";
import { circuitRating, normalMaintenanceCycle } from "./revision-circuits.js";

export const PAGE_RATINGS = Object.freeze({
  clean: "Propre", hesitant: "Hésitant", mistake: "Faute", blocked: "Bloqué",
});

const wordPages = new WeakMap();
function indexWords(index) {
  if (!wordPages.has(index)) {
    const pages = new Map();
    for (const page of index)
      for (const line of page.lines)
        for (const word of line.words) pages.set(wordKey(word), page.n);
    wordPages.set(index, pages);
  }
  return wordPages.get(index);
}

export function pageCoverage(ids, index, resolve) {
  const pages = indexWords(index);
  const coverage = new Map();
  for (const id of ids) {
    for (const word of resolve(id)?.wordRefs || []) {
      const key = wordKey(word), page = pages.get(key);
      if (page == null) continue;
      if (!coverage.has(page)) coverage.set(page, {words: new Set(), ayahs: new Set(), units: new Set()});
      const entry = coverage.get(page);
      entry.words.add(key);
      entry.ayahs.add(`${word.s}:${word.a}`);
      entry.units.add(id);
    }
  }
  return [...coverage].sort(([a], [b]) => a - b).map(([page, entry]) => ({
    page, words: [...entry.words], ayahs: [...entry.ayahs], units: [...entry.units],
  }));
}

function addDays(date, days) {
  const utc = new Date(date + "T00:00:00Z");
  utc.setUTCDate(utc.getUTCDate() + days);
  return utc.toISOString().slice(0, 10);
}

function createPage(page, learnedOn, due, migrated) {
  return {
    page, state: migrated ? "entretien" : "ancrage", learnedOn, due,
    stability: migrated ? rules.migratedStability : rules.initialStability,
    difficulty: migrated ? rules.migratedDifficulty : rules.initialDifficulty,
    recitations: [], cleanStreak: 0, weakPoints: [],
  };
}

export function migratePageState(programme, index, resolve, date) {
  if (programme.corpus !== "quran" || programme.pageState) return programme;
  const items = programme.memo.items || {};
  const pages = pageCoverage(Object.keys(items), index, resolve);
  const cycle = programme.memo.cycle || rules.defaultCycle;
  return {...programme, pageState: Object.fromEntries(pages.map((entry, i) => {
    const learnedOn = entry.units.map(id => items[id].first).filter(Boolean).sort()[0] || date;
    return [entry.page, createPage(entry.page, learnedOn, addDays(date, 1 + Math.floor(i * cycle / pages.length)), true)];
  }))};
}

export function startReviewCircuits(programme, date) {
  if (programme.corpus !== "quran" || programme.reviewCircuits) return programme;
  const maintenance = Object.values(programme.pageState || {}).filter(p => p.state === "entretien")
    .sort((a,b) => a.due.localeCompare(b.due) || a.page - b.page);
  const cycle = normalMaintenanceCycle(maintenance.length);
  const pageState = {...programme.pageState};
  maintenance.forEach((page, i) => {
    const latest = addDays(date, 1 + Math.floor(i * cycle / maintenance.length));
    const due = page.due < latest ? page.due : latest;
    pageState[page.page] = {...page, due, rotationDue:due};
  });
  return {...programme, pageState, reviewCircuits:true};
}

export function seedProgrammeReview(programme, index, resolve, date) {
  const migrated = migratePageState(programme, index, resolve, date);
  if (migrated === programme || !programme.reviewStartsOn || programme.corpus !== "quran") return migrated;
  const items = programme.memo.items;
  const recent = pageCoverage(Object.keys(items).filter(id => items[id].importedRecent), index, resolve);
  const pageState = {...migrated.pageState};
  for (const {page, units} of recent) {
    const learnedOn = units.map(id => items[id].first).filter(Boolean).sort()[0] || date;
    pageState[page] = createPage(page, learnedOn, programme.reviewStartsOn, false);
  }
  return {...migrated, pageState};
}

export function addLearnedPages(programme, ids, index, resolve, date) {
  if (programme.corpus !== "quran") return programme;
  const state = programme.pageState || {};
  const pages = pageCoverage(ids, index, resolve);
  if (!pages.length) return programme;
  const updates = pages.map(({page}) => {
    const entry = state[page];
    if (!entry) return [page, createPage(page, date, addDays(date, 1), false)];
    if (entry.state === "reparation") return [page, entry];
    return [page, {...entry, state:"ancrage", lastLearnedOn:date,
      due:addDays(date, 1), cleanStreak:0, liaisonSince:null, liaisonUntil:null}];
  });
  return {...programme, pageState: {...state, ...Object.fromEntries(updates)}};
}

function recurrentVerses(recitations) {
  const counts = new Map();
  for (const entry of recitations.slice(-rules.weakWindow))
    for (const id of [...entry.mistakes, ...entry.hesitations])
      counts.set(id, (counts.get(id) || 0) + 1);
  return [...counts].filter(([,count]) => count >= rules.weakThreshold).map(([id]) => id);
}

export function ratePage(entry, {date, ayahs, words = [], eventId, rating, verses = [], source = "seul", circuit, minutesPerPage, budgetCost}) {
  if (!Object.hasOwn(PAGE_RATINGS, rating) || entry.recitations.some(recitation => recitation.eventId === eventId)) return entry;
  const selected = [...new Set(verses)].filter(id => ayahs.includes(id));
  const recitations = [...entry.recitations, {
    date, eventId, rating, source, words, ...(circuit ? {circuit} : {}), ...(minutesPerPage > 0 ? {minutesPerPage} : {}), ...(budgetCost > 0 ? {budgetCost} : {}),
    mistakes: ["mistake", "blocked"].includes(rating) ? selected : [],
    hesitations: rating === "hesitant" ? selected : [],
  }];
  const factor = rating === "clean"
    ? (entry.difficulty >= rules.highDifficulty ? rules.hardCleanFactor : rules.cleanFactor)
    : rating === "hesitant" ? rules.hesitantFactor : rules.mistakeFactor;
  return {
    ...entry, recitations,
    state: rating === "blocked" ? "liaison" : rating === "mistake" ? "reparation" : entry.state,
    ...(rating === "blocked" ? {liaisonUntil: addDays(date, rules.blockedLiaisonDays)} : {}),
    stability: rating === "blocked" ? rules.minimumStability : Math.max(rules.minimumStability, entry.stability * factor),
    difficulty: Math.max(0, Math.min(1, entry.difficulty + rules.difficultyChange[rating])),
    cleanStreak: rating === "clean" ? entry.cleanStreak + 1 : 0,
    weakPoints: recurrentVerses(recitations),
  };
}

export function commitPageReviews(programme, reviews, date, eventId) {
  const previous = programme.pageState || {};
  const changes = {};
  const cycle = reviews[0]?.cycle || normalMaintenanceCycle(Object.values(previous).filter(entry => entry.state === "entretien").length);
  for (const {page, ...review} of reviews) {
    const entry = changes[page] || previous[page] || createPage(page, date, addDays(date, 1), false);
    const rated = ratePage(entry, {...review, date, eventId});
    if (rated !== entry) changes[page] = circuitRating(entry, rated, review.circuit, date, cycle);
  }
  return Object.keys(changes).length ? {...programme, pageState: {...previous, ...changes}} : programme;
}
