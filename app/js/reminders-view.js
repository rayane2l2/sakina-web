import { reminderSettings, reminderMessage } from "./reminders-core.js";
export function remindersView({ settings, items, status }, escape) {
  if (!status.native) return "";
  const s = reminderSettings(settings),
    e = escape,
    example = items.find((i) => i.review > 0) || items[0],
    preview = example
      ? reminderMessage(example, { seed: 2, playful: s.playful }).body
      : "Ta séance t’attend sur Sakina.me.";
  return `<section class="card form-card reminder-card"><h2>Mon rendez-vous quotidien</h2><p class="small muted">Des rappels sur ce téléphone, même sans connexion.</p><form id="reminders-form"><label class="sound-choice"><input name="enabled" type="checkbox" ${s.enabled ? "checked" : ""}> Activer les notifications</label><div class="reminder-times">${[0, 1, 2].map((n) => `<label>${n === 0 ? "Horaire" : "Autre horaire · facultatif"}<input type="time" name="time${n}" value="${e(s.times[n] || "")}" ${n === 0 ? "required" : ""}></label>`).join("")}</div><fieldset class="reminder-days"><legend>Quels jours ?</legend>${[
    [1, "Lun"],
    [2, "Mar"],
    [3, "Mer"],
    [4, "Jeu"],
    [5, "Ven"],
    [6, "Sam"],
    [0, "Dim"],
  ]
    .map(
      ([n, t]) =>
        `<label><input type="checkbox" name="days" value="${n}" ${s.days.includes(n) ? "checked" : ""}><span>${t}</span></label>`,
    )
    .join(
      "",
    )}</fieldset><details><summary>Programmes et messages</summary><p class="small muted">Aucune sélection : tous les programmes actifs.</p><div class="reminder-programmes">${items.map((i) => `<label class="sound-choice"><input type="checkbox" name="programmes" value="${e(i.key)}" ${s.programmes.includes(i.key) ? "checked" : ""}> ${e(i.name)}</label>`).join("") || '<p class="small muted">Crée un programme pour personnaliser tes rappels.</p>'}</div><label class="sound-choice"><input name="playful" type="checkbox" ${s.playful ? "checked" : ""}> Une touche d’humour après quelques jours d’absence</label></details><div class="reminder-preview"><span class="small muted">Exemple de message</span><p>${e(preview)}</p></div><button class="btn primary block" type="submit">Enregistrer mes rappels</button></form><p class="small muted" role="status">${status.error ? e(status.error) : status.permission === "denied" ? "Notifications bloquées : autorise Sakina.me dans les réglages Android." : s.enabled && status.scheduled ? `${status.scheduled} rappels programmés sur les 30 prochains jours. Renouvelés à chaque utilisation.` : "Les notifications te seront proposées à l’activation."}</p><p class="small muted">L’heure peut être légèrement décalée par Android pour économiser la batterie.</p><button class="btn secondary block" data-action="reminder-test" ${!s.enabled || status.permission !== "granted" ? "disabled" : ""}>Tester une notification · dans 5 s</button></section>`;
}
