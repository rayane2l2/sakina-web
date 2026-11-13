import { PAGE_REVIEW as rules } from "./revision-settings.js";
import { shiftReviewDay } from "./revision-circuits.js";

export const elapsedDays = (date, previous) =>
  (Date.parse(date) - Date.parse(previous)) / 86400000;

export const reviewMinutes = value => {
  const minutes = Number(value);
  return Number.isFinite(minutes) && minutes > 0
    ? Math.min(240, Math.max(5, minutes)) : rules.defaultBudgetMinutes;
};

export function pageMinutes(pageState) {
  const samples = Object.values(pageState || {}).flatMap(page => page.recitations)
    .filter(note => Number.isFinite(note.minutesPerPage) && note.minutesPerPage > 0)
    .sort((a,b) => b.date.localeCompare(a.date)).slice(0, rules.timingSamples)
    .map(note => note.minutesPerPage).sort((a,b) => a - b);
  return samples.length ? samples[Math.floor(samples.length / 2)] : rules.defaultPageMinutes;
}

export function returnStatus(programme, date) {
  const last = programme.lastStudyOn || programme.memo.log.at(-1)?.date;
  const start = programme.returnStartedOn;
  if (last && elapsedDays(date,last) >= rules.absenceDays) return {start:date, day:1};
  const days = start ? elapsedDays(date,start) + 1 : Infinity;
  return days <= rules.returnHalfDays ? {start,day:days} : null;
}

export function revisionAdvice(programme, date, estimated, budget, maintenancePages = null) {
  const entries = Object.values(programme.pageState || {});
  const since = shiftReviewDay(date, 1 - rules.adviceWindow);
  const liaison = entries.flatMap(page => page.recitations)
    .filter(note => note.circuit === "liaison" && note.date >= since && note.date <= date);
  const errors = liaison.filter(note => ["mistake","blocked"].includes(note.rating)).length;
  const errorRate = liaison.length ? errors / liaison.length : 0;
  const late = Math.max(0,...entries.filter(page => page.state === "entretien" && (!maintenancePages || maintenancePages.has(page.page)))
    .map(page => elapsedDays(date,page.rotationDue || page.due)));
  const repairs = entries.filter(page => page.state === "reparation").length;
  const returning = returnStatus(programme,date);
  const red = errorRate > rules.adviceRedRate || late > rules.adviceRedDelay || repairs > rules.adviceRedRepairs;
  const orange = errorRate >= rules.adviceOrangeRate || late >= rules.adviceOrangeDelay || estimated > budget;
  const color = red ? "red" : orange ? "orange" : "green";
  const advice = returning
    ? returning.day <= rules.returnGentleDays ? "Retour de pause. Priorité à l’ancrage et à la liaison." : "Retour de pause. Tu peux reprendre avec une demi-dose."
    : red ? "Conseil · Consolide aujourd’hui avant d’ajouter du nouveau."
    : orange ? "Conseil · Allège le nouveau si la séance te paraît longue."
    : "Tu peux avancer à ton rythme.";
  return {color, advice, late, repairs};
}

export function fitCircuitBudget(circuits, state, returning, date, minutes, budget, pageWeight) {
  const severe = page => {
    const entry = state[page.page];
    return elapsedDays(date,entry.due) > rules.overdueStabilityFactor * entry.stability;
  };
  const anchor = circuits.ancrage;
  const reparation = circuits.reparation;
  const liaison = circuits.liaison;
  const maintenance = circuits.entretien;
  const earlyReturn = returning && returning.day <= rules.returnGentleDays;
  const urgent = earlyReturn ? [...liaison,...maintenance].filter(severe)
    .map(p => ({...p, circuit:"return-test"})) : [];
  const keys = new Set(urgent.map(p => p.page));
  const groups = [
    ["ancrage",anchor], ["reparation",earlyReturn ? [] : reparation],
    ["liaison",liaison.filter(p => !keys.has(p.page))],
    ["entretien",earlyReturn ? [] : maintenance],
  ];
  const cost = p => minutes * pageWeight(p) * p.repetitions;
  const spent = Object.values(state).flatMap(entry => entry.recitations || [])
    .filter(note => note.date === date).reduce((sum,note)=>sum+(note.budgetCost || 0),0);
  const estimate = Math.ceil(spent + [...anchor,...reparation,...liaison,...maintenance].reduce((sum,p) => sum + cost(p),0));
  let remaining = budget - spent;
  let selected = spent > 0 ? 1 : 0;
  let full = false;
  const fit = pages => {
    const result = [];
    for (const page of pages) {
      if (full || (selected && cost(page) > remaining)) { full = true; break; }
      result.push(page);
      remaining -= cost(page);
      selected++;
    }
    return result;
  };
  const priority = fit(urgent);
  const limited = Object.fromEntries(groups.map(([key,pages]) => [key,fit(pages)]));
  return {...limited, ancrage:[...priority,...limited.ancrage], estimate, remaining:Math.max(0,remaining)};
}

export function forecastReview(pacePages, budget, minutes, maxPages) {
  if (!(pacePages > 0)) return null;
  for (let pages = 1; pages <= maxPages; pages++) {
    const anchor = Math.min(pages,rules.anchorDays * pacePages);
    const liaison = Math.min(rules.liaisonRecentPages, Math.max(0,Math.min(pages,rules.liaisonWindow * pacePages)-anchor));
    const maintenance = pages-anchor-liaison;
    const cycle = rules.maintenanceCycles.find(([juz]) => maintenance / rules.pagesPerJuz < juz)[1];
    const load = Math.ceil(minutes * (anchor + Math.min(anchor,pacePages) + liaison + maintenance/cycle));
    if (load > budget) return {pages, juz:Math.ceil(pages/rules.pagesPerJuz), minutes:load};
  }
  return null;
}
