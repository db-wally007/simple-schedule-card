/**
 * Live calendar events over the WebSocket.
 *
 * `calendar/event/subscribe` takes a fixed {entity_id, start, end} window and
 * PUSHES a fresh event list every time the entity writes state, debounced 1s.
 * No polling, and no 15-minute wait for anything Home Assistant already knows.
 *
 * What it cannot do on its own is make Google talk sooner: the Google
 * coordinator refreshes its cache on a 15-minute interval and
 * `async_get_events()` reads that cache rather than the API. `forceUpdate()`
 * below drives `homeassistant.update_entity` to start that poll immediately,
 * which is what the card's refresh button uses.
 */

import { toScheduleEvent } from './week';
import type { RawCalendarEvent, ScheduleEvent } from '../types';

interface HassLike {
  connection: {
    subscribeMessage: <T>(
      cb: (msg: T) => void,
      msg: Record<string, unknown>,
    ) => Promise<() => void>;
  };
  callService: (
    domain: string,
    service: string,
    data?: Record<string, unknown>,
  ) => Promise<unknown>;
}

interface EventsPush {
  events: RawCalendarEvent[] | null;
}

export class CalendarSubscriptions {
  private _unsubs: Array<() => void> = [];
  /**
   * Every event seen so far, per entity — NOT just the current window's.
   *
   * A push is authoritative only for the window it was asked about, so it
   * replaces what is cached INSIDE that window and leaves everything outside it
   * alone. Deletions and edits within the window are therefore honoured, while
   * weeks fetched earlier stay drawable.
   *
   * That is what stops a week arriving empty. Stepping the window re-subscribes,
   * and until the new push lands there is nothing to draw for any week the old
   * window did not cover — which is why clicking through weeks quickly used to
   * show one or two seconds of blank calendar before the events snapped in.
   */
  private _byEntity = new Map<string, ScheduleEvent[]>();
  private _failed = new Set<string>();
  private _key = '';
  /**
   * The window a `sync` is part-way through establishing.
   *
   * Without it there is a gap of several awaits between `_key` being set and the
   * first subscription landing in `_unsubs`, and during that gap the early-out
   * below sees the right key but `subscribed === false` and starts the whole
   * round again. Anything that re-renders the card in those milliseconds - and
   * the card re-renders on every state change in the house - therefore spawns
   * another full set of subscriptions, each asking Home Assistant to expand
   * three months of recurrences for every calendar.
   */
  private _syncing: string | null = null;

  constructor(private readonly _onChange: () => void) {}

  /** Every calendar's cached events, flattened. */
  get events(): ScheduleEvent[] {
    const all: ScheduleEvent[] = [];
    for (const list of this._byEntity.values()) all.push(...list);
    return all;
  }

  /**
   * Fold a window's worth of pushed events into the cache for one entity.
   *
   * Anything cached that overlaps [start, end) is dropped first: the push is the
   * complete truth for that span, so an event it no longer contains is gone.
   */
  private _merge(entity: string, events: ScheduleEvent[], start: Date, end: Date): void {
    const from = start.getTime();
    const to = end.getTime();
    const kept = (this._byEntity.get(entity) ?? []).filter(
      (e) => e.start.getTime() >= to || e.end.getTime() <= from,
    );
    this._byEntity.set(entity, [...kept, ...events]);
  }

  /** Forget everything cached. Used when a refresh must not show stale events. */
  clear(): void {
    this._byEntity.clear();
  }

  /** Calendars whose last push was an error. */
  get failed(): string[] {
    return [...this._failed];
  }

  get subscribed(): boolean {
    return this._unsubs.length > 0;
  }

