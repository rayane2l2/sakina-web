// Practice is deliberately independent of FSRS cards and review logs.
export function createPractice(ids) {
  const queue = [...new Set(ids)];
  if (!queue.length) throw Error("Choisis au moins une question.");
  return { queue, missed: [], passed: [], round: 1, total: queue.length };
}
export function practiceAnswer(state, success) {
  if (!state.queue.length) return state;
  const [id, ...queue] = state.queue,
    passed = success ? [...state.passed, id] : state.passed,
    missed = success ? state.missed : [...state.missed, id];
  if (queue.length) return { ...state, queue, passed, missed };
  return {
    ...state,
    queue: [...missed],
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
