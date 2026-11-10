import {createProgramWizard} from './program-wizard.js';
import { createOfflineStore } from "./offline-cache.js";
import { ReviewPageCursor, readingPlace } from "./review-continuation.js";
import { dailyMatnPlan } from "./matn-plan.js";
import { wordVoice } from "./quran-audio-sync.js";
import {
  quranReadingMode,
  quranTextSize,
  pageVerseUnits,
  verseTokens,
  spokenVerseUnit,
  verseReadingHTML,
  QuranWordAudio,
} from "./quran-reading.js";
import { matnSequence, fullMatnAudio, matnLyrics } from "./matn-reading.js";
import {
  mergeReviewSteps,
  regroupRemainingReviews,
  reviewRecitationUnits,
  reviewRangeLabel,
} from "./review-flow.js";
import {
  reminderSettings,
  validateReminders,
  localDay,
} from "./reminders-core.js";
import { nativeReminders, createReminderService } from "./reminders-service.js";
import { remindersView } from "./reminders-view.js";
import { bindQuranPages, nextQuranPage } from "./quran-page-gesture.js";
import {
  programmeGroups,
  dailyCandidates,
  questionSummary,
} from "./programme-ux.js";
import {
  lessonMemory,
  rememberLesson,
  forgetLesson,
} from "./session-memory.js";
import { previousScreen } from "./navigation.js";
import {
  readSelectionFields,
  selectedProgramUnits,
  selectionFields,
} from "./program-selection.js";
import {
  orderedLessonSteps,
  lessonCheckpoint,
  restoreLesson,
} from "./daily-session.js";
import { createBooksUI } from "./books-ui.js";
import {
  applyKnowledgeRows,
  knowledgeGroups,
  defaultKnownRange,
  readKnownRanges,
  validateKnowledgeRows,
  priorLearningFields,
} from "./prior-learning.js";
import { brand } from "./brand.js";
import { bindSpeedControls, openSpeed } from "./speed-control.js";
import { hasUnitAudio } from "./matn-corpus.js";
import { ErrorStreak, SpeechAttempts } from "./recitation-feedback.js";
import { normalizeModel, modelLabel, modelPicker } from "./model-choice.js";
import { unitsFromAyah } from "./page-core.js";
import { learningWords, playbackPage } from "./mushaf-learning.js";
import {
  listeningProgress,
  addListeningRound,
  followUnit,
} from "./listen-flow.js";
import { macroPlan, completeMacroReview } from "./macro-plan.js";
import { readingView } from "./reader-view.js";
import {
  learningTargets,
  listeningGoal,
  canRecite,
  canCompleteLesson,
  recognitionAvailable,
  textSheets,
} from "./lesson-core.js";
import {
  mountMushaf,
  updateMushaf,
  updateMushafLearning,
  updateMushafPlayback,
} from "./mushaf-view.js";
import {
  StableMistakes,
  unlockSound,
  mistakeSound,
  setSound,
} from "./sounds.js";
import {
  loadData,
  corpora,
  phonetics,
  section,
  findUnit,
  sectionLabel,
  pageSizes,
  pageIndex,
  pageUnits,
  quranMacroIndex,
  tajweedData,
} from "./data.js";
import { load, save, day, validateBackup } from "./storage.js";
import { wordsStatus } from "./alignment.js";
import { PLAYBACK_SPEEDS, speedLabel } from "./playback-speed.js";
import { AlignmentClient } from "./alignment-client.js";
import { wordHidden } from "./word-display.js";
import { Recognition } from "./recognition.js";
import { nextReadingWord } from "./reading-position.js";
import * as audio from "./audio.js";
let freeReadingSaveTimer;
let retryFrontierKey = null;
const mistakes = new StableMistakes(),
  retryMistakes = new StableMistakes(),
  errorStreak = new ErrorStreak(),
  speechAttempts = new SpeechAttempts();
const alignment = new AlignmentClient();
const M = window.MEMO,
  root = document.querySelector("#app");
const esc = (s) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const icons = {
  home: '<path d="m3 10 9-7 9 7v10H5V10m4 10v-7h6v7"/>',
  book: '<path d="M12 5C9 3 5 3 2 4v15c4-1 7 0 10 2 3-2 6-3 10-2V4c-3-1-7-1-10 1zm0 0v16"/>',
  layers: '<path d="m12 3 10 6-10 6L2 9zm-9 11 9 5 9-5M3 18l9 5 9-5"/>',
  settings:
    '<path d="M4 5h16M4 12h16M4 19h16"/><circle cx="8" cy="5" r="2"/><circle cx="16" cy="12" r="2"/><circle cx="9" cy="19" r="2"/>',
  mic: '<rect x="8" y="2" width="8" height="13" rx="4"/><path d="M5 10v2a7 7 0 0 0 14 0v-2m-7 9v3m-4 0h8"/>',
  play: '<path d="m8 4 13 8-13 8z"/>',
  arrow: '<path d="M4 12h16m-6-6 6 6-6 6"/>',
  check: '<path d="m5 12 4 4L20 5"/>',
};
const icon = (name, cls = "") =>
  `<svg class="icon ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name] || icons.book}</svg>`;
let db = load(),
  view = "home",
  libraryCorpus = "quran",
  search = "",
  reader = {
    corpus: "quran",
    sid: "1",
    page: 1,
    index: 0,
    hidden: false,
    reveal: false,
  },
  session = null,
  recognition = new Recognition(db.settings.recognitionModel),
  voice = { status: "idle", text: "", final: false, result: null },
  playing = null,
  playingWord = null,
  playingPrintedWord = null,
  repeatNow = 0,
  installPrompt = null,
  offlineBusy = false,
  offlineReady = false,
  offlineDownloaded = 0,
  offlineReused = 0,
  offlineCount = 0,
  offlineTotal = 0;
const wordAudio = new QuranWordAudio();
audio.setSpeed(db.settings.playbackRate);
let reminders = null,
  reminderTimer = null,
  reminderBooted = false;
function queueReminders() {
  if (!reminderBooted || !reminders) return;
  clearTimeout(reminderTimer);
  reminderTimer = setTimeout(() => reminders.sync().catch(() => {}), 500);
}
const stateSave = () => {
  try {
    save(db);
    queueReminders();
  } catch {
    toast("Stockage plein : exporte une sauvegarde avant de continuer.");
  }
};
const books = createBooksUI({
  state: () => db,
  save: stateSave,
  toast: (text) => toast(text),
  open: () => {
    view = "books";
  },
  active: () => view === "books",
  currentView: () => view,
  returnTo: (target) => {
    view = target;
    render();
  },
  render: () => render(),
  beforeStudy: async () => {
    stopPlayback();
    await resetVoice();
    session = null;
  },
});
books.bind(root);
let toastTimer;
function toast(text) {
  const el = document.querySelector("#toast");
  el.textContent = text;
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), 4500);
}
const button = (label, action, cls = "", data = "") =>
  `<button class="btn ${cls}" data-action="${action}" ${data}>${label}</button>`;
const title = (label) =>
  `<header class="page-title"><h1>${label}</h1></header>`;
const masthead = () =>
  `<header class="masthead">${button("‹", "back", "app-back", 'aria-label="Retour au menu précédent"')}${brand()}${button(icon("settings"), "nav", "settings-link", 'data-view="settings" aria-label="Mon espace"')}</header>`;
const planCache = new WeakMap();
function prog(p) {
  const date = day(),
    cached = planCache.get(p.memo);
  if (cached?.date === date) return cached.value;
  const value =
    p.corpus === "quran"
      ? macroPlan(p.memo, date, quranMacroIndex, M)
      : dailyMatnPlan(p.memo, date, M);
  planCache.set(p.memo, { date, value });
  return value;
}
const totalRevision = (p) => {
  const x = prog(p);
  return x.recent.length + x.revision.length;
};
function progress(p) {
  const f = M.forecast(p.memo, day());
  let learned = f.learned,
    total = f.total,
    label = corpora[p.corpus].unit + (p.corpus === "quran" ? "s" : "");
  if (p.memo.measure === "page") {
    const weight = (id) => p.memo.sizes?.[id] ?? 1;
    total = p.memo.units.reduce((n, id) => n + weight(id), 0);
    learned = p.memo.units
      .filter((id) => p.memo.items[id])
      .reduce((n, id) => n + weight(id), 0);
    label = "pages";
  }
  const number = (v) =>
    p.memo.measure === "page" ? Number(v.toFixed(2)).toLocaleString("fr") : v;
  return `<div class="progress" role="progressbar" aria-label="Progression de ${esc(p.name)}" aria-valuenow="${learned}" aria-valuemin="0" aria-valuemax="${total}"><i style="width:${(100 * learned) / Math.max(0.0001, total)}%"></i></div><div class="spread small muted"><span>${number(learned)} / ${number(total)} ${label}</span><span>${Math.round((100 * learned) / Math.max(0.0001, total))} %</span></div>`;
}
function nav() {
  return `<nav class="nav" aria-label="Navigation principale">${[
    ["home", "home", "Aujourd’hui"],
    ["library", "book", "Bibliothèque"],
    ["books", "book", "Livres"],
    ["programs", "layers", "Programmes"],
  ]
    .map(
      ([id, i, label]) =>
        `<button data-action="nav" data-view="${id}" ${view === id ? 'aria-current="page"' : ""}>${icon(i)}<span>${label}</span></button>`,
    )
    .join("")}</nav>`;
}
let screenHistory = [],
  lastScreen = "home",
  lastMotionKey = "";
