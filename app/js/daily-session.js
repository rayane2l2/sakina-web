import { deadlineQuota, memoDeadlineWork } from './deadline-plan.js';
import {QURAN_PLAN_VERSION} from './quran-plan.js';
// A saved checkpoint never validates knowledge and never resumes a microphone.
export function orderedLessonSteps(reviews, learning) {
  return [...reviews, ...learning];
}
export function lessonCheckpoint(session, reader, date) {
  if (!session) return null;
  return {
    date,
    quranPlanVersion:QURAN_PLAN_VERSION,
    savedAt: Date.now(),
    programId: session.program.id,
    returnView: session.returnView || "home",
    memoLogLength: session.program.memo.log.length,
    index: session.index,
    steps: session.steps,
    targets: session.targets,
    portionIds: session.portionIds,
    finishSurah: Boolean(session.finishSurah),
    extraLesson: Boolean(session.extraLesson),
    endsAtSurahBoundary: Boolean(session.endsAtSurahBoundary),
    listened: session.listened,
    listenTarget: session.listenTarget,
    phase: session.phase,
    sheet: reader.sheet || 0,
    hidden: reader.hidden,
    reveal: reader.reveal,
    revealedAyahs: reader.revealedAyahs || [],
    followId: reader.followId || null,
    ...(session.newSurahToCheck ? {newSurahToCheck:true} : {}),
    ...(session.pageReviewId ? {pageReviewId: session.pageReviewId, ratedPages: session.ratedPages} : {}),
  };
}
export function restoreLesson(checkpoint, program, date) {
  if (
    !checkpoint ||
    !program ||
    checkpoint.date !== date ||
    (program.endedEarlyOn === date && !checkpoint.finishSurah && !checkpoint.extraLesson) ||
    checkpoint.programId !== program.id ||
    checkpoint.memoLogLength !== program.memo.log.length ||
    !Array.isArray(checkpoint.steps) ||
    !Number.isInteger(checkpoint.index) ||
    !checkpoint.steps[checkpoint.index]
  )
    return null;
  const c = checkpoint,
    current = c.steps[c.index];
  if (
    !Array.isArray(current.ids) ||
    !current.ids.length ||
    !["new", "review"].includes(current.kind)
  )
    return null;
  return {
    program,
    returnView: ["home", "programs", "library"].includes(c.returnView)
      ? c.returnView
      : "home",
    corpus: program.corpus,
    steps: c.steps,
    index: c.index,
    current,
    targets: c.targets || {},
    portionIds: c.portionIds || [],
    finishSurah: Boolean(c.finishSurah),
    extraLesson: Boolean(c.extraLesson),
    endsAtSurahBoundary: Boolean(c.endsAtSurahBoundary),
    listened: Math.max(0, Number(c.listened) || 0),
    listenTarget: Math.max(0, Number(c.listenTarget) || 0),
    phase: c.phase === "recite" ? "recite" : "listen",
    audioRunning: false,
    pageReviewId: c.pageReviewId || null,
    ratedPages: Array.isArray(c.ratedPages) ? c.ratedPages : [],
    newSurahToCheck: Boolean(c.newSurahToCheck),
  };
}

// Only newly created Quran programmes defer imported/old reviews; the knowledge remains intact.
export function firstDayPlan(plan,programme,date){return programme.corpus==='quran'&&programme.reviewStartsOn&&date<programme.reviewStartsOn?{...plan,recent:[],revision:[]}:plan;}

// Only completed individual recalls count when ending before the final recall.
export function confirmedLessonUnits(session, resolve) {
  const confirmed = new Set(session.steps.slice(0, session.index)
    .filter(step => step.kind === "new" && step.practiceKind === "single")
    .flatMap(step => step.ids));
  return session.portionIds.filter(id => {
    if (session.program.memo.items[id]) return false;
    if (confirmed.has(id)) return true;
    if (!id.startsWith("p") || session.program.corpus !== "quran") return false;
    // Legacy programmes can store printed lines rather than whole verse IDs.
    const words = resolve(id)?.wordRefs;
    return Boolean(words?.length && words.every(word => confirmed.has(`${word.s}:${word.a}`)));
  });
}

// Offer only the complete ending of a sourah already started in this programme.
export function remainingSurahVerses(memo, sections) {
  const next = memo.queue.find(id => !memo.items[id]);
  if (!next) return null;
  const surah = sections.find(section => String(section.id) === next.split(":")[0]);
  if (!surah) return null;
  const start = surah.units.findIndex(unit => unit.id === next);
  const count = surah.units.length - start;
  if (start < 1 || count > 3 || !surah.units.slice(0, start).every(unit => memo.items[unit.id]))
    return null;
  const ids = surah.units.slice(start).map(unit => unit.id).filter(id => !memo.items[id]);
  const queue = new Set(memo.queue);
  return ids.every(id => queue.has(id)) ? { surah, ids } : null;
}

export function extraLessonUnits(program, date, memoCore) {
  const tomorrow = memoCore.addDays(date, 1);
  if (program.goal) {
    const { pending, learnedToday } = memoDeadlineWork(program.memo, tomorrow);
    const quota = deadlineQuota(program.goal, tomorrow, pending.length, learnedToday);
    if (quota > 0) return pending.slice(0, quota);
  }
  return memoCore.nextNew(program.memo, tomorrow);
}

// A started sourah gets the rest of the lesson. Complete short sourahs
// can share a lesson when each fits into the proposed learning portion.
export function quranLessonPortion(ids, sections) {
  const first = ids[0];
  if (!first || !ids.every(id => /^\d+:\d+$/.test(id))) return ids;
  const surahId = id => id.split(":")[0];
  const firstSurah = surahId(first);
  const end = ids.findIndex(id => surahId(id) !== firstSurah);
  if (end < 0) return ids;
  const size = new Map(sections.map(section => [String(section.id), section.units.length]));
  const completeFirst = end === size.get(firstSurah) &&
    ids.slice(0, end).every((id, i) => id === `${firstSurah}:${i + 1}`);
  if (!completeFirst) return ids.slice(0, end);
  let offset = end;
  while (offset < ids.length) {
    const sid = surahId(ids[offset]), count = size.get(sid);
    if (!count || offset + count > ids.length) break;
    const whole = ids.slice(offset, offset + count).every((id, i) => id === `${sid}:${i + 1}`);
    if (!whole) break;
    offset += count;
  }
  return ids.slice(0, offset);
}
