/**
 * Alerts on calendar events, through the alerting integration's own API.
 *
 * The card does not know how an alert rule is written. It speaks only the Alert2
 * fork's reminder API - four websocket commands - and the integration makes an
 * ordinary alert rule out of what it is told: which event, how long before it,
 * who is told and how loudly. The rule then shows (and can be edited) in the
 * Alerts view like any other.
 *
 *   alert2/hm/reminders/targets    who can be pushed to, and the banner dashboards
 *   alert2/hm/reminders/subscribe  every reminder, again after each change
 *   alert2/hm/reminders/save       make one, or change one (ui_id)
 *   alert2/hm/reminders/delete     by ui_id, or every reminder of an event
 *
 * Alerting is optional. When it is missing, or too old to have this API, or not
 * answering, nothing here throws into the card: the reason is turned into a
 * sentence for the form to show, and the rest of the card works as before.
 *
 * An event is named the way Home Assistant hands it to a calendar trigger: its
 * uid, and for one occurrence of a series its recurrence_id. Neither is
 * anything the card or the user chooses, so a locked event (another system's)
 * can have alerts exactly like any other.
 *
 * Or by its TITLE: an alert for every event with that title in the calendar,
 * now and later. Events that are not one series - a timetable mirror makes each
 * lesson an event of its own - belong together only by their title. Titles are
 * compared trimmed and in any case (titleKey), as the integration compares them.
 */

/**
 * One event (a one-off, or one occurrence), every occurrence of a series, or every
 * event with a title.
 */
export type ReminderMatch = 'event' | 'series' | 'title';
export type ReminderPriority = 'low' | 'high';

/** A reminder as the integration reports it. */
export interface Reminder {
  ui_id: number;
  entity_id: string;
  name: string;
  calendar: string;
  match: ReminderMatch;
  /** The event's; null for one by title. */
  uid: string | null;
  recurrence_id: string | null;
  /** The title, for one by title; null otherwise. */
  title: string | null;
  summary: string;
  start: string | null;
  all_day: boolean;
  offset_mins: number;
  push: string[];
  /** Dashboard url paths. */
  banner: string[];
  /**
   * On those dashboards' Home pages only (/<dashboard>/home), as the Alerts editor's
   * "Home page only". Absent from an integration older than the option: false.
   */
  banner_home?: boolean;
  priority: ReminderPriority;
}

export interface PushUser {
  id: string;
  name: string;
  devices: Array<{ name: string; notifier: string }>;
}

/** Who a reminder can tell - the Alerts editor's own Push to and Banner on lists. */
export interface AlertTargets {
  users: PushUser[];
  devices: number;
  /** "user:*" - every device with the app. */
  everyone: string;
  /** "user:" - followed by a Home Assistant user id. */
  user_prefix: string;
  banner: Array<{ id: string; name: string; icon: string }>;
}

export interface ReminderSave {
  ui_id?: number;
  calendar: string;
  /** One event: its uid. By title: null, and `title` set. */
  uid: string | null;
  title?: string | null;
  recurrence_id?: string | null;
  match: ReminderMatch;
  summary: string;
  start: string | null;
  all_day: boolean;
  offset_mins: number;
  push: string[];
  banner: string[];
  /** The banner on those dashboards' Home pages only. */
  banner_home: boolean;
  priority: ReminderPriority;
  clock: '12' | '24';
}

/** Whether alerting can be used, and if not, why - in words for the form. */
export type AlertingStatus =
  | { state: 'loading' }
  | { state: 'ok' }
  | { state: 'off'; reason: string };

/**
 * The "before" choices, in minutes. Kept short on purpose (user's choice): the start
 * itself, 5 minutes, an hour, a day. Anything else is Custom, set on the drum. On an
 * all-day event the start is midnight, and "At start of event" means exactly that.
 */
export const OFFSET_PRESETS: readonly number[] = [0, 5, 60, 1440];

/** The longest "before" the integration takes: four weeks (the drum stops a minute short). */
export const MAX_OFFSET_MINS = 4 * 7 * 24 * 60;

/** A new alert starts here - one of the presets, so it does not open as Custom. */
export const DEFAULT_OFFSET_MINS = 60;

