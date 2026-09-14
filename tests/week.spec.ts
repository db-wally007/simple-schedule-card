import { describe, expect, it } from 'vitest';
import {
  axisBounds,
  eventsForDay,
  monthOf,
  monthRows,
  monthWindow,
  monthsBetween,
  parseHM,
  startOfWeek,
  toScheduleEvent,
  weekendHasEvents,
  weekWindow,
} from '../src/data/week';
import type { ScheduleEvent } from '../src/types';

const ev = (start: Date, end: Date, entity = 'calendar.a'): ScheduleEvent => ({
  key: `${entity}|${start.toISOString()}`,
  entity,
  summary: 'X',
  start,
  end,
  allDay: false,
});

describe('startOfWeek', () => {
  it('returns the Monday of the containing week', () => {
    // 2026-09-10 is a Thursday.
    expect(startOfWeek(new Date(2026, 8, 10, 13, 30)).getDate()).toBe(7);
  });

  it('treats Sunday as the END of its week, not the start', () => {
    // 2026-09-13 is a Sunday; its Monday is the 7th, not the 14th.
    expect(startOfWeek(new Date(2026, 8, 13, 23, 0)).getDate()).toBe(7);
  });

  it('is idempotent on a Monday', () => {
    const mon = startOfWeek(new Date(2026, 8, 7, 0, 0));
    expect(startOfWeek(mon).getTime()).toBe(mon.getTime());
  });
});

describe('weekWindow', () => {
  it('always spans seven days even when only five are drawn', () => {
    const w = weekWindow(new Date(2026, 8, 10), 0, 5);
    expect(w.days).toHaveLength(5);
    expect((w.end.getTime() - w.start.getTime()) / 86400000).toBe(7);
  });

  it('offsets by whole weeks', () => {
    const a = weekWindow(new Date(2026, 8, 10), 0, 5);
    const b = weekWindow(new Date(2026, 8, 10), 1, 5);
    expect((b.start.getTime() - a.start.getTime()) / 86400000).toBe(7);
  });

  it('starts the columns on Monday', () => {
    const w = weekWindow(new Date(2026, 8, 10), 0, 5);
    expect(w.days[0].getDay()).toBe(1);
    expect(w.days[4].getDay()).toBe(5);
  });
});

describe('parseHM', () => {
  it('parses a clock string to minutes', () => {
    expect(parseHM('07:40')).toBe(460);
    expect(parseHM('7:05')).toBe(425);
  });
  it('returns null for auto and for junk', () => {
    expect(parseHM('auto')).toBeNull();
    expect(parseHM(undefined)).toBeNull();
    expect(parseHM('25:00')).toBeNull();
    expect(parseHM('noon')).toBeNull();
  });
});

describe('axisBounds', () => {
  const events = [
    ev(new Date(2026, 8, 7, 7, 40), new Date(2026, 8, 7, 8, 25)),
    ev(new Date(2026, 8, 8, 13, 55), new Date(2026, 8, 8, 14, 40)),
  ];

  it('prefers explicit config over the data', () => {
    expect(axisBounds(events, '06:00', '18:00')).toEqual({ start: 360, end: 1080 });
  });

  it('auto-derives the EXACT first start and last end, not whole hours', () => {
    // 07:40 and 14:40 — rounding out to 07:00/15:00 left the first block behind
    // a wedge of empty grid.
    expect(axisBounds(events, 'auto', 'auto')).toEqual({ start: 7 * 60 + 40, end: 14 * 60 + 40 });
  });

  it('falls back to a sane window with no timed events', () => {
    expect(axisBounds([], 'auto', 'auto')).toEqual({ start: 8 * 60, end: 16 * 60 });
  });

  it('never collapses the axis when config is inverted', () => {
    const b = axisBounds(events, '14:00', '09:00');
    expect(b.end).toBeGreaterThan(b.start);
  });
});

describe('toScheduleEvent', () => {
  it('reads the FLAT push shape, not the nested REST one', () => {
    const e = toScheduleEvent(
      {
        start: '2026-09-07T07:40:00+02:00',
        end: '2026-09-07T08:25:00+02:00',
        summary: 'AJ',
        rrule: 'FREQ=WEEKLY;BYDAY=MO',
      },
      'calendar.alex_school',
      0,
    );
    expect(e?.summary).toBe('AJ');
    expect(e?.allDay).toBe(false);
  });

  it('lands a bare date on LOCAL midnight, not UTC', () => {
    const e = toScheduleEvent({ start: '2026-09-07', end: '2026-09-08' }, 'calendar.a', 0);
    expect(e?.allDay).toBe(true);
    expect(e?.start.getDate()).toBe(7);
    expect(e?.start.getHours()).toBe(0);
  });

  it('rejects unusable input rather than rendering garbage', () => {
    expect(toScheduleEvent({ start: '', end: '' }, 'calendar.a', 0)).toBeNull();
  });

  it('gives every occurrence of one recurring uid a distinct key', () => {
    const mk = (d: string) =>
      toScheduleEvent(
        { start: `${d}T07:40:00+02:00`, end: `${d}T08:25:00+02:00`, uid: 'same', summary: 'AJ' },
        'calendar.a',
        0,
      );
    expect(mk('2026-09-07')?.key).not.toBe(mk('2026-09-14')?.key);
  });
});

