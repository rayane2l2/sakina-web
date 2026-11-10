import { wordKey } from "./page-core.js";
import { wordHidden } from "./word-display.js";

export function learningWords(
  knownUnits,
  introducedUnits,
  targetUnits,
  activeAyah = null,
) {
  return {
    visible: new Set(
      [...knownUnits, ...introducedUnits].flatMap((u) =>
        (u?.wordRefs || []).map(wordKey),
      ),
    ),
    target: new Set(
      targetUnits.flatMap((u) => (u.wordRefs || []).map(wordKey)),
    ),
    activeAyah,
  };
}
export function learningWordState(
  word,
  learning,
  hidden = false,
  revealedAyahs = [],
) {
  const id = `${word.surah}:${word.ayah}:${word.word}`,
    ayah = `${word.surah}:${word.ayah}`;
  if (learning.target.has(id) && wordHidden(hidden, ayah, revealedAyahs))
    return "hidden";
  if (Object.hasOwn(learning, "activeWord")) {
    if (learning.activeWord === id && learning.target.has(id)) return "active";
  } else if (learning.activeAyah === ayah && learning.target.has(id))
    return "active";
  return learning.visible.has(id) ? "known" : "future";
}
// A verse boundary is exact. Within a verse spanning pages, audio has no word
// timestamps: proportional word counts provide a time-based page-turn fallback.
export function playbackPage(unit, pages, time = 0, duration = 0) {
  const candidates = unit.pages?.length ? unit.pages : [unit.page];
  if (candidates.length < 2 || !Number.isFinite(duration) || duration <= 0)
    return candidates[0];
  const selected = new Set((unit.wordRefs || []).map(wordKey));
  const sizes = candidates.map(
    (n) =>
      pages[n - 1]?.lines.reduce(
        (sum, line) =>
          sum + line.words.filter((w) => selected.has(wordKey(w))).length,
        0,
      ) || 0,
  );
  const total = sizes.reduce((a, b) => a + b, 0);
  if (!total) return candidates[0];
  const at = Math.max(0, Math.min(1, time / duration)) * total;
  let cursor = 0;
  for (let i = 0; i < candidates.length; i++) {
    cursor += sizes[i];
    if (at < cursor) return candidates[i];
  }
  return candidates.at(-1);
}
