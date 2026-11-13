import { PAGE_REVIEW as rules } from "./revision-settings.js";
import { elapsedDays } from "./revision-support.js";
import { circuitPlan, circuitRating } from "./revision-circuits.js";
import { ratePage } from "./page-review.js";
import { dailyMatnPlan } from "./matn-plan.js";

const states = {ancrage:"Ancrage",liaison:"Liaison",entretien:"Entretien",reparation:"Réparation"};

export function solidityGrid(programme, escape, total = 604) {
  return `<div class="solidity-grid">${Array.from({length:total},(_,i) => {
    const page = programme.pageState?.[i+1];
    const label = page ? `${states[page.state]} · stabilité ${Math.round(page.stability)} j` : "À apprendre";
    return `<span class="solidity-cell ${escape(page?.state || "")}" title="${escape(label)}" aria-label="Page ${i+1} · ${escape(label)}">${i+1}</span>`;
  }).join("")}</div>`;
}

export function weeklyPractice(programme, coverage, index, resolve, date) {
  if (programme.lastWeeklyOn && elapsedDays(date,programme.lastWeeklyOn) < rules.weeklyDays) return [];
  const maintained = coverage.filter(({page}) => programme.pageState[page]?.state === "entretien");
  const coveredWords = new Set(maintained.flatMap(p => p.words));
  const known = new Set(maintained.flatMap(p => p.ayahs).filter(id =>
    resolve(id)?.wordRefs.every(w => coveredWords.has(`${w.s}:${w.a}:${w.w}`))));
  const positions = new Set(maintained.map(p => p.page));
  const week = Math.floor(Date.parse(date) / (86400000 * rules.weeklyDays));
  const pairs = [];
  for (const page of positions) {
    if (!positions.has(page+1)) continue;
    const before = index[page-1]?.lines.at(-1)?.words.at(-1);
    const after = index[page]?.lines[0]?.words[0];
    if (!before || !after) continue;
    const ids = [...new Set([before,after].map(w => `${w.s}:${w.a}`))];
    if (ids.length === 2 && ids.every(id => known.has(id))) pairs.push(ids);
  }
  const exercise = (ids,label,exerciseKind) => ({ids,label,exerciseKind,kind:"review",test:true,afterLearning:true});
  const rotated = items => items.length ? items.map((_,i)=>items[(week+i)%items.length]) : [];
  const jointures = rotated(pairs).slice(0,rules.junctionCount)
    .map(ids=>exercise(ids,`Jointure · environ ${rules.junctionSeconds} s`,"junction"));
  const calls = rotated([...known]).map(id => {
    const [sid,n] = id.split(":");
    return Array.from({length:rules.randomVerses},(_,i)=>`${sid}:${Number(n)+i}`);
  });
  const call = calls.find(ids => ids.every(id => known.has(id)));
  const similar = (programme.similarVerses || []).filter(ids => ids.every(id => programme.memo.items[id] && resolve(id)));
  return [...jointures,...(call ? [exercise(call,`Départ au hasard · ${rules.randomMinutes} min`,"random")] : []),
    ...similar.map(ids=>exercise(ids,"Comparer deux versets similaires","similar"))];
}

export function milestonePlan(programme, sections, date, eligible) {
  const groups = new Map();
  for (const section of sections) for (const unit of section.units) {
    if (!groups.has(unit.juz)) groups.set(unit.juz,[]);
    groups.get(unit.juz).push(unit.id);
  }
  const complete = ids => ids?.length && ids.every(id => programme.memo.items[id] && eligible(id.split(":")[0]));
  if (groups.size === 30 && [...groups.values()].every(complete)) {
    const first = programme.milestones?.khatm;
    if (!first || elapsedDays(date,first) < rules.khatmDays)
      return {key:"khatm",title:"Après le khatm",detail:`Consolidation renforcée pendant ${rules.khatmDays} jours, avec un cycle de ${rules.khatmCycle} jours.`};
  }
  for (const [juz,ids] of [...groups].reverse()) {
    if (!complete(ids)) continue;
    const first = programme.milestones?.[juz];
    const general = juz % rules.milestoneEveryJuz === 0;
    const days = general ? rules.weeklyDays : rules.milestoneDays;
    if (!first || elapsedDays(date,first) < days) {
      const all = general ? [...groups.values()].flat().filter(id => programme.memo.items[id] && eligible(id.split(":")[0])) : ids;
      const offset = first ? elapsedDays(date,first) : 0;
      const chunk = Math.ceil(all.length / days);
      return {key:String(juz),title:general ? "Révision générale" : `Consolider le juz ${juz}`,
        detail:general ? "Tout l’acquis réparti sur une semaine." : `Récite le juz entier pendant ${days} jours.`,
        ids:general ? all.slice(offset*chunk,(offset+1)*chunk) : all};
    }
    break;
  }
  return null;
}

export function rateMatnPortion(programme, entry, coverage, note) {
  const id = coverage.units[0];
  const rated = ratePage(entry,{...coverage,...note});
  if (rated === entry) return programme;
  return {...programme,matnReviews:{...programme.matnReviews,
    [id]:circuitRating(entry,rated,note.circuit,note.date,rules.matnCycle)}};
}

export function circuitMatnPlan(programme,date,M,resolve) {
  const known = programme.memo.units.filter(id => programme.memo.items[id]);
  const words = id => resolve(id)?.text?.trim().split(/\s+/).length || 0;
  const acquiredMinutes = known.reduce((sum,id) => sum + words(id),0) / rules.matnWordsPerMinute;
  if (acquiredMinutes <= rules.matnDailyMinutes)
    return dailyMatnPlan(programme.memo,date,M);
  const coverage = known.map((id,i) => ({page:i+1, words:[id], units:[id], ayahs:[id]}));
  const state = Object.fromEntries(coverage.map(({page,units:[id]}) => {
    const item = programme.memo.items[id];
    const notes = (programme.matnReviews?.[id]?.recitations || []);
    const from = item.learned || item.first || date;
    const phase = elapsedDays(date,from);
    const fallback = {page,state:phase <= rules.anchorDays ? "ancrage" : phase < rules.liaisonWindow ? "liaison" : "entretien",
      learnedOn:from,liaisonSince:phase > rules.anchorDays ? from : null,due:phase < rules.liaisonWindow ? date : item.due || date,
      stability:rules.initialStability,difficulty:rules.initialDifficulty,recitations:notes,cleanStreak:0,weakPoints:[]};
    return [page,programme.matnReviews?.[id] || fallback];
  }));
  const plan = circuitPlan(state,coverage,date,coverage,rules.matnCycle);
  return {fresh:M.nextNew(programme.memo,date),
    recent:[...plan.ancrage,...plan.reparation,...plan.liaison],revision:plan.entretien,state};
}
