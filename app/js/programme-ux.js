export function programmeGroups(programmes) {
  return {
    active: programmes.filter((p) => !p.paused && !p.archived),
    paused: programmes.filter((p) => p.paused && !p.archived),
    archived: programmes.filter((p) => p.archived),
  };
}
// Due work is preferred; within the same category, resume the latest interruption.
export function dailyCandidates(candidates) {
  return candidates
    .filter(
      (p) =>
        !p.paused && !p.archived && (p.review || p.fresh || p.waitingUntil),
    )
    .map((p, order) => ({ ...p, order }))
    .sort((a, b) => {
      const priority = (p) => (p.review > 0 ? 0 : p.fresh > 0 ? 1 : 2);
      return (
        priority(a) - priority(b) ||
        (Number(b.resumeAt) || 0) - (Number(a.resumeAt) || 0) ||
        a.order - b.order
      );
    });
}
export const questionSummary = (review, fresh, waiting = false) =>
  [
    review ? `${review} à réviser` : "",
    fresh ? `${fresh} nouvelle${fresh > 1 ? "s" : ""}` : "",
  ]
    .filter(Boolean)
    .join(" · ") || (waiting ? "Une carte revient bientôt" : "À jour");
export function editionRoute(programmes, editionId) {
  const available = programmes.filter(
    (p) => p.editionId === editionId && !p.archived,
  );
  return available.length === 1
    ? { type: "start", programId: available[0].id }
    : available.length
      ? { type: "choose" }
      : { type: "create" };
}
