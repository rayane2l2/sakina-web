// Practice is deliberately independent of FSRS cards and review logs.
export function createPractice(ids) {
  const queue = [...new Set(ids)];
  if (!queue.length) throw Error("Choisis au moins une question.");
  return { queue, missed: [], passed: [], round: 1, total: queue.length };
}
function shuffled(ids, random = Math.random) {
  const queue = [...ids];
  for (let i = queue.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [queue[i], queue[j]] = [queue[j], queue[i]];
  }
  return queue;
}
export function shufflePractice(state, random = Math.random) {
  return { ...state, queue: shuffled(state.queue, random), shuffle: true };
}
export function practiceAnswer(state, success, random = Math.random) {
  if (!state.queue.length) return state;
  const [id, ...queue] = state.queue,
    passed = success ? [...state.passed, id] : state.passed,
    missed = success ? state.missed : [...state.missed, id];
  if (queue.length) return { ...state, queue, passed, missed };
  return {
    ...state,
    queue: state.shuffle ? shuffled(missed, random) : [...missed],
    passed,
    missed: [],
    round: state.round + (missed.length ? 1 : 0),
  };
}
export const swipeAnswer = (dx, dy) =>
  Math.abs(dx) >= 70 && Math.abs(dx) > Math.abs(dy) * 1.5
    ? dx > 0
      ? "pass"
      : "retry"
    : null;
