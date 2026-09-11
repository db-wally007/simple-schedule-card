/**
 * Column assignment inside a day. Pure — covered by tests/lanes.spec.ts.
 *
 * The grouping key is the SOURCE CALENDAR, never the summary text and never a
 * time gap. Alex's event types each become their own calendar entity
 * (calendar.alex_school, calendar.alex_gymnastics, ...), so "merge events from
 * the same calendar" means "give that calendar one column and stack its events
 * in it".
 *
 * Whatever the mode, the resolved column COUNT is a single number applied to
 * every day alike, so a two-column Monday never leaves Friday's blocks twice as
 * wide. That is the uniform-lattice rule.
 */

import type { LaneMode, ScheduleEvent } from '../types';

export interface PlacedEvent {
  ev: ScheduleEvent;
  /** 0-based column within the day. */
  column: number;
}

export interface Placement {
  /** Per day, in the order the days were passed in. */
  days: PlacedEvent[][];
  /** Columns every day column is divided into. Uniform across the whole grid. */
  columns: number;
}

/**
 * Greedy interval packing: sort by start (longest first on a tie), then drop
 * each event into the first sub-column whose previous event has already ended.
 * Touching events (prev.end === next.start) share a sub-column — back-to-back
 * lessons are a sequence, not an overlap.
 */
export function packSubColumns(events: ScheduleEvent[]): Map<string, number> {
  const sorted = [...events].sort(
    (a, b) =>
      a.start.getTime() - b.start.getTime() ||
      b.end.getTime() - a.end.getTime() ||
      a.key.localeCompare(b.key),
  );
  const laneEnds: number[] = [];
  const out = new Map<string, number>();
  for (const ev of sorted) {
    let lane = laneEnds.findIndex((end) => end <= ev.start.getTime());
    if (lane === -1) {
      lane = laneEnds.length;
      laneEnds.push(0);
    }
    laneEnds[lane] = ev.end.getTime();
    out.set(ev.key, lane);
  }
  return out;
}

/**
 * Place a week's events into columns.
 *
 * `by_source` gives every configured calendar its own column, present whether or
 * not it has anything that day, and sub-divides a calendar's own column only if
 * its events genuinely overlap (the printed timetable's `1. skupina` /
 * `2. skupina` split). `packed` pools all calendars into one set of columns that
 * appear only on a real overlap.
 */
export function placeWeek(
  daysEvents: ScheduleEvent[][],
  mode: LaneMode,
  sourceOrder: string[],
): Placement {
  if (mode === 'packed') {
    const perDay = daysEvents.map((evs) => packSubColumns(evs));
    let columns = 1;
    for (const m of perDay) columns = Math.max(columns, maxOf(m) + 1);
    return {
      columns,
      days: daysEvents.map((evs, i) =>
        evs.map((ev) => ({ ev, column: perDay[i].get(ev.key) ?? 0 })),
      ),
    };
  }

  // by_source: resolve the widest sub-division any single calendar needs
  // anywhere in the week, then give EVERY calendar that many sub-columns so the
  // grid stays uniform.
  const perDayPerSource = daysEvents.map((evs) => {
    const bySource = new Map<string, ScheduleEvent[]>();
    for (const ev of evs) {
      const list = bySource.get(ev.entity);
      if (list) list.push(ev);
      else bySource.set(ev.entity, [ev]);
    }
    const packed = new Map<string, number>();
    for (const list of bySource.values()) {
      for (const [key, lane] of packSubColumns(list)) packed.set(key, lane);
    }
    return packed;
  });

  let sub = 1;
  for (const m of perDayPerSource) sub = Math.max(sub, maxOf(m) + 1);

  const order = sourceOrder.length ? sourceOrder : [''];
  return {
    columns: order.length * sub,
    days: daysEvents.map((evs, i) =>
      evs.map((ev) => {
        const base = Math.max(0, order.indexOf(ev.entity));
        return { ev, column: base * sub + (perDayPerSource[i].get(ev.key) ?? 0) };
      }),
    ),
  };
}

function maxOf(m: Map<string, number>): number {
  let max = -1;
  for (const v of m.values()) max = Math.max(max, v);
  return max;
}