function plural(n: number, word: string): string {
  return `${n} ${word}${n === 1 ? '' : 's'}`;
}

/** The parts of a "before": 1530 -> { days: 1, hours: 1, minutes: 30 }. */
export function splitOffset(mins: number): { days: number; hours: number; minutes: number } {
  const m = Math.max(0, Math.round(mins));
  return { days: Math.floor(m / 1440), hours: Math.floor((m % 1440) / 60), minutes: m % 60 };
}

/**
 * A "before" in words, as a row of the list says it: "At start of event",
 * "30 minutes before", "1 day 2 hours before".
 */
export function offsetLabel(mins: number): string {
  if (mins <= 0) return 'At start of event';
  if (mins % 10080 === 0) return `${plural(mins / 10080, 'week')} before`;
  const { days, hours, minutes } = splitOffset(mins);
  const parts: string[] = [];
  if (days) parts.push(plural(days, 'day'));
  if (hours) parts.push(plural(hours, 'hour'));
  if (minutes) parts.push(plural(minutes, 'minute'));
  return `${parts.join(' ')} before`;
}

/** The same, short, for a summary line: "30 min", "1 h 30 min", "2 days", "At start". */
export function offsetShort(mins: number): string {
  if (mins <= 0) return 'At start';
  if (mins % 10080 === 0) return plural(mins / 10080, 'week');
  const { days, hours, minutes } = splitOffset(mins);
  const parts: string[] = [];
  if (days) parts.push(plural(days, 'day'));
  if (hours) parts.push(`${hours} h`);
  if (minutes) parts.push(`${minutes} min`);
  return parts.join(' ');
}

/** What the fold says while closed: "None", "30 min before", "1 day, 30 min", "3 alerts". */
export function alertsSummary(offsets: number[]): string {
  if (!offsets.length) return 'None';
  if (offsets.length === 1) {
    return offsets[0] <= 0 ? 'At start of event' : `${offsetShort(offsets[0])} before`;
  }
  if (offsets.length === 2) return offsets.map(offsetShort).join(', ');
  return `${offsets.length} alerts`;
}

/** A title as two are compared: trimmed, any case - as the integration compares them. */
export function titleKey(title: string | null | undefined): string {
  return String(title ?? '').trim().toLowerCase();
}

/** What a reminder-matching question needs to know about an event. */
export interface EventKey {
  entity: string;
  uid?: string;
  recurrenceId?: string;
  summary?: string;
}

/** The ones that fire for this event: its series', its own, and its title's. */
export function remindersFor(ev: EventKey, list: readonly Reminder[]): Reminder[] {
  const title = titleKey(ev.summary);
  return list.filter((r) => {
    if (r.calendar !== ev.entity) return false;
    if (r.match === 'title') return !!title && titleKey(r.title) === title;
    if (!ev.uid || r.uid !== ev.uid) return false;
    return r.match === 'series' || (r.recurrence_id || null) === (ev.recurrenceId || null);
  });
}

/**
 * Every event with a reminder, as keys - so drawing a whole week can ask about each
 * block without walking the list each time. See hasReminderKey.
 */
export function reminderKeys(list: readonly Reminder[]): Set<string> {
  const keys = new Set<string>();
  for (const r of list) {
    if (r.match === 'title') keys.add(`t|${r.calendar}|${titleKey(r.title)}`);
    else if (r.match === 'series') keys.add(`s|${r.calendar}|${r.uid}`);
    else keys.add(`e|${r.calendar}|${r.uid}|${r.recurrence_id || ''}`);
  }
  return keys;
}

export function hasReminderKey(keys: ReadonlySet<string>, ev: EventKey): boolean {
  if (!keys.size) return false;
  const title = titleKey(ev.summary);
  if (title && keys.has(`t|${ev.entity}|${title}`)) return true;
  if (!ev.uid) return false;
  return (
    keys.has(`s|${ev.entity}|${ev.uid}`) ||
    keys.has(`e|${ev.entity}|${ev.uid}|${ev.recurrenceId || ''}`)
  );
}

