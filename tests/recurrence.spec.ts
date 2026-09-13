/**
 * Repeat rules. RRULE is the kind of thing that is either exactly right or
 * silently wrong a month later, so every preset's output is pinned here.
 */

import { describe as group, expect, it } from 'vitest';
import {
  describe as words,
  matchPreset,
  presets,
  sameRecurrence,
  toRRule,
  untilStamp,
  weekdayPosition,
  orderDays,
  type Recurrence,
} from '../src/data/recurrence';

/** Tuesday 8 September 2026 — the second Tuesday of that month. */
const TUE = new Date(2026, 8, 8, 10, 20);
const never = { kind: 'never' } as const;

group('presets', () => {
  it('names the weekly one after the event\'s own day', () => {
    const p = presets(TUE, 'en-GB');
    expect(p.map((x) => x.label)).toEqual([
      'Does not repeat',
      'Daily',
      'Weekly on Tuesday',
      'Monthly on the second Tuesday',
      'Annually on 8 September',
      'Every weekday (Monday to Friday)',
    ]);
  });

  it('moves with the date it is built from', () => {
    const fri = new Date(2026, 0, 2, 9, 0); // first Friday of January
    const labels = presets(fri, 'en-GB').map((x) => x.label);
    expect(labels[2]).toBe('Weekly on Friday');
    expect(labels[3]).toBe('Monthly on the first Friday');
  });

  it('calls a fifth weekday the LAST one, not the fifth', () => {
    const fifth = new Date(2026, 8, 29); // fifth Tuesday of September 2026
    expect(weekdayPosition(fifth)).toBe(-1);
    expect(presets(fifth, 'en-GB')[3].label).toBe('Monthly on the last Tuesday');
  });
});

group('toRRule', () => {
  const rule = (over: Partial<Recurrence>): Recurrence => ({
    freq: 'WEEKLY',
    interval: 1,
    byDay: [],
    end: never,
    ...over,
  });

  it('writes each preset the way Google does', () => {
    const [, daily, weekly, monthly, yearly, weekdays] = presets(TUE, 'en-GB');
    expect(toRRule(daily.rule!)).toBe('RRULE:FREQ=DAILY');
    expect(toRRule(weekly.rule!)).toBe('RRULE:FREQ=WEEKLY;BYDAY=TU');
    expect(toRRule(monthly.rule!)).toBe('RRULE:FREQ=MONTHLY;BYDAY=2TU');
    expect(toRRule(yearly.rule!)).toBe('RRULE:FREQ=YEARLY');
    expect(toRRule(weekdays.rule!)).toBe('RRULE:FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR');
  });

  it('omits INTERVAL when it is 1, which is what every preset means', () => {
    expect(toRRule(rule({ byDay: ['TU'] }))).not.toContain('INTERVAL');
    expect(toRRule(rule({ byDay: ['TU'], interval: 3 }))).toContain('INTERVAL=3');
  });

  it('orders BYDAY Monday-first however the days were picked', () => {
    expect(toRRule(rule({ byDay: ['SU', 'WE', 'MO'] }))).toBe('RRULE:FREQ=WEEKLY;BYDAY=MO,WE,SU');
    expect(orderDays(['SA', 'TU'])).toEqual(['TU', 'SA']);
  });

  it('uses the last weekday of the month as -1', () => {
    expect(toRRule(rule({ freq: 'MONTHLY', byPos: { pos: -1, day: 'TU' } }))).toBe(
      'RRULE:FREQ=MONTHLY;BYDAY=-1TU',
    );
  });

  it('never writes UNTIL and COUNT together - Google rejects both at once', () => {
    const until = toRRule(rule({ byDay: ['TU'], end: { kind: 'on', date: '2026-12-08' } }));
    const count = toRRule(rule({ byDay: ['TU'], end: { kind: 'after', count: 13 } }));
    expect(until).toContain('UNTIL=');
    expect(until).not.toContain('COUNT=');
    expect(count).toBe('RRULE:FREQ=WEEKLY;BYDAY=TU;COUNT=13');
  });
});

