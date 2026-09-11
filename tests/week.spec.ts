import { describe, expect, it } from 'vitest';
import {
  axisBounds,
  eventsForDay,
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
