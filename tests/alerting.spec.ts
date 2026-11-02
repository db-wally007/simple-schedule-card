/**
 * Alerts on events: the words the form uses, which reminders belong to which
 * event, and what an unavailable alerting integration is reported as.
 */

import { describe as group, expect, it } from 'vitest';
import {
  DEFAULT_OFFSET_MINS,
  alertingErrorText,
  alertsSummary,
  firstOccurrenceId,
  hasReminderKey,
  offsetLabel,
  offsetShort,
  OFFSET_PRESETS,
  reminderKeys,
  remindersFor,
  splitOffset,
  titleKey,
  uidOf,
  type Reminder,
} from '../src/data/alerting';

function rem(over: Partial<Reminder>): Reminder {
  return {
    ui_id: 1,
    entity_id: 'alert2.rule_x',
    name: 'Gymnastics',
    calendar: 'calendar.kids',
    match: 'series',
    uid: 'gym@google.com',
    recurrence_id: null,
    title: null,
    summary: 'Gymnastics',
    start: null,
    all_day: false,
    offset_mins: 30,
    push: [],
    banner: [],
    priority: 'low',
    ...over,
  };
}

group('words', () => {
  it('offers a short list, the rest is Custom', () => {
    expect(OFFSET_PRESETS.map(offsetLabel)).toEqual([
      'At start of event',
      '5 minutes before',
      '1 hour before',
      '1 day before',
    ]);
    expect(OFFSET_PRESETS).toContain(DEFAULT_OFFSET_MINS);
    expect(offsetLabel(10080)).toBe('1 week before');
  });

  it('says a custom one in parts', () => {
    expect(offsetLabel(90)).toBe('1 hour 30 minutes before');
    expect(offsetLabel(1441)).toBe('1 day 1 minute before');
    expect(offsetShort(90)).toBe('1 h 30 min');
    expect(offsetShort(20160)).toBe('2 weeks');
    expect(splitOffset(1530)).toEqual({ days: 1, hours: 1, minutes: 30 });
  });

  it('summarises the fold', () => {
    expect(alertsSummary([])).toBe('None');
    expect(alertsSummary([30])).toBe('30 min before');
    expect(alertsSummary([0])).toBe('At start of event');
    expect(alertsSummary([1440, 30])).toBe('1 day, 30 min');
    expect(alertsSummary([1, 2, 3])).toBe('3 alerts');
  });
});

group('which reminders an event has', () => {
  const series = rem({ ui_id: 1 });
  const occ = rem({ ui_id: 2, match: 'event', recurrence_id: 'gym_20261021T160000Z' });
  const single = rem({ ui_id: 3, match: 'event', uid: 'cook@google.com' });
  const otherCal = rem({ ui_id: 4, calendar: 'calendar.other' });
  const all = [series, occ, single, otherCal];

  it('gives an occurrence its series reminders and its own', () => {
    const ev = { entity: 'calendar.kids', uid: 'gym@google.com', recurrenceId: 'gym_20261021T160000Z' };
    expect(remindersFor(ev, all).map((r) => r.ui_id)).toEqual([1, 2]);
    const next = { ...ev, recurrenceId: 'gym_20261028T160000Z' };
    expect(remindersFor(next, all).map((r) => r.ui_id)).toEqual([1]);
  });

  it('gives a one-off its own, and nothing for an event without a uid', () => {
    expect(remindersFor({ entity: 'calendar.kids', uid: 'cook@google.com' }, all).map((r) => r.ui_id)).toEqual([3]);
    expect(remindersFor({ entity: 'calendar.kids' }, all)).toEqual([]);
  });

  it('answers the same from keys', () => {
    const keys = reminderKeys(all);
    expect(hasReminderKey(keys, { entity: 'calendar.kids', uid: 'gym@google.com', recurrenceId: 'gym_x' })).toBe(true);
    expect(hasReminderKey(keys, { entity: 'calendar.kids', uid: 'cook@google.com' })).toBe(true);
    expect(hasReminderKey(keys, { entity: 'calendar.kids', uid: 'lunch@google.com' })).toBe(false);
    expect(hasReminderKey(new Set(), { entity: 'calendar.kids', uid: 'cook@google.com' })).toBe(false);
  });

  it('gives every event with a title its title\'s reminders, in that calendar only', () => {
    const byTitle = rem({ ui_id: 9, match: 'title', uid: null, title: 'PrB' });
    const list = [byTitle, otherCal];
    const lesson = (uid: string, summary: string, entity = 'calendar.kids') => ({ entity, uid, summary });
    expect(remindersFor(lesson('bak1@google.com', 'PrB'), list).map((r) => r.ui_id)).toEqual([9]);
    // trimmed, any case - as the integration compares them
    expect(remindersFor(lesson('bak2@google.com', ' prb '), list).map((r) => r.ui_id)).toEqual([9]);
    expect(remindersFor(lesson('bak3@google.com', 'PrB 2'), list)).toEqual([]);
    expect(remindersFor(lesson('bak4@google.com', 'PrB', 'calendar.other'), list)).toEqual([]);
    // no uid needed: a title is enough
    expect(remindersFor({ entity: 'calendar.kids', summary: 'PrB' }, list).map((r) => r.ui_id)).toEqual([9]);
    const keys = reminderKeys(list);
    expect(hasReminderKey(keys, lesson('bak5@google.com', 'PRB'))).toBe(true);
    expect(hasReminderKey(keys, lesson('bak6@google.com', 'M'))).toBe(false);
    expect(titleKey('  PrB ')).toBe('prb');
  });
});

group('ids', () => {
  it('names a new series\' first occurrence as Google does', () => {
    // 18:00 Central European Summer Time on 21 Oct 2026 is 16:00 UTC
    const start = new Date(Date.UTC(2026, 9, 21, 16, 0, 0));
    expect(firstOccurrenceId('abc', start, false)).toBe('abc_20261021T160000Z');
    expect(firstOccurrenceId('abc', new Date(2026, 9, 21), true)).toBe('abc_20261021');
    expect(uidOf('abc')).toBe('abc@google.com');
    expect(uidOf('abc@google.com')).toBe('abc@google.com');
  });
});

group('when alerting is not there', () => {
  it('tells missing from too old', () => {
    const err = { code: 'unknown_command', message: 'Unknown command.' };
    expect(alertingErrorText(err, ['calendar'])).toMatch(/not installed/);
    expect(alertingErrorText(err, ['calendar', 'alert2'])).toMatch(/this version/);
    expect(alertingErrorText({ code: 'not_ready' })).toMatch(/still starting/);
    expect(alertingErrorText({ code: 3, message: 'Connection lost' })).toBe('Alerting did not answer: Connection lost');
  });
});
