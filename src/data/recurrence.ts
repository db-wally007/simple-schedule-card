/**
 * Repeat rules: the model, the RRULE it turns into, and the words for it.
 *
 * Google Calendar's own shape, because that is what the user asked for and what
 * anyone who has made a repeating event already knows: a short list of presets
 * generated from the event's OWN date — "Weekly on Tuesday" only exists because
 * the event is on a Tuesday — plus a custom dialog behind them.
 *
 * All of it is pure, and lives here rather than in the card, because RRULE
 * arithmetic is the kind of thing that is either right or silently wrong a month
 * later. The tests are the point.
 */

export type Freq = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';

/** Where a series stops. Never, on a date, or after a count — never two of them. */
export type RepeatEnd =
  | { kind: 'never' }
  | { kind: 'on'; date: string }
  | { kind: 'after'; count: number };

export interface Recurrence {
  freq: Freq;
  /** Every N days/weeks/months/years. 1 for the plain case. */
  interval: number;
  /** WEEKLY: which weekdays, as RFC codes. Empty means the start's own day. */
  byDay: string[];
  /** MONTHLY: the Nth weekday of the month, -1 meaning the last one. */
  byPos?: { pos: number; day: string };
  end: RepeatEnd;
}

/** RFC 5545 weekday codes, indexed the way Date.getDay() counts. */
export const RFC_DAYS = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'] as const;

/** Monday-first, which is how this card orders every other day list it draws. */
export const WEEK_ORDER = ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'] as const;

const WEEKDAYS = ['MO', 'TU', 'WE', 'TH', 'FR'];

const POS_WORDS: Record<number, string> = {
  1: 'first',
  2: 'second',
  3: 'third',
  4: 'fourth',
  [-1]: 'last',
};

/**
 * Which occurrence of its own weekday a date is, 1-4, or -1 for a fifth.
 *
 * A fifth Tuesday is reported as "last" rather than "fifth" because there is no
 * fifth Tuesday in most months, and a series that skips three months out of four
 * is never what anybody meant. Matches what Google offers for the same date.
 */
export function weekdayPosition(date: Date): number {
  const nth = Math.ceil(date.getDate() / 7);
  return nth >= 5 ? -1 : nth;
}

/** Two day lists holding the same days, order ignored. */
function sameDays(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const left = [...a].sort();
  const right = [...b].sort();
  return left.every((d, i) => d === right[i]);
}

/** Sorted into the card's own week order, so BYDAY never reads shuffled. */
export function orderDays(days: string[]): string[] {
  return [...days].sort((a, b) => WEEK_ORDER.indexOf(a as never) - WEEK_ORDER.indexOf(b as never));
}

export interface Preset {
  /** Stable id, so a re-render cannot rebind a row to a different rule. */
  key: string;
  label: string;
  /** null is the "Does not repeat" row. */
  rule: Recurrence | null;
}

/**
 * The quick list, built from the event's start.
 *
 * Deliberately the same six Google offers plus Custom. They are not arbitrary:
 * each one is the rule somebody would otherwise have to build by hand, and all
 * six are one tap.
 */
export function presets(start: Date, locale?: string): Preset[] {
  const code = RFC_DAYS[start.getDay()];
  const long = new Intl.DateTimeFormat(locale, { weekday: 'long' }).format(start);
  const pos = weekdayPosition(start);
  const dateWords = new Intl.DateTimeFormat(locale, { month: 'long', day: 'numeric' }).format(start);
  const never: RepeatEnd = { kind: 'never' };
  return [
    { key: 'none', label: 'Does not repeat', rule: null },
    { key: 'daily', label: 'Daily', rule: { freq: 'DAILY', interval: 1, byDay: [], end: never } },
    {
      key: 'weekly',
      label: `Weekly on ${long}`,
      rule: { freq: 'WEEKLY', interval: 1, byDay: [code], end: never },
    },
    {
      key: 'monthly',
      label: `Monthly on the ${POS_WORDS[pos]} ${long}`,
      rule: {
        freq: 'MONTHLY',
        interval: 1,
        byDay: [],
        byPos: { pos, day: code },
        end: never,
      },
    },
    {
      key: 'yearly',
      label: `Annually on ${dateWords}`,
      rule: { freq: 'YEARLY', interval: 1, byDay: [], end: never },
    },
    {
      key: 'weekdays',
      label: 'Every weekday (Monday to Friday)',
      rule: { freq: 'WEEKLY', interval: 1, byDay: [...WEEKDAYS], end: never },
    },
  ];
}

/** Whether two rules say the same thing. Used to light up the matching row. */
export function sameRecurrence(a: Recurrence | null, b: Recurrence | null): boolean {
  if (!a || !b) return a === b;
  if (a.freq !== b.freq || a.interval !== b.interval) return false;
  if (!sameDays(a.byDay, b.byDay)) return false;
  if (!!a.byPos !== !!b.byPos) return false;
  if (a.byPos && b.byPos && (a.byPos.pos !== b.byPos.pos || a.byPos.day !== b.byPos.day)) {
    return false;
  }
  if (a.end.kind !== b.end.kind) return false;
  if (a.end.kind === 'on' && b.end.kind === 'on') return a.end.date === b.end.date;
  if (a.end.kind === 'after' && b.end.kind === 'after') return a.end.count === b.end.count;
  return true;
}

