// Presentation/recitation groups only: keep the scheduler's exact IDs and rotations.
const compare = (a, b) => a.s - b.s || a.a - b.a || a.w - b.w;
const refs = (u) => (u.wordRefs?.length ? u.wordRefs : null);
function edges(u, corpus) {
  const words = corpus === "quran" && refs(u);
  if (words) return { first: words[0], last: words.at(-1) };
  const [s, a] = u.id.split(":").map(Number),
    point = { s, a: Number(u.n) || a, w: 1 };
  return { first: point, last: point };
}
function adjacent(a, b, corpus, verse, chainMatn) {
  if (a.s !== b.s && (!chainMatn || corpus === "quran")) return false;
  if (corpus !== "quran") return b.a <= a.a + 1;
  if (compare(b, a) <= 0) return true;
  if (b.a === a.a) return b.w <= a.w + 1;
  return (
    b.a === a.a + 1 &&
    b.w === 1 &&
    a.w === (verse(`${a.s}:${a.a}`)?.wordRefs?.length || 1)
  );
}
export function mergeReviewSteps(
  blocks,
  { corpus, resolve, chainMatn = false },
) {
  const entries = new Map();
  for (const block of blocks)
    for (const id of block.ids) {
      const unit = resolve(id);
      if (!unit) throw Error("Passage de révision introuvable : " + id);
      const entry = entries.get(id) || {
        id,
        unit,
        ...edges(unit, corpus),
        rotations: [],
      };
      for (const rotation of block.macroRotations || [block.macroRotation])
        if (
          rotation &&
          !entry.rotations.some(
            (r) => JSON.stringify(r) === JSON.stringify(rotation),
          )
        )
          entry.rotations.push(rotation);
      entries.set(id, entry);
    }
  const groups = [];
  for (const entry of [...entries.values()].sort(
    (a, b) => compare(a.first, b.first) || compare(a.last, b.last),
  )) {
    let group = groups.at(-1);
    if (
      !group ||
      !adjacent(group.end, entry.first, corpus, resolve, chainMatn)
    ) {
      group = {
        ids: [],
        kind: "review",
        test: true,
        label: "Révision",
        macroRotations: [],
        end: entry.last,
      };
      groups.push(group);
    }
    group.ids.push(entry.id);
    if (compare(entry.last, group.end) > 0) group.end = entry.last;
    for (const r of entry.rotations)
      if (
        !group.macroRotations.some(
          (x) => JSON.stringify(x) === JSON.stringify(r),
        )
      )
        group.macroRotations.push(r);
  }
  return groups.map(({ end, ...step }) =>
    chainMatn
      ? {
          ...step,
          dailyMatn: true,
          label: "Révision quotidienne · tout l’acquis",
        }
      : step,
  );
}
export function regroupRemainingReviews(session, options) {
  if (session.current.kind !== "review") return session;
  const prefix = session.steps.slice(0, session.index),
    remaining = session.steps.slice(session.index);
  const reviews = mergeReviewSteps(
    remaining.filter((s) => s.kind === "review"),
    options,
  );
  const steps = [
    ...prefix,
    ...reviews,
    ...remaining.filter((s) => s.kind !== "review"),
  ];
  return { ...session, steps, current: steps[session.index] };
}
// A printed line may contain several ayahs; an ayah may span several lines/pages.
// Align each selected printed word exactly once, while retaining the original IDs for scheduling.
export function reviewRecitationUnits(units) {
  const byAyah = new Map();
  for (const u of units) {
    if (!refs(u)) return units;
    for (const w of u.wordRefs) {
      const id = `${w.s}:${w.a}`;
      if (!byAyah.has(id))
        byAyah.set(id, {
          id,
          n: w.a,
          page: u.page,
          pages: new Set(),
          words: new Map(),
        });
      const ayah = byAyah.get(id);
      ayah.words.set(w.w, w);
      for (const page of u.pages || [u.page]) if (page) ayah.pages.add(page);
    }
  }
  return [...byAyah.values()].map(({ words, pages, ...u }) => {
    const wordRefs = [...words.values()].sort((a, b) => a.w - b.w);
    return {
      ...u,
      pages: [...pages].sort((a, b) => a - b),
      wordRefs,
      text: wordRefs.map((w) => w.text).join(" "),
    };
  });
}
export function reviewRangeLabel(units, { corpus, sections, resolve }) {
  if (!units.length) return "Révision";
  const targets = corpus === "quran" ? reviewRecitationUnits(units) : units;
  const groups = [];
  for (const u of targets) {
    const word = refs(u)?.[0],
      sid = String(corpus === "quran" && word ? word.s : u.id.split(":")[0]);
    let group = groups.at(-1);
    if (!group || group.sid !== sid) {
      group = { sid, units: [] };
      groups.push(group);
    }
    group.units.push(u);
  }
  return (
    "Révision · " +
    groups
      .map((group) => {
        const name =
            sections.find((s) => String(s.id) === group.sid)?.name || group.sid,
          ranges = [];
        for (const u of group.units) {
          const whole = resolve(u.id),
            partial =
              corpus === "quran" &&
              refs(u) &&
              whole?.wordRefs &&
              u.wordRefs.length !== whole.wordRefs.length;
          const previous = ranges.at(-1);
          if (
            !partial &&
            previous &&
            !previous.partial &&
            u.n === previous.to + 1
          )
            previous.to = u.n;
          else ranges.push({ from: u.n, to: u.n, partial });
        }
        const noun =
          corpus === "quran"
            ? "verset"
            : corpus === "ibn-ashir"
              ? "vers"
              : "passage";
        return (
          name +
          ", " +
          ranges
            .map(
              (r) =>
                `${noun}${r.to > r.from && noun !== "vers" ? "s" : ""} ${r.from}${r.to > r.from ? " à " + r.to : ""}${r.partial ? " (extrait)" : ""}`,
            )
            .join(" ; ")
        );
      })
      .join(" · ")
  );
}