  /**
   * Subscribe to `entityIds` over [start, end). A no-op when already subscribed
   * to exactly that; pass `force` to tear down and rebuild regardless, which is
   * what the refresh button does.
   */
  async sync(
    hass: HassLike,
    entityIds: string[],
    start: Date,
    end: Date,
    force = false,
  ): Promise<void> {
    const key = `${entityIds.join(',')}|${start.getTime()}|${end.getTime()}`;
    // `_syncing` covers the window where this key is claimed but no subscription
    // has landed yet; without it a re-render mid-flight starts the round again.
    if (!force && key === this._key && (this.subscribed || this._syncing === key)) return;
    this._key = key;
    this._syncing = key;
    this.stop();

    const startIso = toLocalIso(start);
    const endIso = toLocalIso(end);

    try {
      await this._subscribeAll(hass, entityIds, key, start, end, startIso, endIso);
    } finally {
      // Only if this call is still the current one - a newer sync has already
      // claimed the flag and must keep it until IT finishes.
      if (this._syncing === key) this._syncing = null;
    }
  }

  private async _subscribeAll(
    hass: HassLike,
    entityIds: string[],
    key: string,
    start: Date,
    end: Date,
    startIso: string,
    endIso: string,
  ): Promise<void> {
    for (const entity of entityIds) {
      try {
        const unsub = await hass.connection.subscribeMessage<EventsPush>(
          (msg) => {
            // A subscription that resolved after the window moved on would
            // otherwise write events for the wrong week.
            if (this._key !== key) return;
            if (!msg || msg.events === null) {
              // A failed push says nothing about the calendar, so the cache is
              // left alone rather than emptied - the last good answer is still
              // the best one available, and the warning icon says it is stale.
              this._failed.add(entity);
            } else {
              this._failed.delete(entity);
              this._merge(
                entity,
                msg.events
                  .map((raw, i) => toScheduleEvent(raw, entity, i))
                  .filter((e): e is ScheduleEvent => e !== null),
                start,
                end,
              );
            }
            this._onChange();
          },
          {
            type: 'calendar/event/subscribe',
            entity_id: entity,
            start: startIso,
            end: endIso,
          },
        );
        if (this._key !== key) {
          unsub();
          return;
        }
        this._unsubs.push(unsub);
      } catch {
        // One bad calendar must not take the others down with it. As above, what
        // was already cached for it is kept.
        this._failed.add(entity);
        this._onChange();
      }
    }
  }

  /**
   * Ask Home Assistant to re-poll the calendars now.
   *
   * Google's coordinator serves reads from a cache it refreshes every 15
   * minutes, so without this a change made in Google can take that long to
   * appear. `homeassistant.update_entity` reaches
   * `CoordinatorEntity.async_update` -> `async_request_refresh()`, whose
   * debouncer is immediate, so the poll starts at once. It RETURNS before the
   * poll finishes; the result arrives through the existing subscriptions.
   */
  async forceUpdate(hass: HassLike, entityIds: string[]): Promise<void> {
    if (!entityIds.length) return;
    try {
      await hass.callService('homeassistant', 'update_entity', {
        entity_id: entityIds,
      });
    } catch {
      // Best effort — the re-subscribe still refreshes what HA already holds.
    }
  }

  /**
   * Ask the colour helper to republish, if it is installed.
   *
   * It reads Home Assistant's in-memory event store, so this must run AFTER the
   * calendars have re-polled or it will just republish what was already there.
   * Silently ignored when pyscript or the helper is absent — the helper is
   * optional and the card works without it.
   */
  async refreshColorHelper(hass: HassLike): Promise<void> {
    try {
      await hass.callService('pyscript', 'simple_schedule_colors_sync', {});
    } catch {
      // Not installed. Fine.
    }
  }

  stop(): void {
    for (const unsub of this._unsubs) {
      try {
        unsub();
      } catch {
        // Already gone with the connection.
      }
    }
    this._unsubs = [];
  }
}

/**
 * Local ISO WITHOUT a zone suffix. The backend validates with `cv.datetime` and
 * then calls `dt_util.as_local()`, so a naive string is read in HA's own zone —
 * which is what a school timetable means by "Monday morning". Sending a UTC
 * 'Z' string would shift the window by the offset.
 */
function toLocalIso(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return (
    `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}` +
    `T${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
  );
}
