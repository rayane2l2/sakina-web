import { PAGE_REVIEW as settings } from "./revision-settings.js";

const dayMs = 86400000;
const stamp = date => Date.parse(date + "T00:00:00Z");
export const shiftReviewDay = (date, days) =>
  new Date(stamp(date) + dayMs * days).toISOString().slice(0, 10);
const age = (date, since) => (stamp(date) - stamp(since)) / dayMs;
const last = entry => entry.recitations.at(-1);
const rotationDue = entry => entry.rotationDue || entry.due;
const latestLearned = entry => entry.lastLearnedOn || entry.learnedOn;
export const maintenanceCycle = pages =>
  settings.maintenanceCycles.find(([juz]) => pages / settings.pagesPerJuz < juz || juz === Infinity)[1];
export const normalMaintenanceCycle = pages =>
  maintenanceCycle(pages) === settings.maintenanceCycles[1][1] ? settings.shorterCycle : maintenanceCycle(pages);

function* notesToday(entry, date) {
  for (let i = entry.recitations.length - 1; i >= 0; i--) {
    const note = entry.recitations[i];
    if (note.date < date) return;
    if (note.date === date) yield note;
  }
}

function reviewedToday(entry, words, date) {
  const reviewed = new Set();
  for (const note of notesToday(entry, date))
    for (const word of note.words || []) reviewed.add(word);
  return words.every(word => reviewed.has(word));
}

function circuitItem(page, circuit, repetitions = 1) {
  return {...page, circuit, repetitions};
}

export function circuitPlan(state, coverage, date, maintenanceCoverage = coverage, cycleOverride = null) {
  const candidates = coverage.filter(page => state[page.page]);
  const entries = name => candidates.filter(page => state[page.page].state === name);
  const pending = pages => pages.filter(({page, words}) =>
    !reviewedToday(state[page], words, date));
  const remaining = (name, limit, pages = candidates) => Math.max(0, limit - pages.filter(({page}) =>
    Array.from(notesToday(state[page], date)).some(note => note.circuit === name)).length);

  const ancrage = pending(entries("ancrage")).filter(({page}) => state[page].due <= date)
    .sort((a,b) => latestLearned(state[b.page]).localeCompare(latestLearned(state[a.page])) || a.page - b.page)
    .map(page => circuitItem(page, "ancrage", age(date, latestLearned(state[page.page])) === 1 ? settings.yesterdayRepetitions : 1));
  const reparation = pending(entries("reparation")).filter(({page}) => state[page].due <= date)
    .sort((a,b) => state[a.page].due.localeCompare(state[b.page].due) || a.page - b.page)
    .slice(0, remaining("reparation", settings.repairDailyLimit))
    .map(page => circuitItem(page, "reparation", settings.repairRepetitions));
  const liaisonPages = entries("liaison").sort((a,b) =>
    latestLearned(state[b.page]).localeCompare(latestLearned(state[a.page])) || b.page - a.page);
  const daily = liaisonPages.filter(({page}) => age(date, latestLearned(state[page])) < settings.liaisonWindow)
    .slice(0, settings.liaisonRecentPages);
  const dailyPages = new Set(daily.map(({page}) => page));
  const alternated = liaisonPages.filter(({page}) => !dailyPages.has(page)).filter(({page}) => {
    const previous = last(state[page]);
    return !previous || age(date, previous.date) >= settings.alternateEvery;
  });
  const liaison = pending([...daily, ...alternated]).filter(({page}) => state[page].due <= date)
    .sort((a,b) => a.page - b.page).map(page => circuitItem(page, "liaison"));

  const maintenance = maintenanceCoverage.filter(({page}) => state[page]?.state === "entretien");
  const cycle = cycleOverride || normalMaintenanceCycle(maintenance.length);
  const due = pending(maintenance).filter(({page}) => state[page].due <= date);
  const rotation = due.filter(({page}) => rotationDue(state[page]) <= date)
    .sort((a,b) => rotationDue(state[a.page]).localeCompare(rotationDue(state[b.page])) || a.page - b.page)
    .slice(0, remaining("entretien", Math.ceil(maintenance.length / cycle), maintenance));
  const early = due.filter(({page}) => rotationDue(state[page]) > date)
    .sort((a,b) => state[a.page].stability - state[b.page].stability || a.page - b.page)
    .slice(0, remaining("entretien-early", settings.earlyMaintenanceLimit));
  return {ancrage, reparation, liaison,
    entretien: [...rotation.map(p => circuitItem(p, "entretien")),
      ...early.map(p => circuitItem(p, "entretien-early"))], cycle};
}

export const circuitOrder = (plan, learning) =>
  [...plan.ancrage, ...plan.reparation, ...plan.liaison, ...learning, ...plan.entretien];

function liaisonEvidence(entry, date) {
  const { liaisonSince, liaisonUntil } = entry;
  if (!liaisonSince || date < (liaisonUntil || shiftReviewDay(liaisonSince, settings.liaisonDays))) return false;
  const notes = entry.recitations.filter(note => note.date >= liaisonSince).slice(-settings.liaisonEvidence);
  return notes.length === settings.liaisonEvidence &&
    notes.filter(note => note.rating === "clean").length >= settings.liaisonEvidence - settings.liaisonHesitations &&
    notes.every(note => ["clean", "hesitant"].includes(note.rating));
}

export function circuitRating(previous, rated, circuit, date, cycle) {
  const rating = last(rated).rating;
  if (rating === "blocked") {
    return {...rated, state:"liaison", liaisonSince:date, due:shiftReviewDay(date, 1)};
  }
  if (rating === "mistake") {
    return {...rated, state:"reparation", repairStartedOn:date, repairIndex:0,
      due:shiftReviewDay(date, settings.repairDays[0])};
  }
  if (rated.state === "reparation") {
    const repairIndex = (previous.repairIndex || 0) + 1;
    if (repairIndex >= settings.repairDays.length && rated.cleanStreak >= settings.repairCleanStreak)
      return {...rated, state:"liaison", liaisonSince:date, liaisonUntil:null, due:shiftReviewDay(date, 1)};
    const target = settings.repairDays[repairIndex];
    const due = target && previous.repairStartedOn ? shiftReviewDay(previous.repairStartedOn, target) : date;
    return {...rated, repairIndex, due:due > date ? due : shiftReviewDay(date, 1)};
  }
  if (rated.state === "ancrage" && latestLearned(rated) === date)
    return {...rated, cleanStreak:0, due:shiftReviewDay(date, 1)};
  if (rated.state === "ancrage" && age(date, latestLearned(rated)) >= settings.anchorDays &&
      rated.cleanStreak >= settings.anchorCleanStreak)
    return {...rated, state:"liaison", liaisonSince:date, liaisonUntil:null, due:shiftReviewDay(date, 1)};
  if (rated.state === "liaison" && liaisonEvidence(rated, date))
    return {...rated, state:"entretien", rotationDue:shiftReviewDay(date, cycle),
      due:shiftReviewDay(date, Math.min(cycle, Math.floor(rated.stability)))};
  if (rated.state !== "entretien") return {...rated, due:shiftReviewDay(date, 1)};
  const nextRotation = circuit === "entretien-early" && rotationDue(previous) > date
    ? rotationDue(previous) : shiftReviewDay(date, cycle);
  const stabilityDue = shiftReviewDay(date, Math.min(cycle, Math.floor(rated.stability)));
  return {...rated, rotationDue:nextRotation, due:nextRotation < stabilityDue ? nextRotation : stabilityDue};
}
