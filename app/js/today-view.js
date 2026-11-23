// HTML for the gamified home path and the maps.
// Builders only: they receive prepared data plus the app's escape and icon helpers.
import { juzSections } from "./gamification.js";

const pct = (part, whole) => (whole ? Math.round((100 * part) / whole) : 0);

export function statsRow({ streak, starsToday, starsTotal }, icon) {
  const lit = streak > 0;
  return `<div class="play-stats">
    <span class="stat-chip lantern ${lit ? "lit" : ""}" title="Jours d’affilée">${icon("lamp")}<b>${streak}</b><small>${streak > 1 ? "jours d’affilée" : "jour d’affilée"}</small></span>
    <span class="stat-chip stars" title="Étoiles gagnées">${icon("star")}<b>${starsTotal}</b><small>${starsToday ? `+${starsToday} aujourd’hui` : "étoiles"}</small></span>
  </div>`;
}

function ring(done, total) {
  const c = 2 * Math.PI * 26,
    offset = total ? c * (1 - done / total) : c;
  return `<div class="goal-ring" aria-hidden="true"><svg viewBox="0 0 64 64"><circle class="ring-bg" cx="32" cy="32" r="26"/><circle class="ring-fg" cx="32" cy="32" r="26" stroke-dasharray="${c.toFixed(1)}" stroke-dashoffset="${offset.toFixed(1)}" transform="rotate(-90 32 32)"/></svg><em>${done}/${total}</em></div>`;
}

function node(item, i, esc, icon) {
  const state = item.done ? "done" : item.stopped ? "stopped" : item.current ? "current" : "todo";
  const glyph = item.done ? icon("check") : icon(item.icon);
  const idle = item.done || item.stopped;
  const orb = idle
    ? `<span class="goal-orb" aria-hidden="true">${glyph}</span>`
    : `<button class="goal-orb" ${item.attrs} aria-label="${esc(item.name)} : ${item.resume ? "reprendre" : "commencer"}">${glyph}</button>`;
  const go = item.done
    ? `<small class="goal-done">Terminé aujourd’hui</small>${item.extra ? `<button class="btn secondary compact goal-go goal-extra" ${item.extra.attrs}>${esc(item.extra.label)} ${icon("arrow")}</button>` : ""}`
    : item.stopped
      ? ""
      : `<button class="btn ${item.current ? "primary" : "secondary"} compact goal-go" ${item.attrs}>${item.resume ? "Reprendre" : "Commencer"} ${icon("arrow")}</button>`;
  return `<li class="goal-node ${state} ${i % 2 ? "alt" : ""}">${orb}<div class="goal-label"><span class="tag">${esc(item.tag)}</span><b>${esc(item.name)}</b><small>${esc(item.summary)}</small>${go}</div></li>`;
}

export function dailyGoalHTML({ progress, items, streak }, esc, icon) {
  const { done, total, complete } = progress;
  const text = complete
    ? `<b>Objectif du jour atteint !</b><span>Ta lanterne brille depuis ${streak} jour${streak > 1 ? "s" : ""}. Reviens demain pour la garder allumée.</span>`
    : `<b>Objectif du jour</b><span>${total > 1 ? `Termine tes ${total} séances` : "Termine ta séance"} pour allumer ta lanterne.</span>`;
  return `<section class="card daily-goal ${complete ? "complete" : ""}">
    <div class="goal-head">${ring(done, total)}<div class="goal-text">${text}</div>${complete ? `<span class="goal-lantern" aria-hidden="true">${icon("lamp")}</span>` : ""}</div>
    <ol class="goal-path">${items.map((item, i) => node(item, i, esc, icon)).join("")}</ol>
  </section>`;
}

// Draws a soft dashed curve through the centre of every goal circle, measured after layout.
export function drawGoalPath(root) {
  const list = root.querySelector(".goal-path");
  if (!list) return;
  list.querySelector(".goal-trail")?.remove();
  const box = list.getBoundingClientRect();
  const points = [...list.querySelectorAll(".goal-orb")].map((orb) => {
    const r = orb.getBoundingClientRect();
    return [Math.round(r.left + r.width / 2 - box.left), Math.round(r.top + r.height / 2 - box.top)];
  });
  if (points.length < 2) return;
  const d = points
    .map(([x, y], i) => {
      if (!i) return `M${x} ${y}`;
      const [px, py] = points[i - 1],
        mid = Math.round((py + y) / 2);
      return `C${px} ${mid} ${x} ${mid} ${x} ${y}`;
    })
    .join(" ");
  list.insertAdjacentHTML("afterbegin", `<svg class="goal-trail" aria-hidden="true" width="${Math.round(box.width)}" height="${Math.round(box.height)}"><path d="${d}"/></svg>`);
}

/* ---------- Carte ---------- */


