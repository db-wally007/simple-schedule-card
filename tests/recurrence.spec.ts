/**
 * Repeat rules. RRULE is the kind of thing that is either exactly right or
 * silently wrong a month later, so every preset's output is pinned here.
 */

import { describe as group, expect, it } from 'vitest';
import {
  describe as words,
  matchPreset,
  normalise,
  parseRRule,
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

group('parseRRule', () => {
  it('reads the shape Home Assistant actually sends', () => {
    // Straight off the live push: 40 of 41 events carried one of these.
    expect(parseRRule('FREQ=WEEKLY;BYDAY=FR')).toEqual({
      freq: 'WEEKLY',
      interval: 1,
      byDay: ['FR'],
      end: never,
    });
  });

  it('tolerates the RRULE: prefix Google puts on the line', () => {
    expect(parseRRule('RRULE:FREQ=DAILY')).toEqual({
      freq: 'DAILY',
      interval: 1,
      byDay: [],
      end: never,
    });
  });

  it('round-trips everything this card can build', () => {
    const start = TUE;
    for (const p of presets(start, 'en-GB')) {
      if (!p.rule) continue;
      expect(parseRRule(toRRule(p.rule))).toEqual(p.rule);
    }
    const custom: Recurrence[] = [
      { freq: 'WEEKLY', interval: 3, byDay: ['MO', 'WE'], end: { kind: 'after', count: 13 } },
      { freq: 'MONTHLY', interval: 2, byDay: [], byPos: { pos: -1, day: 'TU' }, end: never },
      { freq: 'YEARLY', interval: 1, byDay: [], end: { kind: 'on', date: '2027-09-08' } },
    ];
    for (const rule of custom) {
      expect(parseRRule(toRRule(rule))).toEqual(rule);
    }
  });

  it('reads a COUNT and an UNTIL back', () => {
    expect(parseRRule('FREQ=WEEKLY;COUNT=3;INTERVAL=3;BYDAY=WE')).toEqual({
      freq: 'WEEKLY',
      interval: 3,
      byDay: ['WE'],
      end: { kind: 'after', count: 3 },
    });
    const capped = parseRRule('FREQ=WEEKLY;UNTIL=20260928T085959Z;BYDAY=MO');
    expect(capped?.end).toEqual({ kind: 'on', date: '2026-09-28' });
  });

  it('reads a DATE-form UNTIL, which is what an all-day series carries', () => {
    expect(parseRRule('FREQ=WEEKLY;UNTIL=20261208')?.end).toEqual({
      kind: 'on',
      date: '2026-12-08',
    });
  });

  it('orders BYDAY however Google listed it', () => {
    expect(parseRRule('FREQ=WEEKLY;BYDAY=SU,WE,MO')?.byDay).toEqual(['MO', 'WE', 'SU']);
  });

  it('returns null rather than half a rule', () => {
    // Each of these means something this card cannot draw or edit.
    for (const bad of [
      '',
      null,
      undefined,
      'FREQ=HOURLY',
      'FREQ=WEEKLY;INTERVAL=0',
      'FREQ=WEEKLY;COUNT=3;UNTIL=20261208',
      'FREQ=MONTHLY;BYDAY=2TU,3WE',
      'FREQ=WEEKLY;BYDAY=XX',
      'BYDAY=MO',
    ]) {
      expect(parseRRule(bad as never), String(bad)).toBeNull();
    }
  });

  it('describes what it parsed, which is the whole point', () => {
    const rule = parseRRule('FREQ=WEEKLY;BYDAY=FR');
    expect(words(rule, new Date(2026, 8, 11), 'en-GB')).toBe('Weekly on Friday');
    expect(words(parseRRule('FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR'), TUE, 'en-GB')).toBe(
      'Every weekday (Monday to Friday)',
    );
  });
});

group('parseRRule: parity with what Google\'s own dialog writes', () => {
  // Everything below is producible from Google Calendar's Custom recurrence
  // dialog, so the card has to read all of it — see the note in parseRRule.
  it('reads a monthly series stated as a day of the month', () => {
    expect(parseRRule('FREQ=MONTHLY;BYMONTHDAY=14')).toEqual({
      freq: 'MONTHLY', interval: 1, byDay: [], byMonthDay: 14, end: never,
    });
  });

  it('reads a yearly series that restates its month and day', () => {
    expect(parseRRule('FREQ=YEARLY;BYMONTH=9;BYMONTHDAY=8')).toEqual({
      freq: 'YEARLY', interval: 1, byDay: [], byMonth: 9, byMonthDay: 8, end: never,
    });
  });

  it('round-trips both of those without losing the restatement', () => {
    for (const line of [
      'FREQ=MONTHLY;BYMONTHDAY=14',
      'FREQ=MONTHLY;INTERVAL=2;BYMONTHDAY=1',
      'FREQ=YEARLY;BYMONTH=9;BYMONTHDAY=8',
    ]) {
      const rule = parseRRule(line);
      expect(rule, line).not.toBeNull();
      expect(parseRRule(toRRule(rule!))).toEqual(rule);
    }
  });

  it('says the day the RULE names, not the one the start implies', () => {
    const rule = parseRRule('FREQ=MONTHLY;BYMONTHDAY=14');
    // TUE is the 8th; the rule says the 14th, and the rule wins.
    expect(words(rule, TUE, 'en-GB')).toBe('Monthly on day 14');
  });

  it('still refuses what that dialog cannot produce', () => {
    for (const bad of [
      'FREQ=MONTHLY;BYSETPOS=2;BYDAY=MO,TU',
      'FREQ=MONTHLY;BYMONTHDAY=1,15',
      'FREQ=YEARLY;BYYEARDAY=100',
      'FREQ=WEEKLY;BYWEEKNO=3',
      'FREQ=MONTHLY;BYMONTHDAY=14;BYDAY=2TU',
      'FREQ=WEEKLY;BYMONTHDAY=14',
      'FREQ=MONTHLY;BYMONTHDAY=32',
    ]) {
      expect(parseRRule(bad), bad).toBeNull();
    }
  });

  it('ignores WKST, which changes nothing this card draws', () => {
    expect(parseRRule('FREQ=WEEKLY;BYDAY=MO;WKST=SU')).toEqual({
      freq: 'WEEKLY', interval: 1, byDay: ['MO'], end: never,
    });
  });
});

group('normalise', () => {
  it('drops the parts a change of unit left behind', () => {
    // Exactly what the custom dialog produces when you go weekly -> monthly.
    const stale: Recurrence = {
      freq: 'MONTHLY', interval: 1, byDay: ['MO'], byPos: { pos: 1, day: 'MO' }, end: never,
    };
    expect(normalise(stale).byDay).toEqual([]);
    expect(toRRule(stale)).toBe('RRULE:FREQ=MONTHLY;BYDAY=1MO');
  });

  it('makes two rules that emit the same line compare equal', () => {
    const viaDialog: Recurrence = {
      freq: 'MONTHLY', interval: 1, byDay: ['TU'], byPos: { pos: 2, day: 'TU' }, end: never,
    };
    const viaPreset = presets(TUE)[3].rule!;
    expect(toRRule(viaDialog)).toBe(toRRule(viaPreset));
    expect(sameRecurrence(viaDialog, viaPreset)).toBe(true);
    expect(matchPreset(viaDialog, TUE)).toBe('monthly');
  });

  it('never leaves a monthly rule on both a weekday and a date', () => {
    const both: Recurrence = {
      freq: 'MONTHLY', interval: 1, byDay: [], byPos: { pos: 1, day: 'MO' }, byMonthDay: 7,
      end: never,
    };
    expect(normalise(both).byMonthDay).toBeUndefined();
  });
});
