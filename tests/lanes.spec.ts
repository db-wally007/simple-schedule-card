import { describe, expect, it } from 'vitest';
import { packSubColumns, placeWeek } from '../src/data/lanes';
import type { ScheduleEvent } from '../src/types';

let n = 0;
const ev = (h1: number, m1: number, h2: number, m2: number, entity = 'calendar.school'): ScheduleEvent => ({
  key: `k${n++}`,
  entity,
  summary: 'X',
  start: new Date(2026, 8, 7, h1, m1),
  end: new Date(2026, 8, 7, h2, m2),
  allDay: false,
});

describe('packSubColumns', () => {
  it('keeps back-to-back lessons in ONE column', () => {
    // 08:30-09:15 then 09:30-10:15 is a sequence, not an overlap.
    const a = ev(8, 30, 9, 15);
    const b = ev(9, 30, 10, 15);
    const m = packSubColumns([a, b]);
    expect(m.get(a.key)).toBe(0);
    expect(m.get(b.key)).toBe(0);
  });

  it('treats exactly touching events as sequential', () => {
    const a = ev(11, 5, 12, 5);
    const b = ev(12, 5, 12, 50);
    const m = packSubColumns([a, b]);
    expect(m.get(a.key)).toBe(m.get(b.key));
  });

  it('splits genuinely overlapping events', () => {
    const a = ev(8, 30, 10, 0);
    const b = ev(9, 0, 10, 15);
    const m = packSubColumns([a, b]);
    expect(m.get(a.key)).not.toBe(m.get(b.key));
  });

  it('reuses a freed column instead of growing forever', () => {
    const a = ev(8, 0, 9, 0);
    const b = ev(8, 30, 9, 30);
    const c = ev(9, 30, 10, 0);
    const m = packSubColumns([a, b, c]);
    expect(Math.max(...m.values())).toBe(1);
  });

  it('does not depend on input order', () => {
    const a = ev(8, 0, 9, 0);
    const b = ev(8, 30, 9, 30);
    expect(packSubColumns([a, b]).get(a.key)).toBe(packSubColumns([b, a]).get(a.key));
  });
});

describe('placeWeek — the uniform lattice', () => {
  const school = 'calendar.alex_school';
  const gym = 'calendar.alex_gymnastics';

  it('by_source gives every calendar a column even on an empty day', () => {
    const days = [[ev(8, 0, 9, 0, school)], [], []];
    const p = placeWeek(days, 'by_source', [school, gym]);
    expect(p.columns).toBe(2);
  });

  it('by_source puts a calendar in the SAME column every day', () => {
    const days = [[ev(8, 0, 9, 0, gym)], [ev(13, 0, 14, 0, gym)]];
    const p = placeWeek(days, 'by_source', [school, gym]);
    expect(p.days[0][0].column).toBe(p.days[1][0].column);
    expect(p.days[0][0].column).toBe(1);
  });

  it('by_source stacks one calendar’s sequential events in its own column', () => {
    const days = [[ev(8, 30, 9, 15, school), ev(9, 30, 10, 15, school)]];
    const p = placeWeek(days, 'by_source', [school]);
    expect(p.columns).toBe(1);
    expect(p.days[0].every((x) => x.column === 0)).toBe(true);
  });

  it('by_source sub-divides a calendar that overlaps ITSELF (skupina split)', () => {
    const days = [[ev(8, 30, 9, 15, school), ev(8, 30, 9, 15, school)]];
    const p = placeWeek(days, 'by_source', [school]);
    expect(p.columns).toBe(2);
  });

  it('applies one column count to ALL days — a busy Monday never widens Friday', () => {
    const days = [
      [ev(8, 0, 10, 0, school), ev(9, 0, 11, 0, school)],
      [ev(8, 0, 9, 0, school)],
    ];
    const p = placeWeek(days, 'by_source', [school]);
    expect(p.columns).toBe(2);
    // Friday's single block still occupies one of two columns, not the full width.
    expect(p.days[1][0].column).toBeLessThan(p.columns);
  });

  it('packed pools calendars into shared columns', () => {
    const days = [[ev(8, 0, 9, 0, school), ev(13, 0, 14, 0, gym)]];
    const p = placeWeek(days, 'packed', [school, gym]);
    expect(p.columns).toBe(1);
  });

  it('packed still separates a real overlap across calendars', () => {
    const days = [[ev(8, 0, 9, 30, school), ev(9, 0, 10, 0, gym)]];
    const p = placeWeek(days, 'packed', [school, gym]);
    expect(p.columns).toBe(2);
  });

  it('places an unconfigured calendar rather than dropping it', () => {
    const days = [[ev(8, 0, 9, 0, 'calendar.stranger')]];
    const p = placeWeek(days, 'by_source', [school]);
    expect(p.days[0]).toHaveLength(1);
    expect(p.days[0][0].column).toBeGreaterThanOrEqual(0);
  });
});
