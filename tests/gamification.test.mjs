import test from "node:test";
import assert from "node:assert/strict";
import {
  shiftDay, starsFor, updateDailyGoal, goalProgress, updateStreak, currentStreak,
  knownAyahs, pageStates, quranMap, badges, normalizeStreak,
} from "../app/js/gamification.js";

test("shiftDay crosses month and year boundaries", () => {
  assert.equal(shiftDay("2026-03-01", -1), "2026-02-28");
  assert.equal(shiftDay("2026-12-31", 1), "2027-01-01");
});

test("starsFor counts lessons, memo reviews and page recitations", () => {
  const programmes = [{
    memo: { log: [
      { date: "2026-11-16", kind: "learn", n: 15 },
      { date: "2026-11-16", kind: "review", rating: "good", n: 30 },
      { date: "2026-11-16", kind: "learn", n: 0 },
      { date: "2026-11-15", kind: "learn", n: 1 },
    ] },
    pageState: { 582: { recitations: [
      { date: "2026-11-16", rating: "clean" },
      { date: "2026-11-16", rating: "mistake" },
    ] } },
  }];
  assert.equal(starsFor(programmes, "2026-11-16"), 5 + 3 + 3 + 1);
  assert.equal(starsFor(programmes), 5 + 3 + 3 + 1 + 5);
  assert.equal(starsFor([{}]), 0);
});

test("revising a day's pages earns more than a big new lesson", () => {
  const pages = Object.fromEntries(Array.from({ length: 10 }, (_, i) =>
    [500 + i, { recitations: [{ date: "2026-11-16", rating: "clean" }] }]));
  const revision = starsFor([{ pageState: pages }], "2026-11-16");
  const lesson = starsFor([{ memo: { log: [{ date: "2026-11-16", kind: "learn", n: 15 }] } }], "2026-11-16");
  assert.ok(revision > lesson);
});

test("daily goal keeps finished programmes and adds new ones", () => {
  const morning = updateDailyGoal(null, "2026-11-16", ["memo:a", "book:b"]);
  assert.deepEqual(morning.planned, ["memo:a", "book:b"]);
  const later = updateDailyGoal(morning, "2026-11-16", ["book:b"]);
  assert.equal(later, morning, "unchanged goal keeps its identity");
  const extra = updateDailyGoal(morning, "2026-11-16", ["memo:c"]);
  assert.deepEqual(extra.planned, ["memo:a", "book:b", "memo:c"]);
  const tomorrow = updateDailyGoal(extra, "2026-11-17", ["memo:a"]);
  assert.deepEqual(tomorrow, { date: "2026-11-17", planned: ["memo:a"] });
});

test("goalProgress marks programmes without remaining work as done", () => {
  const goal = { date: "2026-11-16", planned: ["memo:a", "book:b", "memo:gone"] };
  const progress = goalProgress(goal, ["book:b"], ["memo:a", "book:b"]);
  assert.equal(progress.total, 2);
  assert.equal(progress.done, 1);
  assert.equal(progress.complete, false);
  assert.equal(goalProgress(goal, [], ["memo:a", "book:b"]).complete, true);
  assert.equal(goalProgress({ planned: [] }, [], []).complete, false);
});

test("streak grows on consecutive completed days and resets after a gap", () => {
  let s = updateStreak(undefined, "2026-11-14", { complete: true });
  assert.equal(s.count, 1);
  s = updateStreak(s, "2026-11-15", { complete: true });
  assert.equal(s.count, 2);
  assert.equal(updateStreak(s, "2026-11-15", { complete: true }), s, "counted once per day");
  assert.equal(currentStreak(s, "2026-11-16"), 2, "still lit the next day");
  assert.equal(currentStreak(s, "2026-11-17"), 0);
  s = updateStreak(s, "2026-11-18", { complete: true });
  assert.equal(s.count, 1);
  assert.equal(s.best, 2);
});

test("a rest day keeps the streak without adding to it", () => {
  let s = updateStreak(undefined, "2026-11-14", { complete: true });
  s = updateStreak(s, "2026-11-15", { rest: true });
  assert.equal(s.count, 1);
  assert.equal(currentStreak(s, "2026-11-16"), 1);
  s = updateStreak(s, "2026-11-16", { complete: true });
  assert.equal(s.count, 2);
  const restThenWork = updateStreak(updateStreak(s, "2026-11-17", { rest: true }), "2026-11-17", { complete: true });
  assert.equal(restThenWork.count, 3);
});

const sections = [
  { id: "112", name: "Al-Ikhlaas", ar: "", units: [1, 2, 3, 4].map((n) => ({ id: `112:${n}`, page: 604, juz: 30 })) },
  { id: "113", name: "Al-Falaq", ar: "", units: [1, 2, 3, 4, 5].map((n) => ({ id: `113:${n}`, page: 603, juz: 30 })) },
  { id: "1", name: "Al-Faatiha", ar: "", units: [1, 2].map((n) => ({ id: `1:${n}`, page: 1, juz: 1 })) },
];