/** The preset a rule IS, or 'custom' when it is not one of them. */
export function matchPreset(rule: Recurrence | null, start: Date, locale?: string): string {
  const found = presets(start, locale).find((p) => sameRecurrence(p.rule, rule));
  return found ? found.key : 'custom';
}

/**
 * UNTIL, in the only form Google accepts for the series it is capping.
 *
 * A date series takes a bare date; a timed one takes UTC with a Z, and a local
 * date-time there is a 400. The end of the chosen day is used rather than its
 * start, so "ends on the 8th" includes the 8th — which is what the words say.
 *
 * The conversion runs against the BROWSER's zone. That is the same assumption
 * the rest of the form makes (every date in it comes from a local Date), and on
 * this setup the tablet and Home Assistant share a zone.
 */
export function untilStamp(date: string, allDay: boolean): string {
  if (allDay) return date.replace(/-/g, '');
  const end = new Date(`${date}T23:59:59`);
  const p = (n: number) => String(n).padStart(2, '0');
  return (
    `${end.getUTCFullYear()}${p(end.getUTCMonth() + 1)}${p(end.getUTCDate())}` +
    `T${p(end.getUTCHours())}${p(end.getUTCMinutes())}${p(end.getUTCSeconds())}Z`
  );
}

/**
 * The RRULE line, prefix included, ready for the create service.
 *
 * DTSTART is not written: Google takes it from the event's own start, and a
 * second copy here would be one more thing that can disagree with it.
 */
export function toRRule(rule: Recurrence, allDay = false): string {
  const parts = [`FREQ=${rule.freq}`];
  if (rule.interval > 1) parts.push(`INTERVAL=${rule.interval}`);
  if (rule.freq === 'WEEKLY' && rule.byDay.length) {
    parts.push(`BYDAY=${orderDays(rule.byDay).join(',')}`);
  }
  if (rule.freq === 'MONTHLY' && rule.byPos) {
    parts.push(`BYDAY=${rule.byPos.pos}${rule.byPos.day}`);
  }
  // UNTIL and COUNT are two ways of saying the same thing, and Google rejects
  // an RRULE carrying both.
  if (rule.end.kind === 'on') parts.push(`UNTIL=${untilStamp(rule.end.date, allDay)}`);
  if (rule.end.kind === 'after') parts.push(`COUNT=${rule.end.count}`);
  return `RRULE:${parts.join(';')}`;
}

function dayNames(days: string[], locale?: string): string {
  // 2024-01-01 is a Monday, so this indexes straight off the week order.
  const names = orderDays(days).map((d) => {
    const i = WEEK_ORDER.indexOf(d as never);
    return new Intl.DateTimeFormat(locale, { weekday: 'long' }).format(new Date(2024, 0, 1 + i));
  });
  if (names.length < 2) return names.join('');
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}

/**
 * The rule in words, for the folded row's summary.
 *
 * Says the whole rule, including where it ends: the summary is the only thing
 * visible once the fold is closed, and a repeat that quietly stops in December
 * is exactly the detail somebody needs to see without opening anything.
 */
export function describe(rule: Recurrence | null, start: Date, locale?: string): string {
  if (!rule) return 'Does not repeat';
  const every = rule.interval > 1 ? `Every ${rule.interval} ` : '';
  let base: string;
  switch (rule.freq) {
    case 'DAILY':
      base = every ? `${every}days` : 'Daily';
      break;
    case 'WEEKLY': {
      const days = rule.byDay.length ? rule.byDay : [RFC_DAYS[start.getDay()]];
      if (!every && sameDays(days, WEEKDAYS)) {
        base = 'Every weekday (Monday to Friday)';
        break;
      }
      const on = `on ${dayNames(days, locale)}`;
      base = every ? `${every}weeks ${on}` : `Weekly ${on}`;
      break;
    }
    case 'MONTHLY': {
      const where = rule.byPos
        ? `on the ${POS_WORDS[rule.byPos.pos]} ${new Intl.DateTimeFormat(locale, {
            weekday: 'long',
          }).format(new Date(2024, 0, 1 + WEEK_ORDER.indexOf(rule.byPos.day as never)))}`
        : `on day ${start.getDate()}`;
      base = every ? `${every}months ${where}` : `Monthly ${where}`;
      break;
    }
    default: {
      const dateWords = new Intl.DateTimeFormat(locale, {
        month: 'long',
        day: 'numeric',
      }).format(start);
      base = every ? `${every}years` : `Annually on ${dateWords}`;
      break;
    }
  }
  if (rule.end.kind === 'on') {
    const on = new Date(`${rule.end.date}T00:00`);
    const words = Number.isNaN(on.getTime())
      ? rule.end.date
      : new Intl.DateTimeFormat(locale, {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        }).format(on);
    return `${base}, until ${words}`;
  }
  if (rule.end.kind === 'after') {
    return `${base}, ${rule.end.count} time${rule.end.count === 1 ? '' : 's'}`;
  }
  return base;
}
