import { wordKey } from "./page-core.js";
import { wordHidden, wordBand } from "./word-display.js";
import { learningWordState } from "./mushaf-learning.js";
let enginePromise,
  revision = 0,
  current = null;
const cache = new Map();
const pendingPages = new Map();
async function getPage(n) {
  if (cache.has(n)) return cache.get(n);
  if (pendingPages.has(n)) return pendingPages.get(n);
  const task = loadPage(n);
  pendingPages.set(n, task);
  try {
    return await task;
  } finally {
    pendingPages.delete(n);
  }
}
async function loadPage(n) {
  enginePromise ??= fetch("vendor/qvp_ffi.wasm")
    .then((r) => {
      if (!r.ok) throw Error("Moteur du mushaf indisponible");
      return r.arrayBuffer();
    })
    .then((bytes) => window.QVP.QvpEngine.init(bytes))
    .catch((error) => {
      enginePromise = null;
      throw error;
    });
  const engine = await enginePromise,
    response = await fetch(`data/pages/${String(n).padStart(3, "0")}.qvp`);
  if (!response.ok) throw Error("Page du mushaf indisponible");
  const page = engine.loadPage(new Uint8Array(await response.arrayBuffer()));
  cache.set(n, page);
  // A handful of pages, not the entire mushaf, stays in WASM memory.
  if (cache.size > 6) {
    const key = cache.keys().next().value;
    if (key !== n && !current?.canvases.some(entry=>entry.page===cache.get(key))) {
      cache.get(key).free();
      cache.delete(key);
    }
  }
  return page;
}
export async function mountMushaf({units,hidden=false,fullPage=false,pageNumbers,onVerse,statuses=[],revealedAyahs=[],revealRecognized=false,learning=null,playing=null,playingWord=null,initialPage=null,scrollTop=null,onPage=null}) {
 const host=document.querySelector('#printed-mushaf');if(!host)return;
 current?.observer?.disconnect();current?.pageObserver?.disconnect();const token=++revision;
 const config=current={units,hidden,fullPage,onVerse,statuses,revealedAyahs,revealRecognized,learning,playing,playingWord,canvases:[]};
 host.classList.add('continuous-mushaf');host.replaceChildren();const stage=host.closest('#reader-stage');
 const keys=new Set(),ayahs=new Set(units.map(u=>u.id));units.forEach(u=>u.wordRefs?.forEach(w=>keys.add(wordKey(w))));
 for(const n of pageNumbers){const paper=document.createElement('section');paper.className='printed-page';paper.dataset.page=n;paper.innerHTML=`<div class="printed-caption">Page ${n}</div><div class="page-placeholder">Ouverture de la page…</div>`;host.append(paper);}
 if(scrollTop!=null)stage.scrollTop=scrollTop;else if(initialPage){const paper=host.querySelector(`[data-page="${initialPage}"]`);if(paper)stage.scrollTop=paper.offsetTop-host.offsetTop;}
 const mountPage=async paper=>{if(paper.dataset.loading||paper.querySelector('canvas'))return;paper.dataset.loading='true';try{const page=await getPage(Number(paper.dataset.page));if(token!==revision||!paper.isConnected||paper.dataset.visible!=='true')return;
 const chosen=learning?page.words:page.words.filter(w=>keys.has(`${w.surah}:${w.ayah}:${w.word}`)||(!keys.size&&ayahs.has(`${w.surah}:${w.ayah}`)));
 const from=0,to=page.height,canvas=document.createElement('canvas');canvas.className='page-canvas';canvas.setAttribute('role','img');canvas.setAttribute('aria-label',`Mushaf, page ${page.page}`);canvas.dataset.page=page.page;canvas.dataset.pageWordCount=page.words.length;canvas.style.aspectRatio=`${page.width} / ${page.height}`;
 const width=Math.max(1,host.clientWidth-4),dpr=Math.min(devicePixelRatio||1,2),scale=width/page.width;canvas.width=Math.round(width*dpr);canvas.height=Math.round(page.height*scale*dpr);paper.querySelector('.page-placeholder')?.remove();paper.append(canvas);
 const allowedSurahs=new Set(units.flatMap(u=>(u.wordRefs||[]).map(w=>w.s))),allowedAyahs=new Set(units.flatMap(u=>(u.wordRefs||[]).map(w=>`${w.s}:${w.a}`))),excludedDecorations=new Set();for(const d of page.decorations)if(d.surah&&(!allowedSurahs.has(d.surah)||(d.ayah&&!allowedAyahs.has(`${d.surah}:${d.ayah}`))))for(let i=d.firstPath;i<d.firstPath+d.nPaths;i++)excludedDecorations.add(i);
 const entry={page,canvas,chosen,from,to,excludedDecorations,keys:new Set(chosen.map(w=>w.index)),dpr,scale,paths:page.buildPaths()};config.canvases.push(entry);
 if(!learning)canvas.addEventListener('click',e=>{const rect=canvas.getBoundingClientRect(),x=(e.clientX-rect.left)*page.width/rect.width,y=(e.clientY-rect.top)*page.height/rect.height;const w=chosen.find(w=>{const b=wordBand(page,w);return x>=b.x-2&&x<=b.x+b.width+2&&y>=b.y&&y<=b.y+b.height;});if(w)onVerse(`${w.surah}:${w.ayah}`);});redraw();
 }catch(e){if(token===revision&&paper.isConnected){paper.querySelector('.page-placeholder').innerHTML='<button type="button" class="btn secondary">Réessayer</button>';paper.querySelector('button').onclick=()=>{delete paper.dataset.loading;void mountPage(paper);};console.error(e);}}finally{delete paper.dataset.loading;}};
 const observer=new IntersectionObserver(entries=>{for(const entry of entries){const paper=entry.target;if(entry.isIntersecting){paper.dataset.visible='true';void mountPage(paper);}else{paper.dataset.visible='false';const canvas=paper.querySelector('canvas');if(canvas){config.canvases=config.canvases.filter(e=>e.canvas!==canvas);canvas.remove();paper.insertAdjacentHTML('beforeend','<div class="page-placeholder">Ouverture de la page…</div>');}}}},{root:stage,rootMargin:'650px 0px'});config.observer=observer;
 const pageObserver=new IntersectionObserver(entries=>{const visible=entries.filter(e=>e.isIntersecting).sort((a,b)=>b.intersectionRatio-a.intersectionRatio);if(visible.length&&token===revision)onPage?.(Number(visible[0].target.dataset.page));},{root:stage,threshold:[.25,.5,.75]});config.pageObserver=pageObserver;
 host.querySelectorAll('.printed-page').forEach(p=>{observer.observe(p);pageObserver.observe(p);});
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
    canvas.dataset.playingWord = current.playingWord || "";
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
      if (current.playingWord === `${w.surah}:${w.ayah}:${w.word}`) {
        c.fillStyle = "#e8efff";
        c.beginPath();
        c.roundRect(b.x, b.y, b.width, b.height, 2);
        c.fill();
        c.strokeStyle = "#2857b6";
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
              : current.playingWord === `${w.surah}:${w.ayah}:${w.word}`
                ? "#2857b6"
                : "#17253b";
      } else {
        if(entry.excludedDecorations?.has(p))continue;
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
      c.fillStyle =
        state === "future"
          ? "#c3cad5"
          : state === "active"
            ? "#2857b6"
            : "#17253b";
    } else c.fillStyle = "#8b98ae";
    c.fill(paths[p], page.pathEvenOdd(p) ? "evenodd" : "nonzero");
  }
  canvas.dataset.knownWords = counts.known + counts.active;
  canvas.dataset.mutedWords = counts.future;
  canvas.dataset.maskedWords = counts.hidden;
  canvas.dataset.activeAyah = current.learning.activeAyah || "";
  canvas.dataset.activeWord = current.learning.activeWord || "";
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

export function updateMushafPlayback(playing, word = null) {
  if (
    current &&
    (current.playing !== playing || current.playingWord !== word)
  ) {
    current.playing = playing;
    current.playingWord = word;
    redraw();
  }
}
