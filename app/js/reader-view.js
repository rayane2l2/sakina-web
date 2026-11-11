import {readingTabs,phoneticPendingHTML,phoneticKeyHTML} from './phonetic-view.js';
import { tajweedLegend } from './tajweed.js';
import { modelPicker } from "./model-choice.js";
import {
  canRecite,
  canCompleteLesson,
  lessonInstruction,
} from "./lesson-core.js";
import { learningView } from "./learning-view.js";
import { speedDialog, speedTrigger } from "./speed-control.js";
export function readingView(m, { button: b, icon, esc: e }) {
  if (m.session && m.practiceKind !== "review")
    return learningView(m, { button: b, icon, esc: e });
  const voiceBusy = ["loading", "listening", "finishing", "file"].includes(
    m.voice.status,
  );
  const ready = canRecite({
    listened: m.listened,
    goal: m.listenGoal,
    needsAudio: m.needsAudio,
  });
  const disabled = !canCompleteLesson({
    listened: m.listened,
    goal: m.listenGoal,
    needsAudio: m.needsAudio,
    busy: voiceBusy || Boolean(m.playing),
  });
  return `<header class="reader-head">${b("‹", "close-reader", "icon-btn", 'aria-label="Retour au menu précédent"')}<div><span class="eyebrow">${m.session ? "SÉANCE GUIDÉE" : "LECTURE LIBRE"}</span><h1>${e(m.title)}</h1><span class="small muted">${e(m.subtitle)}</span></div>${b("⋯", "reader-menu", "icon-btn", 'aria-label="Options de lecture"')}</header>
 ${m.session ? `<div class="lesson-strip"><div class="spread"><b>${e(m.stepTitle)}</b><span>${m.stepIndex + 1}/${m.stepCount}</span></div><div class="progress"><i style="width:${(100 * (m.stepIndex + 1)) / m.stepCount}%"></i></div><p>${e(lessonInstruction(m.practiceKind, m.phase, m.needsAudio, m.recognitionAllowed))}</p></div>` : ""}
 <div class="reader-toolbar">${m.corpus==='quran'?readingTabs(m.readingMode||'mushaf',b):readingTabs(m.matnPhonetic?'phonetic':'text',b,m.corpus)}${m.corpus!=='quran'?b(m.hidden?'Afficher':'Cacher',m.hidden?'show-text':'hide-text','compact'):''}${b(m.bookmarked ? "★" : "☆", "bookmark", "icon-btn", 'aria-label="Marquer ce passage"')}</div>

 <main class="reader-stage ${m.matnPhonetic?'phonetic-reading':''} ${m.verseMode ? "verse-reading-stage" : ""}" id="reader-stage" ${m.corpus === "quran" ? 'tabindex="0" aria-label="Page du Coran"' : ""}>${m.corpus === "quran" ? (m.verseMode ? m.verseHTML : '<div id="printed-mushaf"></div>') : m.matnPhonetic&&!m.phoneticAvailable ? phoneticPendingHTML() : m.matnLyrics ? m.lyricsHTML : `<div class="matn-page" dir="${m.matnPhonetic ? 'ltr' : 'rtl'}" lang="${m.matnPhonetic ? 'fr' : 'ar'}">${m.textHTML}</div>`}</main>
 ${m.corpus !== "quran" && !m.matnLyrics && m.sheets > 1 ? `<div class="sheet-nav">${b("‹", "sheet-previous", "icon-btn", `aria-label="Feuillet précédent" ${m.sheet === 0 ? "disabled" : ""}`)}<span>${m.sheet + 1} / ${m.sheets} ${m.corpus === "quran" ? "pages" : "feuillets"}</span>${b("›", "sheet-next", "icon-btn", `aria-label="Feuillet suivant" ${m.sheet >= m.sheets - 1 ? "disabled" : ""}`)}</div>` : ""}
 <div class="reader-status" role="status"><span id="listen-status">${m.audioLoading?"Chargement de l’audio…":m.playing ? `Écoute ${m.repeatNow}` : m.session ? (m.phase === "listen" ? `${m.listened} / ${m.listenGoal} écoutes` : "Récitation libre · à ton rythme") : m.verseMode ? "" : "Touche le texte pour écouter."}</span>${m.recognitionAllowed ? `<span id="engine-status">${m.session && m.voice.status === "idle" ? "Micro facultatif" : e(m.voiceLabel)}</span>` : "<span>Écoute · rappel de mémoire</span>"}<span id="voice-feedback">${m.voice.error ? e(m.voice.error) : m.voice.final ? "Repères automatiques à vérifier." : ""}</span></div>
 <footer class="reader-dock"><div class="dock-tools">${speedTrigger(m, b)}${b(m.playing||m.audioLoading ? '<span class="stop-square"></span>' : icon("play"), m.playing||m.audioLoading ? "stop-audio" : "listen", "round-tool", `aria-label="${m.playing ? "Arrêter l’écoute" : "Écouter le passage"}" ${m.hasAudio === false ? "disabled" : ""}`)}${m.recognitionAllowed ? `<button class="mic ${m.voice.status === "listening" ? "recording" : ""}" data-action="microphone" ${voiceBusy && m.voice.status !== "listening" ? "disabled" : ""} aria-label="${m.voice.status === "listening" ? "Arrêter la récitation" : "Vérifier avec le micro (facultatif)"}">${m.voice.status === "listening" ? '<span class="stop-square"></span>' : icon("mic")}</button><div class="level"><i id="mic-level"></i></div>` : `<span class="manual-cue">${m.playing ? "Écoute" : m.session ? "Récitation libre" : "Lecture"}</span>`}${m.corpus === "quran" && !m.verseMode ? b(m.hidden ? "Afficher" : "Cacher", m.hidden ? "show-text" : "hide-text", "reader-visibility", `aria-label="${m.hidden ? "Afficher" : "Cacher"} le texte du Mushaf"`) : ""}${m.session ? b("↻", "restart-step", "round-tool", 'aria-label="Réécouter une fois"') : ""}</div>

 ${m.session ? (m.phase === "listen" ? b(m.needsAudio ? `Passer à la récitation · ${m.listened}/${m.listenGoal}` : "Passer à la récitation", "recite", "primary block", ready ? "" : "disabled") : b(m.stepIndex === m.stepCount - 1 ? "Je maîtrise, terminer" : "Je maîtrise, continuer", "mastery-confirm", "primary block", disabled ? "disabled" : "")) : m.corpus === "quran" ? `<p class="quran-page-position">${e(m.position)}${m.swipeHint && !m.verseMode ? "<span>Glisse à droite pour avancer, à gauche pour revenir.</span>" : ""}</p>` : m.matnLyrics ? "" : `<div class="reader-navigation">${b("‹ Précédent", "previous", "secondary", m.first ? "disabled" : "")}<span>${e(m.position)}</span>${b("Suivant ›", "next", "secondary", m.last ? "disabled" : "")}</div>`}
 ${m.corpus === "quran" && !m.verseMode && m.hidden ? b("Dévoiler le verset suivant", "reveal-next", "text block") : ""}</footer>
 <dialog id="reader-menu" class="reader-menu"><div class="spread"><h2>Options de lecture</h2>${b("×", "close-menu", "icon-btn", 'aria-label="Fermer les options"')}</div>${m.recognitionAllowed ? `${modelPicker(m.recognitionModel)}<p class="small muted safety">Les repères automatiques peuvent se tromper et ne remplacent pas un enseignant qualifié.</p><div class="legend"><span>✓ Repéré · trait plein</span><span>× À vérifier · zigzag</span></div><p id="voice-hint" class="small muted">${e(m.voiceHint)}</p><details class="sound-detail"><summary>Voir les sons reconnus</summary><p id="phoneme-output" dir="rtl">${e(m.voice.text)}</p></details>` : m.session ? "<p>Écouter → réciter de mémoire → relier les passages. La reconnaissance vocale n’intervient pas dans l’apprentissage.</p>" : "<p>Écoute et révise librement, sans reconnaissance vocale pour les matns.</p>"}${m.session ? `<p>${m.practiceKind === "review" ? "Essaie de réciter de mémoire avant de consulter le texte. Le contrôle vocal, lorsqu’il est disponible, reste facultatif." : "Écoute au moins cinq fois si la portion dispose d’un audio, puis récite librement autant que tu veux, ici ou hors de l’application."} Consulter le texte et réécouter ne remet rien à zéro. Tu décides quand tu maîtrises et souhaites continuer.</p>` : ""}${!m.session && m.corpus !== "quran" ? b(m.unitLabel==="vers"?"Écouter ce vers":"Écouter ce passage","listen-current","secondary block")+b("Écouter le texte entier", "listen-entire", "secondary block", `data-corpus="${e(m.corpus)}"`) : ""}${m.corpus === "quran" && m.verseMode || m.matnPhonetic ? b("Guide de lecture", "reader-guide", "secondary block") : ""}${m.corpus === "quran" && m.verseMode ? `<label class="quran-size-setting">Taille du texte<input id="quran-text-size" type="range" min="28" max="56" step="4" value="${m.quranTextSize || 40}" aria-label="Taille du texte arabe"></label>` : ""}${b("Télécharger les audios", "download-audio", "secondary block", m.hasAudio === false ? "disabled" : "")}${m.corpus === "quran" ? b("Télécharger les mots de ce passage", "download-words", "secondary block") : ""}${m.recognitionAllowed ? '<label class="btn secondary block file-label">Tester un fichier audio<input type="file" id="audio-file" accept="audio/*" hidden></label>' : ""}</dialog>${m.corpus === "quran" && m.verseMode || m.matnPhonetic ? readerGuide(m, b, e) : ""}${speedDialog(m, b)}`;
}

function readerGuide(m, button, escape) {
  return `<dialog id="reader-guide" class="reader-menu reading-guide" aria-labelledby="reading-guide-title"><div class="spread"><h2 id="reading-guide-title">Guide de lecture</h2>${button('×', 'close-reader-guide', 'icon-btn', 'aria-label="Fermer le guide"')}</div><div class="reading-guide-content">${m.corpus === 'quran' ? '<p>Touche un mot pour écouter sa prononciation.</p>' : ''}<section><h3>Phonétique</h3>${phoneticKeyHTML()}</section>${m.corpus === 'quran' ? `<section><h3>Couleurs du tajwid</h3>${tajweedLegend(escape)}</section>` : ''}</div></dialog>`;
}
