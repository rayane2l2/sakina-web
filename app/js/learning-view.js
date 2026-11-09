import { canRecite, canCompleteLesson } from "./lesson-core.js";
import { listeningProgress } from "./listen-flow.js";
import { speedDialog, speedTrigger } from "./speed-control.js";

// Learning deliberately has its own small surface; review keeps its optional tools.
export function learningView(m, { button: b, icon, esc: e }) {
  const queue = listeningProgress(m.listened, m.listenGoal);
  const listening = m.phase === "listen",
    busy = ["loading", "listening", "finishing", "file"].includes(
      m.voice.status,
    );
  const ready = canRecite({
    listened: m.listened,
    goal: m.listenGoal,
    needsAudio: m.needsAudio,
  });
  const mastered = canCompleteLesson({
    listened: m.listened,
    goal: m.listenGoal,
    needsAudio: m.needsAudio,
    busy: busy || Boolean(m.playing),
  });
  const hint = listening
    ? m.hasAudio
      ? "Écoute en suivant le texte."
      : "Lis tranquillement le passage."
    : m.practiceKind === "group"
      ? "Récite les passages ensemble."
      : m.practiceKind === "link"
        ? "Reprends depuis le début."
        : "À toi : récite sans regarder.";
  return `<header class="learning-head">${b("‹", "close-reader", "learning-close", 'aria-label="Retour au menu précédent"')}<div><span>${m.corpus === "quran" ? "Sabaq" : "Nouveau"}</span><h1>${e(m.title)}</h1></div><span class="learning-position">${m.stepIndex + 1} / ${m.stepCount}</span></header>
 <div class="progress learning-progress" role="progressbar" aria-label="Progression de la séance" aria-valuemin="0" aria-valuemax="${m.stepCount}" aria-valuenow="${m.stepIndex + (listening ? 0.5 : 1)}"><i style="width:${(100 * (m.stepIndex + (listening ? 0.5 : 1))) / m.stepCount}%"></i></div>
 <div class="learning-heading"><h2>${e(m.stepTitle)}</h2><p>${listening ? hint : "Récite de mémoire, à ton rythme."}</p></div>
 <main class="reader-stage learning-card ${m.mushaf ? "learning-mushaf" : ""}" id="reader-stage" ${m.mushaf ? 'tabindex="0" aria-label="Page du Coran"' : ""}>${m.mushaf ? '<div id="printed-mushaf"></div>' : `<div class="matn-page learning-page ${listening ? "lyric-mode" : ""}" dir="rtl" lang="ar">${m.textHTML}</div>`}${m.mushaf && m.sheets > 1 ? `<span class="mushaf-page-position">${m.sheet + 1} / ${m.sheets}</span>` : ""}</main>
 ${!m.mushaf && !listening && m.sheets > 1 ? `<div class="learning-sheets">${b("‹", "sheet-previous", "text", `aria-label="Feuillet précédent" ${m.sheet === 0 ? "disabled" : ""}`)}<span>${m.sheet + 1} / ${m.sheets}</span>${b("›", "sheet-next", "text", `aria-label="Feuillet suivant" ${m.sheet >= m.sheets - 1 ? "disabled" : ""}`)}</div>` : ""}
 <footer class="learning-controls ${listening ? "listening-controls" : "reciting-controls"}">${
   listening
     ? `<div class="listen-bar ${m.hasAudio ? "" : "without-audio"}">
 ${m.hasAudio ? `${speedTrigger(m, b)}${b(m.audioRunning ? '<span class="stop-square"></span>' : icon("play"), m.audioRunning ? "stop-audio" : "lesson-listen", "learning-play", `aria-label="${m.audioRunning ? "Arrêter l’écoute" : "Écouter le passage"}"`)}${b(`<span class="listen-queue-label"><span id="listen-remaining" aria-live="polite" aria-label="${queue.remaining} écoutes restantes">${queue.remaining}</span> restantes</span><span class="listen-add" aria-hidden="true">+1</span>`, "add-listen", "listen-queue add-listen", `aria-label="Ajouter une écoute · ${queue.remaining} écoutes restantes"`)}` : '<span class="silent-study">Lecture</span>'}
 ${b("Réciter", "recite", "learning-next", 'aria-label="Passer à la récitation"')}
 </div>`
     : `<div class="learning-actions">${b(m.hidden ? "Voir le texte" : "Cacher le texte", m.hidden ? "show-text" : "hide-text", "learning-secondary")}${m.hasAudio ? b("Réécouter", "restart-step", "learning-secondary") : ""}</div>${b("Je maîtrise", "mastery-confirm", "learning-success", mastered ? "" : "disabled")}`
 }
 </footer>${speedDialog(m, b)}`;
}