const STATUS_LABEL = { new: "Pas commencé", anchor: "Ancrage", link: "Liaison", solid: "Entretien", repair: "À réparer" };
const LEGEND_ORDER = ["anchor", "link", "solid", "repair"];

function legend() {
  return `<p class="map-legend-line" aria-hidden="true">${LEGEND_ORDER.map((k) => `<span><i class="dot st-${k}"></i>${STATUS_LABEL[k]}</span>`).join("")}</p>`;
}

// One tab per programme: the Quran first, then each matn and book programme.
function mapTabs(others, tab, esc) {
  if (!others.length) return "";
  const tabs = [{ id: "quran", name: "Le Coran" }, ...others];
  return `<div class="map-tabs" role="tablist" aria-label="Choisir une carte">${tabs
    .map((t) => `<button type="button" role="tab" class="map-tab ${t.id === tab ? "selected" : ""}" aria-selected="${t.id === tab}" data-action="map-tab" data-tab="${esc(t.id)}">${esc(t.name)}</button>`)
    .join("")}</div>`;
}

function sectionTitle(title, known, total, unit, esc) {
  return `<h2 class="map-title map-sep"><span>${esc(title)}</span><small>${known} / ${total} ${unit}</small></h2>`;
}

function surahTile(s, esc) {
  const label = `${s.name} · ${STATUS_LABEL[s.status]} · ${s.known} / ${s.total} versets`;
  return `<button type="button" class="surah-tile st-${s.status}" data-action="open-section" data-corpus="quran" data-sid="${esc(s.id)}" aria-label="${esc(label)}" title="${esc(label)}">
    <span class="tile-n">${esc(s.id)}</span><span class="tile-ar" lang="ar" dir="rtl">${esc(s.ar)}</span><span class="tile-name">${esc(s.name)}</span>
    <span class="tile-bar"><i style="width:${pct(s.known, s.total)}%"></i></span></button>`;
}

// A matn passage opens its chapter in the reader; a book question is shown only.
function unitTile(c, m, esc) {
  const label = `${c.n} · ${STATUS_LABEL[c.status]}`;
  const inner = `<span class="tile-n">${c.n}</span><span class="tile-text" dir="auto">${esc(c.text)}</span><span class="tile-bar"><i style="width:${c.status === "new" ? 0 : 100}%"></i></span>`;
  return c.sid
    ? `<button type="button" class="surah-tile unit-tile st-${c.status}" data-action="open-section" data-corpus="${esc(m.corpus)}" data-sid="${esc(c.sid)}" aria-label="${esc(label)}" title="${esc(label)}">${inner}</button>`
    : `<div class="surah-tile unit-tile st-${c.status}" title="${esc(label)}">${inner}</div>`;
}

function quranBody(map, hasQuran, esc) {
  const intro = hasQuran ? "" : `<section class="card map-card"><p class="small muted">Crée un programme Coran : chaque verset appris viendra colorer ta carte.</p><button class="btn primary block" data-action="new">Créer un programme</button></section>`;
  return intro + juzSections(map)
    .map((part) => `<section class="map-surahs">${sectionTitle(`Juz ${part.n}`, part.known, part.total, "versets", esc)}<div class="surah-grid">${part.surahs.map((s) => surahTile(s, esc)).join("")}</div></section>`)
    .join("");
}

function otherBody(m, esc) {
  const unit = m.id.startsWith("book:") ? "questions" : "passages";
  return m.sections
    .map((sec) => `<section class="map-surahs">${sec.title ? sectionTitle(sec.title, sec.known, sec.total, unit, esc) : ""}<div class="surah-grid">${sec.cells.map((c) => unitTile(c, m, esc)).join("")}</div></section>`)
    .join("");
}

export function quranMapHTML({ map, others, tab, earned, hasQuran }, esc, icon) {
  const current = others.find((m) => m.id === tab);
  const subtitle = current
    ? `<p>${current.known} ${current.id.startsWith("book:") ? "questions commencées" : "passages commencés"} sur ${current.total} · ${pct(current.known, current.total)} %</p>`
    : `<p>${map.known} versets sur ${map.total} · ${map.known && !pct(map.known, map.total) ? "< 1" : pct(map.known, map.total)} % du Coran</p>`;
  const badgeList = current ? "" : `<section class="card map-card"><h2 class="map-title">Mes badges</h2><div class="badge-grid">${earned
    .map((b) => `<div class="badge ${b.earned ? "earned" : ""}"><span class="medal">${icon(b.earned ? "star" : "lock")}</span>${esc(b.label)}</div>`)
    .join("")}</div></section>`;
  return `<header class="page-title"><h1>Ma carte</h1>${subtitle}</header>${mapTabs(others, tab, esc)}${legend()}${current ? otherBody(current, esc) : quranBody(map, hasQuran, esc)}${badgeList}`;
}
