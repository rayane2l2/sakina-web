// Gamification derived from the real programme state.
// Every function is pure: it reads programmes, logs and page states and returns new values.
// Nothing here changes how lessons or revisions are planned.

const DAY_MS = 86400000;

// Revision must weigh more than new learning ("la révision prend la majorité du temps"):
// a lesson earns a fixed amount whatever its size, every revised page or block earns stars.
// A hesitation found alone still earns (useful difficulty); a mistake earns for the effort.
export const STAR_RULES = Object.freeze({
  lesson: 5,
  review: Object.freeze({ good: 3, hesitant: 2, forgot: 1 }),
  page: Object.freeze({ clean: 3, hesitant: 2, mistake: 1, blocked: 1 }),
});

export function shiftDay(date, days) {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d) + days * DAY_MS).toISOString().slice(0, 10);
}

/* ---------- Étoiles ---------- */

// Quran revisions are scored per page from pageState, so their memo review events are skipped.
function logStars(log, date, pagesScored) {
  let total = 0;
  for (const event of log || []) {
    if (date && event.date !== date) continue;
    if (event.kind === "learn") total += Number(event.n) > 0 ? STAR_RULES.lesson : 0;
    else if (event.kind === "review" && !pagesScored) total += STAR_RULES.review[event.rating] ?? 1;
  }
  return total;
}

function pageStars(pageState, date) {
  let total = 0;
  for (const entry of Object.values(pageState || {}))
    for (const note of entry?.recitations || []) {
      if (date && note.date !== date) continue;
      total += STAR_RULES.page[note.rating] ?? 0;
    }
  return total;
}

// Stars earned across all programmes, optionally for a single day.
export function starsFor(programmes, date = null) {
  return (programmes || []).reduce(
    (sum, p) => sum + logStars(p.memo?.log, date, p.corpus === "quran") + pageStars(p.pageState, date),
    0,
  );
}

/* ---------- Objectif du jour ---------- */

// Keeps the list of programmes that had work today, so finished ones still count.
export function updateDailyGoal(previous, date, withWork) {
  const valid = previous?.date === date && Array.isArray(previous.planned);
  const base = valid ? previous : { date, planned: [] };
  const planned = [...new Set([...base.planned, ...withWork])];
  if (base === previous && planned.length === previous.planned.length) return previous;
  return { date, planned };
}

export function goalProgress(goal, withWork, existing) {
  const pending = new Set(withWork),
    known = new Set(existing);
  const planned = (Array.isArray(goal?.planned) ? goal.planned : []).filter((key) => known.has(key));
  const items = planned.map((key) => ({ key, done: !pending.has(key) }));
  const done = items.filter((item) => item.done).length;
  return { items, done, total: items.length, complete: items.length > 0 && done === items.length };
}

/* ---------- Lanterne (jours d’affilée) ---------- */

const emptyStreak = () => ({ count: 0, best: 0, last: null, restOn: null });
const whole = (value) => Math.max(0, Math.trunc(Number(value)) || 0);
const dayOrNull = (value) => (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null);

// Saved data may be old or hand-edited: keep only well-formed fields.
export function normalizeStreak(saved) {
  if (!saved || typeof saved !== "object") return emptyStreak();
  return { count: whole(saved.count), best: whole(saved.best), last: dayOrNull(saved.last), restOn: dayOrNull(saved.restOn) };
}

// complete: today's goal is reached. rest: nothing was planned today.
// A day the app is never opened cannot be recognised as a rest day, so it breaks the chain.
export function updateStreak(previous, date, { complete = false, rest = false } = {}) {
  const streak = normalizeStreak(previous);
  const yesterday = shiftDay(date, -1);
  if (complete) {
    // Already counted today.
    if (streak.last === date && streak.restOn !== date) return previous ?? streak;
    // A rest day keeps the chain without adding to it.
    const continues = streak.last === yesterday || (streak.last === date && streak.restOn === date);
    const count = continues ? streak.count + 1 : 1;
    return { count, best: Math.max(streak.best, count), last: date, restOn: null };
  }
  if (rest && streak.last === yesterday) return { ...streak, last: date, restOn: date };
  return previous ?? streak;
}

export function currentStreak(saved, date) {
  const streak = normalizeStreak(saved);
  if (!streak.last) return 0;
  return streak.last === date || streak.last === shiftDay(date, -1) ? streak.count : 0;
}

/* ---------- Carte du Coran ---------- */

const STATE_ORDER = ["reparation", "ancrage", "liaison", "entretien"];
const STATE_STATUS = { reparation: "repair", ancrage: "anchor", liaison: "link", entretien: "solid" };

// Union of verses known in every Quran programme (verse keys like "78:1").
// Line or fragment units only count a verse once every one of its words is learned.
export function knownAyahs(programmes, resolve) {
  const known = new Set(),
    words = new Map();
  for (const p of programmes || []) {
    if (p.corpus !== "quran") continue;
    for (const id of Object.keys(p.memo?.items || {})) {
      if (/^\d+:\d+$/.test(id)) {
        known.add(id);
        continue;
      }
      for (const word of resolve(id)?.wordRefs || []) {
        const key = `${word.s}:${word.a}`;
        if (!words.has(key)) words.set(key, new Set());
        words.get(key).add(word.w);
      }
    }
  }
  for (const [key, covered] of words) {
    const total = resolve(key)?.wordRefs?.length;
    if (!total || covered.size >= total) known.add(key);
  }
  return known;
}

