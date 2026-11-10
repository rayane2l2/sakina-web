// Matns are recited cumulatively every day, independently of item due dates.
export function dailyMatnPlan(state, date, M) {
  const known = state.units.filter((id) => state.items[id]);
  const done = new Set(
    (state.log || [])
      .filter((e) => e.date === date && ["learn", "review"].includes(e.kind))
      .flatMap((e) => e.ids || []),
  );
  const needsReview = known.some((id) => !done.has(id));
  return {
    fresh: M.nextNew(state, date),
    recent: [],
    revision: needsReview
      ? [
          {
            ids: known,
            label: "Révision quotidienne · tout l’acquis",
            dailyMatn: true,
          },
        ]
      : [],
  };
}