let stageSize = { width: 350, height: 350 };
function simpleLearning() {
  return Boolean(session && session.current.kind === "new");
}
function printedLearning() {
  return simpleLearning() && currentCorpus() === "quran";
}
function learningAppearance() {
  if (!printedLearning()) return null;
  const memo = session.program.memo;
  let appearance = session.pageAppearance;
  if (
    !appearance ||
    appearance.memo !== memo ||
    appearance.step !== session.index
  ) {
    const known = Object.keys(memo.items)
      .map((id) => findUnit("quran", id))
      .filter(Boolean);
    const ids = [
      ...new Set(
        session.steps
          .slice(0, session.index + 1)
          .filter((s) => s.kind === "new")
          .flatMap((s) => s.ids),
      ),
    ];
    const introduced = ids
      .map((id) => session.targets?.[id] || findUnit("quran", id))
      .filter(Boolean);
    appearance = {
      memo,
      step: session.index,
      state: learningWords(known, introduced, currentUnits()),
    };
    session.pageAppearance = appearance;
  }
  return {
    ...appearance.state,
    activeWord: session.audioRunning ? playingPrintedWord : null,
    activeAyah:
      session.phase === "listen" && session.audioRunning
        ? playing || reader.followId || currentUnits()[0].id
        : null,
  };
}
function readerSheets() {
  const units = displayUnits();
  if (simpleLearning() && currentCorpus() !== "quran") {
    if (session.phase === "listen")
      return [{ units: [followUnit(units, reader.followId) || units[0]] }];
    return textSheets(
      isHidden() ? units.map((u) => ({ ...u, text: "…" })) : units,
      stageSize.width,
      stageSize.height,
    ).map((units) => ({ units }));
  }
  if (currentCorpus() === "quran")
    return [...new Set(units.flatMap((u) => u.pages || [u.page]))].map(
      (page) => ({
        page,
        units: units.filter((u) => (u.pages || [u.page]).includes(page)),
      }),
    );
  return textSheets(units, stageSize.width, stageSize.height).map((units) => ({
    units,
  }));
}
let layoutObserver;
function render() {
  const previousMushaf=root.querySelector("#printed-mushaf"),mushafTop=previousMushaf?.parentElement.scrollTop,mushafPage=previousMushaf?.dataset.currentPage;
  const verseScroll=root.querySelector('.quran-verse-scroll'),verseTop=verseScroll?.scrollTop||0,verseKey=verseScroll?.querySelector('[data-verse-key]')?.dataset.verseKey;
  const tajweedOpen=[...root.querySelectorAll('details.tajweed-legend, .tajweed-legend details')].map(el=>el.open);
  const formScroll = [
    ...root.querySelectorAll(
      ".selection-choices,.qa-choice-list,.quran-verse-scroll",
    ),
  ].map((el) => ({ selector: "." + el.classList[0], top: el.scrollTop }));
  if (view !== lastScreen) {
    screenHistory.push(lastScreen);
    lastScreen = view;
  }
  if (session && view === "reader") {
    rememberLesson(db, lessonCheckpoint(session, reader, day()));
    stateSave();
  }
  const oldProgress = new Map(
    [...root.querySelectorAll(".progress")].map((el, i) => [
      el.getAttribute("aria-label") || String(i),
      el.querySelector("i")?.style.width,
    ]),
  );
  if (view === "reader" && !session) {
    const place = readingPlace(reader, currentCorpus()),
      old = db.freeReading;
    if (
      !old ||
      ["corpus", "sid", "index", "page", "anchorId"].some(
        (k) => old[k] !== place[k],
      )
    ) {
      db.freeReading = place;
      stateSave();
    }
  }
  const bookStudy = view === "books" && books.isStudying();
  document.body.classList.toggle("book-study-open", bookStudy);
  const speedOpen = document.querySelector("#speed-menu")?.open,
    speedFocused = document.activeElement?.id === "playback-speed";
  document.body.classList.toggle("reader-open", view === "reader");
  document.body.classList.toggle(
    "learning-open",
    view === "reader" && simpleLearning(),
  );
  document.body.classList.toggle(
    "mushaf-learning",
    view === "reader" && printedLearning(),
  );
  layoutObserver?.disconnect();
  root.innerHTML = `<div class="shell ${view === "reader" ? "reading" : bookStudy ? "book-study" : ""}">${view !== "reader" && !bookStudy ? masthead() : ""}${view === "home" ? home() : view === "library" ? library() : view === "programs" ? programs() : view === "new" ? newProgram() : view === "books" ? books.render() : view === "reader" ? readerView() : settings()}</div>${view !== "reader" && !bookStudy ? nav() : ""}`;
  root.querySelectorAll('details.tajweed-legend, .tajweed-legend details').forEach((el,i)=>{el.open=Boolean(tajweedOpen[i]);});
  const nextVerseScroll=root.querySelector('.quran-verse-scroll');if(verseKey&&nextVerseScroll?.querySelector('[data-verse-key]')?.dataset.verseKey===verseKey)nextVerseScroll.scrollTop=verseTop;
  formScroll.forEach(({ selector, top }) => {
    const el = root.querySelector(selector);
    if (el) el.scrollTop = top;
  });
  if (view === "books") books.afterRender();
  const motionKey =
    view +
    ":" +
    (session
      ? session.program.id + ":" + session.index + ":" + session.phase
      : "");
  if (!matchMedia("(prefers-reduced-motion: reduce)").matches) {
    if (lastMotionKey !== motionKey)
      root.querySelector(".shell")?.animate(
        [
          { opacity: 0.75, transform: "translateY(4px)" },
          { opacity: 1, transform: "none" },
        ],
        { duration: 150, easing: "ease-out" },
      );
    root.querySelectorAll(".progress").forEach((el, i) => {
      const bar = el.querySelector("i"),
        from =
          oldProgress.get(el.getAttribute("aria-label") || String(i)) || "0%";
      if (bar && from !== bar.style.width)
        bar.animate([{ width: from }, { width: bar.style.width }], {
          duration: 260,
          easing: "ease-out",
        });
    });
  }
  lastMotionKey = motionKey;
  if (speedOpen) {
    openSpeed();
    if (speedFocused) document.querySelector("#playback-speed")?.focus();
  }
  if (view === "reader") {
    const stage = document.querySelector("#reader-stage");
    const mount = () => {
      if (view !== "reader" || !stage.isConnected) return;
      const next = { width: stage.clientWidth, height: stage.clientHeight },
        changed =
          Math.abs(next.width - stageSize.width) > 5 ||
          Math.abs(next.height - stageSize.height) > 5;
      stageSize = next;
      if (currentCorpus() !== "quran") {
        if (changed) {
          const sheets = readerSheets();
          reader.sheet = Math.min(reader.sheet || 0, sheets.length - 1);
          render();
        } else fitMatn();
        return;
      }
      if (verseMode()) return;
      const sheets = readerSheets(),
        sheet = sheets[Math.min(reader.sheet || 0, sheets.length - 1)];
      mountMushaf({
        units: session ? currentUnits() : corpora.quran.sections.flatMap(s=>s.units),
        hidden: isHidden(),
        fullPage: true,
        revealRecognized: recognitionAvailable(
          currentCorpus(),
          session?.current,
        ),
        learning: learningAppearance(),
        playing,
        playingWord: playingPrintedWord,
        pageNumbers: session ? sheets.map(s=>s.page) : Array.from({length:604},(_,i)=>i+1),
        initialPage: sheet.page,
        scrollTop: Number(mushafPage)===sheet.page ? mushafTop : null,
        onPage: (page)=>{const host=root.querySelector("#printed-mushaf");if(host)host.dataset.currentPage=page;if(session){const index=sheets.findIndex(s=>s.page===page);if(index>=0)reader.sheet=index;}else{if(!recognition.active){reader.page=page;const unit=pageUnits.find(u=>u.page===page);if(unit?.wordRefs[0])reader.sid=String(unit.wordRefs[0].s);if(db.freeReading?.page!==page){db.freeReading=readingPlace(reader,"quran");clearTimeout(freeReadingSaveTimer);freeReadingSaveTimer=setTimeout(stateSave,200);}}const title=root.querySelector(".reader-head h1"),subtitle=root.querySelector(".reader-head .small");if(title)title.textContent=section("quran",reader.sid).name;if(subtitle)subtitle.textContent=`Page ${page} · lecture libre`;const position=root.querySelector(".quran-page-position");if(position)position.textContent=`${page} / 604`;}},
        statuses: statusesFor(session ? currentUnits() : corpora.quran.sections.flatMap(s=>s.units)),
        revealedAyahs: reader.revealedAyahs || [],
        onVerse: (id) => {
          if (!session) {
            reader.anchorId = id;
            reader.sid = id.split(":")[0];
          }
          listen([findUnit("quran", id)]);
        },
      });
    };
    requestAnimationFrame(mount);
    layoutObserver = new ResizeObserver(() => requestAnimationFrame(mount));
    layoutObserver.observe(stage);
  }
}
function fitMatn() {
  const lyrics = document.querySelector(".matn-lyrics");
  if (lyrics) {
    const current = lyrics.querySelector(".matn-lyric-current"),
      available = Math.max(80, lyrics.clientHeight - 150);
    current.style.maxHeight = available + "px";
    let size = 28;
    current.style.fontSize = size + "px";
    while (size > 18 && current.scrollHeight > available) {
      size--;
      current.style.fontSize = size + "px";
    }
    return;
  }
  const page = document.querySelector(".matn-page");
  if (!page) return;
  const track = page.querySelector(".lyric-track");
  let size = 30;
  page.style.fontSize = size + "px";
  const floor = track ? 22 : 17;
  while (
    size > floor &&
    (track
      ? track.scrollHeight > page.clientHeight
      : page.scrollHeight > page.clientHeight + 1)
  ) {
    size--;
    page.style.fontSize = size + "px";
  }
}
function verseMode() {
  return (
    currentCorpus() === "quran" &&
    !simpleLearning() &&
    quranReadingMode(db.settings.quranReadingMode) === "verses"
  );
}
function isHidden() {
  if (verseMode()) return false;
  return Boolean(reader.hidden && !reader.reveal);
}
function lessonOptions() {
  return {
    listened: session?.listened || 0,
    goal: listeningGoal(session?.program.memo.repeat),
    needsAudio: Boolean(
      session &&
        !session.current.test &&
        session.current.kind !== "review" &&
        currentUnits().every((u) => hasUnitAudio(currentCorpus(), u)),
    ),
  };
}
function statusesFor(units) {
  const map = new Map();
  let i = 0;
  for (const u of currentUnits())
    for (const w of u.wordRefs || [])
      map.set(`${w.s}:${w.a}:${w.w}`, voice.result?.words[i++]);
  return units.flatMap((u) =>
    (u.wordRefs || []).map(
      (w) =>
        map.get(`${w.s}:${w.a}:${w.w}`) || { word: w.text, status: "waiting" },
    ),
  );
}
function freshLabel(p) {
  const x = prog(p);
  if (!x.fresh.length) return "Rien de nouveau aujourd’hui";
  if (p.memo.measure === "page") {
    const sizes = p.memo.sizes || {},
      amount = x.fresh.reduce((n, id) => n + (sizes[id] || 0), 0),
      label =
        Math.abs(amount - 0.5) < 0.04
          ? "½ page"
          : Math.abs(amount - 1 / 3) < 0.04
            ? "⅓ de page"
            : Math.abs(amount - 0.25) < 0.04
              ? "¼ de page"
              : `${Number(amount.toFixed(2)).toLocaleString("fr")} page${amount > 1 ? "s" : ""}`;
    return label + " à apprendre";
  }
  return `${x.fresh.length} ${corpora[p.corpus].unit}${x.fresh.length > 1 ? "s" : ""} à apprendre`;
}
function reviewOptions(p) {
  return {
    corpus: p.corpus,
    chainMatn: p.corpus !== "quran",
    resolve: (id) => findUnit(p.corpus, id),
    sections: corpora[p.corpus].sections,
  };
}
function plannedReviews(p) {
  const x = prog(p);
  const steps = mergeReviewSteps(
    [...x.recent, ...x.revision],
    reviewOptions(p),
  );
  return p.corpus === "quran"
    ? steps
    : steps.map((step) => ({
        ...step,
        dailyMatn: true,
        label: "Révision quotidienne · tout l’acquis",
      }));
}
function reviewSummary(p) {
  const groups = plannedReviews(p);
  if (p.corpus !== "quran" && groups.length) {
    const count = new Set(groups.flatMap((s) => s.ids)).size,
      noun = corpora[p.corpus].unit;
    return `Réciter tout l’acquis · ${count} ${noun}${count > 1 && noun !== "vers" ? "s" : ""}`;
  }
  return groups.length
    ? groups
        .map((step) =>
          reviewRangeLabel(
            step.ids.map((id) => findUnit(p.corpus, id)),
            reviewOptions(p),
          ),
        )
        .join(" ; ")
    : "Révisions à jour";
}
function readingResume() {
  const place = db.freeReading || db.last,
    c = corpora[place?.corpus],
    ch = c?.sections.find((ch) => String(ch.id) === String(place.sid));
  if (!ch) return null;
  const index = Math.max(
    0,
    Math.min(ch.units.length - 1, Number(place.index) || 0),
  );
  return {
    ...place,
    index,
    chapter: ch.name,
    label:
      place.corpus === "quran"
        ? `${ch.name} · page ${place.page || ch.units[index].page}`
        : `${c.name} · ${ch.name}`,
  };
}
function readingResumeButton() {
  const resume = readingResume();
  return resume
    ? button(
        `<span>Continuer la lecture<small>${esc(resume.label)}</small></span>`,
        "resume-reading",
        "reading-resume block",
      )
    : "";
}
function home() {
  const memorisation = db.programs.map((p) => {
    const checkpoint = lessonMemory(db, p.id),
      resume = Boolean(restoreLesson(checkpoint, p, day())),
      x = prog(p);
    return {
      kind: "memo",
      id: p.id,
      name: p.name,
      paused: p.paused,
      archived: p.archived,
      review: totalRevision(p),
      fresh: x.fresh.length,
      resume,
      resumeAt: resume ? checkpoint.savedAt || 0 : 0,
      programme: p,
    };
  });
  const candidates = dailyCandidates([...memorisation, ...books.dailyItems()]),
    first = candidates[0];
  const actionAttrs = (p) =>
    p.kind === "book"
      ? `data-book-action="start" data-id="${esc(p.id)}"`
      : `data-action="start" data-id="${esc(p.id)}"`;
  const main = first
    ? `<section class="card today-card"><span class="tag">MA SÉANCE · ${first.kind === "book" ? "QUESTIONS-RÉPONSES" : esc(corpora[first.programme.corpus].name)}</span><h2>${esc(first.name)}</h2><p class="small muted">${first.kind === "book" ? questionSummary(first.review, first.fresh, first.waitingUntil) : `${esc(reviewSummary(first.programme))} · ${freshLabel(first.programme)}`}</p><button class="btn primary block" ${actionAttrs(first)}>${first.resume ? "Reprendre ma séance" : "Commencer ma séance"} ${icon("arrow")}</button></section>`
    : `<section class="card today-card"><h2>${db.programs.length || books.hasPrograms() ? "C’est tout pour aujourd’hui." : "Que veux-tu faire ?"}</h2>${db.programs.length || books.hasPrograms() ? button("Mes programmes", "nav", "secondary block", 'data-view="programs"') : `<div class="first-choices">${button("Lire le Coran", "read-quran", "primary block")}${button("Apprendre et réviser", "nav", "secondary block", 'data-view="programs"')}</div>`}</section>`;
  return `<h1 class="home-heading">Prends un instant.<br>Il est pour toi.</h1>${main}${readingResumeButton()}${offlineReady ? "" : `<section class="card offline-invite"><span class="tag">SUR CET APPAREIL</span><h2>Préparation hors connexion</h2><p class="small muted">Téléchargement automatique. Les fichiers déjà présents sont conservés.</p>${button(offlineBusy ? "Préparation en cours…" : "Reprendre la préparation", "offline", "secondary block", offlineBusy ? "disabled" : "")}<p id="offline-progress" class="small muted" role="status">${offlineBusy ? `${offlineDownloaded} téléchargés · ${offlineReused} conservés` : "La préparation reprend là où elle s’est arrêtée."}</p></section>`}<div class="daily-other">${candidates
    .slice(1)
    .map(
      (p) =>
        `<button class="review-row" ${actionAttrs(p)}>${icon("book")}<span>${esc(p.name)}</span>${icon("arrow")}</button>`,
    )
    .join("")}</div>`;
}
function programCard(p) {
  const x = prog(p);
  return `<article class="card program"><span class="tag">${esc(corpora[p.corpus].name)}${p.archived ? " · Archivé" : p.paused ? " · En pause" : ""}</span><h3>${esc(p.name)}</h3>${progress(p)}<div class="program-meta"><span>${x.fresh.length} à apprendre</span><span>${esc(reviewSummary(p))}</span></div><div class="spread">${!p.archived ? button("Continuer " + icon("arrow"), "start", "primary compact", `data-id="${esc(p.id)}"`) : ""}${button("Gérer", "edit", "text", `data-id="${esc(p.id)}"`)}</div></article>`;
}
function library() {
  const c = corpora[libraryCorpus];
  return `${title("Bibliothèque")}<div class="seg library-corpora">${Object.keys(
    corpora,
  )
    .map((id) =>
      button(
        corpora[id].name,
        "corpus",
        libraryCorpus === id ? "selected" : "",
        `data-corpus="${id}"`,
      ),
    )
    .join(
      "",
    )}</div><label class="search">${icon("book")}<input id="search" type="search" placeholder="Rechercher une sourate, un matan, un livre…" value="${esc(search)}"></label>${libraryCorpus !== "quran" ? button("Écouter " + esc(c.name) + " en entier", "listen-entire", "secondary block", `data-corpus="${libraryCorpus}"`) : ""}${c.reviewStatus === "needs_review" ? '<p class="small muted">Texte importé · relecture à terminer.</p>' : ""}${libraryCorpus === "quran" ? `<div class="page-jump"><label for="page-number">Mushaf · 604 pages</label><div><input type="number" id="page-number" min="1" max="604" value="${reader.page || 1}" aria-label="Numéro de page">${button("Ouvrir la page", "jump-page", "secondary compact")}</div></div>` : ""}<div id="section-list">${libraryResults()}</div>`;
}
function libraryResults() {
  if (!search.trim()) return sectionRows(corpora[libraryCorpus]);
  const results =
    Object.values(corpora)
      .map((c) => {
        const rows = sectionRows(c, true);
        return rows
          ? `<h2 class="section-title">${esc(c.name)}</h2>${rows}`
          : "";
      })
      .join("") + books.searchResults(search);
  return results || '<p class="muted">Aucun résultat.</p>';
}
function sectionRows(c, empty = false) {
  const normalized = (s) =>
    s.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
  return (
    c.sections
      .filter((s) =>
        normalized(s.name + " " + s.ar + " " + s.id).includes(
          normalized(search),
        ),
      )
      .map(
        (s) =>
          `<button class="section-row" data-action="open-section" data-corpus="${c.id}" data-sid="${s.id}"><span class="surah-number">${s.id}</span><span><b>${esc(s.name)}</b><small>${c.id === "quran" ? `${s.units.length} versets · page ${s.units[0].page}` : `${c.unit === "vers" ? "Vers" : "Passages"} ${s.first}–${s.last} · ${s.units.length} ${c.unit}${c.unit === "passage" && s.units.length > 1 ? "s" : ""}`}</small></span><span class="ar section-ar">${esc(s.ar)}</span></button>`,
      )
      .join("") || (empty ? "" : '<p class="muted">Aucun passage trouvé.</p>')
  );
}
function programs() {
  const g = programmeGroups(db.programs);
  return `${title("Programmes")}<div class="section-head">${db.programs.length || books.hasPrograms() ? button("+ Nouveau", "new", "secondary compact") : ""}</div>${g.active.map(programCard).join("")}${g.paused.length ? `<details class="programme-fold"><summary>En pause · ${g.paused.length}</summary>${g.paused.map(programCard).join("")}</details>` : ""}${g.archived.length ? `<details class="programme-fold"><summary>Archivés · ${g.archived.length}</summary>${g.archived.map(programCard).join("")}</details>` : ""}${books.programCards()}${!db.programs.length && !books.hasPrograms() ? `<div class="card first-choices">${button("Mémoriser un texte", "new", "primary block")}${button("Apprendre un livre", "nav", "secondary block", 'data-view="books"')}</div>` : ""}`;
}

