/**
 * The subscription's event cache.
 *
 * The card subscribes three weeks at a time and steps the window as the week
 * changes. What matters here is what survives a step: a push is the complete
 * truth for the window it was asked about and nothing else, so it must replace
 * everything inside that window and leave everything outside it alone. Get that
 * wrong in either direction and the card either shows deleted lessons or blanks
 * a week it had already fetched.
 */

import { describe, expect, it } from 'vitest';
import { CalendarSubscriptions } from '../src/data/calendar-source';
import type { RawCalendarEvent } from '../src/types';

const iso = (d: Date): string => {
  const p = (n: number) => String(n).padStart(2, '0');
  return (
    `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}` +
    `T${p(d.getHours())}:${p(d.getMinutes())}:00`
  );
};

const raw = (day: Date, hour: number, summary: string): RawCalendarEvent => {
  const start = new Date(day.getFullYear(), day.getMonth(), day.getDate(), hour);
  const end = new Date(day.getFullYear(), day.getMonth(), day.getDate(), hour + 1);
  return { start: iso(start), end: iso(end), summary, uid: summary };
};

/**
 * A hass whose subscription hands back whatever the test says is in the window,
 * synchronously, the way the real one pushes on subscribe.
 */
function fakeHass(answers: Record<string, RawCalendarEvent[]>) {
  const calls: Array<{ start: string; end: string }> = [];
  return {
    calls,
    hass: {
      connection: {
        subscribeMessage: async (cb: (msg: unknown) => void, msg: Record<string, unknown>) => {
          calls.push({ start: msg.start as string, end: msg.end as string });
          cb({ events: answers[msg.start as string] ?? [] });
          return () => undefined;
        },
      },
      callService: async () => undefined,
    },
  };
}

const WEEK1 = new Date(2026, 8, 7); // Mon 7 Sep
const WEEK2 = new Date(2026, 8, 14);
const WEEK3 = new Date(2026, 8, 21);
const at = (d: Date, days = 0): Date =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate() + days);

describe('CalendarSubscriptions cache', () => {
  it('keeps events from windows it has moved past', async () => {
    const first = [raw(WEEK1, 8, 'week1'), raw(WEEK2, 8, 'week2')];
    const second = [raw(WEEK3, 8, 'week3')];
    const { hass } = fakeHass({
      [iso(WEEK1)]: first,
      [iso(WEEK3)]: second,
    });
    const subs = new CalendarSubscriptions(() => undefined);

    await subs.sync(hass as never, ['calendar.a'], WEEK1, at(WEEK3, 0));
    expect(subs.events.map((e) => e.summary).sort()).toEqual(['week1', 'week2']);

    // The window steps forward and no longer covers week 1 at all.
    await subs.sync(hass as never, ['calendar.a'], WEEK3, at(WEEK3, 7));
    expect(subs.events.map((e) => e.summary).sort()).toEqual(['week1', 'week2', 'week3']);
  });

  it('lets a push delete an event INSIDE its own window', async () => {
    const { hass } = fakeHass({
      [iso(WEEK1)]: [raw(WEEK1, 8, 'kept'), raw(WEEK1, 10, 'cancelled')],
    });
    const subs = new CalendarSubscriptions(() => undefined);
    await subs.sync(hass as never, ['calendar.a'], WEEK1, at(WEEK1, 7));
    expect(subs.events).toHaveLength(2);

    // Same window, and the lesson is gone from the answer this time.
    const { hass: hass2 } = fakeHass({ [iso(WEEK1)]: [raw(WEEK1, 8, 'kept')] });
    await subs.sync(hass2 as never, ['calendar.a'], WEEK1, at(WEEK1, 7), true);
    expect(subs.events.map((e) => e.summary)).toEqual(['kept']);
  });

  it('leaves the cache alone when a push fails', async () => {
    const { hass } = fakeHass({ [iso(WEEK1)]: [raw(WEEK1, 8, 'lesson')] });
    const subs = new CalendarSubscriptions(() => undefined);
    await subs.sync(hass as never, ['calendar.a'], WEEK1, at(WEEK1, 7));

    const failing = {
      connection: {
        subscribeMessage: async (cb: (msg: unknown) => void) => {
          cb({ events: null });
          return () => undefined;
        },
      },
      callService: async () => undefined,
    };
    await subs.sync(failing as never, ['calendar.a'], WEEK1, at(WEEK1, 7), true);
    // The last good answer is better than nothing; `failed` is what says it is stale.
    expect(subs.events.map((e) => e.summary)).toEqual(['lesson']);
    expect(subs.failed).toEqual(['calendar.a']);
  });

  it('clear() empties it, so a refresh cannot show a stale week', async () => {
    const { hass } = fakeHass({ [iso(WEEK1)]: [raw(WEEK1, 8, 'lesson')] });
    const subs = new CalendarSubscriptions(() => undefined);
    await subs.sync(hass as never, ['calendar.a'], WEEK1, at(WEEK1, 7));
    expect(subs.events).toHaveLength(1);
    subs.clear();
    expect(subs.events).toHaveLength(0);
  });
});

/**
 * Re-entrancy. The card calls sync() from `updated()`, which Home Assistant
 * triggers on every state change in the house, so sync() is routinely re-entered
 * while an earlier one is still awaiting its subscribes. Every spurious round
 * asks HA to expand months of recurrences for every calendar, on the same event
 * loop that feeds the websocket - which is how the frontend ends up starved.
 */
describe('CalendarSubscriptions re-entrancy', () => {
  /** A hass whose subscribeMessage resolves only when the test lets it. */
  function slowHass() {
    const calls: string[] = [];
    let release: (() => void) | null = null;
    const gate = new Promise<void>((r) => {
      release = r;
    });
    return {
      calls,
      release: () => release!(),
      hass: {
        connection: {
          subscribeMessage: async (cb: (msg: unknown) => void, msg: Record<string, unknown>) => {
            calls.push(msg.entity_id as string);
            await gate;
            cb({ events: [] });
            return () => undefined;
          },
        },
        callService: async () => undefined,
      },
    };
  }

  it('does not start a second round while the first is still in flight', async () => {
    const { hass, calls, release } = slowHass();
    const subs = new CalendarSubscriptions(() => undefined);
    const ids = ['calendar.a', 'calendar.b', 'calendar.c'];

    // One real call, then nine re-entrant ones for the SAME window, exactly as
    // a burst of re-renders produces.
    const first = subs.sync(hass as never, ids, WEEK1, at(WEEK1, 7));
    for (let i = 0; i < 9; i++) void subs.sync(hass as never, ids, WEEK1, at(WEEK1, 7));
    release();
    await first;

    // Three subscriptions - one per calendar - not thirty.
    expect(calls).toHaveLength(3);
  });

  it('still re-subscribes when the window genuinely moves', async () => {
    const { hass, calls } = fakeHass({});
    const subs = new CalendarSubscriptions(() => undefined);
    await subs.sync(hass as never, ['calendar.a'], WEEK1, at(WEEK1, 7));
    await subs.sync(hass as never, ['calendar.a'], WEEK2, at(WEEK2, 7));
    expect(calls).toHaveLength(2);
  });

  it('honours force even when the key is unchanged', async () => {
    const { hass, calls } = fakeHass({});
    const subs = new CalendarSubscriptions(() => undefined);
    await subs.sync(hass as never, ['calendar.a'], WEEK1, at(WEEK1, 7));
    await subs.sync(hass as never, ['calendar.a'], WEEK1, at(WEEK1, 7), true);
    expect(calls).toHaveLength(2);
  });
});
