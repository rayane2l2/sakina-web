import { REMINDER_OWNER, reminderAgenda } from "./reminders-core.js";
// Bridge is injected only inside Capacitor. No web push or permission prompt on boot.
export async function nativeReminders() {
  if (!globalThis.Capacitor?.isNativePlatform?.()) return null;
  const { registerPlugin } = await import("../vendor/capacitor-core.mjs");
  return registerPlugin("LocalNotifications");
}
export function createReminderService({
  plugin,
  snapshot,
  onOpen = () => {},
  now = () => new Date(),
}) {
  let chain = Promise.resolve(),
    lastSignature = null;
  const status = {
    native: Boolean(plugin),
    permission: "unknown",
    scheduled: 0,
    until: null,
    error: null,
  };
  const owned = (n) => n.extra?.owner === REMINDER_OWNER;
  const deliveredOwned = (n) =>
    owned(n) || (n.id >= 610000 && n.id < 610090) || n.id === 610999;
  async function sync() {
    if (!plugin) return status;
    try {
      const state = snapshot(),
        permission = await plugin.checkPermissions();
      status.permission = permission.display;
      if (permission.display !== "granted") {
        lastSignature = null;
        status.scheduled = 0;
        return status;
      }
      const events = reminderAgenda({ ...state, now: now() }),
        signature = JSON.stringify(events);
      if (signature === lastSignature) return status;
      const pending = (await plugin.getPending()).notifications.filter(owned),
        ids = new Set(events.map((e) => e.id));
      // Replace matching IDs first; a failed scheduling call keeps the previous set.
      if (events.length) {
        await plugin.createChannel({
          id: "sakina-daily",
          name: "Rendez-vous quotidien",
          description: "Révisions et apprentissage Sakina.me",
          importance: 3,
          visibility: 0,
          vibration: true,
        });
        await plugin.schedule({ notifications: events });
      }
      const obsolete = pending.filter((n) => !ids.has(n.id));
      if (obsolete.length)
        await plugin.cancel({
          notifications: obsolete.map(({ id }) => ({ id })),
        });
      const delivered = (
        await plugin.getDeliveredNotifications()
      ).notifications.filter(deliveredOwned);
      if (delivered.length)
        await plugin.removeDeliveredNotifications({
          notifications: delivered.map(({ id }) => ({ id })),
        });
      status.scheduled = events.length;
      status.until = events.at(-1)?.schedule.at || null;
      status.error = null;
      lastSignature = signature;
    } catch (e) {
      status.error = e.message || "Les rappels n’ont pas pu être programmés.";
      lastSignature = null;
      throw e;
    }
    return status;
  }
  const queue = () => {
    const next = chain.catch(() => {}).then(sync);
    chain = next;
    return next;
  };
  return {
    status,
    sync: queue,
    async permission() {
      if (!plugin) return false;
      const p = await plugin.requestPermissions();
      status.permission = p.display;
      return p.display === "granted";
    },
    async init() {
      if (!plugin) return;
      await plugin.addListener("localNotificationActionPerformed", (e) => {
        if (owned(e.notification)) onOpen(e.notification.extra.key);
      });
      return queue();
    },
    async test() {
      if (!plugin)
        throw Error(
          "Les notifications locales sont disponibles dans l’application Android.",
        );
      if ((await plugin.checkPermissions()).display !== "granted")
        throw Error("Active d’abord les notifications.");
      await plugin.createChannel({
        id: "sakina-daily",
        name: "Rendez-vous quotidien",
        importance: 3,
        visibility: 0,
        vibration: true,
      });
      await plugin.schedule({
        notifications: [
          {
            id: 610999,
            title: "Sakina.me",
            body: "Ton rappel fonctionne. À bientôt pour ta séance !",
            smallIcon: "ic_stat_sakina",
            channelId: "sakina-daily",
            isExactNotification: false,
            schedule: { at: new Date(now().getTime() + 5000) },
            extra: { owner: REMINDER_OWNER },
          },
        ],
      });
    },
  };
}
