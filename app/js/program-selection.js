import { splitPageUnits } from "./page-core.js";
export function readSelectionFields(form, sections) {
  return sections
    .filter(
      (s) => form.querySelector(`[data-select-section="${s.id}"]`)?.checked,
    )
    .map((s) => ({
      section: s.id,
      whole: Boolean(
        form.querySelector(`[data-select-whole="${s.id}"]`)?.checked,
      ),
      from: Number(
        form.querySelector(`[data-select-from="${s.id}"]`)?.value ||
          s.units[0].n,
      ),
      to: Number(
        form.querySelector(`[data-select-to="${s.id}"]`)?.value ||
          s.units.at(-1).n,
      ),
    }));
}
export function selectedProgramUnits(sections, rows, { pages = null } = {}) {
  const selected = new Set();
  for (const row of rows) {
    const section = sections.find((s) => s.id === String(row.section));
    if (!section) throw Error("Chapitre introuvable.");
    const from = Number(row.from),
      to = Number(row.to);
    if (
      !row.whole &&
      (!Number.isInteger(from) ||
        !Number.isInteger(to) ||
        from > to ||
        !section.units.some((u) => u.n === from) ||
        !section.units.some((u) => u.n === to))
    )
      throw Error("Vérifie les limites des passages.");
    for (const unit of section.units)
      if (row.whole || (unit.n >= from && unit.n <= to)) selected.add(unit.id);
  }
  if (!selected.size)
    throw Error("Sélectionne au moins une sourate ou un chapitre.");
  return pages
    ? splitPageUnits(pages).filter((u) =>
        u.wordRefs.every((w) => selected.has(`${w.s}:${w.a}`)),
      )
    : sections.flatMap((s) => s.units).filter((u) => selected.has(u.id));
}
export function selectionFields(sections, draft, e) {
  const rows = draft.selectionRows || [{ section: draft.sid, whole: true }],
    label =
      draft.corpus === "quran"
        ? "verset"
        : draft.corpus === "ibn-ashir"
          ? "vers"
          : "passage";
  const summary = rows
    .map((row) => {
      const section = sections.find((s) => s.id === row.section);
      return section
        ? `${section.name}${row.whole ? "" : ` · ${label}s ${row.from}–${row.to}`}`
        : "";
    })
    .filter(Boolean);
  return `<fieldset class="program-selection"><legend>${draft.corpus === "quran" ? "Sourates à apprendre" : "Chapitres à apprendre"}</legend><div class="selection-presets">${draft.corpus === "quran" ? '<button class="btn text compact" type="button" data-action="selection-amma">Juz ‘Amma</button>' : ""}<button class="btn text compact" type="button" data-action="selection-all">Tout sélectionner</button><button class="btn text compact" type="button" data-action="selection-clear">Effacer</button></div><div class="selection-summary">${summary.length ? summary.map((t) => `<span>${e(t)}</span>`).join("") : "Aucune sélection"}</div><div class="selection-choices">${sections
    .map((section) => {
      const row = rows.find((r) => r.section === section.id);
      return `<section class="selection-section"><label><input type="checkbox" data-select-section="${e(section.id)}" ${row ? "checked" : ""}>${e(section.name)}</label>${row ? `<label class="selection-whole"><input type="checkbox" data-select-whole="${e(section.id)}" ${row.whole ? "checked" : ""}>${draft.corpus === "quran" ? "Sourate entière" : "Chapitre entier"}</label>${!row.whole ? `<div class="two-fields"><label>Du ${label}<input type="number" data-select-from="${e(section.id)}" min="${section.units[0].n}" max="${section.units.at(-1).n}" value="${row.from}" required></label><label>Au ${label}<input type="number" data-select-to="${e(section.id)}" min="${section.units[0].n}" max="${section.units.at(-1).n}" value="${row.to}" required></label></div>` : ""}` : ""}</section>`;
    })
    .join("")}</div></fieldset>`;
}