// Weakest circuit state for each printed page, across Quran programmes.
export function pageStates(programmes) {
  const states = new Map();
  for (const p of programmes || []) {
    if (p.corpus !== "quran") continue;
    for (const [page, entry] of Object.entries(p.pageState || {})) {
      const rank = STATE_ORDER.indexOf(entry?.state);
      if (rank < 0) continue;
      const current = STATE_ORDER.indexOf(states.get(Number(page)));
      if (current < 0 || rank < current) states.set(Number(page), entry.state);
    }
  }
  return states;
}

// Weakest circuit among the surah's pages. A surah still being learned stays in anchoring,
// unless one of its pages needs repair.
function surahStatus(known, total, pages, states) {
  if (!known) return "new";
  const found = pages.map((page) => states.get(page)).filter(Boolean);
  if (found.includes("reparation")) return "repair";
  if (known < total || !found.length) return known < total ? "anchor" : "solid";
  const weakest = found.sort((a, b) => STATE_ORDER.indexOf(a) - STATE_ORDER.indexOf(b))[0];
  return STATE_STATUS[weakest];
}

export function quranMap(sections, known, states) {
  const juz = Array.from({ length: 30 }, (_, i) => ({ n: i + 1, known: 0, total: 0 }));
  const surahs = sections.map((s) => {
    const pages = [...new Set(s.units.map((u) => u.page))];
    const juzList = [...new Set(s.units.map((u) => u.juz))];
    let count = 0;
    for (const u of s.units) {
      const slot = juz[u.juz - 1];
      if (slot) slot.total += 1;
      if (known.has(u.id)) {
        count += 1;
        if (slot) slot.known += 1;
      }
    }
    return {
      id: s.id, name: s.name, ar: s.ar, juz: juzList,
      known: count, total: s.units.length,
      status: surahStatus(count, s.units.length, pages, states),
    };
  });
  const total = juz.reduce((n, j) => n + j.total, 0),
    learned = juz.reduce((n, j) => n + j.known, 0);
  return { juz, surahs, known: learned, total };
}

/* ---------- Matn and book maps ---------- */

// A matn verse's colour from its spacing: just learned, being linked, maintained, or forgotten again.
export function memoStatus(item) {
  if (!item) return "new";
  if (item.lapses > 0 && item.interval <= 1) return "repair";
  if (item.interval < 7) return "anchor";
  if (item.interval < 30) return "link";
  return "solid";
}

// ts-fsrs card states: 0 new, 1 learning, 2 review, 3 relearning.
export function bookCardStatus(card) {
  if (!card) return "new";
  if (card.state === 3) return "repair";
  if (card.state !== 2) return "anchor";
  return (card.stability || 0) >= 21 ? "solid" : "link";
}

const started = (cells) => cells.filter((c) => c.status !== "new").length;

// Consecutive items sharing a key form one run, in their original order.
function runs(items, keyOf) {
  return items.reduce((out, item) => {
    const key = keyOf(item),
      last = out[out.length - 1];
    return last && last.key === key
      ? [...out.slice(0, -1), { key, items: [...last.items, item] }]
      : [...out, { key, items: [item] }];
  }, []);
}

// Matn passages or book questions, cut into chapters wherever the chapter changes.
export function mapSections(cells, titleOf) {
  const sections = runs(cells, titleOf).map((r) => ({ title: r.key, cells: r.items, known: started(r.items), total: r.items.length }));
  return { sections, known: started(cells), total: cells.length };
}

// The whole Quran, juz by juz: every surah with verses in that juz, so a long surah shows in each juz it covers.
export function juzSections(map) {
  return map.juz.map((j) => ({ n: j.n, known: j.known, total: j.total, surahs: map.surahs.filter((s) => s.juz.includes(j.n)) }));
}

/* ---------- Badges ---------- */

export function badges(map, streak) {
  const surahsDone = map.surahs.filter((s) => s.known === s.total).length;
  const juzDone = map.juz.filter((j) => j.total && j.known === j.total).map((j) => j.n);
  const best = streak?.best || 0;
  return [
    { id: "first-surah", label: "Première sourate", earned: surahsDone >= 1 },
    { id: "ten-surahs", label: "10 sourates", earned: surahsDone >= 10 },
    { id: "first-juz", label: "Un juz complet", earned: juzDone.length >= 1 },
    { id: "juz-amma", label: "Juz ‘Amma complet", earned: juzDone.includes(30) },
    { id: "streak-7", label: "7 jours d’affilée", earned: best >= 7 },
    { id: "streak-30", label: "30 jours d’affilée", earned: best >= 30 },
    { id: "khatm", label: "Khatm", earned: map.total > 0 && map.known === map.total },
  ];
}