/**
 * The id Google gives the FIRST occurrence of a series just made from `id` - what
 * Home Assistant will then report as that occurrence's recurrence_id. A timed
 * series stamps the occurrence's start in UTC; an all-day one its date.
 */
export function firstOccurrenceId(id: string, start: Date, allDay: boolean): string {
  const p = (n: number) => String(n).padStart(2, '0');
  if (allDay) {
    return `${id}_${start.getFullYear()}${p(start.getMonth() + 1)}${p(start.getDate())}`;
  }
  return (
    `${id}_${start.getUTCFullYear()}${p(start.getUTCMonth() + 1)}${p(start.getUTCDate())}` +
    `T${p(start.getUTCHours())}${p(start.getUTCMinutes())}${p(start.getUTCSeconds())}Z`
  );
}

/** Google's iCalUID for an event id - what Home Assistant reports as its uid. */
export function uidOf(id: string): string {
  return id.includes('@') ? id : `${id}@google.com`;
}

/**
 * Why alerting cannot be used, in words. `components` is Home Assistant's list of
 * loaded integrations, which tells "not installed" from "installed but too old":
 * both answer the reminder commands with unknown_command.
 */
export function alertingErrorText(err: unknown, components?: readonly string[]): string {
  const e = (err ?? {}) as { code?: string | number; message?: string };
  if (e.code === 'unknown_command') {
    return components?.includes('alert2')
      ? 'Alerting is installed, but this version cannot make alerts from calendar events. ' +
          'It needs the Alert2 version with calendar reminders.'
      : 'Alerting is not installed - the Alert2 integration was not found in Home Assistant.';
  }
  if (e.code === 'not_ready') return 'Alerting is still starting. Try again in a moment.';
  const msg = String(e.message ?? err ?? '').trim();
  return msg ? `Alerting did not answer: ${msg}` : 'Alerting did not answer.';
}

/** The message of an error from a save or delete, for the form. */
export function errorMessage(err: unknown): string {
  const e = (err ?? {}) as { message?: string };
  return String(e.message ?? err ?? 'Unknown error').slice(0, 300);
}

/* ---- the calls ------------------------------------------------------------- */

/* eslint-disable @typescript-eslint/no-explicit-any */

export function fetchTargets(hass: any): Promise<AlertTargets> {
  return hass.callWS({ type: 'alert2/hm/reminders/targets' });
}

/**
 * Follow every reminder. Resolves to the unsubscribe once the integration has
 * accepted; rejects (unknown_command, ...) when it cannot. Home Assistant's
 * connection re-subscribes by itself after a reconnect.
 */
export function subscribeReminders(
  hass: any,
  onList: (list: Reminder[]) => void,
): Promise<() => void> {
  return hass.connection.subscribeMessage(
    (msg: { reminders?: Reminder[] }) => {
      if (Array.isArray(msg?.reminders)) onList(msg.reminders);
    },
    { type: 'alert2/hm/reminders/subscribe' },
  );
}

export function saveReminder(
  hass: any,
  data: ReminderSave,
): Promise<{ ui_id: number; entity_id: string }> {
  const msg: Record<string, unknown> = { type: 'alert2/hm/reminders/save', ...data };
  if (msg.ui_id === undefined || msg.ui_id === null) delete msg.ui_id;
  return hass.callWS(msg);
}

export function deleteReminders(
  hass: any,
  which: { ui_id: number } | { calendar: string; uid: string; recurrence_id?: string | null },
): Promise<{ deleted: number[] }> {
  return hass.callWS({ type: 'alert2/hm/reminders/delete', ...which });
}

/** The clock the user reads times in (their Home Assistant profile), for the message. */
export function clockOf(hass: any): '12' | '24' {
  const tf = hass?.locale?.time_format;
  if (tf === '12' || tf === '24') return tf;
  try {
    const lang = tf === 'system' ? undefined : hass?.locale?.language;
    return new Intl.DateTimeFormat(lang, { hour: 'numeric' }).resolvedOptions().hour12 ? '12' : '24';
  } catch {
    return '24';
  }
}
/* eslint-enable @typescript-eslint/no-explicit-any */
