const DAY = 86400000;
const time = (date) => Date.parse(date + 'T00:00:00Z');
const iso = (timestamp) => new Date(timestamp).toISOString().slice(0, 10);
const daysBetween = (first, last) => (time(last) - time(first)) / DAY;

export function calendarDay(date = new Date()) {
  const d = new Date(date);
  return [d.getFullYear(), d.getMonth() + 1, d.getDate()]
    .map((part, i) => String(part).padStart(i ? 2 : 4, '0')).join('-');
}

function validDay(date) {
  return typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date) &&
    Number.isFinite(time(date)) && iso(time(date)) === date;
}

export function createDeadline(date, start, count) {
  if (!validDay(date) || !validDay(start) || date <= start)
    throw Error('Choisis une date après aujourd’hui.');
  const days = daysBetween(start, date);
  const reviewDays = days >= 3 ? Math.min(7, Math.max(1, Math.floor(days * .15))) : 0;
  return { date, start, count, reviewDays };
}

export function validDeadline(goal) {
  return Boolean(goal && validDay(goal.date) && validDay(goal.start) &&
    goal.date > goal.start && Number.isSafeInteger(goal.count) && goal.count >= 0 &&
    Number.isInteger(goal.reviewDays) && goal.reviewDays >= 0 &&
    goal.reviewDays <= 7 && goal.reviewDays < daysBetween(goal.start, goal.date));
}

export function reviewStart(goal) {
  return iso(time(goal.date) - goal.reviewDays * DAY);
}

// The same calculation serves cards and complete text units. Missed work is
// shared across the remaining days, including the review period if necessary.
export function deadlineQuota(goal, today, remaining, completedToday = 0, cap = 100) {
  if (!validDeadline(goal) || today < goal.start || today >= goal.date) return null;
  const cutoff = reviewStart(goal);
  const learningDays = daysBetween(goal.start, cutoff);
  const elapsed = daysBetween(goal.start, today);
  const atStart = remaining + completedToday;
  const plannedBefore = Math.ceil(goal.count * elapsed / learningDays);
  const plannedToday = Math.ceil(goal.count * (elapsed + 1) / learningDays) - plannedBefore;
  const behind = atStart - (goal.count - plannedBefore);
  const daysLeft = daysBetween(today, today < cutoff ? cutoff : goal.date);
  const quota = today >= cutoff || behind > 0
    ? Math.ceil(atStart / daysLeft)
    : Math.max(0, plannedToday + behind);
  return Math.min(remaining, Math.max(0, Math.min(cap, quota) - completedToday));
}

export function formatDeadline(date) {
  return validDay(date)
    ? new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(time(date))
    : '';
}

export function deadlineSummary(goal, remaining, unit, cap) {
  const days = daysBetween(goal.start, reviewStart(goal));
  const peak = Math.ceil(goal.count / days);
  if (!remaining) return 'Tout le contenu est déjà commencé. Place aux révisions.';
  if (peak > cap) return 'Cette date laisse trop peu de jours pour le contenu sélectionné.';
  const pace = peak === 1 ? `Jusqu’à 1 ${unit} par jour` : `Jusqu’à ${peak} ${unit.endsWith('s') ? unit : unit + 's'} par jour`;
  return pace + (goal.reviewDays ? ` · ${goal.reviewDays} jour${goal.reviewDays > 1 ? 's' : ''} pour réviser avant la date.` : '.');
}

export function requireDeadlineCapacity(goal, limit) {
  if (goal.count > daysBetween(goal.start, reviewStart(goal)) * limit)
    throw Error('Cette date laisse trop peu de jours. Choisis une date plus éloignée ou réduis la sélection.');
}

export function memoDeadlineWork(memo, today) {
  const pending = memo.queue.filter((id) => !memo.items[id]);
  const learnedToday = memo.queue.filter((id) => memo.items[id]?.first === today).length;
  return { pending, learnedToday };
}
