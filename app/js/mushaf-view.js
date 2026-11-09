import { wordKey } from "./page-core.js";
import { wordHidden, wordBand } from "./word-display.js";
import { learningWordState } from "./mushaf-learning.js";
let enginePromise,
  revision = 0,
  current = null;
const cache = new Map();
async function getPage(n) {
  if (cache.has(n)) return cache.get(n);
  enginePromise ??= fetch("vendor/qvp_ffi.wasm")
    .then((r) => {
      if (!r.ok) throw Error("Moteur du mushaf indisponible");
      return r.arrayBuffer();
    })
    .then((bytes) => window.QVP.QvpEngine.init(bytes));
  const engine = await enginePromise,
    response = await fetch(`data/pages/${String(n).padStart(3, "0")}.qvp`);
  if (!response.ok) throw Error("Page du mushaf indisponible");
  const page = engine.loadPage(new Uint8Array(await response.arrayBuffer()));
  cache.set(n, page);
  // A handful of pages, not the entire mushaf, stays in WASM memory.
  if (cache.size > 6) {
    const key = cache.keys().next().value;
    if (key !== n) {
      cache.get(key).free();
      cache.delete(key);
    }
  }
  return page;
}
export async function mountMushaf({
  units,
  hidden = false,
  fullPage = false,
  pageNumbers,
  onVerse,
  statuses = [],
  revealedAyahs = [],
  revealRecognized = false,
  learning = null,
  playing = null,
}) {
  const host = document.querySelector("#printed-mushaf");
  if (!host) return;
  const token = ++revision;
  host.innerHTML = '<p class="small muted center">Ouverture du mushaf…</p>';
  current = {
    units,
    hidden,
    fullPage,
    onVerse,
    statuses,
    revealedAyahs,
    revealRecognized,
    learning,
    playing,
    canvases: [],
  };
  const config = current;
  const keys = new Set(),
    ayahs = new Set(units.map((u) => u.id));
  units.forEach((u) => u.wordRefs?.forEach((w) => keys.add(wordKey(w))));
  try {
    const pages = await Promise.all(pageNumbers.map(getPage));
    if (token !== revision) return;
    host.innerHTML = "";
    for (const page of pages) {
      const chosen = learning
        ? page.words
        : page.words.filter((w) =>
            keys.size
              ? keys.has(`${w.surah}:${w.ayah}:${w.word}`)
              : ayahs.has(`${w.surah}:${w.ayah}`),
          );
      if (!chosen.length) continue;
      const from = fullPage
          ? 0
          : Math.max(0, Math.min(...chosen.map((w) => w.y0)) - 12),
        to = fullPage
          ? page.height
          : Math.min(page.height, Math.max(...chosen.map((w) => w.y1)) + 12);
      const paper = document.createElement("section");
      paper.className = "printed-page";
      const caption = document.createElement("div");
      caption.className = "printed-caption";
      caption.textContent = `${fullPage ? "Page" : "Portion de la page"} ${page.page}`;
      paper.append(caption);
      const canvas = document.createElement("canvas");
      canvas.className = "page-canvas";
      canvas.setAttribute("role", "img");
      canvas.setAttribute("aria-label", `Mushaf, page ${page.page}`);
      canvas.style.aspectRatio = `${page.width} / ${to - from}`;
      canvas.dataset.page = page.page;
      canvas.dataset.pageWordCount = page.words.length;
      if (learning) canvas.style.cursor = "default";
      const availableWidth = Math.max(1, host.clientWidth - 4),
        availableHeight = Math.max(1, host.clientHeight - 26);
      const width = Math.max(
        1,
        Math.min(availableWidth, (availableHeight * page.width) / (to - from)),
      );
      paper.style.width = width + "px";
      const dpr = Math.min(devicePixelRatio || 1, 3),
        scale = width / page.width;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round((to - from) * scale * dpr);
      paper.append(canvas);
      host.append(paper);
      const entry = {
        page,
        canvas,
        chosen,
        from,
        to,
        keys: new Set(chosen.map((w) => w.index)),
        dpr,
        scale,
        paths: page.buildPaths(),
      };
      config.canvases.push(entry);
      if (!learning)
        canvas.addEventListener("click", (e) => {
          const rect = canvas.getBoundingClientRect(),
            x = ((e.clientX - rect.left) * page.width) / rect.width,
            y = ((e.clientY - rect.top) * (to - from)) / rect.height + from;
          const word = chosen.find((w) => {
            const b = wordBand(page, w);
            return (
              x >= b.x - 2 &&
              x <= b.x + b.width + 2 &&
              y >= b.y &&
              y <= b.y + b.height
            );
          });
          if (word) onVerse(`${word.surah}:${word.ayah}`);
        });
    }
    redraw();
  } catch (e) {
    if (token === revision)
      host.innerHTML =
        '<p class="error">Le mushaf n’a pas pu être chargé. Recharge la page ou prépare le mode hors connexion.</p>';
    console.error(e);
  }
}
function redraw() {
  if (!current) return;
  const states = new Map();
  let i = 0;
  for (const u of current.units)
    for (const w of u.wordRefs || []) {
      states.set(wordKey(w), current.statuses[i++]?.status || "waiting");
    }
  for (const entry of current.canvases) {
    const { page, canvas, from, dpr, scale, keys, chosen } = entry,
      c = canvas.getContext("2d"),
      factor = dpr * scale;
    c.setTransform(factor, 0, 0, factor, 0, -from * factor);
    c.clearRect(0, from, page.width, entry.to - from);
    const paths = entry.paths,
      lines = new Set(chosen.map((w) => w.line));
    if (current.learning) {
      drawLearning(entry, c, paths);
      continue;
    }
    canvas.dataset.playingAyah = current.playing || "";
    for (const w of chosen) {
      const status = states.get(`${w.surah}:${w.ayah}:${w.word}`) || "waiting";
      const b = wordBand(page, w),
        masked = wordHidden(
          current.hidden,
          `${w.surah}:${w.ayah}`,
          current.revealedAyahs,
          status,
          current.revealRecognized,
        );
      if (masked) continue;
      if (current.playing === `${w.surah}:${w.ayah}`) {
        c.fillStyle = "#d8e9e1";
        c.beginPath();
        c.roundRect(b.x, b.y, b.width, b.height, 2);
        c.fill();
        c.strokeStyle = "#0e604e";
        c.lineWidth = 1;
        c.beginPath();
        c.moveTo(b.x, b.y + b.height);
        c.lineTo(b.x + b.width, b.y + b.height);
        c.stroke();
      }
      if (status === "heard" || status === "check") {
        c.fillStyle =
          status === "heard"
            ? "#c7e5fa"
            : status === "check"
              ? "#ffcfad"
              : "#b9b8b3";
        c.beginPath();
        c.roundRect(b.x, b.y, b.width, b.height, 2);
        c.fill();
      }
      if (status === "heard" || status === "check") {
        const bottom = b.y + b.height;
        c.strokeStyle = status === "heard" ? "#005b9a" : "#a32f0c";
        c.lineWidth = 1.3;
        c.beginPath();
        if (status === "heard") {
          c.moveTo(b.x, bottom);
          c.lineTo(b.x + b.width, bottom);
        } else {
          for (let x = b.x; x <= b.x + b.width; x += 2) {
            const y = bottom + (Math.round((x - b.x) / 2) % 2) * 2;
            if (x === b.x) c.moveTo(x, y);
            else c.lineTo(x, y);
          }
          c.moveTo(b.x - 3, b.y);
          c.lineTo(b.x, b.y + 3);
          c.moveTo(b.x, b.y);
          c.lineTo(b.x - 3, b.y + 3);
        }
        c.stroke();
      }
    }
    for (let p = 0; p < paths.length; p++) {
      const wi = page.pathWord(p);
      if (wi >= 0) {
        if (!keys.has(wi)) continue;
        const w = page.words[wi],
          status = states.get(`${w.surah}:${w.ayah}:${w.word}`) || "waiting";
        if (
          wordHidden(
            current.hidden,
            `${w.surah}:${w.ayah}`,
            current.revealedAyahs,
            status,
            current.revealRecognized,
          )
        )
          continue;
        c.fillStyle =
          status === "heard"
            ? "#003e6d"
            : status === "check"
              ? "#a32f0c"
              : current.playing === `${w.surah}:${w.ayah}`
                ? "#0e604e"
                : "#17253b";
      } else {
        if (!current.fullPage && !lines.has(page.pathLine(p))) continue;
        c.fillStyle = "#7c7357";
      }
      c.fill(paths[p], page.pathEvenOdd(p) ? "evenodd" : "nonzero");
    }
  }
}
function drawLearning(entry, c, paths) {
  const { page, canvas } = entry,
    states = new Map(),
    bands = new Map(),
    counts = { known: 0, future: 0, active: 0, hidden: 0 };
  for (const word of page.words) {
    const state = learningWordState(
      word,
      current.learning,
      current.hidden,
      current.revealedAyahs,
    );
    states.set(word.index, state);
    counts[state]++;
    if (state === "active") {
      const line = page.lines[word.lineIndex],
        band = bands.get(word.lineIndex) || {
          x0: word.x0,
          x1: word.x1,
          y: line.centre - page.lineSpacing * 0.43,
          h: page.lineSpacing * 0.86,
        };
      band.x0 = Math.min(band.x0, word.x0);
      band.x1 = Math.max(band.x1, word.x1);
      bands.set(word.lineIndex, band);
    }
  }
  for (const b of bands.values()) {
    c.fillStyle = "#edf3fe";
    c.beginPath();
    c.roundRect(b.x0 - 3, b.y, b.x1 - b.x0 + 6, b.h, 3);
    c.fill();
    c.strokeStyle = "#2859c4";
    c.lineWidth = 0.8;
    c.beginPath();
    c.moveTo(b.x0, b.y + b.h);
    c.lineTo(b.x1, b.y + b.h);
    c.stroke();
  }
  for (let p = 0; p < paths.length; p++) {
    const wi = page.pathWord(p);
    if (wi >= 0) {
      const state = states.get(wi);
      if (state === "hidden") continue;
      c.fillStyle = state === "future" ? "#c3cad5" : "#17253b";
    } else c.fillStyle = "#8b98ae";
    c.fill(paths[p], page.pathEvenOdd(p) ? "evenodd" : "nonzero");
  }
  canvas.dataset.knownWords = counts.known + counts.active;
  canvas.dataset.mutedWords = counts.future;
  canvas.dataset.maskedWords = counts.hidden;
  canvas.dataset.activeAyah = current.learning.activeAyah || "";
}
export function updateMushafLearning(learning, hidden) {
  if (current?.learning) {
    current.learning = learning;
    current.hidden = hidden;
    redraw();
  }
}
export function updateMushaf(statuses, hidden) {
  if (current) {
    if (
      current.hidden === hidden &&
      statuses.length === current.statuses.length &&
      statuses.every((s, i) => s.status === current.statuses[i]?.status)
    )
      return;
    current.statuses = statuses;
    current.hidden = hidden;
    redraw();
  }
}

export function updateMushafPlayback(playing) {
  if (current && current.playing !== playing) {
    current.playing = playing;
    redraw();
  }
}
