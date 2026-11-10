/* Sakina · moteur de mémorisation générique (Coran, matns…), sans DOM.
   Une unité = un verset ou un bayt, identifiée « section:numéro ».
   Trois niveaux, à la manière des écoles de hifz :
   - nouveau (sabaq) : `pace` unités par jour, dans l'ordre de la file ;
   - récent (sabqi) : révisé chaque jour pendant `recentDays` jours ;
   - lointain (manzil) : répétition espacée, intervalle plafonné par `cycle`
     pour que tout l'acquis repasse au moins une fois par cycle. */
(() => {
  'use strict';

  const DAY = 86400000;
  const MAX_PACE = 100;
  const RATINGS = ['good', 'hesitant', 'forgot'];
  const DEFAULTS = { pace: 2, recentDays: 7, cycle: 30, blockSize: 10, repeat: 5, group: 2 };
  const EPS = 1e-9;

  /* Rythme en pages : portions proposées et leur libellé. */
  const PAGE_PACES = [0.25, 1 / 3, 0.5, 2 / 3, 1, 1.5, 2, 3];
  const PAGE_LABELS = ['¼ de page', '⅓ de page', '½ page', '⅔ de page', '1 page', '1 page ½', '2 pages', '3 pages'];

  /* ---------- Dates ---------- */
  const toTime = (key) => Date.parse(`${key}T00:00:00Z`);
  const addDays = (key, n) => new Date(toTime(key) + n * DAY).toISOString().slice(0, 10);
  const daysBetween = (a, b) => Math.round((toTime(b) - toTime(a)) / DAY);

  const toInt = (v, min, max, fallback) =>
    Math.min(max, Math.max(min, Math.floor(v === undefined ? fallback : Number(v) || min)));

  function parseId(id) {
    const at = id.lastIndexOf(':');
    return { section: id.slice(0, at), n: Number(id.slice(at + 1)) };
  }

  /* ---------- Rythme ---------- */
  const measureOf = (state) => state.measure || 'ayah';
  const nearestPage = (v) => PAGE_PACES.reduce((best, p) => (Math.abs(p - v) < Math.abs(best - v) ? p : best), 1);

  function toPace(measure, v) {
    if (measure === 'page') return nearestPage(Number(v) || 1);
    return toInt(v, 1, MAX_PACE, DEFAULTS.pace);
  }

  const setPace = (state, pace) => ({ ...state, pace: toPace(measureOf(state), pace) });

  function stepPace(state, delta) {
    if (measureOf(state) !== 'page') return setPace(state, state.pace + delta);
    const i = PAGE_PACES.indexOf(nearestPage(state.pace));
    return { ...state, pace: PAGE_PACES[Math.min(PAGE_PACES.length - 1, Math.max(0, i + delta))] };
  }

  function paceLabel(state, unit = 'verset') {
    if (measureOf(state) === 'line') return `${state.pace} ligne${state.pace>1?'s':''}`;
    if (measureOf(state) === 'page') return PAGE_LABELS[PAGE_PACES.indexOf(nearestPage(state.pace))];
    return `${state.pace} ${unit}${state.pace > 1 && !unit.endsWith('s') ? 's' : ''}`;
  }

  /* ---------- Création ---------- */
  function create({ units = [], learn = [], known = [], measure = 'ayah', sizes = null, pace, recentDays, cycle, blockSize, repeat, group, start } = {}) {
    const state = {
      v: 1,
      units: [...units],
      queue: [...learn],
      measure,
      sizes: measure !== 'ayah' && sizes ? { ...sizes } : null,
      pace: toPace(measure, pace),
      group: toInt(group, 1, 10, DEFAULTS.group),
      recentDays: toInt(recentDays, 1, 60, DEFAULTS.recentDays),
      cycle: toInt(cycle, 2, 365, DEFAULTS.cycle),
      blockSize: toInt(blockSize, 1, 300, DEFAULTS.blockSize),
      repeat: toInt(repeat, 1, 50, DEFAULTS.repeat),
      items: {},
      log: []
    };
    return start ? markKnown(state, known, start) : state;
  }

  /* L'acquis antérieur est étalé sur le cycle pour éviter de tout réviser le même jour. */
  function markKnown(state, ids, date) {
    const fresh = ids.filter((id) => !state.items[id]);
    const old = addDays(date, -(state.recentDays + 1));
    const items = { ...state.items };
    fresh.forEach((id, i) => {
      const offset = 1 + Math.floor((i * state.cycle) / fresh.length);
      items[id] = { first: old, learned: old, due: addDays(date, offset), interval: state.cycle, lapses: 0 };
    });
    return { ...state, items };
  }

  /* ---------- Apprentissage ---------- */
  /* Taille d'une unité dans la mesure du rythme (1 par verset, fraction de page sinon). */
  const sizeOf = (state, id) => (measureOf(state) !== 'ayah' && state.sizes ? state.sizes[id] ?? 0 : 1);
  const amount = (state, ids) => ids.reduce((sum, id) => sum + sizeOf(state, id), 0);
  const learnedOn = (state, date) =>
    amount(state, Object.keys(state.items).filter((id) => state.items[id].first === date));
  const pending = (state) => state.queue.filter((id) => !state.items[id]);

  /* On prend des unités jusqu'à atteindre la portion du jour (au moins une). */
  function nextNew(state, date, extra = 0) {
    const budget = Math.max(0, state.pace - learnedOn(state, date)) + Math.max(0, extra);
    const picked = [];
    let acc = 0;
    for (const id of pending(state)) {
      if (acc >= budget - EPS) break;
      picked.push(id);
      acc += sizeOf(state, id);
    }
    return picked;
  }

  /* Méthode guidée : versets un par un, puis le groupe ensemble, puis relier
     au début de la portion ; à la fin, réciter tout de mémoire. */
  function learningSteps(ids, group = DEFAULTS.group) {
    const size = Math.max(1, group);
    const steps = [];
    for (let start = 0; start < ids.length; start += size) {
      const chunk = ids.slice(start, start + size);
      chunk.forEach((id) => steps.push({ kind: 'single', ids: [id] }));
      if (chunk.length > 1) steps.push({ kind: 'group', ids: chunk });
      if (start > 0) steps.push({ kind: 'link', ids: ids.slice(0, start + chunk.length) });
    }
    return [...steps, { kind: 'test', ids: [...ids] }];
  }

  function learn(state, ids, date) {
    const items = { ...state.items };
    const learned = ids.filter((id) => !items[id]);
    learned.forEach((id) => {
      items[id] = { first: date, learned: date, due: addDays(date, 1), interval: 1, lapses: 0 };
    });
    return { ...state, items, log: [...state.log, { date, kind: 'learn', n: learned.length, ids: [...learned] }] };
  }

  function unlearn(state, ids) {
    const items = { ...state.items };
    ids.forEach((id) => { delete items[id]; });
    return { ...state, items };
  }

  /* ---------- Révision ---------- */
  const isRecent = (state, item, date) => daysBetween(item.learned, date) <= state.recentDays;

  function nextItem(state, item, rating, date) {
    if (rating === 'forgot') {
      return { ...item, learned: date, interval: 1, due: addDays(date, 1), lapses: item.lapses + 1 };
    }
    if (isRecent(state, item, date)) return { ...item, interval: 1, due: addDays(date, 1) };
    const interval = rating === 'good'
      ? Math.min(state.cycle, Math.max(2, item.interval * 2))
      : Math.max(1, Math.round(item.interval / 2));
    return { ...item, interval, due: addDays(date, interval) };
  }

  function review(state, ids, rating, date) {
    if (!RATINGS.includes(rating)) throw new Error(`note inconnue : ${rating}`);
    const items = { ...state.items };
    ids.filter((id) => items[id]).forEach((id) => { items[id] = nextItem(state, items[id], rating, date); });
    return { ...state, items, log: [...state.log, { date, kind: 'review', rating, n: ids.length, ids: [...ids] }] };
  }

  /* ---------- Planification ---------- */
  function toBlocks(units, ids, size) {
    const pos = new Map(units.map((id, i) => [id, i]));
    const sorted = ids.filter((id) => pos.has(id)).sort((a, b) => pos.get(a) - pos.get(b));
    return sorted.reduce((blocks, id) => {
      const last = blocks[blocks.length - 1];
      const { section } = parseId(id);
      const prev = last && last.ids[last.ids.length - 1];
      const follows = last && last.section === section && pos.get(id) === pos.get(prev) + 1 && last.ids.length < size;
      return follows
        ? [...blocks.slice(0, -1), { ...last, ids: [...last.ids, id] }]
        : [...blocks, { section, ids: [id] }];
    }, []);
  }

  function plan(state, date) {
    const due = Object.entries(state.items).filter(([, it]) => it.due <= date);
    const recent = due.filter(([, it]) => isRecent(state, it, date)).map(([id]) => id);
    const revision = due.filter(([, it]) => !isRecent(state, it, date)).map(([id]) => id);
    return {
      fresh: nextNew(state, date),
      recent: toBlocks(state.units, recent, state.blockSize),
      revision: toBlocks(state.units, revision, state.blockSize)
    };
  }

  function forecast(state, date) {
    const rest = pending(state);
    const slotToday = Math.max(0, state.pace - learnedOn(state, date));
    const after = Math.max(0, amount(state, rest) - slotToday);
    return {
      left: rest.length,
      learned: Object.keys(state.items).length,
      total: new Set([...state.queue, ...Object.keys(state.items)]).size,
      endDate: rest.length === 0 ? null : addDays(date, Math.ceil(after / state.pace - EPS))
    };
  }

  const setRepeat = (state, repeat) => ({ ...state, repeat: toInt(repeat, 1, 50, 1) });
  const setGroup = (state, group) => ({ ...state, group: toInt(group, 1, 10, DEFAULTS.group) });

  function setMeasure(state, measure, sizes = null) {
    if (measure === 'page' || measure === 'line') return { ...state, measure, sizes: { ...sizes }, pace: 1 };
    return { ...state, measure: 'ayah', sizes: null, pace: DEFAULTS.pace };
  }

  const api = {
    DEFAULTS, RATINGS, MAX_PACE, PAGE_PACES,
    addDays, daysBetween, parseId,
    create, markKnown, nextNew, learningSteps, learn, unlearn, review, toBlocks, plan, forecast,
    setPace, stepPace, paceLabel, setRepeat, setGroup, setMeasure
  };
  if (typeof window !== 'undefined') window.MEMO = api;
  if (typeof module !== 'undefined') module.exports = api;
})();
