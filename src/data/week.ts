/** Week windows and the time axis. Pure — covered by tests/week.spec.ts. */

import type { RawCalendarEvent, ScheduleEvent } from '../types';

export interface WeekWindow {
  /** Monday 00:00 local. Always the full seven days — see `days` for what is drawn. */
  start: Date;
  /** The following Monday 00:00 local. */
  end: Date;
  /** The day columns actually rendered, one Date at local midnight each. */
  days: Date[];
}

export function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/** Monday of the week containing `ref`, at local midnight. */
export function startOfWeek(ref: Date): Date {
  const d = startOfDay(ref);
  // getDay(): 0 = Sunday. Sunday belongs to the week that started six days earlier.
  const back = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - back);
  return d;
}

/**
 * The window to subscribe over, plus the columns to draw.
 *
 * The subscription always spans the full seven days even when only Mon-Fri is
 * drawn, so turning weekends on later needs no change to the fetch path.
 */
export function weekWindow(ref: Date, weekOffset: number, dayCount: number): WeekWindow {
  const start = startOfWeek(ref);
  start.setDate(start.getDate() + weekOffset * 7);
  const end = new Date(start);
  end.setDate(end.getDate() + 7);

  const days: Date[] = [];
  for (let i = 0; i < dayCount; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    days.push(d);
  }
  return { start, end, days };
}

/** Minutes since local midnight. */
export function minutesOfDay(d: Date): number {
  return d.getHours() * 60 + d.getMinutes();
}

/** 'HH:MM' to minutes since midnight; null when unparseable or 'auto'. */
export function parseHM(v: string | undefined): number | null {
  if (!v || v === 'auto') return null;
  const m = /^(\d{1,2}):(\d{2})$/.exec(v.trim());
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 24 || min > 59) return null;
  return h * 60 + min;
}

/**
 * Axis bounds in minutes since midnight.
 *
 * Explicit config wins. 'auto' returns the week's earliest start and latest end
 * EXACTLY — not rounded out to whole hours. The schedule begins where the first
 * lesson begins, so the first block sits flush against the left edge instead of
 * behind a wedge of empty grid. Whole-hour rounding was the first behaviour and
 * left 07:00–07:40 permanently blank.
 *
 * The grid is still DRAWN past both ends (see the bleed in the renderer) so
 * overscrolling reveals more ruled time rather than a void; that is a rendering
 * concern, not a bounds one.
 *
 * Derived from the data, but applied to EVERY day alike, which is what the
 * uniform-lattice rule requires.
 */
export function axisBounds(
  events: ScheduleEvent[],
  startCfg: string | undefined,
  endCfg: string | undefined,
): { start: number; end: number } {
  const fixedStart = parseHM(startCfg);
  const fixedEnd = parseHM(endCfg);
  if (fixedStart !== null && fixedEnd !== null && fixedEnd > fixedStart) {
    return { start: fixedStart, end: fixedEnd };
  }

  let lo = Infinity;
  let hi = -Infinity;
  for (const e of events) {
    if (e.allDay) continue;
    lo = Math.min(lo, minutesOfDay(e.start));
    // An event ending at exactly midnight belongs to the day it started on.
    const endMin = minutesOfDay(e.end) === 0 ? 24 * 60 : minutesOfDay(e.end);
    hi = Math.max(hi, endMin);
  }
  if (!Number.isFinite(lo) || !Number.isFinite(hi)) {
    lo = 8 * 60;
    hi = 16 * 60;
  }

  const start = fixedStart !== null ? fixedStart : lo;
  const end = fixedEnd !== null ? fixedEnd : hi;
  // Never let a bad pairing collapse the axis.
  return end > start ? { start, end } : { start, end: start + 60 };
}

/** Parse one pushed event onto the local timeline. Returns null if unusable. */
export function toScheduleEvent(
  raw: RawCalendarEvent,
  entity: string,
  index: number,
): ScheduleEvent | null {
  if (!raw || !raw.start || !raw.end) return null;
  const allDay = raw.all_day === true || !raw.start.includes('T');
  const start = parseLocal(raw.start);
  const end = parseLocal(raw.end);
  if (!start || !end) return null;
  return {
    // recurrence_id is unique per occurrence; uid is not. Index backstops both.
    key: `${entity}|${raw.recurrence_id ?? raw.uid ?? 'x'}|${raw.start}|${index}`,
    entity,
    uid: raw.uid ?? undefined,
    recurrenceId: raw.recurrence_id ?? undefined,
    summary: (raw.summary ?? '').trim() || '(no title)',
    description: raw.description ?? undefined,
    location: raw.location ?? undefined,
    start,
    end,
    allDay,
  };
}

function parseLocal(v: string): Date | null {
  // A bare date is an all-day boundary and must land at LOCAL midnight; passing
  // 'YYYY-MM-DD' to Date() parses it as UTC and shifts the day in most zones.
  const bare = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v);
  if (bare) return new Date(Number(bare[1]), Number(bare[2]) - 1, Number(bare[3]));
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * Does the week have anything on Saturday or Sunday?
 *
 * Drives `days: auto`. Deliberately all-or-nothing: showing only the weekend day
 * that has something would make the grid six columns one week and seven the
 * next, so a column would be a different width each time. Both or neither keeps
 * two widths in play instead of three.
 *
 * `week` must be the full seven days — pass the unclipped window.
 */
export function weekendHasEvents(events: ScheduleEvent[], week: Date[]): boolean {
  return week
    .filter((d) => d.getDay() === 0 || d.getDay() === 6)
    .some((d) => eventsForDay(events, d).length > 0);
}

/** Events that intersect the given local day, clipped to it. */
export function eventsForDay(events: ScheduleEvent[], day: Date): ScheduleEvent[] {
  const dayStart = startOfDay(day).getTime();
  const dayEnd = dayStart + 24 * 60 * 60 * 1000;
  return events.filter((e) => e.start.getTime() < dayEnd && e.end.getTime() > dayStart);
}
