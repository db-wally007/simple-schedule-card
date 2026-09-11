/** Shared types for simple-schedule-card. */

/**
 * `focused` (the default) fits the time axis to the calendar's own events, so a
 * school week starts at the first lesson and ends at the last. `full` draws the
 * whole day, midnight to midnight, for a calendar whose events are scattered
 * and whose empty hours are worth seeing — a bin collection at 04:00 says more
 * with the rest of the day around it.
 */
export type CalendarMode = 'focused' | 'full';

/**
 * `fixed` gives every hour the same pixel width whatever the screen, so a block
 * of a given length always looks the same and the grid scrolls when the day is
 * wider than the card. `adaptive` squeezes the whole span into the card instead,
 * so nothing scrolls and an hour is as wide as it needs to be.
 *
 * Only meaningful for `days-as-rows`, which is the orientation with a
 * horizontal axis to fit.
 */
export type ViewWidthMode = 'fixed' | 'adaptive';

export interface CalendarSourceConfig {
  entity: string;
  calendar_mode?: CalendarMode;
  view_width_mode?: ViewWidthMode;
  /**
   * A `person.*` whose picture becomes the calendar's avatar. The picture lives
   * on the PERSON, not on a Home Assistant user — a person can have one without
   * having a login at all — so this points at a person even when the calendar
   * belongs to someone who can sign in.
   *
   * Without it, or without a picture, the avatar falls back to the first letter
   * of the calendar's name on its own colour.
   */
  person?: string;
}

/**
 * `auto` draws Mon–Fri, and adds BOTH weekend days as soon as either of them has
 * an event. The full week is always fetched either way; this only decides what
 * is drawn.
 */
export type DaysOption = 'mon-fri' | 'mon-sun' | 'auto';
export type LaneMode = 'by_source' | 'packed';
export type LayoutOption = 'auto' | 'grid' | 'list';
/**
 * Which axis the days run along. `days-as-columns` is the calendar-style grid:
 * days across the top, time down the left. `days-as-rows` transposes it into a
 * timetable: days down the left, time across the top.
 */
export type Orientation = 'days-as-columns' | 'days-as-rows';

export interface SimpleScheduleCardConfig {
  type: string;
  /** Shorthand for a single calendar. `entities` wins when both are given. */
  entity?: string;
  entities?: Array<string | CalendarSourceConfig>;
  days?: DaysOption;
  /** 'HH:MM' or 'auto' (derive from the week, applied to every column alike). */
  day_start?: string;
  day_end?: string;
  orientation?: Orientation;
  /**
   * `days-as-columns`: pixels per hour, so the card's height follows from this
   * and the axis span.
   */
  hour_height?: number;
  /**
   * `days-as-rows`: pixels per lane within a day's row, so a row is this tall
   * times the number of lanes the week needs.
   */
  day_height?: number;
  /**
   * `days-as-rows`: pixels per hour along the time axis. A FIXED scale rather
   * than stretching to the container, so a block is the same width whatever the
   * screen and a title of a given length always fits. The default sizes a
   * 45-minute block to hold about 16 characters; the grid scrolls horizontally
   * when the week is wider than the card.
   */
  hour_width?: number;
  lane_mode?: LaneMode;
  /** 'auto' follows Home Assistant's own setting; '12'/'24' pin it for this card. */
  time_format?: 'auto' | '12' | '24';
  show_refresh?: boolean;
  layout?: LayoutOption;
  layout_breakpoint?: number;
  /**
   * Colour by event title, e.g. `Lunch: '#f4c542'`. An explicit override that
   * beats everything else, including the colour helper. Matched
   * case-insensitively on the exact summary.
   */
  event_colors?: Record<string, string>;
  /**
   * Minimum contrast ratio between a block's fill and its white label. Fills
   * lighter than this are darkened until they pass. 4.5 is WCAG AA for body
   * text; lower it (3.5 is still readable) for a brighter grid, or set 0 to use
   * Google's palette untouched.
   */
  min_contrast?: number;
  /**
   * Per-event colours published by the `simple_schedule_colors` pyscript helper,
   * which recovers what Home Assistant discards. Set `false` to ignore it even
   * when present, or a string to point at a different path.
   */
  color_helper?: boolean | string;
}

/**
 * One event exactly as `calendar/event/subscribe` pushes it — the flat form from
 * `CalendarEvent.as_dict()`. NOT the nested `{"dateTime": ...}` shape the REST
 * view returns; the two differ and this card only ever speaks the flat one.
 */
export interface RawCalendarEvent {
  /** Local ISO with offset, or a bare 'YYYY-MM-DD' when all_day. */
  start: string;
  end: string;
  summary?: string;
  description?: string | null;
  location?: string | null;
  uid?: string | null;
  recurrence_id?: string | null;
  rrule?: string | null;
  all_day?: boolean;
}

/** An event resolved onto the local timeline and tagged with its source calendar. */
export interface ScheduleEvent {
  key: string;
  entity: string;
  /** iCalUID — shared by every occurrence of a recurring series. */
  uid?: string;
  /** Set only on a singly-modified occurrence, which may carry its own colour. */
  recurrenceId?: string;
  summary: string;
  description?: string;
  location?: string;
  start: Date;
  end: Date;
  allDay: boolean;
}