test("knownAyahs merges verse ids and page portions of Quran programmes only", () => {
  const resolve = (id) => (id === "p604a" ? { wordRefs: [{ s: 113, a: 1 }, { s: 113, a: 2 }] } : null);
  const known = knownAyahs([
    { corpus: "quran", memo: { items: { "112:1": {}, p604a: {} } } },
    { corpus: "ibn-ashir", memo: { items: { "1:1": {} } } },
  ], resolve);
  assert.deepEqual([...known].sort(), ["112:1", "113:1", "113:2"]);
});

test("quranMap gives surah status from progress and weakest page state", () => {
  const states = pageStates([
    { corpus: "quran", pageState: { 604: { state: "entretien" } } },
    { corpus: "quran", pageState: { 604: { state: "liaison" } } },
  ]);
  assert.equal(states.get(604), "liaison");
  const known = new Set(["112:1", "112:2", "112:3", "112:4", "113:1"]);
  const map = quranMap(sections, known, states);
  const byId = Object.fromEntries(map.surahs.map((s) => [s.id, s.status]));
  assert.deepEqual(byId, { 112: "link", 113: "anchor", 1: "new" });
  assert.equal(map.juz[29].known, 5);
  assert.equal(map.juz[29].total, 9);
  const repair = quranMap(sections, known, new Map([[604, "reparation"]]));
  assert.equal(repair.surahs[0].status, "repair");
});

test("badges reflect real milestones", () => {
  const all = new Set(sections.flatMap((s) => s.units.map((u) => u.id)));
  const map = quranMap(sections, all, new Map());
  const earned = badges(map, { best: 8 }).filter((b) => b.earned).map((b) => b.id);
  assert.deepEqual(earned, ["first-surah", "first-juz", "juz-amma", "streak-7", "khatm"]);
});

test("Quran revisions are scored per page, not twice through the memo log", () => {
  const programme = {
    corpus: "quran",
    memo: { log: [{ date: "2026-11-16", kind: "review", rating: "good", n: 20 }] },
    pageState: { 604: { recitations: [{ date: "2026-11-16", rating: "hesitant" }] } },
  };
  assert.equal(starsFor([programme], "2026-11-16"), 2);
  assert.equal(starsFor([{ ...programme, corpus: "ibn-ashir" }], "2026-11-16"), 3 + 2);
});

test("corrupted saved goal and streak are ignored safely", () => {
  const goal = updateDailyGoal({ date: "2026-11-16", planned: null }, "2026-11-16", ["memo:a"]);
  assert.deepEqual(goal, { date: "2026-11-16", planned: ["memo:a"] });
  assert.equal(goalProgress({ planned: "memo:a" }, [], ["memo:a"]).total, 0);
  assert.deepEqual(normalizeStreak({ count: "4", best: "x", last: 12, restOn: "2026-11-15" }),
    { count: 4, best: 0, last: null, restOn: "2026-11-15" });
  assert.deepEqual(normalizeStreak("oops"), { count: 0, best: 0, last: null, restOn: null });
  const s = updateStreak({ count: "2", best: "2", last: "2026-11-15" }, "2026-11-16", { complete: true });
  assert.equal(s.count, 3);
  assert.equal(currentStreak({ count: "5", last: "2026-11-16" }, "2026-11-16"), 5);
});

test("a rest day does not light the lantern on its own and work after it still counts", () => {
  const rest = updateStreak({ count: 3, best: 3, last: "2026-11-15" }, "2026-11-16", { rest: true });
  assert.equal(rest.count, 3);
  assert.equal(rest.restOn, "2026-11-16");
  assert.equal(updateStreak(rest, "2026-11-16", { complete: true }).count, 4);
  const gap = { count: 3, best: 3, last: "2026-11-14" };
  assert.equal(updateStreak(gap, "2026-11-16", { rest: true }), gap, "a missed day is not a rest day");
});

test("knownAyahs only counts verses whose words are all learned", () => {
  const words = (s, a, n) => Array.from({ length: n }, (_, i) => ({ s, a, w: i + 1 }));
  const units = {
    "p1:1": { wordRefs: [...words(1, 1, 4), ...words(1, 2, 2)] },
    "p1:2": { wordRefs: words(1, 2, 3).slice(2) },
    "1:1": { wordRefs: words(1, 1, 4) },
    "1:2": { wordRefs: words(1, 2, 5) },
  };
  const resolve = (id) => units[id];
  const partial = knownAyahs([{ corpus: "quran", memo: { items: { "p1:1": {} } } }], resolve);
  assert.deepEqual([...partial], ["1:1"]);
  const more = knownAyahs([{ corpus: "quran", memo: { items: { "p1:1": {}, "p1:2": {} } } }], resolve);
  assert.deepEqual([...more], ["1:1"], "1:2 still misses words 4 and 5");
});

test("a surah still being learned stays in anchoring even with a solid page", () => {
  const map = quranMap(sections, new Set(["112:1"]), new Map([[604, "entretien"]]));
  assert.equal(map.surahs[0].status, "anchor");
  const repair = quranMap(sections, new Set(["112:1"]), new Map([[604, "reparation"]]));
  assert.equal(repair.surahs[0].status, "repair");
});