group('untilStamp', () => {
  it('is a bare date for an all-day series', () => {
    expect(untilStamp('2026-12-08', true)).toBe('20261208');
  });

  it('is UTC with a Z for a timed one', () => {
    expect(untilStamp('2026-12-08', false)).toMatch(/^\d{8}T\d{6}Z$/);
  });

  it('covers the whole of the day it names', () => {
    // The end of the 8th in local time, whatever zone the test machine is in,
    // must not fall before the START of the 8th.
    const stamp = untilStamp('2026-12-08', false);
    const iso = stamp.replace(
      /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/,
      '$1-$2-$3T$4:$5:$6Z',
    );
    expect(new Date(iso).getTime()).toBeGreaterThan(new Date('2026-12-08T00:00').getTime());
  });
});

group('matchPreset', () => {
  it('recognises a rule that IS a preset', () => {
    const weekly = presets(TUE)[2].rule;
    expect(matchPreset(weekly, TUE)).toBe('weekly');
    expect(matchPreset(null, TUE)).toBe('none');
  });

  it('calls anything else custom', () => {
    expect(
      matchPreset({ freq: 'WEEKLY', interval: 2, byDay: ['TU'], end: never }, TUE),
    ).toBe('custom');
    // Same shape, but it stops - so it is no longer the plain preset.
    expect(
      matchPreset(
        { freq: 'WEEKLY', interval: 1, byDay: ['TU'], end: { kind: 'after', count: 4 } },
        TUE,
      ),
    ).toBe('custom');
  });

  it('does not confuse a preset built for another day', () => {
    const weeklyTue = presets(TUE)[2].rule;
    const friday = new Date(2026, 0, 2);
    expect(matchPreset(weeklyTue, friday)).toBe('custom');
  });
});

group('sameRecurrence', () => {
  it('ignores the order days were picked in', () => {
    const a: Recurrence = { freq: 'WEEKLY', interval: 1, byDay: ['MO', 'WE'], end: never };
    const b: Recurrence = { freq: 'WEEKLY', interval: 1, byDay: ['WE', 'MO'], end: never };
    expect(sameRecurrence(a, b)).toBe(true);
  });

  it('separates null from a rule', () => {
    expect(sameRecurrence(null, null)).toBe(true);
    expect(sameRecurrence(null, { freq: 'DAILY', interval: 1, byDay: [], end: never })).toBe(false);
  });
});

group('describe', () => {
  it('says the plain cases the short way', () => {
    expect(words(null, TUE, 'en-GB')).toBe('Does not repeat');
    expect(words({ freq: 'DAILY', interval: 1, byDay: [], end: never }, TUE, 'en-GB')).toBe('Daily');
    expect(words({ freq: 'WEEKLY', interval: 1, byDay: ['TU'], end: never }, TUE, 'en-GB')).toBe(
      'Weekly on Tuesday',
    );
  });

  it('recognises the weekday set by its days, not by which button made it', () => {
    expect(
      words(
        { freq: 'WEEKLY', interval: 1, byDay: ['FR', 'MO', 'TU', 'WE', 'TH'], end: never },
        TUE,
        'en-GB',
      ),
    ).toBe('Every weekday (Monday to Friday)');
  });

  it('lists several days readably', () => {
    expect(
      words({ freq: 'WEEKLY', interval: 2, byDay: ['WE', 'MO'], end: never }, TUE, 'en-GB'),
    ).toBe('Every 2 weeks on Monday and Wednesday');
  });

  it('always says where a series stops', () => {
    expect(
      words(
        { freq: 'WEEKLY', interval: 1, byDay: ['TU'], end: { kind: 'on', date: '2026-12-08' } },
        TUE,
        'en-GB',
      ),
    ).toBe('Weekly on Tuesday, until 8 Dec 2026');
    expect(
      words(
        { freq: 'DAILY', interval: 1, byDay: [], end: { kind: 'after', count: 1 } },
        TUE,
        'en-GB',
      ),
    ).toBe('Daily, 1 time');
  });

  it('falls back to the start day when a weekly rule names none', () => {
    expect(words({ freq: 'WEEKLY', interval: 1, byDay: [], end: never }, TUE, 'en-GB')).toBe(
      'Weekly on Tuesday',
    );
  });
});
