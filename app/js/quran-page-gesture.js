// Turn the leaf toward the right to advance through the mushaf.
export function quranSwipe(dx, dy) {
  return Math.abs(dx) >= 65 && Math.abs(dx) > Math.abs(dy) * 1.5
    ? dx > 0
      ? 1
      : -1
    : 0;
}
export function nextQuranPage(
  { page = 1, sheet = 0, sheets = 1, session = false },
  delta,
) {
  const current = session ? sheet : page,
    min = session ? 0 : 1,
    max = session ? sheets - 1 : 604,
    next = Math.max(min, Math.min(max, current + delta));
  return {
    changed: next !== current,
    ...(session ? { sheet: next } : { page: next }),
  };
}
export function bindQuranPages(root, { enabled, onTurn, onError }) {
  let start = null,
    busy = false,
    suppressUntil = 0;
  const pointers = new Set();
  const turn = async (delta, keyboard = false) => {
    if (busy) return;
    busy = true;
    try {
      await onTurn(delta);
      if (keyboard)
        root.querySelector("#reader-stage")?.focus({ preventScroll: true });
    } catch (e) {
      onError(e.message);
    } finally {
      busy = false;
    }
  };
  root.addEventListener("pointerdown", (e) => {
    if (!enabled() || e.button > 0) return;
    pointers.add(e.pointerId);
    if (pointers.size !== 1 || !e.target.closest("#reader-stage")) {
      start = null;
      return;
    }
    start = { id: e.pointerId, x: e.clientX, y: e.clientY };
  });
  root.addEventListener(
    "pointermove",
    (e) => {
      if (!start || start.id !== e.pointerId) return;
      const dx = e.clientX - start.x,
        dy = e.clientY - start.y;
      if (Math.abs(dx) > 12 && Math.abs(dx) > Math.abs(dy) * 1.5)
        e.preventDefault();
    },
    { passive: false },
  );
  root.addEventListener("pointerup", (e) => {
    pointers.delete(e.pointerId);
    if (!start || start.id !== e.pointerId) return;
    const delta = quranSwipe(e.clientX - start.x, e.clientY - start.y);
    start = null;
    if (!delta || !enabled()) return;
    e.preventDefault();
    suppressUntil = Date.now() + 450;
    turn(delta);
  });
  root.addEventListener("pointercancel", (e) => {
    pointers.delete(e.pointerId);
    start = null;
  });
  root.addEventListener(
    "click",
    (e) => {
      if (e.target.closest("#reader-stage") && Date.now() < suppressUntil) {
        e.preventDefault();
        e.stopImmediatePropagation();
      }
    },
    true,
  );
  root.addEventListener("keydown", (e) => {
    if (
      !enabled() ||
      !e.target.closest("#reader-stage") ||
      e.target.closest("input,select,textarea,button,a") ||
      !["ArrowLeft", "ArrowRight"].includes(e.key)
    )
      return;
    e.preventDefault();
    turn(e.key === "ArrowLeft" ? 1 : -1, true);
  });
}
