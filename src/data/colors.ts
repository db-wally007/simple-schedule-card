/**
 * Per-calendar colour.
 *
 * Home Assistant stores a calendar's colour in ENTITY REGISTRY OPTIONS —
 * `options.calendar.color`, written from Google's `backgroundColor` by
 * `CalendarEntity.initial_color`. It is NOT in `hass.entities`: the display dict
 * the frontend preloads special-cases only `sensor` options. So it has to be
 * asked for explicitly, with `config/entity_registry/get_entries`, which carries
 * no admin requirement (only update/remove/update_settings do) and is therefore
 * safe for a non-admin kiosk user.
 *
 * `get_initial_entity_options()` runs only at INITIAL registration, so calendars
 * added before the feature landed have no colour at all. Hence the fallback.
 *
 * PER-EVENT colour is a different thing and is NOT available to any card.
 * Google returns `colorId` on every event and gcal_sync parses it, but
 * `_get_calendar_event()` in components/google/calendar.py copies exactly eight
 * fields into `CalendarEvent` and the colour is not one of them — the dataclass
 * has no colour field at all. So a calendar where the user has painted Lunch
 * yellow still arrives here as one flat calendar colour. `event_colors` in the
 * card config is the workaround.
 */

import type { CalendarSourceConfig } from '../types';

/** Apple system colours — distinguishable on a dark panel and from each other. */
export const PALETTE = [
  '#0a84ff',
  '#30d158',
  '#ff9f0a',
  '#bf5af2',
  '#ff375f',
  '#64d2ff',
  '#ffd60a',
  '#5e5ce6',
];

interface RegistryEntry {
  options?: { calendar?: { color?: string } };
}

/** entity_id to registry colour, for those that have one. */
export async function fetchRegistryColors(
  hass: { callWS: <T>(msg: Record<string, unknown>) => Promise<T> },
  entityIds: string[],
): Promise<Record<string, string>> {
  if (!entityIds.length) return {};
  const out: Record<string, string> = {};
  try {
    const res = await hass.callWS<Record<string, RegistryEntry | null>>({
      type: 'config/entity_registry/get_entries',
      entity_ids: entityIds,
    });
    for (const [id, entry] of Object.entries(res ?? {})) {
      const color = entry?.options?.calendar?.color;
      if (typeof color === 'string' && /^#[0-9a-fA-F]{6}$/.test(color)) out[id] = color;
    }
  } catch {
    // A missing colour is cosmetic; the palette covers it.
  }
  return out;
}

/** The registry's colour, then the palette by position. */
export function resolveColor(
  source: CalendarSourceConfig,
  registry: Record<string, string>,
  index: number,
): string {
  return registry[source.entity] ?? PALETTE[index % PALETTE.length];
}

/** A per-title override from `event_colors`, matched case-insensitively. */
export function eventColor(
  summary: string,
  overrides: Record<string, string> | undefined,
): string | undefined {
  if (!overrides) return undefined;
  const want = summary.trim().toLowerCase();
  for (const [key, value] of Object.entries(overrides)) {
    if (key.trim().toLowerCase() === want) return value;
  }
  return undefined;
}

/**
 * Per-event colours published by the `simple_schedule_colors` pyscript helper.
 *
 * Home Assistant downloads Google's per-event colour and then discards it at the
 * integration boundary (see the note at the top of this file). The helper reads
 * it back out of the store HA has already written and publishes it here. The
 * helper is entirely optional: if the file is absent the card simply falls back
 * to calendar-level colour, so a missing file is not an error and is never
 * logged as one.
 */
export interface EventColorMap {
  by_uid: Record<string, string>;
  by_recurrence_id: Record<string, string>;
}

export const DEFAULT_COLOR_HELPER_URL = '/local/simple-schedule-card-data/event-colors.json';

export async function fetchEventColors(url: string): Promise<EventColorMap | null> {
  try {
    // The helper rewrites this atomically every 15 minutes; no-cache keeps a
    // proxy or service worker from pinning an old copy.
    const res = await fetch(url, { cache: 'no-cache' });
    if (!res.ok) return null;
    const data = (await res.json()) as Partial<EventColorMap>;
    return {
      by_uid: data.by_uid ?? {},
      by_recurrence_id: data.by_recurrence_id ?? {},
    };
  } catch {
    return null;
  }
}

/**
 * A modified single occurrence carries its own colour and beats the series it
 * belongs to, so `recurrence_id` is checked before `uid`.
 */
export function lookupEventColor(
  map: EventColorMap | null,
  uid: string | undefined,
  recurrenceId: string | undefined,
): string | undefined {
  if (!map) return undefined;
  if (recurrenceId && map.by_recurrence_id[recurrenceId]) return map.by_recurrence_id[recurrenceId];
  if (uid && map.by_uid[uid]) return map.by_uid[uid];
  return undefined;
}

/** WCAG relative luminance of an sRGB triple. */
function luminance(r: number, g: number, b: number): number {
  const lin = (v: number): number => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

/** Contrast ratio of white text on a fill of this luminance. */
function contrastOnWhite(l: number): number {
  return 1.05 / (l + 0.05);
}

/**
 * Darken a fill until white text on it reaches `target` contrast.
 *
 * The labels here are always white, and Google's palette is tuned for its own
 * UI, which puts DARK text on those fills — white on Flamingo `#e67c73` is only
 * 2.9:1, which is why the untouched palette reads as washed out. Scaling the
 * channels keeps the hue and only removes lightness, which is the same move
 * Google's dark mode makes.
 *
 * Returns the colour unchanged when it already passes, or when `target` is 0.
 */
export function darkenForContrast(hex: string, target: number): string {
  const m = /^#([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/.exec(hex);
  if (!m || !(target > 1)) return hex;
  const r = parseInt(m[1], 16);
  const g = parseInt(m[2], 16);
  const b = parseInt(m[3], 16);
  if (contrastOnWhite(luminance(r, g, b)) >= target) return hex;

  // Luminance falls monotonically as the channels scale down, so bisect for the
  // LARGEST factor that still passes — the least darkening that does the job.
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 24; i++) {
    const mid = (lo + hi) / 2;
    if (contrastOnWhite(luminance(r * mid, g * mid, b * mid)) >= target) lo = mid;
    else hi = mid;
  }
  const k = lo;
  const hx = (v: number) =>
    Math.max(0, Math.min(255, Math.round(v * k)))
      .toString(16)
      .padStart(2, '0');
  return `#${hx(r)}${hx(g)}${hx(b)}`;
}
