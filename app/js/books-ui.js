import {
  programmeGroups,
  dailyCandidates,
  editionRoute,
  questionSummary,
} from "./programme-ux.js";
import { bookMemory, rememberBook, forgetBook } from "./session-memory.js";
import { bookContentHTML } from "./book-content.js";
import { loadBookStudy, saveBookStudy } from "./books-store.js";
import {
  createPractice,
  practiceAnswer,
  shufflePractice,
  swipeAnswer,
} from "./book-practice.js";
import { speedDialog, speedTrigger } from "./speed-control.js";
import {
  emptyStudy,
  createBookProgram,
  bookPlan,
  canResumeScheduledCard,
  previewGrades,
  applyGrade,
  intervalLabel,
  cardKey,
  validateBookStudy,
  migrateCloserReviews,
  undoBookGrade,
} from "./books-core.js";
const E = (s) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const B = (text, action, cls = "", attrs = "") =>
  `<button type="button" class="btn ${cls}" data-book-action="${action}" ${attrs}>${text}</button>`;
const PLAY_LABEL =
  '<svg class="qa-play-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 4v16l13-8z"/></svg> Écouter la citation';
const gradeNames = ["À revoir", "Difficile", "Correct", "Facile"];
export function createBooksUI(host) {
  let catalog = null,
    error = null,
    mode = "list",
    edition = null,
    draft = null,
    editing = null,
    session = null,
    clip = null,
    timer = null,
    drag = null,
    grading = false,
    saving = false,
    selectedBook = null,
    formReturn = "list",
    wizardStep = 0;
  const editions = new Map(),
    state = () => {
      const db = host.state();
      if (!db.bookStudy) db.bookStudy = emptyStudy();
      return db.bookStudy;
    };
  function dailyItems() {
    return state()
      .programs.map((p) => {
        const ed = editions.get(p.editionId);
        if (!ed) return null;
        const plan = bookPlan(state(), p, ed),
          resume = canResume(p);
        return {
          kind: "book",
          id: p.id,
          name: p.name,
          paused: p.paused,
          archived: p.archived,
          review: plan.due.length,
          fresh: plan.fresh.length,
          waitingUntil: plan.waitingUntil,
          resume,
          resumeAt: resume ? bookMemory(host.state(), p)?.savedAt || 0 : 0,
        };
      })
      .filter(Boolean);
  }
  const recommendation = () => dailyCandidates(dailyItems())[0];
  const program = () =>
    session?.practiceProgram ||
    state().programs.find((p) => p.id === session?.programId);
  const speedButton = (label, action, cls = "", attrs = "") =>
    `<button type="button" class="btn ${cls}" data-action="${action}" ${attrs}>${label}</button>`;
  function checkpoint() {
    if (!session) return;
    rememberBook(host.state(), {
      ...session,
      preview: null,
      savedDay: new Date().toDateString(),
      savedAt: Date.now(),
      baseReps: session.questionId
        ? state().cards[cardKey(edition.id, session.questionId)]?.reps || 0
        : 0,
    });
    host.save();
  }
  function canResume(p, practice = false) {
    const c = bookMemory(host.state(), p, practice);
    return (
      Boolean(c?.practice) === practice &&
      (!practice ||
        (c.practice.queue.length > 0 &&
          JSON.stringify(c.practiceProgram?.questionIds) ===
            JSON.stringify(p.questionIds))) &&
      c?.programId === p.id &&
      (practice || c.savedDay === new Date().toDateString()) &&
      (c.practice ||
        (!p.archived &&
          (!c.questionId || p.questionIds.includes(c.questionId))))
    );
  }
  const canUndo = () => {
    const u = state().undo,
      p = program();
    return (
      !session?.practice &&
      u &&
      p &&
      p.questionIds.some((id) => cardKey(p.editionId, id) === u.key)
    );
  };
  const commit = async (next) => {
    await saveBookStudy(next);
    host.state().bookStudy = next;
    host.save();
  };
  const stopAudio = () => {
    if (clip) {
      clip.pause();
      clip.src = "";
      clip = null;
    }
    document
      .querySelectorAll(".qa-audio")
      .forEach((el) => (el.innerHTML = el.dataset.audioLabel || PLAY_LABEL));
  };
  const refresh = () => {
    host.open();
    host.render();
  };
  async function loadEdition(id) {
    if (editions.has(id)) return editions.get(id);
    const spec = catalog.books
      .flatMap((b) => b.editions)
      .find((e) => e.id === id);
    if (!spec) throw Error("Édition du livre introuvable.");
    const response = await fetch(spec.file);
    if (!response.ok)
      throw Error(
        "Le livre ne peut pas être chargé. Prépare le mode hors connexion.",
      );
    const data = await response.json();
    if (data.id !== id || !Array.isArray(data.questions))
      throw Error("Livre invalide.");
    editions.set(id, data);
    return data;
  }
  async function init() {
    try {
      error = null;
      if (!host.state().bookStudy)
        host.state().bookStudy = (await loadBookStudy()) || emptyStudy();
      const response = await fetch("data/books/catalog.json");
      if (!response.ok) throw Error("Catalogue indisponible.");
      catalog = await response.json();
      if (host.state().bookStudy) validateBookStudy(host.state().bookStudy);
      const closer = migrateCloserReviews(state());
      if (closer !== state()) await commit(closer);
      for (const p of state().programs) await loadEdition(p.editionId);
    } catch (e) {
      error = e.message;
    }
  }
  function newDraft(data, p = null) {
    formReturn = ["edition", "editions"].includes(mode) ? mode : "list";
    edition = data;
    wizardStep=0;
    editing = p?.id || null;
    draft = {
      name: p?.name || data.title,
      newPerDay: p?.newPerDay ?? 5,
      mode: p?.selection?.mode || "all",
      chapters: p?.selection?.chapters || [],
      ids: p?.selection?.ids || [],
      ranges: p?.selection?.ranges?.map((r) => ({ ...r })) || [
        { from: 1, to: 25 },
      ],
      retention: p?.retention || 0.9,
    };
    mode = "form";
    session = null;
  }
  function capture() {
    const form = document.querySelector("#book-program-form");
    if (!form) return;
    draft.name = form.elements.name.value;
    draft.newPerDay = Number(form.elements.newPerDay.value);
    draft.retention = Number(form.elements.retention.value) / 100;
    draft.chapters = [
      ...form.querySelectorAll('[name="chapters"]:checked'),
    ].map((x) => x.value);
    draft.ids = [...form.querySelectorAll('[name="questions"]:checked')].map(
      (x) => x.value,
    );
    draft.ranges = [...form.querySelectorAll(".qa-range")].map((row) => ({
      from: Number(row.querySelector("[data-from]").value),
      to: Number(row.querySelector("[data-to]").value),
    }));
    if (!draft.ranges.length) draft.ranges = [{ from: 1, to: 25 }];
  }
  function frontBlocks(q) {
    return blocks(q.front);
  }
  function blocks(items) {
    return bookContentHTML(items, (b) => {
      const hadith = b.type === "hadith-audio",
        label = hadith
          ? PLAY_LABEL.replace("Écouter la citation", "Écouter le hadith")
          : PLAY_LABEL,
        accessible = hadith
          ? `Écouter le hadith`
          : `Écouter la citation ${b.reference} avec Minshawi`;
      return `<div class="qa-verse-audio">${B(label, "audio", "qa-audio", `data-src="${E(b.audio)}" data-audio-label="${E(label)}" aria-label="${E(accessible)}"`)}<div class="qa-audio-progress" aria-hidden="true"><i></i></div>${speedTrigger({ playbackRate: host.state().settings.playbackRate }, speedButton).replace('id="speed-trigger-value"', "data-speed-value")}${hadith ? "" : `<small>${E(b.reference)} · Minshawi</small>`}</div>`;
    });
  }
  function cards(programmes = state().programs) {
    return programmes
      .map((p) => {
        const ed = editions.get(p.editionId);
        if (!ed) return "";
        const plan = bookPlan(state(), p, ed);
        return `<article class="card qa-program"><span class="tag">QUESTIONS-RÉPONSES · ${ed.language.toUpperCase()}${p.archived ? " · Archivé" : p.paused ? " · En pause" : ""}</span><h3>${E(p.name)}</h3><p class="small muted">${questionSummary(plan.due.length, plan.fresh.length, plan.waitingUntil)}</p><div class="progress" role="progressbar" aria-label="Questions commencées" aria-valuenow="${plan.started}" aria-valuemin="0" aria-valuemax="${plan.total}"><i style="width:${(100 * plan.started) / Math.max(1, plan.total)}%"></i></div><div class="spread"><small class="muted">${plan.started} / ${plan.total} questions</small>${p.archived ? "<small>Archivé</small>" : B(canResume(p) ? "Reprendre" : "Commencer", "start", "primary compact", `data-id="${E(p.id)}"`)}${B("Révision libre", "practice", "secondary compact", `data-id="${E(p.id)}"`)}${B("Gérer", "edit", "text", `data-id="${E(p.id)}"`)}</div></article>`;
      })
      .join("");
  }
  function groupedCards(programmes = state().programs) {
    const g = programmeGroups(programmes);
    return (
      cards(g.active) +
      (g.paused.length
        ? `<details class="programme-fold"><summary>En pause · ${g.paused.length}</summary>${cards(g.paused)}</details>`
        : "") +
      (g.archived.length
        ? `<details class="programme-fold"><summary>Archivés · ${g.archived.length}</summary>${cards(g.archived)}</details>`
        : "")
    );
  }
  async function openEdition(id) {
    const route = editionRoute(state().programs, id);
    if (route.type === "start") {
      await begin(state().programs.find((p) => p.id === route.programId));
      return;
    }
    if (route.type === "create") {
      newDraft(await loadEdition(id));
      refresh();
      return;
    }
    edition = await loadEdition(id);
    mode = "edition";
    refresh();
  }
  function editionMenu() {
    return `<div class="page-title"><h1>${E(edition.title)}</h1></div><h2 class="section-title">Choisir mon programme</h2>${groupedCards(state().programs.filter((p) => p.editionId === edition.id))}${B("Créer un programme", "create", "secondary block", `data-edition="${E(edition.id)}"`)}`;
  }
  function list() {
    if (error)
      return `<section class="card"><h2>Livres</h2><p>${E(error)}</p></section>`;
    return `<div class="page-title"><h1>Livres</h1></div>${state().programs.length ? `<div class="section-head"><h2 class="section-title">Mes programmes</h2>${B("+ Nouveau programme", "create", "secondary compact")}</div>${groupedCards()}` : ""}<h2 class="section-title">Les livres</h2>${catalog?.books.map((book) => `<article class="card qa-book" role="button" tabindex="0" data-book-action="open-book" data-book="${E(book.id)}" aria-label="Ouvrir ${E(book.title)}"><span class="qa-book-symbol" aria-hidden="true">▤</span><div><h3>${E(book.title)}</h3><p class="small muted">Questions-réponses</p><div class="row">${book.editions.map((ed) => B(ed.label, book.editions.length === 1 ? "open-book" : "open-edition", "secondary compact", book.editions.length === 1 ? `data-book="${E(book.id)}"` : `data-edition="${E(ed.id)}"`)).join("")}</div></div></article>`).join("") || "<p>Chargement des livres…</p>"}`;
  }
  function legacyForm() {
    const ed = edition,
      selection = draft.mode;
    return `<div class="page-title"><h1>${editing ? "Modifier" : "Créer"} mon programme</h1></div><form id="book-program-form" class="card form-card"><div class="qa-book-title"><h2>${E(ed.title)}</h2><small>${ed.language === "fr" ? "Français" : "العربية"} · ${ed.questions.length} questions</small></div><label>Nom du programme<input name="name" maxlength="80" value="${E(draft.name)}" required></label><p class="qa-form-label">Ce que je veux apprendre</p><div class="seg qa-modes">${[
      ["all", "Tout le livre"],
      ["chapters", "Chapitres"],
      ["ranges", "Au choix"],
      ["individual", "Questions"],
    ]
      .map(([id, title]) =>
        B(
          title,
          "scope",
          id === selection ? "selected" : "",
          `data-mode="${id}" aria-pressed="${id === selection}"`,
        ),
      )
      .join(
        "",
      )}</div>${selection === "all" ? '<p class="small muted">Toutes les questions, dans l’ordre du livre.</p>' : selection === "chapters" ? `<div class="qa-choice-list">${ed.chapters.map((ch) => `<label style="${ch.parentId ? "padding-left:16px" : ""}"><input type="checkbox" name="chapters" value="${E(ch.id)}" ${draft.chapters.includes(ch.id) ? "checked" : ""}>${E(ch.title)}</label>`).join("")}</div>` : selection === "individual" ? `<div class="qa-choice-list">${ed.questions.map((q) => `<label><input type="checkbox" name="questions" value="${E(q.id)}" ${draft.ids.includes(q.id) ? "checked" : ""}>${q.number}${q.occurrence > 1 ? " (2e)" : ""} · ${E(q.searchText.slice(0, 90))}</label>`).join("")}</div>` : `<div class="qa-ranges">${draft.ranges.map((r, i) => `<div class="qa-range"><label>De la question<input data-from type="number" min="1" max="${Math.max(...ed.questions.map((q) => q.number))}" value="${r.from}" required></label><label>À la question<input data-to type="number" min="1" max="${Math.max(...ed.questions.map((q) => q.number))}" value="${r.to}" required></label>${draft.ranges.length > 1 ? B("×", "remove-range", "text", `data-index="${i}" aria-label="Retirer cette plage"`) : ""}</div>`).join("")}</div>${B("+ Ajouter une plage", "add-range", "text")}`}<label>Nouvelles questions par jour<input name="newPerDay" type="number" min="0" max="1000" value="${draft.newPerDay}" required></label><details><summary>Réglages de révision</summary><label>Rétention souhaitée<select name="retention">${[0.8, 0.85, 0.9, 0.95, 0.97, 0.99].map((r) => `<option value="${r * 100}" ${r === draft.retention ? "selected" : ""}>${Math.round(r * 100)} %</option>`).join("")}</select></label><p class="small muted">FSRS-6 · étapes d’apprentissage 1 min et 10 min, réapprentissage 10 min. Les échéances s’adaptent à chaque carte.</p></details><p class="small muted">Les révisions dues passent avant les nouvelles questions.</p><button class="btn primary block" type="submit">${editing ? "Enregistrer" : "Créer et commencer"}</button>${B("Réviser librement cette sélection", "practice-draft", "secondary block")}${editing ? `<div class="qa-manage-actions">${B(state().programs.find((p) => p.id === editing)?.paused ? "Réactiver" : "Mettre en pause", "pause", "secondary", `data-id="${E(editing)}"`)}${B("Archiver", "archive", "secondary", `data-id="${E(editing)}"`)}${B("Supprimer ce programme", "delete", "danger", `data-id="${E(editing)}"`)}</div>` : ""}</form>${B("Retour aux livres", "list", "text")}`;
  }
  function form(){
    const html=legacyForm(),doc=new DOMParser().parseFromString(html,'text/html'),form=doc.querySelector('form');
    form.querySelector('.qa-book-title')?.remove();
    const stages=[doc.createElement('section'),doc.createElement('section'),doc.createElement('section')];
    for(const child of [...form.children]){let stage=0;if(child.matches('label')&&child.querySelector('[name="newPerDay"]'))stage=1;else if(child.tagName==='DETAILS'||child.matches('[type="submit"],.qa-manage-actions')||child.matches('label')&&child.querySelector('[name="name"]'))stage=2;else if(child.hasAttribute('data-book-action')&&['practice-draft'].includes(child.dataset.bookAction))stage=2;else if(child.classList.contains('small'))stage=1;stages[stage].append(child);}
    const advanced=stages[2].querySelector('details');if(advanced){const retention=advanced.querySelector('select'),label=advanced.querySelector('label');const input=doc.createElement('input');input.type='number';input.name='retention';input.min='70';input.max='99';input.value=draft.retention*100;retention.replaceWith(input);advanced.replaceWith(label);}
    const submit=stages[2].querySelector('[type="submit"]');if(submit)submit.textContent=editing?'Enregistrer':'Lancer mon premier entraînement';
    const select=stages[0].querySelector('.qa-modes');if(select)select.classList.add('guide-scope');
    const heading=['Que veux-tu apprendre dans ce livre ?','Combien de nouvelles questions par jour ?','Ton programme est prêt.'][wizardStep];
    const pace=stages[1].querySelector('[name="newPerDay"]');if(pace)pace.parentElement.insertAdjacentHTML('beforebegin',`<div class="guide-pace-options">${[3,5,10].map(n=>B(`${n} questions par jour`,'wizard-pace',`guide-choice ${n===draft.newPerDay?'selected':''}`,`data-value="${n}"`)).join('')}</div>`);
    form.className='guide-book-form';form.innerHTML=`<header class="guide-book-progress"><span>${wizardStep+1} sur 3</span><div class="progress"><i style="width:${100*(wizardStep+1)/3}%"></i></div></header><h2>${heading}</h2><p class="small muted">${E(edition.title)}</p>`;
    stages.forEach((section,i)=>{section.hidden=i!==wizardStep;section.className='guide-book-stage';form.append(section);});
    if(wizardStep<2)form.insertAdjacentHTML('beforeend',B('Continuer →','wizard-next','primary block guide-sticky'));
    if(wizardStep>0)form.insertAdjacentHTML('beforeend',B('‹ Retour','wizard-back','text block'));
    return form.outerHTML;
  }
  function prepareCard() {
    const p = program();
    if (!p) return;
    if (session.practice) {
      session.questionId = session.practice.queue[0] || null;
      session.face = "front";
      session.preview = null;
      checkpoint();
      return;
    }
    const plan = bookPlan(state(), p, edition);
    session.questionId = plan.next;
    session.face = "front";
    session.preview = null;
    session.total = Math.max(
      session.total || 0,
      session.completed +
        plan.due.length +
        plan.fresh.length +
        (plan.waitingUntil ? 1 : 0),
    );
    session.nextDue = plan.nextDue;
    session.waitingUntil = plan.waitingUntil;
    checkpoint();
  }
  async function begin(p, practice = false) {
    const returnTo = host.active()
      ? mode === "form"
        ? "form"
        : ["edition", "editions"].includes(mode)
          ? mode
          : "list"
      : "view:" + host.currentView();
    await host.beforeStudy();
    edition = await loadEdition(p.editionId);
    const saved = bookMemory(host.state(), p, practice);
    if (canResume(p, practice)) {
      session = { ...saved, preview: null, returnTo };
      if (!practice && !canResumeScheduledCard(state(), p, edition, saved))
        prepareCard();
    } else {
      session = {
        programId: p.id,
        completed: 0,
        returnTo,
        ...(practice
          ? {
              practice: createPractice(p.questionIds),
              practiceProgram: p,
              demo: !host.state().settings.bookPracticeIntro,
            }
          : {}),
      };
      prepareCard();
    }
    mode = "study";
    refresh();
  }
  async function practiceGrade(success) {
    if (!session.practice || session.face !== "back") return;
    if (session.demo) {
      host.state().settings.bookPracticeIntro = true;
      session.demo = false;
      session.face = "front";
      checkpoint();
      refresh();
      return;
    }
    session.practice = practiceAnswer(session.practice, success);
    prepareCard();
    refresh();
  }
  function gradeButtons() {
    if (session.practice)
      return (
        B("← À reprendre", "practice-retry", "qa-grade qa-grade-1") +
        B("Je savais →", "practice-pass", "qa-grade qa-grade-3")
      );
    const p = program(),
      now = new Date();
    session.preview = previewGrades(
      { ...state(), retention: p.retention || 0.9 },
      edition.id,
      session.questionId,
      now,
    );
    return gradeNames
      .map((name, i) => {
        const due = session.preview.options[i + 1].card.due,
          delay = intervalLabel(due, now);
        return B(
          `<span>${E(delay)}</span><strong>${name}</strong>`,
          "grade",
          `qa-grade qa-grade-${i + 1}`,
          `data-grade="${i + 1}" aria-label="${name}, prochaine révision dans ${E(delay)}"`,
        );
      })
      .join("");
  }
  function study() {
    const p = program();
    if (!p) {
      mode = "list";
      session = null;
      return list();
    }
    if (!session.questionId) {
      return `<header class="qa-study-head">${B("‹", "book-back", "qa-close", 'aria-label="Retour au menu précédent"')}<h1>${E(p.name)}</h1></header><main class="qa-finished"><span class="qa-finished-mark">✓</span><h2>${session.practice ? "Toutes les cartes sont réussies." : session.waitingUntil ? "Une courte pause." : "Terminé pour aujourd’hui."}</h2><p role="status" id="qa-waiting">${session.practice ? "" : session.waitingUntil ? `Une carte revient dans ${E(intervalLabel(session.waitingUntil))}. Elle s’ouvrira automatiquement ici.` : session.nextDue ? `Prochaine révision dans ${E(intervalLabel(session.nextDue))}.` : p.newPerDay === 0 ? "Aucune nouvelle question n’est prévue." : p.questionIds.some((id) => !state().cards[cardKey(edition.id, id)]) ? "Les nouvelles questions reviennent demain." : "Toutes les questions sont à jour."}</p>${canUndo() ? B("Annuler la dernière réponse", "undo", "secondary") : ""}${B("Retour à l’accueil", "home", "primary")}</main>`;
    }
    const q = session.demo
      ? {
          number: "d’essai",
          front: [
            { type: "text", text: "Touchez cette carte pour la retourner." },
          ],
          back: [
            {
              type: "text",
              text: "Glissez à droite si vous saviez, à gauche pour la reprendre. Les boutons font la même chose.",
            },
          ],
        }
      : edition.questions.find((q) => q.id === session.questionId);
    const face = session.face === "back";
    return `<header class="qa-study-head">${B("‹", "book-back", "qa-close", 'aria-label="Retour au menu précédent"')}<div><small>${E(edition.title)}</small><h1>${E(p.name)}</h1></div><div class="qa-study-meta"><span>${session.practice ? `${session.practice.passed.length} / ${session.practice.total}` : `${session.completed + 1} / ${Math.max(session.total, session.completed + 1)}`}</span>${session.practice && !session.demo ? B("Mélanger", "practice-shuffle", "qa-shuffle", `aria-label="Mélanger les cartes restantes" ${session.practice.queue.length < 2 ? "disabled" : ""}`) : ""}</div></header><div class="progress qa-study-progress" role="progressbar" aria-label="Progression de la séance de questions"><i style="width:${session.practice ? (100 * session.practice.passed.length) / session.practice.total : Math.min(100, (100 * session.completed) / Math.max(1, session.total))}%"></i></div><section class="qa-flip-card ${face ? "flipped" : ""}" tabindex="0" role="group" aria-label="Carte question ${q.number}. Appuyez sur Entrée pour la retourner."><div class="qa-card-inner"><div class="qa-face qa-front" ${face ? 'inert aria-hidden="true"' : ""}><div class="qa-card-tag"><span>Question ${q.number}${q.occurrence > 1 ? " (2e)" : ""}</span><span>${session.demo ? "Démonstration" : session.practice ? "Révision libre" : state().cards[cardKey(edition.id, q.id)] ? "Révision" : "Apprendre"}</span></div><div class="qa-card-scroll qa-question-content" tabindex="0" role="region" aria-label="Question défilante" dir="${edition.direction}"><div class="qa-front-content">${frontBlocks(q)}</div></div></div><div class="qa-face qa-back" ${!face ? 'inert aria-hidden="true"' : ""}><div class="qa-card-tag"><span>Question ${q.number}</span><span>Réponse</span></div><div class="qa-card-scroll" tabindex="0" role="region" aria-label="Réponse défilante" dir="${edition.direction}">${blocks(q.back)}</div></div></div></section><footer class="qa-study-footer"><p class="qa-tap-hint" ${face ? "hidden" : ""}>${session.demo ? "Démonstration · aucune réponse enregistrée" : !host.state().settings.bookFlipSeen ? "Touchez la carte pour afficher la réponse." : ""}</p>${session.demo ? B("Passer la démonstration", "skip-demo", "qa-undo") : ""}<div class="qa-ratings ${session.practice ? "qa-practice-ratings" : ""}" ${!face ? "hidden" : ""}>${face ? gradeButtons() : ""}</div>${canUndo() ? B("Annuler", "undo", "qa-undo", 'aria-label="Annuler la dernière réponse"') : ""}</footer>${speedDialog({ playbackRate: host.state().settings.playbackRate }, speedButton)}`;
  }
  function render() {
    return mode === "study"
      ? study()
      : mode === "form"
        ? form()
        : mode === "edition"
          ? editionMenu()
          : mode === "editions"
            ? `<h1>Choisir la langue</h1>${catalog.books
                .find((b) => b.id === selectedBook)
                .editions.map((ed) =>
                  B(
                    ed.label,
                    "open-edition",
                    "secondary block",
                    `data-edition="${E(ed.id)}"`,
                  ),
                )
                .join("")}`
            : list();
  }
  function flip() {
    if (!session?.questionId) return;
    session.face = session.face === "back" ? "front" : "back";
    const back = session.face === "back",
      card = document.querySelector(".qa-flip-card");
    card.classList.toggle("flipped", back);
    card.querySelector(".qa-front").inert = back;
    card.querySelector(".qa-front").setAttribute("aria-hidden", String(back));
    card.querySelector(".qa-back").inert = !back;
    card.querySelector(".qa-back").setAttribute("aria-hidden", String(!back));
    document.querySelector(".qa-tap-hint").hidden = back;
    const grades = document.querySelector(".qa-ratings");
    grades.hidden = !back;
    if (back) {
      grades.innerHTML = gradeButtons();
      host.state().settings.bookFlipSeen = true;
    } else stopAudio();
    checkpoint();
    updateScrollHints();
  }
  async function action(e) {
    const el = e.target.closest("[data-book-action]");
    if (!el) {
      const card = e.target.closest(".qa-flip-card");
      if (
        card &&
        !e.target.closest("button,a,input,summary,details") &&
        !window.getSelection()?.toString() &&
        !drag?.moved
      )
        flip();
      return;
    }
    e.preventDefault();
    const a = el.dataset.bookAction;
    if(a==='wizard-next'||a==='wizard-back'){capture();if(a==='wizard-next'&&draft.mode==='individual'&&!draft.ids.length){host.toast('Choisis au moins une question.');return;}if(a==='wizard-next'&&draft.mode==='chapters'&&!draft.chapters.length){host.toast('Choisis au moins un chapitre.');return;}wizardStep=Math.max(0,Math.min(2,wizardStep+(a==='wizard-next'?1:-1)));refresh();return;}
    if(a==='wizard-pace'){capture();draft.newPerDay=Number(el.dataset.value);refresh();return;}
    try {
      if (a !== "audio") stopAudio();
      if (a === "practice-shuffle") {
        if (!session?.practice || session.demo || grading) return;
        session.practice = shufflePractice(session.practice);
        prepareCard();
        refresh();
        return;
      }
      if (a === "open-book") {
        const book = catalog.books.find((b) => b.id === el.dataset.book);
        if (book.editions.length === 1) {
          selectedBook = null;
          await openEdition(book.editions[0].id);
        } else {
          selectedBook = book.id;
          mode = "editions";
          refresh();
        }
      }
      if (a === "open-edition") await openEdition(el.dataset.edition);
      if (a === "home") {
        checkpoint();
        session = null;
        mode = "list";
        host.returnTo("home");
        return;
      }
      if (a === "book-back") {
        if (mode === "study") {
          checkpoint();
          const returnTo = session?.returnTo;
          session = null;
          mode =
            returnTo === "form" && draft
              ? "form"
              : ["edition", "editions"].includes(returnTo)
                ? returnTo
                : "list";
          if (returnTo?.startsWith("view:")) {
            host.returnTo(returnTo.slice(5));
            return;
          }
        } else if (mode === "form") {
          mode = formReturn;
        } else if (mode === "edition") {
          mode = selectedBook ? "editions" : "list";
        } else if (mode === "editions") {
          selectedBook = null;
          mode = "list";
        }
        refresh();
        return;
      }
      if (a === "list") {
        checkpoint();
        session = null;
        mode = "list";
        refresh();
      }
      if (a === "create") {
        await host.beforeStudy();
        if (
          !el.dataset.edition &&
          catalog.books.flatMap((b) => b.editions).length > 1
        ) {
          session = null;
          mode = "list";
          refresh();
          return;
        }
        const id = el.dataset.edition || catalog.books[0].editions[0].id;
        newDraft(await loadEdition(id));
        refresh();
      }
      if (a === "edit") {
        const p = state().programs.find((p) => p.id === el.dataset.id);
        newDraft(await loadEdition(p.editionId), p);
        refresh();
      }
      if (a === "scope") {
        capture();
        draft.mode = el.dataset.mode;
        refresh();
      }
      if (a === "add-range") {
        capture();
        draft.ranges.push({ from: 1, to: 1 });
        refresh();
      }
      if (a === "remove-range") {
        capture();
        draft.ranges.splice(Number(el.dataset.index), 1);
        refresh();
      }
      if (a === "start") {
        const p = state().programs.find((p) => p.id === el.dataset.id);
        await begin(p);
      }
      if (a === "practice") {
        const p = state().programs.find((p) => p.id === el.dataset.id);
        await begin(p, true);
      }
      if (a === "practice-draft") {
        capture();
        const p = {
          ...createBookProgram(edition, {
            name: draft.name,
            newPerDay: 0,
            selection: {
              mode: draft.mode,
              chapters: draft.chapters,
              ranges: draft.ranges,
              ids: draft.ids,
            },
          }),
          id: "practice:" + edition.id,
        };
        await begin(p, true);
      }
      if (a === "skip-demo" && session?.demo) {
        host.state().settings.bookPracticeIntro = true;
        session.demo = false;
        session.face = "front";
        checkpoint();
        refresh();
      }
      if (a === "practice-pass" || a === "practice-retry")
        await practiceGrade(a === "practice-pass");
      if (a === "undo") {
        if (grading || !canUndo()) return;
        grading = true;
        try {
          const key = state().undo?.key;
          await commit(undoBookGrade(state()));
          session.completed = Math.max(0, session.completed - 1);
          prepareCard();
          const id = key?.split("/").slice(1).join("/");
          if (program().questionIds.includes(id)) {
            session.questionId = id;
            checkpoint();
          }
          refresh();
        } finally {
          grading = false;
        }
      }
      if (a === "pause" || a === "archive") {
        await commit({
          ...state(),
          programs: state().programs.map((p) =>
            p.id === el.dataset.id
              ? {
                  ...p,
                  paused: a === "pause" ? !p.paused : true,
                  archived: a === "archive" ? true : false,
                }
              : p,
          ),
        });
        const updated = state().programs.find((p) => p.id === el.dataset.id);
        host.toast(
          updated.archived
            ? "Programme archivé."
            : updated.paused
              ? "Programme mis en pause."
              : "Programme réactivé.",
        );
        mode = formReturn;
        refresh();
      }
      if (a === "refresh") {
        prepareCard();
        refresh();
      }
      if (a === "grade") {
        if (grading || session?.face !== "back" || !session.preview) return;
        grading = true;
        document
          .querySelectorAll(".qa-ratings button")
          .forEach((b) => (b.disabled = true));
        try {
          const gradingSession = session,
            next = applyGrade(
              state(),
              session.preview,
              Number(el.dataset.grade),
            );
          await commit(next);
          if (session !== gradingSession) return;
          session.completed++;
          prepareCard();
          refresh();
        } finally {
          grading = false;
          document
            .querySelectorAll(".qa-ratings button")
            .forEach((b) => (b.disabled = false));
        }
      }
      if (
        a === "delete" &&
        confirm(
          "Supprimer ce programme ? L’historique des cartes est conservé.",
        )
      ) {
        await commit({
          ...state(),
          programs: state().programs.filter((p) => p.id !== el.dataset.id),
        });
        forgetBook(host.state(), el.dataset.id);
        host.save();
        mode = "list";
        refresh();
      }
      if (a === "audio") {
        if (clip?.getAttribute("src") === el.dataset.src && !clip.paused) {
          stopAudio();
          el.innerHTML = el.dataset.audioLabel || PLAY_LABEL;
          return;
        }
        stopAudio();
        clip = new Audio(el.dataset.src);
        clip.preservesPitch = true;
        clip.playbackRate = host.state().settings.playbackRate || 1;
        const playingClip = clip;
        clip.ontimeupdate = () => {
          if (clip !== playingClip) return;
          const bar = el.parentElement?.querySelector(".qa-audio-progress i");
          if (bar)
            bar.style.width = `${(100 * playingClip.currentTime) / (playingClip.duration || 1)}%`;
        };
        el.disabled = true;
        try {
          await playingClip.play();
          if (clip !== playingClip) return;
          el.textContent = "Ⅱ Pause";
          playingClip.onended = () => {
            el.innerHTML = el.dataset.audioLabel || PLAY_LABEL;
          };
        } finally {
          el.disabled = false;
        }
      }
    } catch (e) {
      el.disabled = false;
      if (
        e.name !== "AbortError" &&
        !/interrupted by a call to pause/i.test(e.message)
      )
        host.toast(e.message);
    }
  }
  async function submit(e) {
    if (e.target.id !== "book-program-form") return;
    e.preventDefault();
    if(wizardStep<2){capture();wizardStep++;refresh();return;}
    if (saving) return;
    saving = true;
    const submitButton = e.target.querySelector("[type=submit]");
    submitButton.disabled = true;
    try {
      capture();
      if (
        draft.mode === "ranges" &&
        draft.ranges.some(
          (r) =>
            !Number.isInteger(r.from) ||
            !Number.isInteger(r.to) ||
            r.from < 1 ||
            r.to < r.from,
        )
      )
        throw Error("Vérifie les limites des questions.");
      const p = {
        ...createBookProgram(edition, {
          id: editing || undefined,
          name: draft.name,
          newPerDay: draft.newPerDay,
          selection: {
            mode: draft.mode,
            chapters: draft.chapters,
            ranges: draft.ranges,
            ids: draft.ids,
          },
        }),
        retention: draft.retention,
      };
      if (editing)
        await commit({
          ...state(),
          programs: state().programs.map((old) =>
            old.id === editing ? p : old,
          ),
        });
      else await commit({ ...state(), programs: [...state().programs, p] });
      session = { programId: p.id, completed: 0 };
      mode = "study";
      prepareCard();
      refresh();
    } catch (e) {
      host.toast(e.message);
    } finally {
      saving = false;
      submitButton.disabled = false;
    }
  }
  function updateScrollHints() {
    document
      .querySelectorAll(".qa-card-scroll")
      .forEach((el) =>
        el.classList.toggle(
          "has-more",
          el.scrollHeight - el.scrollTop - el.clientHeight > 6,
        ),
      );
  }
  function tick() {
    if (
      !host.active() ||
      mode !== "study" ||
      !session ||
      session.practice ||
      grading
    )
      return;
    if (!session.questionId) {
      const plan = bookPlan(state(), program(), edition);
      if (plan.next) {
        prepareCard();
        refresh();
        return;
      }
      const label = document.querySelector("#qa-waiting");
      if (label && session.waitingUntil)
        label.textContent = `Une carte revient dans ${intervalLabel(session.waitingUntil)}. Elle s’ouvrira automatiquement ici.`;
    } else if (
      session.face === "back" &&
      Date.now() -
        (session.preview ? Date.parse(session.preview.createdAt) : 0) >
        30000
    ) {
      const grades = document.querySelector(".qa-ratings");
      if (grades) grades.innerHTML = gradeButtons();
    }
  }
  function bind(root) {
    root.addEventListener("click", action);
    root.addEventListener("keydown", (e) => {
      if (
        (e.key === "Enter" || e.key === " ") &&
        e.target.matches('[data-book-action="open-book"]')
      ) {
        e.preventDefault();
        e.target.click();
      }
    });
    root.addEventListener("submit", submit);
    root.addEventListener("scroll", updateScrollHints, true);
    root.addEventListener("keydown", (e) => {
      if (
        (e.key === "Enter" || e.key === " ") &&
        e.target.matches(".qa-flip-card")
      ) {
        e.preventDefault();
        flip();
      }
    });
    root.addEventListener("pointerdown", (e) => {
      drag =
        e.target.closest(".qa-flip-card") &&
        !e.target.closest("button,a,input,summary,details")
          ? { x: e.clientX, y: e.clientY, moved: false }
          : null;
    });
    root.addEventListener("pointermove", (e) => {
      if (!drag) return;
      const dx = e.clientX - drag.x,
        dy = e.clientY - drag.y;
      if (Math.hypot(dx, dy) > 8) drag.moved = true;
      const answer = swipeAnswer(dx, dy);
      if (session?.practice && session.face === "back" && answer) {
        const card = root.querySelector(".qa-flip-card");
        if (card) {
          card.style.setProperty(
            "--swipe-x",
            Math.max(-110, Math.min(110, dx)) + "px",
          );
          card.dataset.swipe = answer;
        }
      }
    });
    root.addEventListener("pointerup", (e) => {
      const answer = drag?.moved
        ? swipeAnswer(e.clientX - drag.x, e.clientY - drag.y)
        : null;
      const card = root.querySelector(".qa-flip-card");
      if (card) {
        card.style.removeProperty("--swipe-x");
        delete card.dataset.swipe;
      }
      if (session?.practice && answer && session.face === "back") {
        e.preventDefault();
        practiceGrade(answer === "pass");
      }
      setTimeout(() => {
        drag = null;
      }, 0);
    });
    root.addEventListener("pointercancel", () => {
      drag = null;
      const card = root.querySelector(".qa-flip-card");
      card?.style.removeProperty("--swipe-x");
      if (card) delete card.dataset.swipe;
    });
    timer = setInterval(tick, 1000);
    window.addEventListener("focus", tick);
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) stopAudio();
      else tick();
    });
  }
  return {
    init,
    bind,
    render,
    searchResults: (query) => {
      const norm = (t) =>
        t.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
      return (
        catalog?.books
          .filter((b) => norm(b.title).includes(norm(query)))
          .map((b) =>
            B(E(b.title), "open-book", "section-row", `data-book="${E(b.id)}"`),
          )
          .join("") || ""
      );
    },
    dailyInfo: () => recommendation() || null,
    persist: async (study) =>
      saveBookStudy(validateBookStudy(study || emptyStudy())),
    isStudying: () => mode === "study",
    isNested: () => mode !== "list",
    hasPrograms: () => Boolean(state().programs.length),
    programCards: groupedCards,
    dailyItems,
    reminderItems: (at) =>
      state()
        .programs.map((p) => {
          const ed = editions.get(p.editionId);
          if (!ed) return null;
          const x = bookPlan(state(), p, ed, at);
          return {
            key: "book:" + p.id,
            kind: "book",
            name: p.name,
            topic: ed.title,
            review: x.due.length,
            fresh: x.fresh.length,
            paused: p.paused,
            archived: p.archived,
          };
        })
        .filter(Boolean),
    openProgram: async (id) => {
      const p = state().programs.find(
        (p) => p.id === id && !p.paused && !p.archived,
      );
      if (p) await begin(p);
      else {
        mode = "list";
        refresh();
      }
    },
    back: () => {
      if(mode==="form"&&wizardStep>0){capture();wizardStep--;refresh();return;}
      stopAudio();
      checkpoint();
      const returnTo = session?.returnTo;
      session = null;
      mode =
        mode === "study"
          ? returnTo === "edition"
            ? "edition"
            : returnTo === "form" && draft
              ? "form"
              : "list"
          : mode === "form"
            ? formReturn
            : mode === "edition" && selectedBook
              ? "editions"
              : "list";
      refresh();
    },
    setSpeed: (rate) => {
      if (clip) clip.playbackRate = rate;
    },
    afterRender: updateScrollHints,
    leave: () => {
      stopAudio();
      if (host.active() && mode === "study") checkpoint();
    },
  };
}
