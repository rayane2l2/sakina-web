// Local scheduling only. Future workloads are snapshots, refreshed after every change.
export const REMINDER_OWNER = "sakina-daily-v1";
export const REMINDER_DAYS = 30;
export const DEFAULT_REMINDERS = Object.freeze({
  enabled: false,
  times: ["09:00"],
  days: [1, 2, 3, 4, 5, 6, 0],
  programmes: [],
  playful: true,
});
export function reminderSettings(value = {}) {
  const times = [
    ...new Set(
      (Array.isArray(value.times)
        ? value.times
        : DEFAULT_REMINDERS.times
      ).filter(
        (t) => typeof t === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(t),
      ),
    ),
  ]
    .sort()
    .slice(0, 3);
  const days = [
    ...new Set(
      (Array.isArray(value.days) ? value.days : DEFAULT_REMINDERS.days).filter(
        (n) => Number.isInteger(n) && n >= 0 && n <= 6,
      ),
    ),
  ];
  return {
    enabled: value.enabled === true,
    times,
    days,
    programmes: [
      ...new Set(
        (Array.isArray(value.programmes) ? value.programmes : [])
          .filter((x) => typeof x === "string")
          .slice(0, 200),
      ),
    ],
    playful: value.playful !== false,
  };
}
export function validateReminders(value) {
  const s = reminderSettings(value);
  if (!s.times.length) throw Error("Choisis au moins un horaire.");
  if (!s.days.length) throw Error("Choisis au moins un jour.");
  return s;
}
export const localDay = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
function daysApart(a, b) {
  return Math.max(
    0,
    Math.round(
      (Date.UTC(a.getFullYear(), a.getMonth(), a.getDate()) -
        Date.UTC(b.getFullYear(), b.getMonth(), b.getDate())) /
        86400000,
    ),
  );
}
export const REMINDER_PHRASES = Object.freeze({
  review: [
    "{topic} t’attend pour une révision.",
    "Un petit retour sur {topic} ?",
    "C’est le moment de retrouver {topic}.",
    "Quelques minutes pour réviser {topic} ?",
    "Aujourd’hui, on consolide {topic}.",
    "Ton rendez-vous avec {topic} est prêt.",
    "On reprend {topic}, tranquillement ?",
    "Une révision de {topic}, et tu continues ta journée.",
    "Garde le fil avec {topic}.",
    "Retrouve les passages de {topic} à réviser.",
    "Un peu de révision avec {topic} ?",
    "Ta séance sur {topic} est prête.",
  ],
  fresh: [
    "Une nouvelle portion de {topic} t’attend.",
    "On avance un peu dans {topic} ?",
    "Prêt pour la suite de {topic} ?",
    "Ton prochain passage de {topic} est prêt.",
    "Quelques minutes pour apprendre {topic} ?",
    "Retrouve ton programme : {topic}.",
    "Un petit pas de plus dans {topic}.",
    "Aujourd’hui, on poursuit {topic}.",
    "Écouter, réciter : retrouve {topic}.",
    "La suite de {topic}, quand tu es prêt.",
    "Un moment pour {topic} ?",
    "Ta séance d’apprentissage de {topic} t’attend.",
  ],
  comeback: [
    "On reprend {topic} là où tu en étais ?",
    "Quelques jours ont passé. Retrouve {topic}, simplement.",
    "Ton programme {topic} est toujours là.",
    "Un petit retour sur {topic}, sans tout recommencer.",
    "Reviens retrouver {topic}, à ton rythme.",
    "Envie de renouer avec {topic} aujourd’hui ?",
    "On retrouve le fil de {topic} ?",
    "Une petite séance de {topic} pour reprendre.",
  ],
  playful: [
    "{topic} ne va pas s’apprendre tout seul… on reprend ?",
    "Pause terminée ? {topic} a gardé ta place.",
    "{topic} est toujours au même endroit. Toi aussi, tu peux revenir !",
    "Petit coucou de {topic}. On se retrouve ?",
    "Le bouton « Continuer » de {topic} attend son grand retour.",
    "Un café, un peu de {topic}… et on reprend le fil.",
  ],
});
const hash = (s) => {
  let n = 0;
  for (const c of String(s)) n = (Math.imul(n, 31) + c.charCodeAt(0)) | 0;
  return n >>> 0;
};
export function reminderMessage(
  item,
  { seed = 0, absence = 0, playful = true, counts = true } = {},
) {
  const category =
    absence >= 3
      ? playful && seed % 2 === 0
        ? "playful"
        : "comeback"
      : item.review > 0
        ? "review"
        : "fresh";
  const choices = REMINDER_PHRASES[category],
    topic = String(item.topic || item.name || "ton programme")
      .replace(/[\r\n]+/g, " ")
      .slice(0, 100);
  let body = choices[(seed >>> 0) % choices.length].replaceAll(
    "{topic}",
    topic,
  );
  // Only today's exact outstanding count is displayed; tomorrow's actions are unknown.
  if (counts && item.kind === "book" && item.review > 0)
    body += ` ${item.review} ${item.review === 1 ? "carte à réviser" : "cartes à réviser"}.`;
  return { title: "Sakina.me", body, category };
}
export function reminderAgenda({
  settings,
  itemsAt,
  now = new Date(),
  lastSeen = now,
  horizon = REMINDER_DAYS,
}) {
  const s = reminderSettings(settings);
  if (!s.enabled || !s.times.length || !s.days.length) return [];
  const events = [];
  const baseline = new Date(lastSeen);
  for (let d = 0; d < Math.min(30, Math.max(0, horizon)); d++) {
    const date = new Date(now);
    date.setHours(12, 0, 0, 0);
    date.setDate(date.getDate() + d);
    if (!s.days.includes(date.getDay())) continue;
    for (let slot = 0; slot < s.times.length; slot++) {
      const [hour, minute] = s.times[slot].split(":").map(Number),
        at = new Date(date);
      at.setHours(hour, minute, 0, 0);
      if (at <= now) continue;
      const items = itemsAt(at).filter(
        (i) =>
          !i.paused &&
          !i.archived &&
          (!s.programmes.length || s.programmes.includes(i.key)) &&
          (i.review > 0 || i.fresh > 0),
      );
      const due = items.filter((i) => i.review > 0),
        pool = due.length ? due : items;
      if (!pool.length) continue;
      const item = pool[(d + slot) % pool.length],
        seed = hash(`${localDay(at)}/${slot}/${item.key}`),
        absence = Number.isFinite(baseline.getTime())
          ? daysApart(at, baseline)
          : 0;
      const message = reminderMessage(item, {
        seed,
        absence,
        playful: s.playful,
        counts: d === 0,
      });
      events.push({
        id: 610000 + d * 3 + slot,
        title: message.title,
        body: message.body,
        schedule: { at, allowWhileIdle: true },
        isExactNotification: false,
        channelId: "sakina-daily",
        smallIcon: "ic_stat_sakina",
        extra: { owner: REMINDER_OWNER, key: item.key, date: localDay(at) },
      });
    }
  }
  return events;
}