let draft = {
    corpus: "quran",
    sid: "114",
    endSid: "114",
    pace: 2,
    measure: "ayah",
    name: "",
    first: 1,
    last: 6,
    group: 2,
    repeat: 5,
  },
  editing = null;
function draftUnits() {
  if (editing) {
    const p = db.programs.find((p) => p.id === editing);
    return p.memo.units.map((id) => findUnit(p.corpus, id)).filter(Boolean);
  }
  const c = corpora[draft.corpus],
    s = section(draft.corpus, draft.sid),
    end = section(draft.corpus, draft.endSid || draft.sid);
  if (draft.selectionRows)
    return draft.selectionRows.length
      ? selectedProgramUnits(c.sections, draft.selectionRows, {
          pages:
            draft.corpus === "quran" && draft.measure === "page"
              ? pageUnits
              : null,
        })
      : [];
  if (draft.corpus === "quran" && draft.measure === "page") {
    const first = Number(draft.pageFirst || s.units[0].page),
      last = Number(draft.pageLast || end.units.at(-1).page);
    return pageUnits.filter((u) => u.page >= first && u.page <= last);
  }
  return c.sections
    .slice(c.sections.indexOf(s), c.sections.indexOf(end) + 1)
    .flatMap((ch) =>
      ch.units.slice(
        ch === s ? Number(draft.first || 1) - 1 : 0,
        ch === end ? Number(draft.last || end.units.length) : undefined,
      ),
    );
}
function currentPriorGroups() {
  return knowledgeGroups(
    draftUnits(),
    draft.corpus,
    corpora[draft.corpus].sections,
  );
}
function applyPrior(p, form) {
  if (!form.knownRecent) return p;
  return {
    ...p,
    memo: applyKnowledgeRows(
      p.memo,
      draft.knownRanges || [],
      p.corpus,
      corpora[p.corpus].sections,
      (id) => findUnit(p.corpus, id),
      day(),
      M,
    ),
  };
}
let programWizard;
function guide(){return programWizard??=createProgramWizard({corpora,index:pageIndex,M,resolve:findUnit,today:day,refresh:render,onExit:()=>{view="programs";render();},onBooks:()=>{view="books";render();},onSave:(p,start)=>{if(db.programs.some(x=>x.id===p.id))db.programs=db.programs.map(x=>x.id===p.id?p:x);else db.programs.push(p);stateSave();editing=null;if(start)void startProgram(p.id).catch(e=>toast(e.message));else{view="programs";render();}toast("Programme enregistré.");}});}
function newProgram() {
  return guide().render()+(editing?`<div class="qa-manage-actions">${button("Mettre en pause / réactiver","pause-program","secondary",`data-id="${editing}"`)}${button("Archiver","archive-program","secondary",`data-id="${editing}"`)}${button("Supprimer ce programme","delete-program","danger",`data-id="${editing}"`)}</div>`:"");
}
function legacyNewProgram() {
  if (!editing) draft.selectionRows ??= [{ section: draft.sid, whole: true }];
  const c = corpora[draft.corpus],
    s = section(draft.corpus, draft.sid),
    end = section(draft.corpus, draft.endSid || draft.sid);
  return `${title(editing ? "Modifier le programme" : "Nouveau programme")}${!editing ? '<button type="button" class="btn secondary block" data-book-action="create">Programme de questions-réponses</button>' : ""}<form id="program-form" class="card form-card"><label>Nom du programme<input name="name" maxlength="60" value="${esc(draft.name)}" placeholder="Ex. Mon Juz ‘Amma"></label>${
    !editing
      ? `<label>Texte<select name="corpus">${Object.values(corpora)
          .map(
            (x) =>
              `<option value="${x.id}" ${x.id === draft.corpus ? "selected" : ""}>${x.name}</option>`,
          )
          .join("")}</select></label>${selectionFields(c.sections, draft, esc)}`
      : ""
  }<label>Rythme quotidien<select name="measure"><option value="ayah">En ${c.unit.endsWith("s") ? c.unit : c.unit + "s"}</option>${draft.corpus === "quran" ? `<option value="page" ${draft.measure === "page" ? "selected" : ""}>En portions de page</option>` : ""}</select></label>${draft.measure === "page" && !editing ? '<p class="small muted">Les versets choisis sont répartis selon la portion de page quotidienne.</p>' : ""}<label>Quantité par jour${draft.measure === "page" ? `<select name="pace">${M.PAGE_PACES.map((x, i) => `<option value="${x}" ${x === Number(draft.pace) ? "selected" : ""}>${["¼ de page", "⅓ de page", "½ page", "⅔ de page", "1 page", "1 page ½", "2 pages", "3 pages"][i]}</option>`).join("")}</select>` : `<input name="pace" type="number" min="1" max="100" value="${draft.pace}" required>`}</label><div class="two-fields"><label>Écoutes par défaut<input name="repeat" type="number" min="1" max="20" value="${draft.repeat}"></label><label>Groupe de ${draft.measure === "page" ? "lignes" : c.unit.endsWith("s") ? c.unit : c.unit + "s"}<input name="group" type="number" min="1" max="10" value="${draft.group}"></label></div>${priorLearningFields(draftUnits(), draft.corpus, draft, esc, c.sections)}<button class="btn primary block" type="submit">${editing ? "Enregistrer" : "Créer mon programme"}</button></form>${button("Retour", "nav", "text", 'data-view="programs"')}${editing ? `<div class="qa-manage-actions">${button(db.programs.find((p) => p.id === editing)?.paused ? "Réactiver" : "Mettre en pause", "pause-program", "secondary", `data-id="${editing}"`)}${button("Archiver", "archive-program", "secondary", `data-id="${editing}"`)}${button("Supprimer ce programme", "delete-program", "danger", `data-id="${editing}"`)}</div>` : ""}`;
}
function currentUnits() {
  if (session) {
    const units = session.current.ids.map((id) =>
      session.current.kind === "review"
        ? findUnit(session.corpus, id)
        : session.targets?.[id] || findUnit(session.corpus, id),
    );
    return session.corpus === "quran" && session.current.kind === "review"
      ? reviewRecitationUnits(units)
      : units;
  }
  if (reader.corpus === "quran" && verseMode()) {
    const units = pageVerseUnits(corpora.quran.sections, reader.page),
      anchor = units.findIndex((u) => u.id === reader.anchorId);
    return units.slice(Math.max(0, anchor)).map(spokenVerseUnit);
  }
  if (reader.corpus === "quran")
    return unitsFromAyah(
      pageUnits.filter((u) => u.page === reader.page),
      reader.anchorId,
    );
  return [section(reader.corpus, reader.sid).units[reader.index]];
}
function displayUnits() {
  if (!session && reader.corpus === "quran")
    return pageUnits.filter((u) => u.page === reader.page);
  return currentUnits();
}
function displayStatuses() {
  const byWord = new Map();
  let i = 0;
  for (const u of currentUnits())
    for (const w of u.wordRefs || []) {
      byWord.set(`${w.s}:${w.a}:${w.w}`, voice.result?.words[i++]);
    }
  return displayUnits().flatMap((u) =>
    (u.wordRefs || []).map(
      (w) =>
        byWord.get(`${w.s}:${w.a}:${w.w}`) || {
          word: w.text,
          status: "waiting",
        },
    ),
  );
}
function currentCorpus() {
  return session?.corpus || reader.corpus;
}
function readerView() {
  const corpus = currentCorpus(),
    units = currentUnits(),
    s = section(corpus, !session ? reader.sid : units[0].id.split(":")[0]),
    sheets = readerSheets();
  reader.sheet = Math.max(0, Math.min(reader.sheet || 0, sheets.length - 1));
  const hidden = isHidden(),
    sheet = sheets[reader.sheet];
  return readingView(
    {
      corpus,
      verseMode: verseMode(),
      quranTextSize: quranTextSize(db.settings.quranTextSize),
      verseHTML:
        corpus === "quran" && verseMode()
          ? verseReadingHTML(
              {
                units: session
                  ? units
                  : pageVerseUnits(corpora.quran.sections, reader.page),
                sections: corpora.quran.sections,
                resolve: (id) => findUnit("quran", id),
                size: db.settings.quranTextSize,
                wordPlaying: playingWord,
                showHint: !db.settings.wordHintSeen,
                tajweed: tajweedData,
                pageNavigation: session
                  ? null
                  : { first: reader.page <= 1, last: reader.page >= 604 },
              },
              esc,
            )
          : "",
      swipeHint: false,
      title: session?.current.dailyMatn ? corpora[corpus].name : s.name,
      subtitle: session?.current.dailyMatn
        ? "Tout l’acquis · récitation quotidienne"
        : corpus === "quran"
          ? `Page ${sheet.page} · ${session ? (session.current.kind === "review" ? "révision" : "portion du jour") : "lecture libre"}`
          : `${corpora[corpus].unit === "vers" ? "Vers" : "Passage"} ${units[0].n}${units.length > 1 ? "–" + units.at(-1).n : ""} · ${s.name}`,
      session: Boolean(session),
      mushaf: printedLearning(),
      matnLyrics: !session && corpus !== "quran",
      lyricsHTML:
        !session && corpus !== "quran"
          ? matnLyrics(
              corpora[corpus],
              {
                sid: reader.sid,
                index: reader.index,
                hidden,
                playing,
                revealed: reader.revealedAyahs || [],
              },
              esc,
            )
          : "",
      recognitionAllowed: recognitionAvailable(corpus, session?.current),
      stepTitle: session?.current.dailyMatn
        ? `Récite ${units.length > 1 ? "les" : "le"} ${corpora[corpus].unit}${units.length > 1 && corpora[corpus].unit !== "vers" ? "s" : ""} ${units[0].n}${units.length > 1 ? " à " + units.at(-1).n : ""}`
        : session?.current.kind === "review"
          ? reviewRangeLabel(units, reviewOptions(session.program))
          : session?.current.label,
      practiceKind: session?.current.practiceKind || session?.current.kind,
      stepIndex: session?.index || 0,
      stepCount: session?.steps.length || 0,
      phase: session?.phase,
      listened: session?.listened || 0,
      listenGoal:
        session?.listenTarget ?? listeningGoal(session?.program.memo.repeat),
      audioRunning: Boolean(session?.audioRunning),
      needsAudio: lessonOptions().needsAudio,
      hasAudio: units.every((u) => hasUnitAudio(corpus, u)),
      hidden,
      playing,
      repeatNow,
      playbackRate: db.settings.playbackRate,
      recognitionModel: db.settings.recognitionModel,
      voice,
      voiceLabel: voiceLabel(),
      voiceHint: voiceHint(),
      sheet: reader.sheet,
      sheets: sheets.length,
      textHTML:
        simpleLearning() && !printedLearning()
          ? session.phase === "listen"
            ? `<div class="lyric-track">${sheet.units.map((u) => learningText(u, hidden)).join("")}</div>`
            : sheet.units.map((u) => learningText(u, hidden)).join("")
          : corpus === "quran"
            ? ""
            : sheet.units.map((u) => verseHTML(corpus, u, hidden)).join(""),
      bookmarked: db.bookmarks.includes(corpus + "/" + units[0].id),
      first:
        corpus === "quran"
          ? reader.page <= 1
          : reader.index === 0 && Number(reader.sid) === 1,
      last:
        corpus === "quran"
          ? reader.page >= 604
          : reader.index >= s.units.length - 1 &&
            Number(reader.sid) >= corpora[corpus].sections.length,
      position:
        corpus === "quran"
          ? `${reader.page} / 604`
          : `${corpora[corpus].unit === "vers" ? "Vers" : "Passage"} ${units[0].n} / ${corpora[corpus].sections.at(-1).last}`,
    },
    { button, icon, esc },
  );
}
function learningText(u, hidden) {
  const text = hidden
    ? '<span class="learning-veil" aria-label="Texte caché"></span>'
    : u.parts && u.text === u.parts.join(" ")
      ? u.parts.map(esc).join("<br>")
      : esc(u.text);
  return `<div class="learning-unit"><p>${text}</p></div>`;
}
function verseHTML(corpus, u, hidden) {
  const ref = phonetics[u.id],
    active = voice.text;
  let words = u.text
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => ({ word, status: "waiting" }));
  if (corpus === "quran" && active) {
    const offset = currentUnits()
      .slice(
        0,
        currentUnits().findIndex((x) => x.id === u.id),
      )
      .reduce((n, x) => n + x.text.split(/\s+/).length, 0);
    if (voice.result)
      words = voice.result.words.slice(offset, offset + words.length);
    else if (corpus === "quran" && ref && currentUnits().length === 1)
      words = wordsStatus(
        words.map((w) => w.word),
        ref.aya_phonemes_list,
        voice.text,
        voice.final,
      ).words;
  }
  return `<div class="verse ${playing === u.id ? "playing" : ""}" data-verse="${u.id}"><p>${words.map((w, i) => `<span data-word="${i}" class="word ${w.status} ${wordHidden(hidden, u.wordRefs ? `${u.wordRefs[i].s}:${u.wordRefs[i].a}` : u.id, reader.revealedAyahs, w.status, recognitionAvailable(corpus, session?.current)) ? "veiled" : ""}">${esc(w.word)}</span>`).join(" ")}</p></div>`;
}
function voiceLabel() {
  return (
    modelLabel(db.settings.recognitionModel) +
    " · " +
    {
      idle: recognition.loaded ? "Moteur prêt" : "Sur cet appareil",
      loading: "Chargement du modèle…",
      listening: "Micro actif",
      finishing: "Analyse de la fin…",
      done: "Récitation terminée",
      file: "Analyse du fichier…",
      error: "Essai interrompu",
    }[voice.status]
  );
}
function voiceHint() {
  if (!session && voice.status === "listening" && voice.result?.locating)
    return "Récite quelques mots : je cherche ta position sur la page.";
  return voice.status === "listening"
    ? "Je t’écoute. Récite, puis touche le carré pour terminer."
    : voice.status === "loading"
      ? "Préparation du modèle local. Le premier chargement peut prendre un moment."
      : voice.status === "finishing" || voice.status === "file"
        ? "Le modèle écoute et compare les sons…"
        : "Touche le micro, attends « Micro actif », puis commence à réciter.";
}
function feedbackHTML() {
  if (voice.error)
    return `<p class="error" role="alert">${esc(voice.error)}</p>`;
  if (!voice.text)
    return voice.final
      ? '<p class="muted">Aucun son reconnu. Réessaie dans un endroit calme.</p>'
      : "";
  return `<div class="legend"><span><i class="green"></i> ✓ Repéré · trait plein</span><span><i class="amber"></i> × À vérifier · zigzag</span></div><p class="small muted">${voice.final ? "Compare les repères avec ta récitation." : "Le suivi se précise au fil de la récitation."}</p>`;
}
function reminderItems(at = new Date()) {
  const date = localDay(at);
  const memo = db.programs.map((p) => {
    const x =
      p.corpus === "quran"
        ? macroPlan(p.memo, date, quranMacroIndex, M)
        : dailyMatnPlan(p.memo, date, M);
    const ids = [...x.recent, ...x.revision].flatMap((b) => b.ids || []),
      id = ids[0] || x.fresh[0];
    const name =
      p.corpus === "quran" && id
        ? section(p.corpus, id.split(":")[0])?.name
        : null;
    return {
      key: "memo:" + p.id,
      kind: "memo",
      name: p.name,
      topic: name ? "sourate " + name : corpora[p.corpus]?.name || p.name,
      review: ids.length,
      fresh: x.fresh.length,
      paused: p.paused,
      archived: p.archived,
    };
  });
  return [...memo, ...books.reminderItems(at)];
}
function reminderSnapshot() {
  return {
    settings: db.settings.reminders,
    itemsAt: reminderItems,
    lastSeen: db.settings.reminderLastSeen || Date.now(),
  };
}
function reminderPanel() {
  return remindersView(
    {
      settings: db.settings.reminders,
      items: reminderItems().filter((i) => !i.paused && !i.archived),
      status: reminders?.status || { native: false },
    },
    esc,
  );
}
function settings() {
  return `${title("Mon espace")}${reminderPanel()}<section class="card"><span class="tag">HORS CONNEXION</span><h2>Hors connexion</h2>${button("Préparer l’accès hors connexion", "offline", "primary block", offlineBusy ? "disabled" : "")}<p id="offline-progress" class="small muted"></p><p class="small muted">Pour le Coran, télécharge les audios des passages souhaités depuis la lecture.</p></section><section class="card form-card">${modelPicker(db.settings.recognitionModel)}<p class="small muted">Le modèle 3.1 fonctionne sur cet appareil.</p><h2>Audio</h2><label>Récitateur<select id="reciter">${[
    ["minshawi", "Minshawi · murattal"],
    ["husary", "Husary · murattal"],
    ["alafasy", "Mishary Alafasy"],
  ]
    .map(
      ([id, name]) =>
        `<option value="${id}" ${db.settings.reciter === id ? "selected" : ""}>${name}</option>`,
    )
    .join(
      "",
    )}</select></label><label>Voix des mots<select id="word-voice"><option value="quran-com" ${wordVoice(db.settings.wordVoice) === "quran-com" ? "selected" : ""}>Mots détachés · Quran.com</option><option value="minshawi" ${wordVoice(db.settings.wordVoice) === "minshawi" ? "selected" : ""}>Minshawi · extraits</option></select></label><label class="sound-choice"><input type="checkbox" id="mistake-sound" ${db.settings.mistakeSound !== false ? "checked" : ""}> Son discret pour les écarts stables</label><label>Répétitions en lecture libre<input type="number" id="repeat" min="1" max="20" value="${db.settings.repeat}"></label></section><section class="card"><h2>Sauvegarde</h2><div class="row">${button("Exporter", "export", "secondary")}<label class="btn secondary file-label">Importer<input type="file" id="backup-file" accept="application/json" hidden></label></div>${button("Installer Sakina.me", "install", "text block")}<p class="small muted">Sur iPhone : Safari → Partager → Sur l’écran d’accueil.</p></section><section class="card"><h2>Favoris</h2>${
    db.bookmarks.length
      ? db.bookmarks
          .map((key) => {
            const [c, id] = key.split("/"),
              u = findUnit(c, id);
            return u
              ? button(
                  esc(section(c, id.split(":")[0]).name) + " · " + u.n,
                  "open-unit",
                  "text block",
                  `data-corpus="${c}" data-id="${id}"`,
                )
              : "";
          })
          .join("")
      : '<p class="muted">Une étoile dans la lecture, et tu retrouves ton passage ici.</p>'
  }</section><details class="card"><summary>À propos du suivi vocal</summary><p class="small muted">Sakina.me · version 1.25.1</p><p>Zipformer Quran v3.1 · Quran Lab, via ReciteQuran et le moteur local sherpa-onnx. Reconnaissance des phonèmes en Hafs. Retours expérimentaux, sans validation automatique du tajwid.</p><p>Application personnelle et gratuite. Aucune publicité, aucun compte, aucun envoi d’audio.</p><a href="vendor/LICENSE-ReciteQuran.txt">Conditions ReciteQuran</a> · <a href="THIRD_PARTY_NOTICES.txt">Sources et licences</a></details>`;
}
async function resetVoice() {
  errorStreak.reset();
  retryMistakes.reset();
  mistakes.reset();
  alignment.reset();
  await recognition.stop(false);
  if (voice.status === "error") {
    recognition.dispose();
    recognition = new Recognition(db.settings.recognitionModel);
    attachRecognition();
  }
  voice = { status: "idle", text: "", final: false };
}
function moveReadingCursor(startWord = null) {
  if (session || currentCorpus() !== "quran") return;
  reader.voiceStartWord = startWord;
  alignment.reset();
  errorStreak.reset();
  retryMistakes.reset();
  mistakes.reset();
  retryFrontierKey = null;
  const active = recognition.active;
  recognition.resetSegment();
  speechAttempts.begin();
  voice = {
    status: active ? "listening" : "idle",
    text: "",
    final: false,
    result: null,
  };
}
function ensureMode() {
  if (!recognitionAvailable(currentCorpus(), session?.current))
    throw Error(
      "La reconnaissance est proposée uniquement en révision et en lecture libre du Coran.",
    );
}
function attachRecognition() {
  recognition.addEventListener("result", ({ detail: r }) => {
    if (view !== "reader") return;
    voice.text = r.text || r.tokens?.join("") || "";
    voice.final = r.final;
    if (r.final) voice.status = "done";
    const units = currentUnits(),
      corpus = currentCorpus();
    const referenceWords = [],
      texts = [];
    for (const u of units) {
      if (corpus === "quran" && u.wordRefs) {
        const refs = u.wordRefs.map(
          (w) => phonetics[`${w.s}:${w.a}`]?.aya_phonemes_list[w.w - 1] || "",
        );
        referenceWords.push(...refs);
        texts.push(...u.wordRefs.map((w) => w.text));
      }
    }
    alignment.compare(
      {
        words: texts,
        referenceWords,
        heard: voice.text,
        final: voice.final && Boolean(session),
        settled: voice.final,
        freeReading:
          corpus === "quran" && (!session || (reader.reviewStartWord || 0) > 0),
        startWord:
          session?.current.kind === "review"
            ? (reader.reviewStartWord ?? 0)
            : (reader.voiceStartWord ?? null),
        epoch: recognition.generation,
      },
      (comparison) => {
        if (
          session?.current.kind === "review" &&
          reader.reviewStartWord > 0 &&
          reader.reviewPrefixWords?.length
        )
          comparison.words = comparison.words.map((w, i) =>
            i < reader.reviewStartWord ? reader.reviewPrefixWords[i] || w : w,
          );
        voice.result = comparison;
        let offset = 0;
        for (const u of units) {
          const els = [
            ...document.querySelectorAll(
              `[data-verse="${CSS.escape(u.id)}"] .word`,
            ),
          ];
          const ref = phonetics[u.id];
          els.forEach((el, i) => {
            const status = comparison.words[offset + i]?.status || "waiting";
            el.classList.remove("heard", "check", "waiting", "veiled");
            el.classList.add(status);
            const ref = u.wordRefs?.[i],
              ayah = ref ? `${ref.s}:${ref.a}` : u.id;
            if (
              wordHidden(
                isHidden(),
                ayah,
                reader.revealedAyahs,
                status,
                recognitionAvailable(corpus, session?.current),
              )
            )
              el.classList.add("veiled");
          });
          offset += u.wordRefs?.length || u.text.split(/\s+/).length;
        }
        updateMushaf(
          statusesFor(session ? currentUnits() : corpora.quran.sections.flatMap(s=>s.units)),
          isHidden(),
        );
        const ordinary =
          voice.text &&
          mistakes.inspect(comparison.words, performance.now(), r.final);
        // Use the spoken frontier, not historical errors earlier on the page.
        const frontier = comparison.words.findLastIndex(
          (w) => w.status !== "waiting",
        );
        if (
          session?.current.kind === "review" &&
          corpus === "quran" &&
          recognition.active
        ) {
          reader.reviewPageCursor ??= new ReviewPageCursor(
            units.flatMap((u) => u.wordRefs || []),
            readerSheets(),
            pageIndex,
          );
          const next = reader.reviewPageCursor.follow(
            comparison.words,
            reader.sheet || 0,
          );
          if (next !== (reader.sheet || 0)) {
            reader.sheet = next;
            render();
          }
        }
        let strong = false;
        if (frontier >= 0 && speechAttempts.hasEvidence(voice.text)) {
          const word = comparison.words[frontier],
            refs = units.flatMap((u) => u.wordRefs || []),
            ref = refs[frontier];
          const key = ref ? `${ref.s}:${ref.a}:${ref.w}` : String(frontier);
          if (retryFrontierKey !== key) {
            retryMistakes.reset();
            retryFrontierKey = key;
          }
          if (word.status === "heard")
            errorStreak.inspect(key, "heard", speechAttempts.id, voice.text);
          else if (retryMistakes.inspect([word], performance.now(), r.final))
            strong = errorStreak.inspect(
              key,
              word.status,
              speechAttempts.id,
              voice.text,
            );
        }
        if (strong) {
          mistakeSound(true);
          navigator.vibrate?.([180, 80, 180, 80, 280]);
          toast("Ce mot accroche : prends le temps de le réécouter.");
        } else if (ordinary) mistakeSound();
        updateVoiceDOM();
      },
      (error) => {
        voice.error = error;
        updateVoiceDOM();
      },
    );
    updateVoiceDOM();
  });
  recognition.addEventListener("error", ({ detail }) => {
    voice.error = detail;
    voice.status = "error";
    recognition.stop(false);
    updateVoiceDOM();
  });
  recognition.addEventListener("level", ({ detail }) => {
    if (speechAttempts.level(detail, performance.now(), voice.text))
      retryMistakes.reset();
    const el = document.querySelector("#mic-level");
    if (el) el.style.width = Math.min(100, detail * 700) + "%";
  });
  recognition.addEventListener("limit", () => {
    voice.status = "finishing";
    updateVoiceDOM();
  });
}
function updateVoiceDOM() {
  root
    .querySelectorAll(".quran-verse-block")
    .forEach((el) =>
      el.classList.toggle("is-playing", el.dataset.verseKey === playing),
    );
  root
    .querySelectorAll(".quran-word")
    .forEach((el) =>
      el.classList.toggle(
        "is-speaking",
        (el.dataset.coordinate === "printed"
          ? playingPrintedWord
          : playingWord) === `${el.dataset.id}:${el.dataset.position}`,
      ),
    );
  if (verseMode()) {
    const statuses = new Map();
    let at = 0;
    for (const unit of currentUnits())
      for (const w of unit.wordRefs || [])
        statuses.set(
          `${w.s}:${w.a}:${w.w}`,
          voice.result?.words[at++]?.status || "waiting",
        );
    root.querySelectorAll(".quran-word").forEach((el) => {
      const positions =
        el.dataset.coordinate === "printed"
          ? [Number(el.dataset.position)]
          : wordAudio.printedFor(el.dataset.id, Number(el.dataset.position)) ||
            [];
      const values = positions.map(
        (w) => statuses.get(`${el.dataset.id}:${w}`) || "waiting",
      );
      const status = values.includes("check")
        ? "check"
        : values.length && values.every((v) => v === "heard")
          ? "heard"
          : "waiting";
      el.classList.toggle("is-heard", status === "heard");
      el.classList.toggle("is-check", status === "check");
    });
  }
  const lyric = root.querySelector(".matn-lyrics");
  lyric
    ?.querySelector(".matn-lyric-current")
    ?.classList.toggle(
      "is-playing",
      Boolean(playing && lyric.dataset.focus === playing),
    );
  updateMushafPlayback(playing, playingPrintedWord);
  const play = document.querySelector(
    '[data-action="listen"], [data-action="lesson-listen"], [data-action="stop-audio"]',
  );
  if (play) {
    const running = Boolean(playing || session?.audioRunning);
    play.dataset.action = running
      ? "stop-audio"
      : simpleLearning()
        ? "lesson-listen"
        : "listen";
    play.setAttribute(
      "aria-label",
      running ? "Arrêter l’écoute" : "Écouter le passage",
    );
    play.innerHTML = running
      ? '<span class="stop-square"></span>'
      : icon("play");
  }
  const set = (q, value) => {
    const el = document.querySelector(q);
    if (el) el.textContent = value;
  };
  set("#engine-status", voiceLabel());
  set("#voice-hint", voiceHint());
  set("#phoneme-output", voice.text);
  const feedback = document.querySelector("#voice-feedback");
  if (feedback) feedback.innerHTML = feedbackHTML();
  const mic = document.querySelector(".mic");
  const mastery = document.querySelector('[data-action="mastery-confirm"]');
  if (mastery)
    mastery.disabled = !canCompleteLesson({
      ...lessonOptions(),
      busy:
        Boolean(playing) ||
        ["loading", "listening", "finishing", "file"].includes(voice.status),
    });
  if (mic) {
    mic.classList.toggle("recording", voice.status === "listening");
    mic.disabled = ["loading", "finishing", "file"].includes(voice.status);
    mic.innerHTML =
      voice.status === "listening"
        ? '<span class="stop-square"></span>'
        : icon("mic");
    mic.setAttribute(
      "aria-label",
      voice.status === "listening"
        ? "Arrêter la récitation"
        : "Vérifier avec le micro (facultatif)",
    );
  }
}
attachRecognition();
async function openReader(corpus, sid, index = 0) {
  const returnView = view === "reader" ? reader.returnView : view;
  stopPlayback();
  await resetVoice();
  session = null;
  reader = {
    returnView,
    corpus,
    sid,
    index,
    page:
      corpus === "quran" ? section(corpus, sid).units[index]?.page || 1 : null,
    anchorId: corpus === "quran" ? section(corpus, sid).units[index]?.id : null,
    hidden: false,
    reveal: false,
  };
  view = "reader";
  db.last = { corpus, sid, index };
  stateSave();
  render();
  window.scrollTo(0, 0);
}
async function startProgram(id) {
  const p = db.programs.find((p) => p.id === id);
  if (!p) return;
  const checkpoint = lessonMemory(db, p.id);
  const restored = restoreLesson(checkpoint, p, day());
  if (restored) {
    stopPlayback();
    await resetVoice();
    session = regroupRemainingReviews(restored, reviewOptions(p));
    session.returnView = view === "reader" ? "home" : view;
    reader.hidden = checkpoint.hidden;
    reader.reveal = checkpoint.reveal;
    reader.sheet = checkpoint.sheet;
    reader.revealedAyahs = checkpoint.revealedAyahs || [];
    reader.followId = checkpoint.followId || null;
    view = "reader";
    db.lastDaily = { type: "memorisation", id };
    stateSave();
    render();
    return;
  }
  const x = prog(p),
    steps = [],
    targets = learningTargets(
      p.corpus,
      x.fresh.map((id) => findUnit(p.corpus, id)),
    ),
    byId = Object.fromEntries(targets.map((u) => [u.id, u]));
  for (const step of targets.length
    ? M.learningSteps(
        targets.map((u) => u.id),
        p.memo.group,
      )
    : []) {
    const first = byId[step.ids[0]].n,
      last = byId[step.ids.at(-1)].n,
      label = {
        single: `${p.corpus === "quran" ? "Verset" : corpora[p.corpus].unit === "vers" ? "Vers" : "Passage"} ${first}`,
        group: `Ensemble · ${first}–${last}`,
        link: `Relier · ${first}–${last}`,
        test: "Toute la portion de mémoire",
      }[step.kind];
    steps.push({
      ...step,
      practiceKind: step.kind,
      kind: "new",
      label,
      test: step.kind === "test",
    });
  }
  steps.push(...plannedReviews(p));
  steps.splice(
    0,
    steps.length,
    ...orderedLessonSteps(
      steps.filter((s) => s.kind === "review"),
      steps.filter((s) => s.kind === "new"),
    ),
  );
  if (!steps.length) {
    toast("Ta séance est terminée pour aujourd’hui.");
    return;
  }
  stopPlayback();
  await resetVoice();
  session = {
    program: p,
    returnView: view === "reader" ? "home" : view,
    corpus: p.corpus,
    targets: byId,
    portionIds: x.fresh,
    steps,
    index: 0,
    current: steps[0],
    listened: 0,
    listenTarget: listeningGoal(p.memo.repeat),
    audioRunning: false,
    phase: steps[0].kind === "review" || steps[0].test ? "recite" : "listen",
  };
  db.lastDaily = { type: "memorisation", id };
  reader.reveal = false;
  reader.hidden = session.phase === "recite";
  reader.revealedAyahs = [];
  reader.sheet = 0;
  view = "reader";
  render();
  if (session.phase === "listen" && lessonOptions().needsAudio) await listen();
}
let listenRun = 0;
function stopPlayback() {
  listenRun++;
  audio.stop();
  if (session) session.audioRunning = false;
  playing = null;
  playingWord = null;
  playingPrintedWord = null;
  repeatNow = 0;
  updateMushafPlayback(null, null);
}
async function listen(units = currentUnits(), extra = false, options = {}) {
  const token = ++listenRun,
    lesson = session,
    step = session?.current,
    returnToRecite = session?.phase === "recite";
  if (session && !options.readingOnly) {
    session.listenTarget ??= listeningGoal(session.program.memo.repeat);
    if (extra || session.listenTarget <= session.listened)
      session.listenTarget = session.listened + 1;
    session.audioRunning = true;
    session.phase = "listen";
    reader.followId = units[0]?.id;
    reader.reveal = true;
    reader.hidden = false;
    reader.revealedAyahs = [];
  }
  const completePortion =
    session &&
    !options.readingOnly &&
    units.length === currentUnits().length &&
    units.every((u, i) => u.id === currentUnits()[i].id);
  const startListened = session?.listened || 0;
  const repeats =
    options.repeats ??
    (session
      ? () => Math.max(0, lesson.listenTarget - startListened)
      : db.settings.repeat);
  playingWord = options.word ? `${units[0].id}:${options.word}` : null;
  await resetVoice();
  voice.status = "idle";
  render();
  const reciter = options.reciter || db.settings.reciter;
  if (currentCorpus() === "quran" && !options.word)
    await wordAudio.prepare(units, reciter).catch(() => {});
  if (token !== listenRun) return;
  try {
    await audio.play(
      currentCorpus(),
      units,
      reciter,
      repeats,
      (u, rep) => {
        playing = u?.id || null;
        if (!u) {
          playingWord = null;
          playingPrintedWord = null;
        } else if (options.word) {
          playingWord = options.wordCursor?.canonical
            ? `${u.id}:${options.wordCursor.canonical}`
            : null;
          playingPrintedWord =
            u.printedWordKey ||
            (options.wordCursor?.printed
              ? `${u.id}:${options.wordCursor.printed}`
              : null);
        } else {
          playingWord = null;
          playingPrintedWord = null;
        }
        repeatNow = rep;
        if (u && simpleLearning()) followLearningAudio(u.id);
        else if (u && options.whole) {
          const chapter = corpora[currentCorpus()].sections.find((ch) =>
            ch.units.some((v) => v.id === u.id),
          );
          if (chapter) {
            reader.sid = chapter.id;
            reader.index = chapter.units.findIndex((v) => v.id === u.id);
            reader.sheet = 0;
            render();
          }
        }
        if (!u && session === lesson && session) session.audioRunning = false;
        document
          .querySelectorAll(".verse")
          .forEach((el) =>
            el.classList.toggle("playing", el.dataset.verse === playing),
          );
        const e = document.querySelector("#listen-status");
        if (e)
          e.textContent = u
            ? `Écoute ${rep} · ${corpora[currentCorpus()].unit} ${u.n}`
            : "Écoute terminée.";
        updateVoiceDOM();
        if (u && verseMode() && !options.word) {
          const scroller = root.querySelector(".quran-verse-scroll"),
            card = root.querySelector(`[data-verse-key="${CSS.escape(u.id)}"]`);
          if (scroller && card) {
            const bounds = scroller.getBoundingClientRect(),
              rect = card.getBoundingClientRect();
            if (rect.top < bounds.top || rect.bottom > bounds.bottom)
              scroller.scrollTo({
                top: scroller.scrollTop + rect.top - bounds.top - 8,
                behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
                  ? "instant"
                  : "smooth",
              });
          }
        }
      },
      () => {
        if (completePortion && session === lesson && session.current === step) {
          session.listened++;
          updateLessonControls();
        }
      },
      (u, time, duration) => {
        if (currentCorpus() === "quran" && !options.word) {
          const position = wordAudio.cursor(u.id, time, reciter),
            canonical = position.canonical
              ? `${u.id}:${position.canonical}`
              : null,
            printed = position.printed ? `${u.id}:${position.printed}` : null;
          if (canonical !== playingWord || printed !== playingPrintedWord) {
            playingWord = canonical;
            playingPrintedWord = printed;
            if (printedLearning())
              updateMushafLearning(learningAppearance(), isHidden());
            updateVoiceDOM();
          }
        }
        followLearningTime(u.id, time, duration);
      },
    );
    if (
      session &&
      token === listenRun &&
      session === lesson &&
      session.current === step
    ) {
      session.audioRunning = false;
      if (returnToRecite) {
        session.phase = "recite";
        reader.hidden = true;
        reader.reveal = false;
      }
      render();
    }
  } catch (e) {
    if (token === listenRun && session === lesson) {
      if (session) session.audioRunning = false;
      render();
      toast(e.message);
    }
  }
}
function updateLessonControls() {
  if (!session) return;
  rememberLesson(db, lessonCheckpoint(session, reader, day()));
  stateSave();
  const state = listeningProgress(session.listened, session.listenTarget),
    dots = document.querySelector("#lesson-dots");
  if (dots) {
    dots.setAttribute(
      "aria-label",
      `${state.completed} écoutes terminées sur ${state.target}`,
    );
    while (dots.children.length < state.dots.length)
      dots.append(document.createElement("i"));
    while (dots.children.length > state.dots.length)
      dots.lastElementChild.remove();
    state.dots.forEach((done, i) =>
      dots.children[i].classList.toggle("done", done),
    );
  }
  const remaining = document.querySelector("#listen-remaining");
  if (remaining) {
    remaining.textContent = String(state.remaining);
    remaining.setAttribute(
      "aria-label",
      `${state.remaining} écoutes restantes`,
    );
  }
  const add = document.querySelector('[data-action="add-listen"]');
  if (add)
    add.setAttribute(
      "aria-label",
      `Ajouter une écoute · ${state.remaining} écoutes restantes`,
    );
}
function followLearningAudio(id) {
  if (!simpleLearning() || session.phase !== "listen") return;
  const unit = followUnit(currentUnits(), id);
  if (!unit) return;
  const changed = reader.followId !== unit.id;
  reader.followId = unit.id;
  if (printedLearning()) {
    const page = playbackPage(unit, pageIndex),
      sheets = readerSheets(),
      index = sheets.findIndex((s) => s.page === page);
    if (index >= 0 && index !== (reader.sheet || 0)) {
      reader.sheet = index;
      render();
    } else updateMushafLearning(learningAppearance(), isHidden());
    return;
  }
  const page = document.querySelector(".learning-page");
  if (!page) return;
  reader.sheet = 0;
  page.innerHTML = `<div class="lyric-track">${learningText(unit, isHidden())}</div>`;
  page.scrollTop = 0;
  fitMatn();
  if (changed && !matchMedia("(prefers-reduced-motion: reduce)").matches)
    page.querySelector(".lyric-track").animate(
      [
        { transform: "translateY(6px)", opacity: 0.25 },
        { transform: "translateY(0)", opacity: 1 },
      ],
      { duration: 180, easing: "cubic-bezier(.2,.7,.2,1)" },
    );
}
function followLearningTime(id, time, duration) {
  if (
    !simpleLearning() ||
    session.phase !== "listen" ||
    playing !== id ||
    !Number.isFinite(duration) ||
    duration <= 0
  )
    return;
  if (printedLearning()) {
    const unit = followUnit(currentUnits(), id);
    if (!unit) return;
    const ref = playingPrintedWord?.split(":").map(Number);
    const page = ref
        ? pageIndex.find((p) =>
            p.lines.some((l) =>
              l.words.some(
                (w) => w.s === ref[0] && w.a === ref[1] && w.w === ref[2],
              ),
            ),
          )?.n || playbackPage(unit, pageIndex, time, duration)
        : playbackPage(unit, pageIndex, time, duration),
      index = readerSheets().findIndex((s) => s.page === page);
    if (index >= 0 && index !== (reader.sheet || 0)) {
      reader.sheet = index;
      render();
    }
    return;
  }
  const page = document.querySelector(".learning-page.lyric-mode"),
    track = page?.querySelector(".lyric-track");
  if (!track) return;
  const overflow = Math.max(0, track.scrollHeight - page.clientHeight),
    progress = Math.min(1, Math.max(0, (time / duration - 0.12) / 0.76));
  if (overflow)
    page.scrollTo({
      top: overflow * progress,
      behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
    });
}

