import { wordKey } from "./page-core.js";

export function completedSurahChecks(programme, sections, resolve) {
  const known = programme.memo.items;
  const wordRefs = Object.keys(known).filter(id => id.startsWith("p"))
    .flatMap(id => (resolve(id)?.wordRefs || []).map(wordKey));
  const printed = new Set(wordRefs);
  return sections.filter(({units}) => units.length && units.every(unit =>
    known[unit.id] || (unit.wordRefs?.length && unit.wordRefs.every(word => printed.has(wordKey(word))))
  )).map(({id,name}) => ({id,name, status:programme.surahChecks?.[id]?.status || "pending"}));
}

export function markSurahCheck(programme, id, status, date) {
  if (!["corrected", "continue-alone"].includes(status)) return programme;
  if (programme.surahChecks?.[id]?.status === status) return programme;
  return {...programme, surahChecks:{...programme.surahChecks, [id]:{status,date}}};
}

export function eligibleMaintenancePages(plan, pending, resolve) {
  if (!pending.size) return plan;
  return plan.map(page => {
    if (!page.words.some(word => pending.has(word.split(":")[0]))) return page;
    const words = page.words.filter(word => !pending.has(word.split(":")[0]));
    if (!words.length) return null;
    const selected = new Set(words);
    return {...page, words,
      ayahs:page.ayahs.filter(id => !pending.has(id.split(":")[0])),
      units:page.units.filter(id => resolve(id)?.wordRefs.some(word => selected.has(wordKey(word)))),
    };
  }).filter(Boolean);
}