describe('eventsForDay', () => {
  it('keeps only events intersecting that local day', () => {
    const list = [
      ev(new Date(2026, 8, 7, 8, 0), new Date(2026, 8, 7, 9, 0)),
      ev(new Date(2026, 8, 8, 8, 0), new Date(2026, 8, 8, 9, 0)),
    ];
    expect(eventsForDay(list, new Date(2026, 8, 7))).toHaveLength(1);
  });

  it('includes an event that straddles midnight', () => {
    const list = [ev(new Date(2026, 8, 7, 23, 0), new Date(2026, 8, 8, 1, 0))];
    expect(eventsForDay(list, new Date(2026, 8, 8))).toHaveLength(1);
  });
});

describe('weekendHasEvents', () => {
  const week = weekWindow(new Date(2026, 8, 10), 0, 7).days; // Mon 7th … Sun 13th

  it('is false for a Monday-to-Friday week', () => {
    const list = [
      ev(new Date(2026, 8, 7, 8, 0), new Date(2026, 8, 7, 9, 0)),
      ev(new Date(2026, 8, 11, 13, 0), new Date(2026, 8, 11, 14, 0)),
    ];
    expect(weekendHasEvents(list, week)).toBe(false);
  });

  it('is true for a Saturday event', () => {
    expect(weekendHasEvents([ev(new Date(2026, 8, 12, 10, 0), new Date(2026, 8, 12, 11, 0))], week)).toBe(true);
  });

  it('is true for a Sunday event', () => {
    expect(weekendHasEvents([ev(new Date(2026, 8, 13, 10, 0), new Date(2026, 8, 13, 11, 0))], week)).toBe(true);
  });

  it('is false for an empty week', () => {
    expect(weekendHasEvents([], week)).toBe(false);
  });

  it('ignores a weekend event from a DIFFERENT week', () => {
    expect(weekendHasEvents([ev(new Date(2026, 8, 19, 10, 0), new Date(2026, 8, 19, 11, 0))], week)).toBe(false);
  });
});

describe('monthWindow', () => {
  it('draws only the weeks the month actually touches', () => {
    // September 2026 starts on a Tuesday and runs 30 days: five rows. Drawing
    // six put a whole week of October under it.
    expect(monthRows(new Date(2026, 8, 15), 0)).toBe(5);
    expect(monthWindow(new Date(2026, 8, 15), 0).days).toHaveLength(35);
  });

  it('uses six only when a long month starts late in the week', () => {
    // August 2026 begins on a Saturday and runs 31 days: 6 lead + 31 = 37.
    expect(monthRows(new Date(2026, 7, 15), 0)).toBe(6);
    expect(monthWindow(new Date(2026, 7, 15), 0).days).toHaveLength(42);
  });

  it('uses four for a February that begins on a Monday', () => {
    // 1 February 2027 is a Monday and the month is 28 days: exactly four weeks,
    // and padding it out would be inventing rows nothing falls in.
    expect(monthRows(new Date(2027, 1, 10), 0)).toBe(4);
    expect(monthWindow(new Date(2027, 1, 10), 0).days).toHaveLength(28);
  });

  it('never leaves a day of the month off the grid', () => {
    // The property that matters, checked across four years of months.
    for (let i = -24; i <= 24; i++) {
      const w = monthWindow(new Date(2026, 8, 15), i);
      const subject = monthOf(new Date(2026, 8, 15), i);
      const length = new Date(subject.getFullYear(), subject.getMonth() + 1, 0).getDate();
      const seen = new Set(w.days.map((d) => d.toDateString()));
      for (let day = 1; day <= length; day++) {
        const want = new Date(subject.getFullYear(), subject.getMonth(), day);
        expect(seen.has(want.toDateString()), want.toDateString()).toBe(true);
      }
      // And never a whole row that belongs to neither neighbour's month.
      expect(w.days.length % 7).toBe(0);
    }
  });

  it('starts on the Monday on or before the 1st', () => {
    // 1 September 2026 is a Tuesday, so the grid opens on Monday 31 August.
    const w = monthWindow(new Date(2026, 8, 15), 0);
    expect(w.days[0].getDay()).toBe(1);
    expect(w.days[0].toDateString()).toBe(new Date(2026, 7, 31).toDateString());
  });

  it('opens on the 1st itself when that IS a Monday', () => {
    // 1 February 2027 is a Monday: no leading days from January.
    const w = monthWindow(new Date(2027, 1, 10), 0);
    expect(w.days[0].toDateString()).toBe(new Date(2027, 1, 1).toDateString());
  });

  it('steps by whole months, across a year end', () => {
    const ref = new Date(2026, 11, 15);
    expect(monthOf(ref, 1).getMonth()).toBe(0);
    expect(monthOf(ref, 1).getFullYear()).toBe(2027);
    expect(monthOf(ref, -12).getFullYear()).toBe(2025);
    // The 31st of a long month must not skid into the month after next.
    expect(monthOf(new Date(2026, 0, 31), 1).getMonth()).toBe(1);
  });

  it('has a window that contains every cell it drew', () => {
    const w = monthWindow(new Date(2026, 8, 15), 0);
    expect(w.start.getTime()).toBeLessThanOrEqual(w.days[0].getTime());
    expect(w.end.getTime()).toBeGreaterThan(w.days[w.days.length - 1].getTime());
  });

  it('counts whole months between dates for the pill', () => {
    expect(monthsBetween(new Date(2026, 8, 1), new Date(2026, 8, 30))).toBe(0);
    expect(monthsBetween(new Date(2026, 8, 1), new Date(2026, 9, 1))).toBe(1);
    expect(monthsBetween(new Date(2026, 11, 1), new Date(2027, 0, 1))).toBe(1);
    expect(monthsBetween(new Date(2026, 8, 1), new Date(2025, 8, 1))).toBe(-12);
  });
});