async function advanceMastered() {
  const p = session.program,
    step = session.current;
  if (step.kind === "review") {
    p.memo = M.review(p.memo, step.ids, "good", day());
    if (p.corpus === "quran")
      for (const rotation of step.macroRotations || [step.macroRotation])
        p.memo = completeMacroReview(p.memo, rotation, day());
  }
  if (step.kind === "new" && step.test)
    p.memo = M.learn(p.memo, session.portionIds, day());
  stateSave();
  session.index++;
  if (session.index >= session.steps.length) {
    forgetLesson(db, p.id);
    stateSave();
    session = null;
    view = "home";
    render();
    toast("Séance terminée. Les révisions sont prévues.");
    return;
  }
  session.current = session.steps[session.index];
  session.listened = 0;
  session.listenTarget = listeningGoal(p.memo.repeat);
  session.audioRunning = false;
  session.phase = session.current.test ? "recite" : "listen";
  reader.hidden = session.phase === "recite";
  reader.reveal = false;
  reader.revealedAyahs = [];
  reader.sheet = 0;
  render();
  if (session.phase === "listen" && lessonOptions().needsAudio) await listen();
}
async function action(el) {
  if(el.dataset.guide){guide().action(el);return;}
  const a = el.dataset.action;
  if (a === "reminder-test") {
    await reminders.test();
    toast("Rappel de test prévu dans 5 secondes.");
    return;
  }
  if (a === "quran-reading-mode") {
    stopPlayback();
    await resetVoice();
    db.settings.quranReadingMode = quranReadingMode(el.dataset.mode);
    stateSave();
    render();
    return;
  }
  if (a === "quran-font") {
    db.settings.quranTextSize = quranTextSize(
      quranTextSize(db.settings.quranTextSize) + Number(el.dataset.delta),
    );
    stateSave();
    render();
    return;
  }
  if (a === "listen-reading-verse") {
    const unit = findUnit("quran", el.dataset.id);
    if (!unit) return;
    if (!session) {
      reader.anchorId = unit.id;
      reader.sid = unit.id.split(":")[0];
    }
    await listen([unit], false, { repeats: 1, readingOnly: true });
    return;
  }
  if (a === "listen-word") {
    const id = el.dataset.id,
      position = Number(el.dataset.position),
      unit = findUnit("quran", id);
    if (!unit) return;
    stopPlayback();
    updateVoiceDOM();
    const request = listenRun;
    el.disabled = true;
    try {
      const coordinate = el.dataset.coordinate || "canonical",
        cursor = await wordAudio.positions(id, position, coordinate);
      let units = [];
      if (wordVoice(db.settings.wordVoice) === "quran-com")
        units = (await wordAudio.recordings(id, position, coordinate)).map(
          (r) => ({
            ...unit,
            wordAudioURL: r.url,
            playbackIdentity: r.url,
            printedWordKey: r.printedKey,
          }),
        );
      else {
        const selected = coordinate === "printed" ? cursor.canonical : position,
          range = selected ? await wordAudio.range(id, selected) : null;
        if (range) units = [{ ...unit, audioRange: range }];
      }
      if (request !== listenRun || view !== "reader" || !verseMode()) return;
      if (!units.length) {
        toast(
          "Cet audio du mot n’est pas disponible. Tu peux écouter le verset entier.",
        );
        return;
      }
      if (!db.settings.wordHintSeen) {
        db.settings.wordHintSeen = true;
        stateSave();
      }
      await listen(units, false, {
        reciter: "minshawi",
        repeats: 1,
        word: position,
        wordCursor: cursor,
        readingOnly: true,
      });
    } finally {
      if (el.isConnected) el.disabled = false;
    }
    return;
  }
  if (a === "read-quran") {
    books.leave();
    stopPlayback();
    await resetVoice();
    session = null;
    libraryCorpus = "quran";
    view = "library";
    render();
    return;
  }
  if (a === "resume-reading") {
    const place = readingResume();
    if (!place) return;
    await openReader(place.corpus, place.sid, place.index);
    if (place.corpus === "quran") {
      reader.page = Math.max(
        1,
        Math.min(604, Number(place.page) || reader.page),
      );
      reader.anchorId = place.anchorId || reader.anchorId;
      render();
    }
    return;
  }
  if (a === "back") {
    if (view === "books" && books.isNested()) {
      books.back();
      return;
    }
    books.leave();
    stopPlayback();
    await resetVoice();
    if (session) rememberLesson(db, lessonCheckpoint(session, reader, day()));
    stateSave();
    session = null;
    view = previousScreen(screenHistory, lastScreen);
    lastScreen = view;
    render();
    window.scrollTo(0, 0);
    return;
  }
  if (
    a === "selection-amma" ||
    a === "selection-all" ||
    a === "selection-clear"
  ) {
    const f = root.querySelector("#program-form");
    draft = { ...draft, ...Object.fromEntries(new FormData(f)) };
    draft.selectionRows =
      a === "selection-clear"
        ? []
        : corpora[draft.corpus].sections
            .filter((s) => a === "selection-all" || Number(s.id) >= 78)
            .map((s) => ({ section: s.id, whole: true }));
    draft.knownRanges = [];
    draft.knownRecent = false;
    render();
    return;
  }
  if (a === "pause-program" || a === "archive-program") {
    const p = db.programs.find((p) => p.id === el.dataset.id);
    if (p) {
      p.paused = a === "pause-program" ? !p.paused : true;
      p.archived = a === "archive-program";
      stateSave();
      view = "programs";
      toast(
        p.archived
          ? "Programme archivé."
          : p.paused
            ? "Programme mis en pause."
            : "Programme réactivé.",
      );
      render();
    }
    return;
  }
  if (a === "known-add" || a === "known-remove") {
    const form = document.querySelector("#program-form"),
      values = Object.fromEntries(new FormData(form));
    draft = {
      ...draft,
      ...values,
      knownRecent: form.elements.knownRecent.checked,
    };
    const groups = currentPriorGroups();
    draft.knownRanges = readKnownRanges(values, draft, groups);
    if (a === "known-add") {
      const used = new Set(draft.knownRanges.map((r) => r.section)),
        group = groups.find((g) => !used.has(g.id)) || groups[0];
      if (group) draft.knownRanges.push(defaultKnownRange(group));
    } else {
      draft.knownRanges.splice(Number(el.dataset.index), 1);
      if (!draft.knownRanges.length) draft.knownRecent = false;
    }
    render();
    return;
  }

  if (
    [
      "nav",
      "close-reader",
      "recite",
      "restart-step",
      "stop-audio",
      "mastery-confirm",
      "next",
      "previous",
    ].includes(a)
  )
    listenRun++;
  if (a === "reader-menu") {
    document.querySelector("#reader-menu").showModal();
    return;
  }
  if (a === "close-menu") {
    document.querySelector("#reader-menu").close();
    return;
  }
  if (a === "sheet-next" || a === "sheet-previous") {
    reader.sheet = Math.max(
      0,
      Math.min(
        readerSheets().length - 1,
        (reader.sheet || 0) + (a === "sheet-next" ? 1 : -1),
      ),
    );
    render();
    return;
  }
  if (a === "nav") {
    if (session) rememberLesson(db, lessonCheckpoint(session, reader, day()));
    stateSave();
    books.leave();
    stopPlayback();
    await resetVoice();
    view = el.dataset.view;
    session = null;
    render();
    window.scrollTo(0, 0);
  }
  if (a === "library-corpus") {
    libraryCorpus = el.dataset.corpus;
    search = "";
    view = "library";
    render();
  }
  if (a === "corpus") {
    libraryCorpus = el.dataset.corpus;
    search = "";
    render();
  }
  if (a === "jump-page") {
    const n = Number(document.querySelector("#page-number").value);
    if (!Number.isInteger(n) || n < 1 || n > 604) {
      toast("Choisis une page de 1 à 604.");
      return;
    }
    const sid = String(pageIndex[n - 1].lines[0].words[0].s);
    await openReader("quran", sid);
    reader.page = n;
    reader.anchorId = null;
    render();
  }
  if (a === "open-section") await openReader(el.dataset.corpus, el.dataset.sid);
  if (a === "open-unit") {
    const c = el.dataset.corpus,
      sid = el.dataset.id.split(":")[0],
      index = section(c, sid).units.findIndex((u) => u.id === el.dataset.id);
    await openReader(c, sid, index);
  }
  if (a === "new") {
    guide().reset();
    editing = null;
    draft = {
      corpus: "quran",
      sid: "114",
      endSid: "114",
      pace: 2,
      measure: "ayah",
      name: "",
      first: 1,
      last: 6,
      group: 2,
      repeat: 5,
    };
    view = "new";
    render();
  }
  if (a === "start-first") {
    if (db.programs.length) await startProgram(db.programs[0].id);
    else {
      view = "new";
      render();
    }
  }
  if (a === "start") await startProgram(el.dataset.id);
  if (a === "edit") {
    const p = db.programs.find((p) => p.id === el.dataset.id);
    editing = p.id;
    guide().reset(p);
    draft = {
      corpus: p.corpus,
      sid: p.sid,
      name: p.name,
      pace: p.memo.pace,
      measure: p.memo.measure,
      group: p.memo.group,
      repeat: p.memo.repeat,
      knownRecent: false,
    };
    view = "new";
    render();
  }
  if (a === "delete-program") {
    if (
      confirm(
        "Supprimer ce programme et sa progression ? Pense à exporter une sauvegarde.",
      )
    ) {
      db.programs = db.programs.filter((p) => p.id !== el.dataset.id);
      forgetLesson(db, el.dataset.id);
      stateSave();
      view = "programs";
      render();
    }
  }
  if (a === "close-reader") {
    if (session) rememberLesson(db, lessonCheckpoint(session, reader, day()));
    stateSave();
    stopPlayback();
    await resetVoice();
    const returnView = session?.returnView || reader.returnView || "home";
    session = null;
    view = returnView;
    render();
  }
  if (a === "next" || a === "previous") {
    const delta = a === "next" ? 1 : -1;
    if (reader.corpus === "quran") {
      stopPlayback();
      await resetVoice();
      reader.page = Math.max(1, Math.min(604, reader.page + delta));
      reader.anchorId = null;
      reader.voiceStartWord = null;
      reader.revealedAyahs = [];
      reader.sid = String(pageIndex[reader.page - 1].lines[0].words[0].s);
      reader.reveal = false;
      render();
      window.scrollTo(0, 0);
    } else {
      const s = section(reader.corpus, reader.sid),
        index = reader.index + delta;
      if (index >= 0 && index < s.units.length)
        await openReader(reader.corpus, reader.sid, index);
      else {
        const sid = String(Number(reader.sid) + delta),
          next = section(reader.corpus, sid);
        await openReader(
          reader.corpus,
          sid,
          delta > 0 ? 0 : next.units.length - 1,
        );
      }
    }
  }
  if (a === "show-text") {
    reader.hidden = false;
    reader.reveal = true;
    render();
  }
  if (a === "hide-text") {
    if (verseMode()) return;
    reader.revealedAyahs = [];
    reader.hidden = true;
    reader.reveal = false;
    moveReadingCursor();
    render();
  }
  if (a === "reveal-next") {
    const units = session ? displayUnits() : currentUnits(),
      ids = [...new Set(units.flatMap((u) => u.sources || [u.id]))];
    reader.revealedAyahs ??= [];
    const next = ids.find((id) => !reader.revealedAyahs.includes(id));
    if (next) {
      reader.revealedAyahs.push(next);
      moveReadingCursor(nextReadingWord(units, reader.revealedAyahs));
    } else toast("Toute la portion est dévoilée.");
    render();
  }
  if (a === "reveal") {
    reader.reveal = !reader.reveal;
    render();
  }
  if (a === "bookmark") {
    const key = currentCorpus() + "/" + currentUnits()[0].id;
    db.bookmarks = db.bookmarks.includes(key)
      ? db.bookmarks.filter((k) => k !== key)
      : [...db.bookmarks, key];
    stateSave();
    render();
  }
  if (a === "add-listen") {
    if (!session) return;
    session.listenTarget = addListeningRound(
      session.listened,
      session.listenTarget,
    );
    updateLessonControls();
    if (!session.audioRunning) await listen();
    return;
  }
  if (a === "lesson-listen") await listen();
  if (a === "matn-focus") {
    const corpus = el.dataset.corpus,
      sequence = matnSequence(corpora[corpus]),
      target = sequence.find((x) => x.unit.id === el.dataset.id);
    if (!target) return;
    const wasPlaying = Boolean(playing);
    await openReader(corpus, target.sid, target.index);
    if (wasPlaying)
      await listen(
        sequence
          .slice(sequence.indexOf(target))
          .filter((x) => x.unit.audio)
          .map((x) => x.unit),
        false,
        { whole: true },
      );
    return;
  }
  if (a === "listen-entire") {
    const corpus = el.dataset.corpus || currentCorpus();
    if (corpus === "quran") return;
    const c = corpora[corpus],
      all = c.sections.flatMap((ch) => ch.units),
      units = fullMatnAudio(c).map((x) => x.unit);
    if (!units.length) {
      toast("Aucun audio disponible pour ce texte.");
      return;
    }
    const first = c.sections.find((ch) =>
      ch.units.some((u) => u.id === units[0].id),
    );
    await openReader(
      corpus,
      first.id,
      first.units.findIndex((u) => u.id === units[0].id),
    );
    if (units.length < all.length)
      toast(
        `${units.length} passages disponibles sur ${all.length}. Les passages sans audio sont ignorés.`,
      );
    await listen(units, false, { whole: true });
    return;
  }
  if (a === "listen" && !session && currentCorpus() !== "quran") {
    const sequence = matnSequence(corpora[currentCorpus()]),
      from = sequence.findIndex(
        (x) => String(x.sid) === String(reader.sid) && x.index === reader.index,
      ),
      units = sequence
        .slice(Math.max(0, from))
        .filter((x) => x.unit.audio)
        .map((x) => x.unit);
    await listen(units, false, { whole: true });
    return;
  }
  if (a === "listen") await listen(undefined, true);
  if (a === "listen-verse")
    await listen([findUnit(currentCorpus(), el.dataset.id)]);
  if (a === "stop-audio") {
    stopPlayback();
    playing = null;
    render();
  }
  if (a === "recite") {
    if (!session) return;
    stopPlayback();
    session.listenTarget = session.listened;
    await resetVoice();
    session.phase = "recite";
    reader.hidden = true;
    reader.reveal = false;
    reader.revealedAyahs = [];
    render();
  }
  if (a === "restart-step") {
    if (session) await listen(undefined, true);
  }
  if (a === "mastery-confirm") {
    if (
      !session ||
      !canCompleteLesson({
        ...lessonOptions(),
        busy:
          Boolean(playing) ||
          ["loading", "listening", "finishing", "file"].includes(voice.status),
      })
    )
      return;
    stopPlayback();
    await resetVoice();
    await advanceMastered();
  }
  if (a === "microphone") {
    stopPlayback();
    playing = null;
    if (voice.status === "error") await resetVoice();
    ensureMode();
    mistakes.reset();
    await unlockSound();
    setSound(db.settings.mistakeSound !== false);
    if (voice.status === "listening") {
      voice.status = "finishing";
      updateVoiceDOM();
      await recognition.stop();
      return;
    }
    if (session?.current.kind === "review" && currentCorpus() === "quran") {
      reader.reviewPageCursor = new ReviewPageCursor(
        currentUnits().flatMap((u) => u.wordRefs || []),
        readerSheets(),
        pageIndex,
      );
      reader.reviewStartWord = Math.max(
        0,
        reader.reviewPageCursor.startAt(reader.sheet || 0),
      );
      reader.reviewPrefixWords =
        voice.result?.words?.slice(0, reader.reviewStartWord) || [];
    }
    alignment.reset();
    speechAttempts.begin();
    retryMistakes.reset();
    voice = { status: "loading", text: "", final: false };
    render();
    try {
      if (currentCorpus() === "quran")
        void wordAudio.prepare(currentUnits(), "minshawi").catch(() => {});
      await recognition.start({
        maxDuration: session?.current.kind === "review" ? 600000 : 120000,
      });
      voice.status = "listening";
      updateVoiceDOM();
    } catch (e) {
      voice.status = "error";
      voice.error =
        e.name === "NotAllowedError"
          ? "Le microphone n’est pas autorisé. Active-le dans les réglages du navigateur."
          : e.message;
      updateVoiceDOM();
    }
  }
  if (a === "download-words") {
    el.disabled = true;
    try {
      const selected = session
          ? currentUnits()
          : pageVerseUnits(corpora.quran.sections, reader.page),
        requests = [];
      for (const u of selected)
        for (const token of verseTokens(u, findUnit("quran", u.id)).filter(
          (w) => w.position,
        )) {
          const coordinate =
            u !== findUnit("quran", u.id) && u.wordRefs?.length
              ? "printed"
              : "canonical";
          for (const r of await wordAudio.recordings(
            u.id,
            token.position,
            coordinate,
          ))
            requests.push({
              ...findUnit("quran", u.id),
              wordAudioURL: r.url,
              playbackIdentity: r.url,
            });
        }
      await audio.download(
        "quran",
        requests,
        "minshawi",
        (i, n) => (el.textContent = `${i} / ${n} mots`),
      );
      toast("Les mots de ce passage sont disponibles hors connexion.");
    } finally {
      if (el.isConnected) {
        el.disabled = false;
        el.textContent = "Télécharger les mots de ce passage";
      }
    }
    return;
  }
  if (a === "download-audio") {
    const c = currentCorpus();
    el.disabled = true;
    try {
      await audio.download(
        c,
        currentUnits(),
        db.settings.reciter,
        (i, n) => (el.textContent = `${i} / ${n} audios`),
      );
      toast("Audios disponibles hors connexion.");
    } finally {
      el.disabled = false;
      el.textContent = "Télécharger les audios";
    }
  }
  if (a === "offline") await prepareOffline(el);
  if (a === "export") {
    const blob = URL.createObjectURL(
        new Blob([JSON.stringify(db, null, 2)], { type: "application/json" }),
      ),
      a = document.createElement("a");
    a.href = blob;
    a.download = `sakina-${day()}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(blob), 1000);
  }
  if (a === "install") {
    if (installPrompt) {
      await installPrompt.prompt();
      installPrompt = null;
    } else
      toast(
        "Sur iPhone : Safari → Partager → Sur l’écran d’accueil. Sur Android : menu → Installer l’application.",
      );
  }
}
let offlineStorePromise;
async function offlineStore() {
  if (!offlineStorePromise)
    offlineStorePromise = (async () => {
      const response = await fetch("offline-manifest.json", {
        cache: "no-cache",
      });
      if (!response.ok)
        throw Error("L’inventaire hors connexion est indisponible.");
      return createOfflineStore({
        manifest: await response.json(),
        baseURL: location.href,
        shellCache: "sakina-recite-v36",
      });
    })().catch((error) => {
      offlineStorePromise = null;
      throw error;
    });
  return offlineStorePromise;
}
async function checkOffline() {
  try {
    offlineReady = await (await offlineStore()).ready();
  } catch {
    offlineReady = false;
  }
  if (view === "home") render();
  return offlineReady;
}
async function prepareOffline(el) {
  if (offlineBusy || !("caches" in globalThis)) return;
  offlineBusy = true;
  if (el) el.disabled = true;
  if (view === "home" || view === "settings") render();
  try {
    if ("serviceWorker" in navigator)
      await Promise.race([
        navigator.serviceWorker.ready,
        new Promise((resolve) => setTimeout(resolve, 10000)),
      ]);
    await (
      await offlineStore()
    ).prepare(({ checked, total, downloaded, reused }) => {
      offlineCount = checked;
      offlineTotal = total;
      offlineDownloaded = downloaded;
      offlineReused = reused;
      const progress = document.querySelector("#offline-progress");
      if (progress)
        progress.textContent = `${downloaded} téléchargés · ${reused} conservés`;
    });
    offlineReady = true;
    await navigator.storage?.persist?.().catch(() => {});
    toast("Sakina est prête hors connexion.");
  } catch (error) {
    toast(
      error.message +
        " La préparation reprendra sans effacer les fichiers conservés.",
    );
  } finally {
    offlineBusy = false;
    if (el?.isConnected) el.disabled = false;
    if (view === "home" || view === "settings") render();
  }
}
window.addEventListener("online", () => {
  if (!offlineReady && !offlineBusy) void prepareOffline();
});
root.addEventListener("click", (e) => {
  const el = e.target.closest("[data-action],[data-guide]");
  if (el && !el.disabled) action(el).catch((error) => toast(error.message));
});
bindQuranPages(root, {
  enabled: () =>
    false, // Mushaf navigation is vertical; swipe page turning is retired.
  onError: toast,
  onTurn: async (delta) => {
    const move = nextQuranPage(
      {
        page: reader.page,
        sheet: reader.sheet || 0,
        sheets: readerSheets().length,
        session: Boolean(session),
      },
      delta,
    );
    if (!move.changed) return false;
    if (session) {
      stopPlayback();
      reader.sheet = move.sheet;
      db.settings.quranSwipeSeen = true;
      stateSave();
      render();
    } else {
      await action({ dataset: { action: delta > 0 ? "next" : "previous" } });
      db.settings.quranSwipeSeen = true;
      stateSave();
      render();
    }
    const stage = root.querySelector("#reader-stage");
    if (stage && !matchMedia("(prefers-reduced-motion: reduce)").matches)
      stage.animate(
        [
          { opacity: 0.65, transform: `translateX(${delta > 0 ? -12 : 12}px)` },
          { opacity: 1, transform: "none" },
        ],
        { duration: 170, easing: "ease-out" },
      );
    return true;
  },
});
bindSpeedControls(root, {
  getRate: () => db.settings.playbackRate,
  onRate: (rate) => {
    db.settings.playbackRate = audio.setSpeed(rate);
    books.setSpeed(rate);
    stateSave();
  },
});
root.addEventListener("input", (e) => {
  if(view==="new"&&guide().input(e.target))return;
  if (e.target.id === "search") {
    search = e.target.value;
    document.querySelector("#section-list").innerHTML = libraryResults();
  }
});
root.addEventListener("input", (e) => {
  const el = e.target;
  if (!el.matches("[data-select-from],[data-select-to]") || !el.validity.valid)
    return;
  draft.selectionRows = readSelectionFields(
    el.form,
    corpora[draft.corpus].sections,
  );
  const summary = root.querySelector(".selection-summary");
  if (summary)
    summary.innerHTML = draft.selectionRows
      .map(
        (r) =>
          `<span>${esc(section(draft.corpus, r.section).name)}${r.whole ? "" : ` · ${corpora[draft.corpus].unit}s ${r.from}–${r.to}`}</span>`,
      )
      .join("");
});
root.addEventListener("change", async (e) => {
  const el = e.target;
  try {
    if(view==="new"&&guide().change(el))return;
    if (el.closest("#program-form")) {
      if (
        el.hasAttribute("data-select-section") ||
        el.hasAttribute("data-select-whole") ||
        el.hasAttribute("data-select-from") ||
        el.hasAttribute("data-select-to")
      ) {
        const f = el.form;
        draft = {
          ...draft,
          ...Object.fromEntries(new FormData(f)),
          selectionRows: readSelectionFields(f, corpora[draft.corpus].sections),
        };
        draft.knownRanges = (draft.knownRanges || []).filter((r) =>
          draft.selectionRows.some((s) => s.section === r.section),
        );
        render();
        return;
      }
      if (!editing)
        draft.selectionRows = readSelectionFields(
          el.form,
          corpora[draft.corpus].sections,
        );
      draft = {
        ...draft,
        ...Object.fromEntries(new FormData(el.form)),
        knownRecent: el.form.elements.knownRecent?.checked || false,
      };
      if (el.name === "corpus") {
        draft.sid = draft.corpus === "quran" ? "114" : "1";
        draft.endSid = draft.sid;
        draft.first = 1;
        draft.last = section(draft.corpus, draft.sid).units.length;
        draft.measure = "ayah";
        draft.knownRanges = [];
        draft.knownRecent = false;
        draft.selectionRows = [{ section: draft.sid, whole: true }];
        if (corpora[draft.corpus].type === "prose") {
          draft.pace = 1;
          draft.group = 1;
        }
      }
      if (el.name === "sid") {
        draft.endSid = draft.sid;
        draft.first = 1;
        draft.last = section(draft.corpus, draft.sid).units.length;
      }
      if (el.name === "endSid") {
        draft.last = section(draft.corpus, draft.endSid).units.length;
      }
      if (el.name === "measure") draft.pace = el.value === "page" ? 0.5 : 2;
      draft.knownRanges = readKnownRanges(
        Object.fromEntries(new FormData(el.form)),
        draft,
        currentPriorGroups(),
      );
      if (draft.knownRecent && !draft.knownRanges.length)
        draft.knownRecent = false;
      render();
    }
    if (el.id === "recognition-model") {
      await resetVoice();
      recognition.dispose();
      db.settings.recognitionModel = normalizeModel(el.value);
      recognition = new Recognition(db.settings.recognitionModel);
      attachRecognition();
      stateSave();
      render();
      toast(modelLabel(db.settings.recognitionModel) + " sélectionné.");
    }
    if (el.id === "mistake-sound") {
      db.settings.mistakeSound = el.checked;
      setSound(el.checked);
      stateSave();
    }
    if (el.id === "word-voice") {
      db.settings.wordVoice = wordVoice(el.value);
      stateSave();
    }
    if (el.id === "quran-text-size") {
      db.settings.quranTextSize = quranTextSize(el.value);
      stateSave();
      root
        .querySelector(".quran-verse-scroll")
        ?.style.setProperty(
          "--quran-text-size",
          db.settings.quranTextSize + "px",
        );
    }
    if (el.id === "reciter") {
      db.settings.reciter = el.value;
      stateSave();
    }
    if (el.id === "repeat") {
      db.settings.repeat = Math.min(20, Math.max(1, Number(el.value) || 3));
      stateSave();
    }
    if (el.id === "audio-file" && el.files[0]) {
      stopPlayback();
      alignment.reset();
      if (voice.status === "error") await resetVoice();
      ensureMode();
      mistakes.reset();
      speechAttempts.begin();
      retryMistakes.reset();
      await unlockSound();
      setSound(db.settings.mistakeSound !== false);
      voice = { status: "file", text: "", final: false };
      updateVoiceDOM();
      await recognition.file(el.files[0]);
    }
    if (el.id === "backup-file" && el.files[0]) {
      const next = validateBackup(JSON.parse(await el.files[0].text()));
      if (confirm("Remplacer les programmes actuels par cette sauvegarde ?")) {
        await books.persist(next.bookStudy);
        db = next;
        await books.init();
        db.settings = {
          reciter: "minshawi",
          repeat: 1,
          ...db.settings,
          playbackRate: audio.setSpeed(db.settings?.playbackRate),
        };
        await resetVoice();
        recognition.dispose();
        db.settings.recognitionModel = normalizeModel(
          db.settings.recognitionModel,
        );
        recognition = new Recognition(db.settings.recognitionModel);
        attachRecognition();
        stateSave();
        render();
        toast("Sauvegarde importée.");
      }
    }
  } catch (error) {
    voice.error = error.message;
    if (view === "reader") {
      voice.status = "error";
      updateVoiceDOM();
    }
    toast(error.message);
  }
});
root.addEventListener("submit", async (e) => {
  if (e.target.id === "reminders-form") {
    e.preventDefault();
    const form = e.target,
      submit = form.querySelector('[type="submit"]');
    submit.disabled = true;
    try {
      const data = new FormData(form),
        next = validateReminders({
          enabled: data.has("enabled"),
          times: [0, 1, 2].map((n) => data.get("time" + n)).filter(Boolean),
          days: data.getAll("days").map(Number),
          programmes: data.getAll("programmes"),
          playful: data.has("playful"),
        });
      if (
        next.enabled &&
        reminders.status.native &&
        !(await reminders.permission())
      ) {
        toast(
          "Notifications refusées. Autorise Sakina.me dans les réglages Android.",
        );
        render();
        return;
      }
      db.settings.reminders = next;
      stateSave();
      await reminders.sync();
      render();
      toast(next.enabled ? "Rappels enregistrés." : "Rappels désactivés.");
    } catch (error) {
      toast(error.message);
    } finally {
      if (submit.isConnected) submit.disabled = false;
    }
    return;
  }
  if (e.target.id !== "program-form") return;
  e.preventDefault();
  try {
    if (!editing)
      draft.selectionRows = readSelectionFields(
        e.target,
        corpora[draft.corpus].sections,
      );
    const form = Object.fromEntries(new FormData(e.target)),
      c = corpora[draft.corpus],
      s = section(draft.corpus, draft.sid);
    if (form.knownRecent) {
      const groups = currentPriorGroups();
      draft.knownRanges = readKnownRanges(form, draft, groups);
      validateKnowledgeRows(draft.knownRanges, groups);
    }
    if (editing) {
      const p = db.programs.find((p) => p.id === editing);
      p.name = form.name.trim() || p.name;
      p.memo = M.setMeasure(
        p.memo,
        form.measure,
        form.measure === "page"
          ? pageSizes(p.memo.units.map((id) => findUnit("quran", id)))
          : null,
      );
      p.memo = M.setPace(p.memo, form.pace);
      p.memo = M.setRepeat(p.memo, form.repeat);
      p.memo = M.setGroup(p.memo, form.group);
    } else {
      draft.selectionRows ??= [{ section: draft.sid, whole: true }];
      const units = selectedProgramUnits(c.sections, draft.selectionRows, {
        pages:
          draft.corpus === "quran" && form.measure === "page"
            ? pageUnits
            : null,
      });
      const ids = units.map((u) => u.id);
      db.programs.push({
        id: crypto.randomUUID(),
        name:
          form.name.trim() ||
          (draft.selectionRows.length === 1
            ? section(draft.corpus, draft.selectionRows[0].section).name
            : corpora[draft.corpus].name),
        corpus: draft.corpus,
        sid: draft.selectionRows?.[0]?.section || draft.sid,
        selectionRows: draft.selectionRows,
        memo: M.create({
          units: ids,
          learn: ids,
          pace: form.pace,
          measure: form.measure,
          sizes: form.measure === "page" ? pageSizes(units) : null,
          group: form.group,
          repeat: form.repeat,
        }),
      });
    }
    const target = editing
      ? db.programs.find((p) => p.id === editing)
      : db.programs.at(-1);
    const updated = applyPrior(target, form);
    db.programs = db.programs.map((p) => (p.id === target.id ? updated : p));
    stateSave();
    editing = null;
    view = "programs";
    render();
    toast("Programme enregistré.");
  } catch (error) {
    toast(error.message);
  }
});
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  installPrompt = e;
});
document.addEventListener("visibilitychange", () => {
  if (!document.hidden && reminderBooted) {
    db.settings.reminderLastSeen = Date.now();
    stateSave();
    reminders.sync().catch(() => {});
  }
  if (document.hidden) {
    if (session) rememberLesson(db, lessonCheckpoint(session, reader, day()));
    stateSave();
    stopPlayback();
    if (recognition.active) {
      recognition.stop(false);
      voice.status = "idle";
      voice.error = "Micro arrêté pendant la mise en arrière-plan.";
      updateVoiceDOM();
    }
  }
});
try {
  await loadData();
  await books.init();
  db.settings.reminders = reminderSettings(db.settings.reminders);
  db.settings.reminderLastSeen = Date.now();
  reminders = createReminderService({
    plugin: await nativeReminders(),
    snapshot: reminderSnapshot,
    onOpen: async (key) => {
      try {
        stopPlayback();
        await resetVoice();
        books.leave();
        session = null;
        if (key?.startsWith("book:")) await books.openProgram(key.slice(5));
        else {
          view = "programs";
          render();
        }
      } catch (error) {
        toast(error.message);
      }
    },
  });
  reminderBooted = true;
  stateSave();
  await reminders.init().catch(() => {});
  render();
  void checkOffline().then(() => {
    if (!offlineReady && navigator.onLine) void prepareOffline();
  });
} catch (error) {
  root.innerHTML = `<div class="boot"><h1>La bibliothèque n’a pas pu s’ouvrir.</h1><p>${esc(error.message)}</p><button onclick="location.reload()">Réessayer</button></div>`;
}
