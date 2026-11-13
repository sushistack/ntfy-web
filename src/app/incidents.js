// Groups raw ntfy notifications into "incidents" for the board and history views.
//
// ntfy has no notion of an alert lifecycle, so we infer one from what senders actually do:
// - ops-alerter re-publishes every 15 min while a condition holds and goes silent when it clears.
// - Uptime Kuma sends "<name> DOWN" then "<name> UP".
// - Everything else is one-off.
// shortcut: grouping is by topic + normalized title; senders that put changing text in the title
//   beyond numbers won't group. Upgrade to an explicit `key:` tag from senders if that bites.

export const SLOT_SECONDS = 15 * 60; // one ops-alerter poll
export const SLOTS_PER_DAY = 96;
export const QUIET_AFTER_SECONDS = 35 * 60; // two missed polls (15 min cadence) + slack
export const RUN_GAP_SECONDS = 60 * 60; // a longer silence starts a new run ("since" resets)

const RECOVERY_RE = /\s+up\s*$/i;
const FAILURE_RE = /\s+down\s*$/i;

export const titleOf = (n) => (n.title || (n.message || "").split("\n")[0] || "").trim().slice(0, 120);

export const isRecovery = (n) => RECOVERY_RE.test(titleOf(n));

/** Stable per-topic grouping key: drop Kuma's UP/DOWN suffix and any numbers (82% → #%). */
export const normalizeTitle = (title) =>
  title
    .replace(RECOVERY_RE, "")
    .replace(FAILURE_RE, "")
    .toLowerCase()
    .replace(/\d+([.,]\d+)?/g, "#")
    .replace(/\s+/g, " ")
    .trim();

export const incidentKey = (n) => `${n.subscriptionId}|${normalizeTitle(titleOf(n))}`;

/** Short URL-safe id for a key (FNV-1a 32-bit, base36). */
export const incidentId = (key) => {
  let h = 0x811c9dc5;
  // eslint-disable-next-line no-bitwise -- a hash is bitwise by nature
  for (let i = 0; i < key.length; i += 1) h = Math.imul(h ^ key.charCodeAt(i), 0x01000193);
  // eslint-disable-next-line no-bitwise -- unsigned 32-bit
  return (h >>> 0).toString(36);
};

/** Earliest firing of the latest run: walk back while gaps stay under RUN_GAP_SECONDS. */
const runStart = (firings) => {
  let i = firings.length - 1;
  while (i > 0 && firings[i] - firings[i - 1] <= RUN_GAP_SECONDS) i -= 1;
  return firings[i];
};

/**
 * @param notifications ntfy notifications ({id, subscriptionId, time (s), title, message, priority, new})
 * @param now unix seconds
 * @returns incidents sorted newest-first:
 *   {key, id (short, for URLs), subscriptionId, title, state: 'open'|'quiet'|'resolved'|'info', firings: number[] (asc),
 *    first, since (start of the current unbroken run), runCount, last, resolvedAt, priority, unread, latest, notifications (desc)}
 */
export const groupIncidents = (notifications, now) => {
  const groups = new Map();
  for (const n of notifications) {
    const key = incidentKey(n);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(n);
  }

  const incidents = [];
  for (const [key, list] of groups) {
    // ntfy times are whole seconds; on a tie treat a recovery as the later message (UP follows DOWN).
    list.sort((a, b) => b.time - a.time || isRecovery(b) - isRecovery(a));
    const latest = list[0];
    const failures = list.filter((n) => !isRecovery(n));
    const firings = failures.map((n) => n.time).sort((a, b) => a - b);
    const priority = Math.max(...list.map((n) => n.priority ?? 3));
    const hasPair = list.some(isRecovery) || list.some((n) => FAILURE_RE.test(titleOf(n)));

    let state;
    if (isRecovery(latest)) state = "resolved";
    else if (priority <= 3 && !hasPair) state = "info";
    else if (now - latest.time <= QUIET_AFTER_SECONDS) state = "open";
    else state = "quiet";

    const display = failures[0] ?? latest; // show the failure title ("X DOWN"), not "X UP"
    incidents.push({
      key,
      id: incidentId(key),
      subscriptionId: latest.subscriptionId,
      title: titleOf(display),
      state,
      firings,
      first: firings[0] ?? latest.time,
      since: runStart(firings) ?? latest.time,
      runCount: firings.filter((f) => f >= (runStart(firings) ?? latest.time)).length,
      last: firings[firings.length - 1] ?? latest.time,
      resolvedAt: state === "resolved" ? latest.time : null,
      priority,
      unread: list.filter((n) => n.new === 1).length,
      latest: display,
      notifications: list,
    });
  }
  return incidents.sort((a, b) => b.notifications[0].time - a.notifications[0].time);
};

/** Local-midnight unix seconds for the day containing `t`, shifted by `dayOffset` days. */
export const dayStart = (t, dayOffset = 0) => {
  const d = new Date(t * 1000);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + dayOffset);
  return Math.floor(d.getTime() / 1000);
};

/** Slot indices (0..95) within the day starting at `start` that contain a firing. */
export const slotsForDay = (times, start) => {
  const end = start + SLOTS_PER_DAY * SLOT_SECONDS;
  const set = new Set();
  for (const t of times) if (t >= start && t < end) set.add(Math.floor((t - start) / SLOT_SECONDS));
  return set;
};

export const slotOf = (t, start) => Math.floor((t - start) / SLOT_SECONDS);
