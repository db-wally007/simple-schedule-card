import { LitElement, html, css, nothing, type PropertyValues, type TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

import { CalendarSubscriptions } from './data/calendar-source';
import {
  DEFAULT_COLOR_HELPER_URL,
  type EventColorMap,
  darkenForContrast,
  eventColor,
  fetchEventColors,
  fetchRegistryColors,
  lookupEventColor,
  resolveColor,
} from './data/colors';
import { placeWeek } from './data/lanes';
import {
  describe as describeRepeat,
  matchPreset,
  presets as repeatPresets,
  toRRule,
  RFC_DAYS,
  WEEK_ORDER,
  type Freq,
  type Recurrence,
} from './data/recurrence';
import {
  BASEMAPS,
  LEAFLET_CSS,
  type BaseMap,
  MIN_QUERY_LEN,
  loadLeaflet,
  mapsLink,
  previewTiles,
  reverseGeocode,
  searchPlaces,
  type Place,
} from './data/geo';
import {
  axisBounds,
  eventsForDay,
  startOfDay,
  weekendHasEvents,
  weekWindow,
} from './data/week';
import type {
  CalendarMode,
  ModeToggleIcons,
  CalendarSourceConfig,
  ScheduleEvent,
  SimpleScheduleCardConfig,
  ViewWidthMode,
} from './types';

/**
 * simple-schedule-card — a whole week of calendar events as a proportional time
 * grid: hours down the left, days across the top.
 *
 * Two things make it different from every stock calendar card.
 *
 * 1. It shows the CURRENT WEEK, not the next N days. On Wednesday you still see
 *    Monday. Stock cards are all "upcoming" lists and structurally cannot.
 *
 * 2. The grid is a UNIFORM LATTICE. Any hour band occupies the same pixels in
 *    every column, an empty Friday is exactly as wide as a busy Monday, and the
 *    column subdivision is resolved once for the whole week and applied to all
 *    days alike. When geometry does change, everything rescales together.
 *
 * Events arrive over calendar/event/subscribe, which pushes rather than polls.
 * Grouping is by SOURCE CALENDAR: each kind of activity is its own calendar
 * entity and gets its own colour, and in by_source mode its own column.
 */

const CARD_VERSION = '2.0.0';

const DEFAULTS = {
  days: 'auto' as const,
  day_start: '07:00',
  day_end: '15:00',
  orientation: 'days-as-columns' as const,
  hour_height: 84,
  day_height: 72,
  // 192px/hour puts a 45-minute block at 144px, ~126px of text inside, which is
  // about 16 characters at the block's 15px/600 face (measured, not guessed).
  // Wider than the screen for a normal school day, hence the scroller.
  hour_width: 192,
  lane_mode: 'by_source' as const,
  time_format: 'auto' as const,
  min_contrast: 4.5,
  show_refresh: true,
  show_mode_toggles: true,
  mode_toggle_icons: 'crop' as const,
  animations: 'auto' as const,
  layout: 'auto' as const,
  layout_breakpoint: 560,
};

/**
 * Half the width of an hour label, near enough. "17:00" at 14px tabular figures
 * measures about 40px, and it is centred on its tick, so this is how far it
 * reaches either side.
 */
const HOUR_LABEL_HALF_PX = 22;

/** Minimum block height. Below this a 15-minute activity has no readable label. */
const MIN_BLOCK_PX = 28;
/*
 * The same idea along the other axis, for the transposed grid - but stated in
 * MINUTES, not pixels, because the transposed grid has two scales.
 *
 * It was 40px, which is fine in view_width_mode:fixed (192px/hour makes a
 * 45-minute lesson 144px, so the floor only ever caught events under about
 * twelve minutes) and badly wrong in adaptive. Squeezing a whole 24-hour day
 * into ~1160px puts an hour at 48px, so 40px is nearly FIFTY MINUTES: the
 * floor fired on every ordinary lesson, painted 29 of 34 blocks wider than
 * their real duration, overlapped the next block by 4px wherever two lessons
 * abut, and welded the day into one solid bar with the gaps eaten. A
 * proportional axis is the card's whole promise, and an absolute pixel floor
 * silently breaks it at small scales.
 *
 * Twelve minutes is what 40px meant at the default hour_width, so fixed mode
 * is unchanged in practice, and it now scales with the axis instead of
 * fighting it.
 */
const MIN_BLOCK_MINUTES = 12;
/*
 * The scroll range is EXACTLY the schedule, and the void a bounce used to reveal
 * is handled by painting, not by content. Three attempts to fix it with content
 * all failed:
 *
 *   - stopping at the last event left flat card background on any bounce;
 *   - an hour of ruled grid either side became real scrollable area, so the
 *     card could come to rest in blank time;
 *   - the whole day, midnight to midnight, is how Apple and Google do it, but
 *     they show ~14 hours at once on a vertical axis. Here the viewport holds
 *     about five hours, so a day is five screens of mostly nothing.
 *
 * The row banding is therefore a repeating gradient on the SCROLLER rather than
 * a fill on each row. A scroll container's own background paints on its border
 * box and does not move when the content rubber-bands, so the stripes stay put
 * and a bounce reads as the rows continuing. Horizontal stripes are constant
 * along x, so nothing has to line up.
 */
/**
 * Per-row delay in the block cascade on a week change.
 *
 * 26ms read as everything arriving at once. At 55ms the five rows land in
 * sequence — visibly a cascade, still done inside a second.
 */
const STAGGER_MS = 55;
/**
 * Per-ROW delay in the list cascade, and the ceiling on it.
 *
 * The list has one row per event rather than one per day, so the grid's 55ms
 * would run to nearly two seconds over a full week. 22ms sweeps visibly and the
 * cap keeps the tail from dragging however many events a day holds.
 */
const LIST_STAGGER_MS = 22;
const LIST_STAGGER_CAP_MS = 520;
/**
 * The week LEAVING: a short fade and fold away, before the new one is built.
 *
 * Short because nothing is learned from watching content go, and accelerating
 * (ease-in) because it is being dismissed - the arrival gets the decelerating
 * curve. Shorter than the arrival on purpose: the eye should spend its time on
 * the week that is coming.
 */
/**
 * Where the week pill stops counting weeks and starts counting months, and then
 * years. Eight weeks is about as far as a week count stays readable — past that
 * "In 11 Weeks" is arithmetic, not information. The divisors are the real
 * averages, so a month count never drifts against the calendar.
 */
const WEEKS_BEFORE_MONTHS = 8;
const WEEKS_PER_MONTH = 4.345;
const WEEKS_PER_YEAR = 52.18;

const NAV_OUT_MS = 230;
const NAV_OUT_EASE = 'cubic-bezier(0.4, 0, 1, 1)';
const NAV_OUT_SHIFT = 16;
const NAV_OUT_SCALE = 0.985;

/** Which occurrences an edit or delete applies to. Mirrors the pyscript helper. */
type EditScope = 'instance' | 'future' | 'series';

/**
 * Google's event palette, id to hex.
 *
 * The same eleven the API takes on `colorId`, and the same ones the colour
 * helper publishes — it fetches them live from Google's colors endpoint, so a
 * hex arriving in event-colors.json can be turned back into the id to send.
 * Verified against a real calendar: every colour in the published map is one of
 * these, exactly.
 */
const GOOGLE_EVENT_COLORS: Array<[string, string, string]> = [
  ['1', '#a4bdfc', 'Lavender'],
  ['2', '#7ae7bf', 'Sage'],
  ['3', '#dbadff', 'Grape'],
  ['4', '#ff887c', 'Flamingo'],
  ['5', '#fbd75b', 'Banana'],
  ['6', '#ffb878', 'Tangerine'],
  ['7', '#46d6db', 'Peacock'],
  ['8', '#e1e1e1', 'Graphite'],
  ['9', '#5484ed', 'Blueberry'],
  ['10', '#51b749', 'Basil'],
  ['11', '#dc2127', 'Tomato'],
];

/** Which field's inline picker is open, if any. */
type PickerField = 'startDate' | 'startTime' | 'endDate' | 'endTime' | 'untilDate' | null;

/** Row height of a wheel column, and how many rows show at once. Both in px. */
const WHEEL_ITEM_H = 44;
const WHEEL_ROWS = 5;

/** The edit form's values, split into the fields the inputs actually bind to. */
interface EventDraft {
  /** The event this was opened from, so a re-render cannot rebind it elsewhere. */
  key: string;
  entity: string;
  /** Google's id for the occurrence — what the pyscript services take. Empty for a new event. */
  eventId: string;
  /** Creating rather than changing: no id yet, no delete, no recurrence scope. */
  isNew: boolean;
  recurring: boolean;
  summary: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  location: string;
  description: string;
  allDay: boolean;
  /** Google palette id, or '' for "whatever colour the calendar is". */
  colorId: string;
  /** The repeat rule, or null for a one-off. New events only — see _renderEditor. */
  repeat: Recurrence | null;
}

/** A Date split the way <input type="date"> and <input type="time"> want it. */
function splitLocal(d: Date): { date: string; time: string } {
  const p = (n: number) => String(n).padStart(2, '0');
  return {
    date: `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`,
    time: `${p(d.getHours())}:${p(d.getMinutes())}`,
  };
}

/** The day after a yyyy-mm-dd, over month and year ends. */
function nextDay(date: string): string {
  const d = new Date(`${date}T00:00`);
  d.setDate(d.getDate() + 1);
  return splitLocal(d).date;
}

/* ---- creating an event by pressing the grid --------------------------- *
 *
 * A press, not a tap: a tap on a block already opens it, and on a wall tablet
 * the grid is also the thing you steady the slate with. Half a second of
 * deliberate contact is the line between "I meant this" and a brushed screen,
 * and it is what every calendar app on a touchscreen asks for.
 * ----------------------------------------------------------------------- */

/** How long an empty slot has to be held before the new-event sheet opens. */
const PRESS_MS = 520;
/** Travel that turns a press into a scroll, in px. */
const PRESS_SLOP_PX = 10;
/** New events start on this grid, and last this long. Minutes. */
const NEW_SNAP_MIN = 15;
const NEW_EVENT_MIN = 30;

/** Round minutes down onto the snap grid. Where you pressed is where it starts. */
function snapMinutes(minutes: number): number {
  return Math.max(0, Math.floor(minutes / NEW_SNAP_MIN) * NEW_SNAP_MIN);
}


/**
 * Where a press landed, and how to draw the slot it is claiming.
 *
 * The two grids disagree about everything — which axis is time, whether it is
 * measured in px or %, how tall a row is — so each renderer hands over its own
 * arithmetic rather than this code trying to reconstruct it from the DOM.
 */
interface PressGeom {
  /** Which axis carries time in this layout. */
  axis: 'x' | 'y';
  /** Minutes from midnight at the near edge of the canvas, and its span. */
  start: number;
  span: number;
  /**
   * Which surface is being held: the timeline itself, or the day's label.
   *
   * They share a day index, so without this both would light up at once — the
   * slot inside the grid AND the cell naming the day.
   */
  kind: 'slot' | 'label';
  /** Inline style placing the ghost, given the block's start and end in minutes. */
  ghost: (from: number, to: number) => string;
}

/**
 * The day-label press, which every layout offers in the same shape.
 *
 * A label names a day and says nothing about a time, so it means the current
 * clock time on that day — exactly as the + button does — and _fitSlot trims it
 * to whatever room is actually there. `span: 0` collapses the position maths to
 * "wherever on the label you pressed, it is the same answer".
 */
function labelPress(nowMinutes: number): PressGeom {
  return { axis: 'y', start: nowMinutes, span: 0, kind: 'label', ghost: () => '' };
}
/**
 * Narrowest an hour may get before the axis starts skipping labels.
 *
 * "10:00" is about 40px at the label's size; 64 leaves it air on both sides. At
 * 24 hours in a ~1000px card an hour is ~42px, so without this the labels run
 * into each other and the axis reads as one smear of digits.
 */
const MIN_HOUR_PX = 64;
/** Air left before the first event when a full-day calendar scrolls into place. */
const FOCUS_LEAD_MIN = 20;
/** Must track --rday-w and the panel padding in the stylesheet. */
const RDAY_W = 172;
const PANEL_PAD = 18;
/**
 * Icons for the two header mode toggles, keyed by the mode each button is
 * currently IN. Four sets of the same two controls, differing only in metaphor:
 *   crop      - the axis is cropped to the lessons, or uncropped
 *   timeline  - the most literal word for what the axis is
 *   calendar  - a bounded range, or the expanded day
 *   arrows    - plain collapse/expand; note both controls then speak the same
 *               horizontal-arrow language and blur together at 40px
 * The width half is shared by three of them because fit-to-screen against
 * pan is already the clearest pair for "does this scroll".
 */
const TOGGLE_ICONS: Record<
  ModeToggleIcons,
  { focused: string; full: string; fixed: string; adaptive: string }
> = {
  crop: {
    focused: 'mdi:crop',
    full: 'mdi:crop-free',
    fixed: 'mdi:pan-horizontal',
    adaptive: 'mdi:fit-to-screen-outline',
  },
  timeline: {
    focused: 'mdi:timeline-clock-outline',
    full: 'mdi:timeline-outline',
    fixed: 'mdi:pan-horizontal',
    adaptive: 'mdi:overscan',
  },
  calendar: {
    focused: 'mdi:calendar-range',
    full: 'mdi:calendar-expand-horizontal',
    fixed: 'mdi:pan-horizontal',
    adaptive: 'mdi:fit-to-screen-outline',
  },
  arrows: {
    focused: 'mdi:arrow-collapse-horizontal',
    full: 'mdi:arrow-expand-horizontal',
    fixed: 'mdi:pan-horizontal',
    adaptive: 'mdi:fit-to-screen-outline',
  },
};

/** How long the refresh spinner is held even when the answer comes back at once. */
const SPIN_MIN_MS = 600;
/** Give up waiting for a push and stop the spinner. */
const SPIN_MAX_MS = 12000;
/** Let the calendars finish re-polling before asking the helper to republish. */
const REPOLL_SETTLE_MS = 2200;

/* ---- waiting for a write to come back ------------------------------- *
 *
 * A write goes to Google, Google tells Home Assistant, Home Assistant tells the
 * card. Closing the form the moment Google says "done" put the UNCHANGED week
 * back on screen for the length of that chain — three or four seconds of
 * looking like the edit had failed. So the form stays up, still saying Saving,
 * until the change is actually visible, which is usually well under a second.
 * ---------------------------------------------------------------------- */

/* ---- rubber band ----------------------------------------------------- *
 *
 * A sheet whose content fits is not a scroll container, so a drag on it goes
 * straight through to the page behind and the week scrolls under the form. The
 * same drag, in the same place, does nothing at all once the form is tall
 * enough to scroll — which is the part that reads as broken.
 *
 * So a drag that has nowhere to go is taken by the sheet and answered with
 * resistance, which is both the fix and the thing that says "this does not
 * scroll".
 * ---------------------------------------------------------------------- */

/** Furthest the sheet will ever travel, however hard it is pulled. */
const RUBBER_MAX_PX = 56;
/** How quickly the give runs out. Larger is looser. */
const RUBBER_SOFT_PX = 190;

/** How long to keep asking before giving up and closing anyway. */
const WRITE_SETTLE_MAX_MS = 6000;
/** Gap between re-fetches. Google is not always immediately consistent. */
const WRITE_REFETCH_MS = 700;
/** Gap between looks at what arrived. */
const WRITE_POLL_MS = 120;

@customElement('simple-schedule-card')
export class SimpleScheduleCard extends LitElement {
  @property({ attribute: false }) public hass?: any;

  @state() private _config?: SimpleScheduleCardConfig;
  @state() private _sources: CalendarSourceConfig[] = [];
  @state() private _colors: Record<string, string> = {};
  @state() private _eventColors: EventColorMap | null = null;
  @state() private _weekOffset = 0;
  @state() private _now = new Date();
  @state() private _hostWidth = 0;
  @state() private _refreshing = false;
  @state() private _selected?: ScheduleEvent;
  @state() private _navDir: 'none' | 'fwd' | 'back' = 'none';
  @state() private _activeIdx = 0;

  private _motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  private _onMotionChange = (): void => {
    this.requestUpdate();
  };

  /** The week change waiting on its fade-out. See _navigate. */
  private _navApply?: () => void;
  private _navAnims: Animation[] = [];
  /**
   * Fade-outs that have done their job and must be released after the render.
   *
   * A separate list from _navAnims, not a boolean, and that distinction is the
   * whole bug it was written for: a click arriving while a fade-out is still
   * running commits that one and starts a new fade IN THE SAME TICK, so by the
   * time the render came round, a "cancel whatever is in _navAnims" flag
   * cancelled the animation that had only just started. Its commit then never
   * ran, the week stayed put, and the NEXT click flushed it - every navigation
   * one click behind, for good, since the fault re-armed itself every time.
   */
  private _staleAnims: Animation[] = [];
  /** entity_id -> mode overrides set from the header toggles. Session only. */
  @state() private _modeOverride: Record<string, Partial<CalendarSourceConfig>> = {};
  @state() private _pickerOpen = false;
  /**
   * Bumped when the calendar menu closes, to REPLAY the entry cascade.
   *
   * A CSS animation only restarts when its name changes, so this alternates
   * between two identical keyframes. Re-rendering with the same name would
   * leave the finished animation exactly where it was.
   */
  @state() private _animEpoch = 0;
  @state() private _hThumb: { left: number; width: number } | null = null;
  /** Measured width of the time axis, for turning pixel margins into percents. */
  @state() private _axisPx = 0;

  /**
   * Edit mode. Off is the whole card as it was: tapping an event shows it.
   *
   * Deliberately a MODE rather than an edit button on every event. The card is a
   * wall display first, and a timetable that can be altered by a stray tap is
   * worse than one that cannot be altered at all. Turning it on is two
   * deliberate actions, and the header says so in red for as long as it lasts.
   */
  @state() private _editMode = false;
  @state() private _menuOpen = false;
  /** The event being edited, as form values. Null when just viewing. */
  @state() private _draft: EventDraft | null = null;
  /** Which occurrences a save or delete applies to. */
  @state() private _scope: EditScope = 'instance';
  /** Set while a write is in flight, so the form cannot be submitted twice. */
  @state() private _busy = false;
  @state() private _editError: string | null = null;
  /** Delete asks first. Set between the press and the confirmation. */
  @state() private _confirmDelete = false;
  /** The slot a press-and-hold is claiming: which day, which surface, how to draw it. */
  @state() private _press: { idx: number; kind: 'slot' | 'label'; style: string } | null = null;
  private _pressTimer?: ReturnType<typeof setTimeout>;
  private _pressFrom: { x: number; y: number } | null = null;
  /** Which date or time field has its wheel open. One at a time, like iOS. */
  @state() private _openPicker: PickerField = null;
  /** The month the inline calendar is showing, which is not the selected one. */
  @state() private _pickerMonth: { y: number; m: number } | null = null;
  /**
   * A picker on its way OUT, kept mounted until its collapse has played.
   *
   * Lit drops a conditional element the instant the condition turns false,
   * which gives a panel that springs open and then simply ceases to exist. This
   * holds it in the DOM for the length of the exit.
   */
  @state() private _pickerClosing: PickerField = null;
  /** The collapse in flight, and which panel it belongs to. */
  private _pickerOutAnim?: Animation;
  private _pickerOutField: PickerField = null;
  /** Widths captured before a reflow of the "Repeat every" row — see _flipCapture. */
  private _flipFrom: Array<{ el: HTMLElement; w: number }> | null = null;
  /** Month steps: the direction of travel, and a counter that restarts the CSS. */
  @state() private _calDir = 0;
  @state() private _calEpoch = 0;
  /** Location and notes start folded away when there is nothing in them. */
  @state() private _detailsOpen = false;
  /** The colour grid, folded by default — it is the least-used row in the form. */
  @state() private _colorOpen = false;
  /** The repeat options, folded the same way. New events only. */
  @state() private _repeatOpen = false;
  /** The custom-recurrence window, and the rule it is editing (a working copy). */
  @state() private _customOpen = false;
  @state() private _custom: Recurrence | null = null;
  /** Held true while it plays its exit, so it leaves rather than blinking out. */
  @state() private _customClosing = false;
  private _customCloseTimer?: ReturnType<typeof setTimeout>;
  /** The Ends group inside it, folded the same way Location is. */
  @state() private _endsOpen = false;
  /** Address suggestions for the location field, and the map preview's state. */
  @state() private _places: Place[] = [];
  @state() private _placesBusy = false;
  @state() private _mapOpen = false;
  @state() private _mapPoint: { lat: number; lon: number } | null = null;
  private _placeTimer?: ReturnType<typeof setTimeout>;
  private _placeAbort?: AbortController;
  /** Street or satellite, the way Google offers it. */
  @state() private _baseMap: BaseMap = 'street';
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  private _baseLayers: any[] = [];
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  private _leafletMap: any = null;
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  private _leafletMarker: any = null;
  /** Drops a late answer for an earlier tap. See _pickAt. */
  private _mapPickSeq = 0;
  private _mapWanted = false;
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  private _leaflet: any = null;
  /** Null until asked for, then true or false for the rest of the session. */
  @state() private _leafletOk = false;
  /** Drives the one-shot red wash when edit mode is entered or left. */
  @state() private _flash = 0;
  /** True when that wash is the LEAVING one, which runs the same frames backwards. */
  @state() private _flashOut = false;
  /** Set when a wheel has just been rendered and still needs positioning. */
  private _wheelsPending = false;
  @state() private _revision = 0;

  private _subs = new CalendarSubscriptions(() => {
    this._revision++;
  });
  private _tick?: ReturnType<typeof setInterval>;
  private _spinTimer?: ReturnType<typeof setTimeout>;
  private _hostRo?: ResizeObserver;
  private _colorKey = '';
  private _focusPx = 0;
  private _focusKey = '';
  private _focusBusy = false;

  private _colorsAt = 0;
  private _eventColorsAt = 0;
  private _eventColorsPending = false;

  public setConfig(config: SimpleScheduleCardConfig): void {
    if (!config) throw new Error('simple-schedule-card: invalid configuration');
    const sources = normaliseSources(config);
    if (!sources.length) {
      throw new Error(
        'simple-schedule-card: "entity" (a calendar entity_id) or "entities" is required',
      );
    }
    for (const s of sources) {
      if (!s.entity.startsWith('calendar.')) {
        throw new Error(`simple-schedule-card: "${s.entity}" is not a calendar entity`);
      }
    }
    this._config = { ...config };
    this._sources = sources;
    this._colorKey = '';
  }

  public getCardSize(): number {
    return 10;
  }

  public getGridOptions() {
    return { columns: 'full', rows: 10, min_rows: 6 };
  }

  static getStubConfig(): SimpleScheduleCardConfig {
    return {
      type: 'custom:simple-schedule-card',
      entity: 'calendar.school',
      ...DEFAULTS,
    };
  }

  public connectedCallback(): void {
    super.connectedCallback();
    // Nothing on screen tracks the clock any more; this only has to notice the
    // date rolling over so the week window follows it.
    this._tick = setInterval(() => {
      this._now = new Date();
    }, 60_000);
    this._hostRo = new ResizeObserver((entries) => {
      const w = Math.round(entries[entries.length - 1].contentRect.width);
      if (w && w !== this._hostWidth) this._hostWidth = w;
    });
    this._hostRo.observe(this);
    this._motionQuery.addEventListener('change', this._onMotionChange);
  }

  public disconnectedCallback(): void {
    super.disconnectedCallback();
    if (this._tick) clearInterval(this._tick);
    this._tick = undefined;
    if (this._spinTimer) clearTimeout(this._spinTimer);
    this._spinTimer = undefined;
    this._hostRo?.disconnect();
    this._hostRo = undefined;
    this._motionQuery.removeEventListener('change', this._onMotionChange);
    this._setPicker(false);
    this._setMenu(false);
    this._pressCancel();
    this._subs.stop();
  }

  protected updated(changed: PropertyValues): void {
    super.updated(changed);
    // The fade-out is fill:forwards and would otherwise go on holding opacity 0
    // over the week that just replaced it - the elements are REUSED across the
    // change, so the new week would fade in and then vanish behind the old
    // animation. Cancelling here, in the same frame as the render, hands them
    // back to the CSS .dir-* rule that brings the week in.
    if (this._staleAnims.length) {
      for (const a of this._staleAnims) a.cancel();
      this._staleAnims = [];
    }
    // A wheel is positioned by scrollTop, which only means anything once the
    // column exists and has its height. This is the first moment that is true.
    if (this._wheelsPending) {
      this._wheelsPending = false;
      this._positionWheels();
    }
    this._animatePicker();
    this._flipPlay();
    this._syncLeaflet();
    if (!this.hass || !this._config) return;
    if (this._orientation === 'days-as-rows') {
      this._measureScrollbar();
      this._focusScroller();
    }
    void this._ensureSubscribed();
    void this._ensureColors();
    void this._ensureEventColors();
  }

  /**
   * The week to draw. The window is ALWAYS the full seven days — that is what is
   * subscribed to — and only the day list is trimmed, so `auto` can look at the
   * weekend before deciding whether to show it.
   */
  private get _window() {
    const full = weekWindow(this._now, this._weekOffset, 7);
    const mode = this._config?.days ?? DEFAULTS.days;
    let count = 5;
    if (mode === 'mon-sun') count = 7;
    else if (mode === 'auto' && weekendHasEvents(this._activeEvents, full.days)) count = 7;
    return { start: full.start, end: full.end, days: full.days.slice(0, count) };
  }

  private get _entityIds(): string[] {
    return this._sources.map((s) => s.entity);
  }

  /** Events of the calendar currently on screen. */
  private get _activeEvents(): ScheduleEvent[] {
    const entity = this._sources[Math.min(this._activeIdx, this._sources.length - 1)]?.entity;
    return this._subs.events.filter((e) => e.entity === entity);
  }

  /**
   * What is SUBSCRIBED: three weeks — the one on screen and one either side.
   *
   * Stepping a week then re-subscribes to a window that still overlaps most of
   * the last one, and the subscription cache keeps whatever falls outside it, so
   * the week being stepped onto is already drawn before its own push arrives.
   * With a one-week window there was nothing cached for it at all, and clicking
   * through weeks quickly showed a second or two of empty calendar each time.
   *
   * Everything that reasons about ONE week filters by day (eventsForDay) or by
   * range, so the wider window never widens what is drawn.
   */
  private get _subWindow() {
    return {
      start: weekWindow(this._now, this._weekOffset - 1, 7).start,
      end: weekWindow(this._now, this._weekOffset + 1, 7).end,
    };
  }

  private async _ensureSubscribed(): Promise<void> {
    const w = this._subWindow;
    await this._subs.sync(this.hass, this._entityIds, w.start, w.end);
  }

  /**
   * Re-read the calendars' own colours. Refetched on a TTL rather than once,
   * because the `simple_schedule_colors` helper writes this field in the
   * background when a calendar is recoloured in Google — without a TTL the card
   * would show the stale colour until the page was reloaded.
   */
  private async _ensureColors(force = false): Promise<void> {
    const key = this._entityIds.join(',');
    const stale = Date.now() - this._colorsAt > 10 * 60_000;
    if (!force && key === this._colorKey && !stale) return;
    this._colorKey = key;
    this._colorsAt = Date.now();
    this._colors = await fetchRegistryColors(this.hass, this._entityIds);
  }

  /** The colour of a whole calendar — used by the legend. */
  /**
   * True whenever something is layered in front of the schedule — the calendar
   * menu or an event's detail sheet. Both recede the grid the same way, so the
   * card has one behaviour for "there is something on top of this" rather than
   * two that drift apart.
   */
  /**
   * Is the schedule standing back behind something?
   *
   * The overflow menu counts, exactly as the calendar picker does. Both are
   * menus that open over the week, and only one of them used to push the week
   * away — so opening the other one left the schedule sitting at full strength
   * behind a floating panel, which is the thing that read as "no animation".
   */
  private get _receded(): boolean {
    // _draft on its own means a NEW event, which has no _selected behind it.
    return this._pickerOpen || this._menuOpen || !!this._selected || !!this._draft;
  }

  /** Close the detail sheet, replaying the entry cascade as the menu does. */
  private _closeSheet(): void {
    if (!this._selected) return;
    this._selected = undefined;
    this._animEpoch++;
  }

  /* ------------------------------------------------------------------ *
   * Editing.
   *
   * Every write goes through pyscript/simple_schedule_edit.py, because Home
   * Assistant itself cannot change a Google event: the integration declares
   * CREATE and DELETE only, so core's calendar/event/update refuses. That
   * file's header has the whole of why.
   * ------------------------------------------------------------------ */

  /**
   * Google's own id for an event, which is what the edit services take.
   *
   * A recurring occurrence has a recurrence_id — `<master>_<utc stamp>` — and
   * that IS the id. A one-off has none, and its id is the uid with Google's
   * suffix taken off. Checked against a real calendar both ways round.
   */
  private _googleId(ev: ScheduleEvent): string | null {
    if (ev.recurrenceId) return ev.recurrenceId;
    if (ev.uid) return ev.uid.replace(/@google\.com$/i, '');
    return null;
  }

  private _isRecurring(ev: ScheduleEvent): boolean {
    return !!ev.recurrenceId && ev.recurrenceId.includes('_');
  }

  private _setMenu(open: boolean): void {
    if (open === this._menuOpen) return;
    this._menuOpen = open;
    // Replays the entry cascade on the way back, the same as the picker does.
    if (!open) this._animEpoch++;
    if (open) {
      document.addEventListener('pointerdown', this._onMenuOutside, true);
      document.addEventListener('keydown', this._onMenuKey, true);
    } else {
      document.removeEventListener('pointerdown', this._onMenuOutside, true);
      document.removeEventListener('keydown', this._onMenuKey, true);
    }
  }

  // Same shape as the calendar picker's: the card is in a shadow root, so a
  // click outside it never bubbles anywhere the card can see. composedPath does.
  private _onMenuOutside = (ev: Event): void => {
    const wrap = this.renderRoot?.querySelector('.tools-menu-wrap');
    if (wrap && ev.composedPath().includes(wrap)) return;
    this._setMenu(false);
  };

  private _onMenuKey = (ev: KeyboardEvent): void => {
    if (ev.key === 'Escape') this._setMenu(false);
  };

  private _toggleEditMode(): void {
    this._setMenu(false);
    this._editMode = !this._editMode;
    // Leaving edit mode must not leave a half-typed form behind it.
    if (!this._editMode) this._closeEditor();
    // A wash of red across the whole card either way. The pill alone is a small
    // thing in a corner, and this is the one mode where a tap changes somebody's
    // timetable — it should be impossible to enter OR leave without noticing.
    if (!this._reducedMotion) {
      this._flashOut = !this._editMode;
      this._flash++;
    }
  }

  /**
   * The palette id matching an event's current colour, or '' for the default.
   *
   * The colour helper publishes hex, not ids, so this maps back through Google's
   * own palette — which is where the helper got those hexes from, so the match
   * is exact rather than nearest.
   */
  private _colorIdFor(ev: ScheduleEvent): string {
    const map = this._eventColors;
    if (!map) return '';
    const hex = (ev.recurrenceId ? map.by_recurrence_id?.[ev.recurrenceId] : undefined)
      ?? (ev.uid ? map.by_uid?.[ev.uid] : undefined);
    if (!hex) return '';
    const found = GOOGLE_EVENT_COLORS.find(([, value]) => value.toLowerCase() === hex.toLowerCase());
    return found ? found[0] : '';
  }

  /** Build the form from an event. */
  private _openEditor(ev: ScheduleEvent): void {
    const eventId = this._googleId(ev);
    if (!eventId) {
      this._editError = 'This event has no id Google would recognise.';
      return;
    }
    const from = splitLocal(ev.start);
    const to = splitLocal(ev.end);
    this._draft = {
      key: ev.key,
      entity: ev.entity,
      eventId,
      isNew: false,
      recurring: this._isRecurring(ev),
      summary: ev.summary,
      startDate: from.date,
      startTime: from.time,
      endDate: to.date,
      endTime: to.time,
      location: ev.location ?? '',
      description: ev.description ?? '',
      allDay: ev.allDay,
      colorId: this._colorIdFor(ev),
      // Not offered when editing: changing a rule on a live series is a
      // different operation from setting one, with the scope question tangled
      // into it. The form hides the row rather than showing one that lies.
      repeat: null,
    };
    this._openPicker = null;
    this._pickerClosing = null;
    this._pickerMonth = null;
    // Folded away when there is nothing in them, open when there is — so the
    // form is short for the common case without ever hiding real content.
    this._detailsOpen = !!(ev.location || ev.description);
    this._colorOpen = false;
    this._places = [];
    this._mapOpen = false;
    this._mapPoint = null;
    // One occurrence is the safe default and the one meant most of the time: a
    // lesson moves this week, the timetable itself does not change.
    this._scope = 'instance';
    this._editError = null;
    this._confirmDelete = false;
  }

  /**
   * The same form, empty, for an event that does not exist yet.
   *
   * It lands on the calendar currently on screen. That is the one being looked
   * at, the one whose colour the sheet takes, and the only one the card can
   * name — a calendar chooser inside the sheet would be a second picker
   * answering a question the header has already answered.
   */
  private _openCreator(start: Date, minutes = NEW_EVENT_MIN): void {
    const entity = this._active?.entity;
    if (!entity) return;
    const from = splitLocal(start);
    const to = splitLocal(new Date(start.getTime() + minutes * 60_000));
    // Nothing is selected: this sheet is not about an existing block, and
    // leaving a stale selection behind it would paint one as chosen.
    this._selected = undefined;
    this._draft = {
      key: `new:${start.getTime()}`,
      entity,
      eventId: '',
      isNew: true,
      // "recurring" is about the event on Google, which this one is not yet; it
      // is what puts the scope question on the EDIT form. A repeat rule set here
      // is carried in `repeat` and applies from the moment it is created.
      recurring: false,
      summary: '',
      startDate: from.date,
      startTime: from.time,
      endDate: to.date,
      endTime: to.time,
      location: '',
      description: '',
      allDay: false,
      colorId: '',
      repeat: null,
    };
    this._openPicker = null;
    this._pickerClosing = null;
    this._pickerMonth = null;
    this._detailsOpen = false;
    this._colorOpen = false;
    this._repeatOpen = false;
    this._cancelCustom();
    this._places = [];
    this._mapOpen = false;
    this._mapPoint = null;
    this._scope = 'instance';
    this._editError = null;
    this._confirmDelete = false;
  }

  /**
   * What the + button means by "now": the next slot on the snap grid.
   *
   * UP, where a press on the grid rounds down. A press names a slot and gets
   * that slot; the + names no time at all, and starting an event a quarter of
   * an hour in the past is a worse guess than starting it at the next one.
   */
  private get _nowSlot(): Date {
    const d = new Date(this._now);
    d.setSeconds(0, 0);
    d.setMinutes(Math.ceil(d.getMinutes() / NEW_SNAP_MIN) * NEW_SNAP_MIN);
    return d;
  }

  /** The same moment as minutes from midnight, which is what a day label takes. */
  private get _nowMinutes(): number {
    const slot = this._nowSlot;
    return slot.getHours() * 60 + slot.getMinutes();
  }

  /**
   * Begin a press-and-hold on empty space.
   *
   * Only in edit mode. The grid is also what a tablet gets held by, and in the
   * default view-only mode a press has to stay inert — a kiosk on a wall must
   * not be able to put an event in somebody's calendar by being leant on.
   *
   * Two surfaces offer it. A press on the TIMELINE claims the slot under the
   * finger; a press on a DAY LABEL claims the day at the current clock time.
   * They share a day index, which is why the press records which kind it is —
   * without that, pressing the label lit the row beside it as well.
   */
  private _pressStart(e: PointerEvent, day: Date, idx: number, geom: PressGeom): void {
    this._pressCancel();
    if (!this._editMode || this._draft) return;
    // Right and middle buttons are not a press; touch and pen report button 0.
    if (e.button !== 0) return;
    // A block is somebody's event — that is a tap to open, not empty space.
    if ((e.target as HTMLElement | null)?.closest('.ev, .lr:not(.empty)')) return;

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const size = geom.axis === 'x' ? rect.width : rect.height;
    if (size <= 0) return;
    const along = geom.axis === 'x' ? e.clientX - rect.left : e.clientY - rect.top;
    const frac = Math.min(1, Math.max(0, along / size));
    const { from, to } = this._fitSlot(day, geom.start + frac * geom.span);

    this._pressFrom = { x: e.clientX, y: e.clientY };
    // The ghost is clipped to the axis; the event itself is not, so a press in
    // the last half hour still makes a half-hour event and the axis grows.
    this._press = {
      idx,
      kind: geom.kind,
      style: `${geom.ghost(from, Math.min(to, geom.start + geom.span))};
              animation-duration:${PRESS_MS}ms`,
    };
    const at = new Date(startOfDay(day).getTime() + from * 60_000);
    const minutes = to - from;
    // On the window, not the canvas: a press that ends with the finger somewhere
    // else still has to end. Bound here and dropped in _pressCancel, so nothing
    // is listening between presses.
    window.addEventListener('pointermove', this._onPressMove, true);
    window.addEventListener('pointerup', this._onPressEnd, true);
    window.addEventListener('pointercancel', this._onPressEnd, true);
    // Any scroll — the hour scroller, the dashboard behind the card — is a drag.
    window.addEventListener('scroll', this._onPressEnd, true);
    this._pressTimer = setTimeout(() => {
      this._pressTimer = undefined;
      this._press = null;
      this._pressCancel();
      this._openCreator(at, minutes);
    }, PRESS_MS);
  }

  /**
   * The slot a press actually claims, once the events around it are taken in.
   *
   * Half an hour by default, but a timetable is mostly gaps of five and fifteen
   * minutes, and an event that spills over the lesson after it is wrong in a way
   * that takes a trip to Google to undo. So the end is cut at whatever starts
   * next, and — just as important — the START is held at whatever ended last:
   * snapping to the quarter hour alone would push a press in the 9:15-9:30 gap
   * back to 9:15 and into the lesson before it when that ran to 9:20.
   */
  private _fitSlot(day: Date, raw: number): { from: number; to: number } {
    const dayStart = startOfDay(day).getTime();
    const active = this._active?.entity;
    let prevEnd = 0;
    let nextStart = 24 * 60;
    for (const ev of this._subs.events) {
      if (ev.entity !== active || ev.allDay) continue;
      // Minutes from THIS day's midnight, so other days fall outside 0-1440 and
      // drop out of both comparisons without a date check.
      const s = minsFrom(ev.start, dayStart);
      const e = minsFrom(ev.end, dayStart);
      if (e <= raw && e > prevEnd) prevEnd = e;
      if (s > raw && s < nextStart) nextStart = s;
    }
    const from = Math.max(snapMinutes(raw), prevEnd);
    const gap = nextStart - from;
    // A gap narrower than the default is still the gap, and filling it exactly
    // is the point. No room at all — the press landed where two events meet,
    // which the block floor can make reachable — falls back to the default and
    // is allowed to overlap, because a zero-length event is not an event.
    return { from, to: from + (gap > 0 ? Math.min(NEW_EVENT_MIN, gap) : NEW_EVENT_MIN) };
  }

  /** Travel past the slop means the finger is scrolling the grid, not holding it. */
  private _onPressMove = (e: PointerEvent): void => {
    const from = this._pressFrom;
    if (!from) return;
    if (
      Math.abs(e.clientX - from.x) > PRESS_SLOP_PX ||
      Math.abs(e.clientY - from.y) > PRESS_SLOP_PX
    ) {
      this._pressCancel();
    }
  };

  private _onPressEnd = (): void => {
    this._pressCancel();
  };

  private _pressCancel(): void {
    if (this._pressTimer) clearTimeout(this._pressTimer);
    this._pressTimer = undefined;
    this._pressFrom = null;
    if (this._press) this._press = null;
    window.removeEventListener('pointermove', this._onPressMove, true);
    window.removeEventListener('pointerup', this._onPressEnd, true);
    window.removeEventListener('pointercancel', this._onPressEnd, true);
    window.removeEventListener('scroll', this._onPressEnd, true);
  }

  private _closeEditor(): void {
    // A new event has no _selected behind it, so _closeSheet — which keys off
    // one — cannot replay the entry cascade. Do it here instead.
    if (!this._selected) this._animEpoch++;
    this._draft = null;
    this._editError = null;
    this._confirmDelete = false;
    this._busy = false;
    this._openPicker = null;
    this._pickerClosing = null;
    this._pickerMonth = null;
    this._cancelCustom();
    this._closeSheet();
  }

  /**
   * Collapse the open picker, letting the exit play.
   *
   * Everything that closes a picker while the FORM stays open goes through
   * here. The teardown paths — closing the editor, closing the window — clear
   * both fields instead, because there is nothing left to animate against.
   */
  private _closePicker(): void {
    if (!this._openPicker) return;
    this._pickerClosing = this._openPicker;
    this._openPicker = null;
  }

  /** Open one inline picker, closing whichever was open. iOS shows one at a time. */
  private _togglePicker(field: Exclude<PickerField, null>): void {
    this._confirmDelete = false;
    if (this._openPicker === field) {
      this._closePicker();
      return;
    }
    // Switching straight from one picker to another: the one being left has to
    // collapse rather than blink out, so both are on screen for a moment. They
    // are told apart by data-field, never by document order.
    this._pickerClosing = this._openPicker === field ? null : this._openPicker;
    this._openPicker = field;
    // A fresh panel opens on its selected month, with nothing to slide from.
    this._calDir = 0;
    const value =
      field === 'untilDate'
        ? (this._custom?.end.kind === 'on' ? this._custom.end.date : '')
        : (this._draft?.[field] ?? '');
    if (field !== 'startTime' && field !== 'endTime') {
      const [y, m] = value.split('-').map(Number);
      this._pickerMonth = { y: y || new Date().getFullYear(), m: (m || 1) - 1 };
    }
    // The wheels are positioned by scrollTop once they exist — see updated().
    this._wheelsPending = true;
  }

  /**
   * Keep the end after the start when the start moves.
   *
   * Picking a start later than the end is the single easiest mistake to make in
   * a form like this, and a validation error afterwards is a worse answer than
   * simply carrying the end along — which is what every calendar app does.
   */
  private _patchStart(patch: Partial<EventDraft>): void {
    const d = this._draft;
    if (!d) return;
    const before = new Date(`${d.startDate}T${d.startTime || '00:00'}`).getTime();
    const after = new Date(`${d.endDate}T${d.endTime || '00:00'}`).getTime();
    const span = Number.isFinite(before) && Number.isFinite(after) ? after - before : 0;
    const next = { ...d, ...patch };
    const moved = new Date(`${next.startDate}T${next.startTime || '00:00'}`).getTime();
    if (span > 0 && Number.isFinite(moved)) {
      const end = new Date(moved + span);
      const split = splitLocal(end);
      next.endDate = split.date;
      next.endTime = split.time;
    }
    this._draft = next;
    this._confirmDelete = false;
  }

  /**
   * Tapping an event: read it, or edit it.
   *
   * One entry point for all five places an event can be tapped — two grids, the
   * list, the all-day strip — so the mode can never be honoured in some of them
   * and not others.
   */
  private _pickEvent(ev: ScheduleEvent): void {
    this._selected = ev;
    if (this._editMode) this._openEditor(ev);
  }

  private _patchDraft(patch: Partial<EventDraft>): void {
    if (!this._draft) return;
    this._draft = { ...this._draft, ...patch };
    // Any edit invalidates a delete the user was halfway through confirming.
    this._confirmDelete = false;
  }

  /**
   * Call one of the pyscript services and report what came back.
   *
   * pyscript raises on failure and Home Assistant turns that into a rejected
   * call, so an error here is the real reason rather than a guess. It is shown
   * in the form instead of being thrown away, because the alternative is a Save
   * button that silently does nothing.
   */
  private async _callEdit(service: string, data: Record<string, unknown>): Promise<boolean> {
    this._busy = true;
    this._editError = null;
    try {
      await this.hass.callService('pyscript', service, data);
      return true;
    } catch (err) {
      const message = (err as { message?: string })?.message ?? String(err);
      this._editError = message.replace(/^[\s\S]*ValueError:\s*/, '').slice(0, 300);
      return false;
    }
    // _busy is NOT cleared here. The write landing is not the end of the job —
    // the week still has to catch up with it — and dropping the flag in between
    // would flick the button back to Save for a frame. The callers own it.
  }

  /** The scope to send: meaningless for a one-off, so pinned to the occurrence. */
  private get _sendScope(): EditScope {
    return this._draft?.recurring ? this._scope : 'instance';
  }

  /**
   * Everything the card is currently DRAWING, as one string.
   *
   * Compared before and after a write to tell whether the change has arrived.
   * It carries the fields the form can change — including colour, so that a
   * colour-only edit is noticed too — and nothing else, because anything else
   * would make it change for reasons that have nothing to do with this write.
   */
  private _viewFingerprint(): string {
    const active = this._active?.entity;
    const w = this._window;
    return this._subs.events
      .filter((e) => e.entity === active && e.start < w.end && e.end > w.start)
      .map((e) =>
        [
          e.key,
          e.summary,
          e.start.getTime(),
          e.end.getTime(),
          e.allDay,
          e.location ?? '',
          e.description ?? '',
          this._colorForEvent(e),
        ].join('|'),
      )
      .sort()
      .join('\n');
  }

  /**
   * Hold on until the week on screen reflects the write that just happened.
   *
   * Re-fetches on a slow beat and looks on a fast one, because the two are
   * different questions: Google may not have propagated yet (so ask again), and
   * a push may still be in flight (so look again). Gives up after
   * WRITE_SETTLE_MAX_MS — the write itself succeeded either way, and a form
   * that will not close is worse than one that closes a moment early.
   */
  private async _settleAfterWrite(before: string, colourChanged: boolean): Promise<void> {
    if (!this.hass) return;
    // `before` is taken by the CALLER, before the service call. Taking it here
    // is too late: the pyscript service re-polls Home Assistant before it
    // returns, so the push has often already landed by the time the write
    // resolves — and a fingerprint that already holds the answer never changes,
    // so this waited out the whole timeout on every save. Measured at 7s.
    const deadline = Date.now() + WRITE_SETTLE_MAX_MS;
    let nextFetch = 0;
    while (Date.now() < deadline) {
      if (Date.now() >= nextFetch) {
        nextFetch = Date.now() + WRITE_REFETCH_MS;
        const w = this._subWindow;
        // Re-subscribing on its own only re-reads what Home Assistant already
        // has, and for a DELETE that lagged Google by seconds — measured at 9s
        // to disappear while an edit took 1.6s to appear. Asking the calendar
        // to re-poll first is what makes the two behave the same.
        await this._subs.forceUpdate(this.hass, this._entityIds);
        // NOT _subs.clear() first: emptying the cache would make the
        // fingerprint change to "nothing at all", which reads as the answer
        // arriving. Re-subscribing replaces the window's events on its own.
        await this._subs.sync(this.hass, this._entityIds, w.start, w.end, true);
        if (colourChanged) {
          // The colour map is a separate file that a helper republishes, so a
          // colour change is only visible once that has run again.
          await this._subs.refreshColorHelper(this.hass);
          await this._ensureEventColors(true);
        }
      }
      await new Promise((r) => setTimeout(r, WRITE_POLL_MS));
      if (this._viewFingerprint() !== before) return;
    }
  }

  /* ---- the rubber band, for a sheet with nothing to scroll ---------- */

  private _rubberFrom: number | null = null;
  private _rubberAt = 0;

  /**
   * The thing that actually scrolls inside a draggable surface.
   *
   * The edit sheet scrolls itself; the custom-recurrence window scrolls its
   * body, and it is the WINDOW that should move when the body has nowhere to
   * go — a body sliding under its own header looks like a broken layout.
   */
  private _dragScroller(host: HTMLElement): HTMLElement {
    return (host.querySelector('.rec-body') as HTMLElement | null) ?? host;
  }

  private _onDragStart(e: TouchEvent): void {
    this._rubberFrom = e.touches.length === 1 ? e.touches[0].clientY : null;
  }

  private _onDragMove(e: TouchEvent): void {
    const from = this._rubberFrom;
    if (from === null || e.touches.length !== 1) return;
    const host = e.currentTarget as HTMLElement;
    const box = this._dragScroller(host);
    const dy = e.touches[0].clientY - from;
    const room = box.scrollHeight - box.clientHeight;
    // Stuck means: nothing to scroll at all, or already hard against the end
    // being pulled towards. Either way the page behind must not take it.
    const stuck =
      room <= 1 ||
      (dy > 0 && box.scrollTop <= 0) ||
      (dy < 0 && box.scrollTop >= room - 1);
    if (!stuck) {
      if (this._rubberAt) this._setRubber(host, 0, true);
      return;
    }
    // Cancelling the touch is what stops the chain. overscroll-behavior alone
    // does not: a box with nothing to scroll is not overscrolling, it is not
    // scrolling, and the gesture was never its to contain.
    //
    // Guarded, because once a native scroll has been handed to the compositor
    // the event stops being cancellable and calling this only logs a warning.
    // That case is the boundary one, which overscroll-behavior does cover.
    if (e.cancelable) e.preventDefault();
    const give = RUBBER_MAX_PX * (1 - Math.exp(-Math.abs(dy) / RUBBER_SOFT_PX));
    this._setRubber(host, Math.sign(dy) * give, false);
  }

  private _onDragEnd(e: TouchEvent): void {
    this._rubberFrom = null;
    if (this._rubberAt) this._setRubber(e.currentTarget as HTMLElement, 0, true);
  }

  /**
   * Written straight to the element, not through state.
   *
   * This runs on every touchmove; re-rendering the whole card sixty times a
   * second to move one box by a few pixels is not a trade worth making.
   */
  private _setRubber(host: HTMLElement, px: number, spring: boolean): void {
    this._rubberAt = px;
    host.classList.toggle('springing', spring);
    host.style.setProperty('--rubber', `${px}px`);
  }

  /** Whether this save moves the colour, which needs the helper to re-run. */
  private _colourMoved(draft: EventDraft): boolean {
    const was = this._selected ? this._colorIdFor(this._selected) : '';
    return draft.colorId !== was;
  }

  private async _saveDraft(): Promise<void> {
    const draft = this._draft;
    if (!draft || this._busy) return;
    if (!draft.summary.trim()) {
      this._editError = 'A title is required.';
      return;
    }
    // Google's all-day end is EXCLUSIVE: a single day ends on the NEXT one. An
    // existing all-day event already arrives that way, having come from Google;
    // one ticked all-day in this form has not, and would be sent as a zero-
    // length day that Google rejects outright.
    const endDate =
      draft.allDay && draft.endDate <= draft.startDate ? nextDay(draft.startDate) : draft.endDate;
    const start = draft.allDay ? draft.startDate : `${draft.startDate} ${draft.startTime}:00`;
    const end = draft.allDay ? endDate : `${draft.endDate} ${draft.endTime}:00`;
    if (!draft.allDay && new Date(start.replace(' ', 'T')) >= new Date(end.replace(' ', 'T'))) {
      this._editError = 'The end has to come after the start.';
      return;
    }

    const fields = {
      entity_id: draft.entity,
      summary: draft.summary.trim(),
      start,
      end,
      all_day: draft.allDay,
      location: draft.location,
      description: draft.description,
      // Omitted entirely when unset: sending an empty colour is not the same as
      // not mentioning it, and only one of those leaves the calendar's own
      // colour alone.
      ...(draft.colorId ? { color_id: draft.colorId } : {}),
    };
    // Taken BEFORE the write — see _settleAfterWrite.
    const before = this._viewFingerprint();
    let ok = false;
    try {
      ok = draft.isNew
        ? await this._callEdit('simple_schedule_event_create', {
            ...fields,
            // Only when there is one: the service reads a present rrule as "set
            // the recurrence", and an empty string would mean "clear it".
            ...(draft.repeat ? { rrule: toRRule(draft.repeat, draft.allDay) } : {}),
          })
        : await this._callEdit('simple_schedule_event_update', {
            ...fields,
            event_id: draft.eventId,
            scope: this._sendScope,
          });
      // The write has landed, but the week has not caught up with it yet. The
      // button goes on saying so until it has.
      if (ok) await this._settleAfterWrite(before, this._colourMoved(draft));
    } finally {
      this._busy = false;
    }
    if (ok) this._closeEditor();
  }

  /** First press arms, second press deletes. Destructive and one-way. */
  private async _deleteDraft(): Promise<void> {
    const draft = this._draft;
    if (!draft || this._busy || draft.isNew) return;
    if (!this._confirmDelete) {
      this._confirmDelete = true;
      return;
    }
    const before = this._viewFingerprint();
    let ok = false;
    try {
      ok = await this._callEdit('simple_schedule_event_delete', {
        entity_id: draft.entity,
        event_id: draft.eventId,
        scope: this._sendScope,
      });
      // As with a save: the form stays up until the block has actually gone,
      // rather than handing back a week that still has it in.
      if (ok) await this._settleAfterWrite(before, false);
    } finally {
      this._busy = false;
    }
    if (ok) this._closeEditor();
  }

  /** Alternating keyframe name — see _animEpoch. */
  private get _evAnim(): string {
    return this._animEpoch % 2 ? 'evInB' : 'evIn';
  }

  private get _minContrast(): number {
    const v = this._config?.min_contrast;
    return typeof v === 'number' ? v : DEFAULTS.min_contrast;
  }

  /** URL of the pyscript helper's output, or null when it is switched off. */
  private get _helperUrl(): string | null {
    const cfg = this._config?.color_helper;
    if (cfg === false) return null;
    if (typeof cfg === 'string' && cfg) return cfg;
    return DEFAULT_COLOR_HELPER_URL;
  }

  /**
   * Refresh the per-event colour map. The helper rewrites it every 15 minutes,
   * so re-reading more often than that is pointless; `force` is for the refresh
   * button. A missing file is the normal "helper not installed" case and leaves
   * `_eventColors` null so every block falls back to its calendar's colour.
   */
  private async _ensureEventColors(force = false): Promise<void> {
    const url = this._helperUrl;
    if (!url) {
      this._eventColors = null;
      return;
    }
    if (this._eventColorsPending) return;
    if (!force && this._eventColorsAt && Date.now() - this._eventColorsAt < 10 * 60_000) return;
    this._eventColorsPending = true;
    try {
      this._eventColors = await fetchEventColors(url);
      this._eventColorsAt = Date.now();
    } finally {
      this._eventColorsPending = false;
    }
  }

  private _colorFor(entity: string): string {
    const i = this._sources.findIndex((s) => s.entity === entity);
    const source = this._sources[i] ?? { entity };
    return resolveColor(source, this._colors, i < 0 ? 0 : i);
  }

  /**
   * The colour of one block, most specific first: an explicit `event_colors`
   * title match, then Google's own per-event colour via the helper, then the
   * calendar's colour.
   */
  private _colorForEvent(ev: ScheduleEvent): string {
    return (
      eventColor(ev.summary, this._config?.event_colors) ??
      lookupEventColor(this._eventColors, ev.uid, ev.recurrenceId) ??
      this._colorFor(ev.entity)
    );
  }

  /** The calendar's own name, as Home Assistant has it. Never a configured one. */
  private _nameFor(entity: string): string {
    return titleCase(this.hass?.states?.[entity]?.attributes?.friendly_name ?? entity);
  }

  /**
   * The active calendar, with any header-toggle override folded in. Every read
   * of calendar_mode and view_width_mode goes through here, so overriding at
   * this one point reaches the axis, the lane packing and both renderers
   * without any of them knowing the modes can be changed at runtime.
   */
  private get _active(): CalendarSourceConfig {
    const src = this._sources[Math.min(this._activeIdx, this._sources.length - 1)];
    if (!src) return src;
    const over = this._modeOverride[src.entity];
    return over ? { ...src, ...over } : src;
  }

  /** The active calendar's mode, override first, then config, then default. */
  private get _calendarMode(): CalendarMode {
    return this._active?.calendar_mode === 'full' ? 'full' : 'focused';
  }

  private get _widthMode(): ViewWidthMode {
    return this._active?.view_width_mode === 'adaptive' ? 'adaptive' : 'fixed';
  }

  /**
   * Flip one mode for the active calendar only. Keyed by entity so each
   * calendar remembers its own shape while the card is open - a timetable and
   * a household calendar want different ones, which is why these are per
   * calendar in config to begin with. Deliberately NOT persisted: the YAML
   * stays the source of truth and a reload returns to it.
   */
  private _toggleMode(key: 'calendar_mode' | 'view_width_mode'): void {
    const src = this._sources[Math.min(this._activeIdx, this._sources.length - 1)];
    if (!src) return;
    const cur = this._active;
    const next =
      key === 'calendar_mode'
        ? { calendar_mode: (cur.calendar_mode === 'full' ? 'focused' : 'full') as CalendarMode }
        : {
            view_width_mode: (cur.view_width_mode === 'adaptive'
              ? 'fixed'
              : 'adaptive') as ViewWidthMode,
          };
    this._modeOverride = {
      ...this._modeOverride,
      [src.entity]: { ...this._modeOverride[src.entity], ...next },
    };
    // The grid reflows completely, so replay the entry cascade rather than
    // letting the blocks jump to their new places.
    this._animEpoch++;
  }

  /** The person's picture, if one is configured and set. */
  private _avatarFor(source: CalendarSourceConfig): string | undefined {
    const pic = source.person
      ? this.hass?.states?.[source.person]?.attributes?.entity_picture
      : undefined;
    return typeof pic === 'string' && pic ? pic : undefined;
  }

  /**
   * Open state for the calendar menu, with a document-level listener while it is
   * open so a click anywhere else dismisses it.
   *
   * The listener has to sit on `document` and test `composedPath()`: the card is
   * in a shadow root, so a click outside it never bubbles to anything the card
   * itself can see.
   */
  private _setPicker(open: boolean): void {
    if (open === this._pickerOpen) return;
    this._pickerOpen = open;
    if (!open) this._animEpoch++;
    if (open) {
      document.addEventListener('pointerdown', this._onOutside, true);
      document.addEventListener('keydown', this._onPickerKey, true);
    } else {
      document.removeEventListener('pointerdown', this._onOutside, true);
      document.removeEventListener('keydown', this._onPickerKey, true);
    }
  }

  private _onOutside = (ev: Event): void => {
    const picker = this.renderRoot?.querySelector('.picker');
    if (picker && ev.composedPath().includes(picker)) return;
    this._setPicker(false);
  };

  private _onPickerKey = (ev: KeyboardEvent): void => {
    if (ev.key === 'Escape') this._setPicker(false);
  };

  private _selectCalendar(idx: number): void {
    this._setPicker(false);
    if (idx === this._activeIdx) return;
    // Same move the week arrows use, direction taken from where the calendar
    // sits in the list, so the motion says which way you moved.
    const dir = idx > this._activeIdx ? 'fwd' : 'back';
    this._navigate(dir, () => {
      this._activeIdx = idx;
    });
  }

  private _goWeek(delta: number): void {
    this._navigate(delta > 0 ? 'fwd' : 'back', () => {
      this._weekOffset += delta;
    });
  }

  private _goToday(): void {
    if (this._weekOffset === 0) return;
    const dir = this._weekOffset > 0 ? 'back' : 'fwd';
    this._navigate(dir, () => {
      this._weekOffset = 0;
    });
  }

  /* ------------------------------------------------------------------ *
   * Changing week, in two halves.
   *
   * The week leaving FADES AND FOLDS AWAY first, and only then is the new one
   * built and brought in, cell by cell. One half on its own is what made this
   * read as "basic" - the CSS `.dir-*` rules bring a week in, but nothing ever
   * saw the old one go, so the change was a 28px nudge over content that had
   * already been swapped underneath it.
   *
   * The out half has to be imperative: the old week's DOM stops existing the
   * moment the state changes, so it cannot be animated by a rule that only
   * applies after the render.
   * ------------------------------------------------------------------ */

  /**
   * Whether this card should hold still.
   *
   * Follows the OPERATING SYSTEM by default, which is why an identical card can
   * animate on one machine and not on another: Windows' Settings > Accessibility
   * > Visual effects > Animation effects, and macOS' Reduce Motion, are both
   * reported to the browser as `prefers-reduced-motion: reduce`, and that used
   * to silence every animation here with no way to say otherwise. `animations`
   * is that way — see the option's docs.
   *
   * Read through a getter rather than cached because the OS setting can be
   * flipped while the page is open; _motionQuery re-renders when it is.
   */
  private get _reducedMotion(): boolean {
    const mode = this._config?.animations ?? DEFAULTS.animations;
    if (mode === 'always') return false;
    if (mode === 'off') return true;
    return this._motionQuery.matches;
  }

  /**
   * Exactly the elements the CSS `.dir-fwd` / `.dir-back` rules bring back in.
   *
   * The week range is one of them. It names the week being shown, so leaving it
   * to swap its text under a schedule that fades and slides made it the one part
   * of the card that jump-cut.
   */
  private get _contentEls(): HTMLElement[] {
    return Array.from(
      this.renderRoot?.querySelectorAll<HTMLElement>(
        '.range, .list, .rgrid .rframe, .grid .body, .grid .hdr',
      ) ?? [],
    );
  }

  /**
   * Commit a navigation whose fade-out is still running.
   *
   * Clicking an arrow twice quickly must step two weeks, not one. The pending
   * change is applied at once and the new one starts its own fade, so the second
   * click is never swallowed by the first click's animation.
   */
  private _flushNav(): void {
    const pending = this._navApply;
    if (!pending) return;
    pending();
  }

  private _navigate(dir: 'fwd' | 'back', apply: () => void): void {
    this._flushNav();
    this._selected = undefined;

    const commit = (): void => {
      this._navApply = undefined;
      // Hand this fade-out over to be released after the render - NOT cancelled
      // here, or the old week would be restored to full opacity, and NOT via a
      // flag, or it would be the next fade-out that got cancelled.
      this._staleAnims.push(...this._navAnims);
      this._navAnims = [];
      apply();
      this._navDir = dir;
      // Restart the cell cascade. A CSS animation only re-runs on a change of
      // NAME, and Lit reuses the row and block elements across a week change,
      // so without this the new week's cells simply appear in place.
      this._animEpoch++;
    };

    const els = this._contentEls;
    if (this._reducedMotion || !els.length) {
      commit();
      return;
    }

    // Out is the opposite way to in: the week leaves towards the side the new
    // one will not be coming from.
    const shift = dir === 'fwd' ? -NAV_OUT_SHIFT : NAV_OUT_SHIFT;
    this._navApply = commit;
    this._navAnims = els.map((el) =>
      el.animate(
        [
          { opacity: '1', transform: 'none' },
          { opacity: '0', transform: `translateX(${shift}px) scale(${NAV_OUT_SCALE})` },
        ],
        { duration: NAV_OUT_MS, easing: NAV_OUT_EASE, fill: 'forwards' },
      ),
    );
    const last = this._navAnims[this._navAnims.length - 1];
    void last.finished.then(() => this._flushNav()).catch(() => undefined);
  }

  /**
   * Refresh everything, in the order the data actually flows.
   *
   * A refresh that only re-read what Home Assistant already held was useless:
   * Google's coordinator caches for 15 minutes, so a change made in Google
   * simply was not there yet. The full chain is
   *
   *   1. force the calendars to re-poll Google,
   *   2. wait for that to land,
   *   3. have the colour helper republish from the freshly updated store,
   *   4. re-subscribe and re-read both colour sources.
   *
   * Steps 1 and 3 are best-effort: neither the integration's polling nor the
   * helper is guaranteed to be present, and the card must still refresh what it
   * can without them.
   */
  private async _refresh(): Promise<void> {
    if (this._refreshing || !this.hass) return;
    this._refreshing = true;
    const started = Date.now();
    if (this._spinTimer) clearTimeout(this._spinTimer);

    // Backstop: however the chain goes, the spinner stops.
    const backstop = setTimeout(() => {
      this._refreshing = false;
    }, SPIN_MAX_MS);

    try {
      await this._subs.forceUpdate(this.hass, this._entityIds);
      await new Promise((r) => setTimeout(r, REPOLL_SETTLE_MS));
      await this._subs.refreshColorHelper(this.hass);
      const w = this._subWindow;
      // Refresh means "tell me what is true now", so the cache of older weeks
      // goes with it - otherwise a deletion outside the refreshed window would
      // survive the very button meant to pick it up.
      this._subs.clear();
      await Promise.all([
        this._subs.sync(this.hass, this._entityIds, w.start, w.end, true),
        this._ensureColors(true),
        this._ensureEventColors(true),
      ]);
    } finally {
      clearTimeout(backstop);
      const wait = Math.max(0, SPIN_MIN_MS - (Date.now() - started));
      this._spinTimer = setTimeout(() => {
        this._refreshing = false;
      }, wait);
    }
  }

  protected render(): TemplateResult | typeof nothing {
    if (!this._config || !this.hass) return nothing;

    const cfg = this._config;
    const w = this._window;
    // One calendar at a time. Filtering HERE rather than at the subscription
    // means switching is instant, and it keeps the axis and the weekend rule
    // scoped to the calendar on screen: one child's 06:00 club must not rescale
    // another's grid, nor add weekend rows to it.
    const activeEntity = this._active?.entity;
    // The cache spans three weeks so stepping never lands on an empty grid; what
    // is DRAWN is one week, and the axis in particular must be scaled to that
    // week alone or a neighbouring early start would rescale this one.
    const all = this._subs.events.filter(
      (e) => e.entity === activeEntity && e.start < w.end && e.end > w.start,
    );
    const timed = all.filter((e) => !e.allDay);
    const axis = axisBounds(timed, cfg.day_start ?? DEFAULTS.day_start, cfg.day_end ?? DEFAULTS.day_end);
    const list = this._mode === 'list';

    return html`
      <ha-card>
        <div
          class="panel ${list ? 'narrow' : ''} ${this._reducedMotion ? 'reduce' : ''} ${this
            ._flash
            ? this._flashOut
              ? 'flash-out'
              : 'flash'
            : ''}"
        >
          ${this._renderHead(w.days)}
          ${list ? this._renderList(w.days, all) : this._renderGrid(w.days, all, axis)}
        </div>
        ${this._renderSheet()}
        <!-- The one-shot wash on entering edit mode. Keyed on a counter so a
             second entry re-runs it: an animation only restarts when the
             element is new, and this element is otherwise identical. -->
        ${this._flash
          ? html`<div
              class="mode-flash ${this._flashOut ? 'out' : ''}"
              .key=${this._flash}
              @animationend=${() => (this._flash = 0)}
            ></div>`
          : nothing}
      </ha-card>
    `;
  }

  /** Config pins the layout; 'auto' picks by the card's own measured width. */
  private get _mode(): 'grid' | 'list' {
    const l = this._config?.layout ?? DEFAULTS.layout;
    if (l === 'grid' || l === 'list') return l;
    const bp = this._config?.layout_breakpoint ?? DEFAULTS.layout_breakpoint;
    // Unmeasured (first paint) renders the grid: this is a tablet card first,
    // and a grid-to-grid settle beats a visible list-to-grid flip.
    return this._hostWidth > 0 && this._hostWidth < bp ? 'list' : 'grid';
  }

  /**
   * How far the week on screen is from the current one, in words.
   *
   * ALWAYS returns something. It used to go blank past one week either side, on
   * the reasoning that the date range said it better — but the list layout drops
   * the range entirely, so the pill became the only thing naming the week and a
   * blank pill left nothing at all.
   *
   * The unit coarsens as the distance grows, because "In 34 Weeks" is a number
   * to be decoded rather than read. Weeks up to WEEKS_BEFORE_MONTHS, then
   * months, then years once the month count would reach twelve.
   */
  private get _weekLabel(): string {
    const offset = this._weekOffset;
    if (offset === 0) return 'This Week';
    const ahead = offset > 0;
    const weeks = Math.abs(offset);
    if (weeks === 1) return ahead ? 'Next Week' : 'Last Week';

    let count = weeks;
    let unit = 'Week';
    if (weeks > WEEKS_BEFORE_MONTHS) {
      count = Math.round(weeks / WEEKS_PER_MONTH);
      unit = 'Month';
      if (count >= 12) {
        count = Math.round(weeks / WEEKS_PER_YEAR);
        unit = 'Year';
      }
    }
    const amount = `${count} ${unit}${count === 1 ? '' : 's'}`;
    return ahead ? `In ${amount}` : `${amount} Ago`;
  }

  /** Avatar, or the calendar's initial on its own colour when there is none. */
  private _renderAvatar(source: CalendarSourceConfig): TemplateResult {
    const pic = this._avatarFor(source);
    if (pic) return html`<img class="av" src=${pic} alt="" />`;
    const colour = darkenForContrast(this._colorFor(source.entity), this._minContrast);
    const initial = (this._nameFor(source.entity).trim()[0] ?? '?').toUpperCase();
    return html`<span class="av init" style="background:${colour}">${initial}</span>`;
  }

  /**
   * The card's heading: avatar, the calendar's own name, and — when there is
   * more than one calendar — a chevron. The whole thing is the target, not just
   * the chevron.
   *
   * There is no separate card title. The calendar being shown IS the title, so
   * a single calendar renders the same heading without the chevron or the menu,
   * rather than a control that cannot do anything.
   */
  private _renderPicker(): TemplateResult {
    const sources = this._sources;
    const many = sources.length > 1;
    const active = this._active;
    return html`
      <div class="picker">
        <button
          class="pick-btn ${many ? '' : 'static'}"
          ?disabled=${!many}
          aria-haspopup=${many ? 'listbox' : nothing}
          aria-expanded=${many ? (this._pickerOpen ? 'true' : 'false') : nothing}
          @click=${() => {
            if (many) this._setPicker(!this._pickerOpen);
          }}
        >
          ${this._renderAvatar(active)}
          <span class="pick-name">${this._nameFor(active.entity)}</span>
          ${many
            ? html`<ha-icon
                class="pick-chev ${this._pickerOpen ? 'open' : ''}"
                icon="mdi:chevron-down"
              ></ha-icon>`
            : nothing}
        </button>
        <div class="pick-menu ${this._pickerOpen ? 'open' : ''}" role="listbox">
          ${sources.map(
            (s, i) => html`
              <button
                class="pick-item ${i === this._activeIdx ? 'sel' : ''}"
                role="option"
                aria-selected=${i === this._activeIdx ? 'true' : 'false'}
                @click=${() => this._selectCalendar(i)}
              >
                ${this._renderAvatar(s)}
                <span class="pick-name">${this._nameFor(s.entity)}</span>
              </button>
            `,
          )}
        </div>
      </div>
    `;
  }

  private _renderHead(days: Date[]): TemplateResult {
    const cfg = this._config!;
    const failed = this._subs.failed;
    const list = this._mode === 'list';
    // The phone drops the date range and keeps only the pill. Every day heading
    // below carries its own date, so on a narrow card the range was a second
    // answer to a question already answered five times over — and the pill says
    // the thing the headings cannot, which is where this week sits relative to
    // now. The grid keeps both: its day columns are initials, not dates.
    const range =
      list || !days.length
        ? ''
        : `${this._fmtDate(days[0])} – ${this._fmtDate(days[days.length - 1])}`;
    return html`
      <div class="head">
        <div class="titles">
          ${this._renderPicker()}
          <!-- Both only in edit mode, and both in the same breath: the pill says
               the card is armed, and the + is the one thing that mode offers
               which pressing the grid cannot reach on a phone, where the list
               layout has no timeline to press. -->
          ${this._editMode
            ? html`
                <span class="pill edit-pill">Edit Mode</span>
                <button
                  class="pill add-pill"
                  aria-label="Add event"
                  title="Add event"
                  @click=${() => this._openCreator(this._nowSlot)}
                >
                  <ha-icon icon="mdi:plus"></ha-icon>
                </button>
              `
            : nothing}
        </div>
        ${this._renderModeToggles()}
        <div class="head-right">
          <div class="tools">
          ${failed.length
            ? html`<div class="warn" title=${failed.join(', ')}>
                <ha-icon icon="mdi:alert-circle-outline"></ha-icon>
              </div>`
            : nothing}
          <button class="btn" @click=${() => this._goWeek(-1)} aria-label="Previous week">
            <ha-icon icon="mdi:chevron-left"></ha-icon>
          </button>
          <button
            class="btn today ${this._weekOffset === 0 ? 'off' : ''}"
            @click=${() => this._goToday()}
            aria-label="This week"
          >
            <ha-icon icon="mdi:calendar-today"></ha-icon>
          </button>
          <button class="btn" @click=${() => this._goWeek(1)} aria-label="Next week">
            <ha-icon icon="mdi:chevron-right"></ha-icon>
          </button>
          ${(cfg.show_refresh ?? DEFAULTS.show_refresh) ? this._renderToolsMenu() : nothing}
          </div>
          <div class="range dir-${this._navDir}">
            ${range}<span class="pill">${this._weekLabel}</span>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * The overflow menu, in the slot the refresh button used to hold on its own.
   *
   * Refresh moved INTO it rather than sitting beside it: the header already
   * carries four buttons on a phone, and a fifth for a mode that is used once in
   * a while would have cost the calendar name the width it needs. The button
   * still spins while a refresh runs, so the feedback did not move with it.
   */
  private _renderToolsMenu(): TemplateResult {
    const open = this._menuOpen;
    return html`
      <div class="tools-menu-wrap">
        <button
          class="btn ${this._refreshing ? 'spin' : ''} ${open ? 'on' : ''}"
          aria-haspopup="menu"
          aria-expanded=${open ? 'true' : 'false'}
          aria-label="More"
          @click=${() => this._setMenu(!open)}
        >
          <ha-icon icon=${this._refreshing ? 'mdi:refresh' : 'mdi:dots-horizontal'}></ha-icon>
        </button>
        <div class="pick-menu menu-right ${open ? 'open' : ''}" role="menu">
          <button
            class="pick-item"
            role="menuitem"
            @click=${() => {
              this._setMenu(false);
              void this._refresh();
            }}
          >
            <ha-icon icon="mdi:refresh"></ha-icon>
            <span class="pick-name">Refresh calendar</span>
          </button>
          <button
            class="pick-item ${this._editMode ? 'sel' : ''}"
            role="menuitem"
            @click=${() => this._toggleEditMode()}
          >
            <ha-icon icon=${this._editMode ? 'mdi:pencil-off' : 'mdi:pencil'}></ha-icon>
            <span class="pick-name">
              ${this._editMode ? 'Leave Edit Mode' : 'Enter Edit Mode'}
            </span>
          </button>
        </div>
      </div>
    `;
  }

  /**
   * The two mode toggles, centred in the header.
   *
   * Each shows the mode it is CURRENTLY in rather than the one it would switch
   * to - a toggle that displays its own destination reads backwards the moment
   * you stop looking at it - and is highlighted when it is on the non-default
   * setting, so a glance says whether the view has been reshaped.
   *
   * Only offered where they mean something: the list layout has no time axis at
   * all, and view_width_mode has nothing to fit unless the days run as rows.
   */
  private _renderModeToggles(): unknown {
    const cfg = this._config!;
    if (!(cfg.show_mode_toggles ?? DEFAULTS.show_mode_toggles)) return nothing;
    if (this._mode !== 'grid') return nothing;

    const full = this._calendarMode === 'full';
    const adaptive = this._widthMode === 'adaptive';
    const rows = this._orientation === 'days-as-rows';
    const ic =
      TOGGLE_ICONS[cfg.mode_toggle_icons ?? DEFAULTS.mode_toggle_icons] ??
      TOGGLE_ICONS[DEFAULTS.mode_toggle_icons];

    return html`
      <div class="mode-toggles">
        <button
          class="btn ${full ? 'on' : ''}"
          @click=${() => this._toggleMode('calendar_mode')}
          title=${full ? 'Whole day - tap to fit the events' : 'Fitted to the events - tap for the whole day'}
          aria-pressed=${full ? 'true' : 'false'}
          aria-label="Time span"
        >
          <ha-icon icon=${full ? ic.full : ic.focused}></ha-icon>
        </button>
        ${rows
          ? html`<button
              class="btn ${adaptive ? 'on' : ''}"
              @click=${() => this._toggleMode('view_width_mode')}
              title=${adaptive
                ? 'Fitted to the card - tap for a fixed scale'
                : 'Fixed scale, scrolls - tap to fit the card'}
              aria-pressed=${adaptive ? 'true' : 'false'}
              aria-label="Width"
            >
              <ha-icon icon=${adaptive ? ic.adaptive : ic.fixed}></ha-icon>
            </button>`
          : nothing}
      </div>
    `;
  }

  /**
   * Size and place the custom scrollbar thumb.
   *
   * Called on scroll AND from `updated`, because on first paint there has been
   * no scroll event yet and the bar has to be there from the start — its job is
   * to tell you there is more schedule off-screen, which is most useful before
   * you have touched anything.
   *
   * Fractions rather than pixels: the track sits under the hour columns only, so
   * it is narrower than the scroller.
   */
  private _measureScrollbar(el?: HTMLElement | null): void {
    const sc = el ?? (this.renderRoot?.querySelector('.rscroll') as HTMLElement | null);
    if (!sc) return;
    const { scrollLeft, scrollWidth, clientWidth } = sc;
    // The scroller IS the axis in adaptive mode - the day column is a sibling,
    // not a child - so this is what a pixel margin has to be stated against.
    if (clientWidth && Math.abs(clientWidth - this._axisPx) > 0.5) this._axisPx = clientWidth;
    if (scrollWidth <= clientWidth + 1) {
      if (this._hThumb) this._hThumb = null;
      return;
    }
    const width = Math.max(6, (clientWidth / scrollWidth) * 100);
    const left = (scrollLeft / (scrollWidth - clientWidth)) * (100 - width);
    const prev = this._hThumb;
    if (!prev || Math.abs(prev.left - left) > 0.05 || Math.abs(prev.width - width) > 0.05) {
      this._hThumb = { left, width };
    }
  }

  /**
   * Park the scroller where the active calendar should open: just before the
   * first event for a full-day calendar, and 0 for a focused one — where x=0 is
   * the first event already, but still needs setting so a switch does not
   * inherit the previous calendar's position.
   *
   * The assignment is retried across a few frames because layout is not settled
   * on the update that first renders the grid, and a scrollLeft set before the
   * content is scrollable is silently CLAMPED TO ZERO — recording the position
   * as done before checking left the card sitting at midnight.
   */
  private _focusScroller(): void {
    // Runs for focused mode too, where the target is simply 0: switching from a
    // full-day calendar left the scroller wherever that one had been, so the
    // school week opened scrolled to Friday afternoon.
    const key = `${this._weekOffset}|${this._activeIdx}|${this._focusPx}`;
    if (key === this._focusKey) return;
    // Re-entrancy guard. Setting scrollLeft fires a scroll event, which updates
    // the scrollbar state, which re-renders, which calls back in here — and the
    // key is not recorded until the value sticks, so without this every one of
    // those re-entries started ANOTHER retry chain and the page locked up.
    if (this._focusBusy) return;
    const el = this.renderRoot?.querySelector('.rscroll') as HTMLElement | null;
    if (!el) return;

    this._focusBusy = true;
    let tries = 0;
    const apply = (): void => {
      el.scrollLeft = this._focusPx;
      if (Math.abs(el.scrollLeft - this._focusPx) < 2) {
        this._focusKey = key;
        this._focusBusy = false;
        return;
      }
      if (tries++ < 12) {
        requestAnimationFrame(apply);
      } else {
        this._focusBusy = false;
      }
    };
    apply();
  }

  private _onHScroll(ev: Event): void {
    this._measureScrollbar(ev.currentTarget as HTMLElement);
  }

  /* ------------------------------------------------------------------ *
   * Dragging the horizontal scrollbar.
   *
   * The native bar is hidden (scrollbar-width: none) and this thumb drawn in its
   * place, which on a touch kiosk is all it needs to be: an indicator that there
   * is more week to the right. On a desktop that is not enough - a thing shaped
   * exactly like a scrollbar that cannot be dragged is worse than no scrollbar
   * at all - so it behaves like one.
   * ------------------------------------------------------------------ */

  private _barDrag: { x0: number; left0: number; travel: number; max: number } | null = null;

  private get _scrollerEl(): HTMLElement | null {
    return (this.renderRoot?.querySelector('.rscroll') as HTMLElement | null) ?? null;
  }

  private _barDown(e: PointerEvent): void {
    const bar = e.currentTarget as HTMLElement;
    const thumb = bar.querySelector('.hthumb') as HTMLElement | null;
    const sc = this._scrollerEl;
    if (!thumb || !sc) return;

    const track = bar.getBoundingClientRect();
    const t = thumb.getBoundingClientRect();
    const max = sc.scrollWidth - sc.clientWidth;
    // How far the thumb itself can travel, which is NOT the track width: the
    // thumb's own width is the part of the track it always occupies.
    const travel = Math.max(1, track.width - t.width);
    if (max <= 0) return;

    let left0 = t.left - track.left;
    // Pressed the track rather than the thumb: jump so the thumb centres on the
    // pointer, then carry on as a drag from there. That is what a modern
    // scrollbar does, and it makes a long week one gesture instead of several.
    if (e.clientX < t.left || e.clientX > t.right) {
      left0 = Math.max(0, Math.min(travel, e.clientX - track.left - t.width / 2));
      sc.scrollLeft = (left0 / travel) * max;
    }

    this._barDrag = { x0: e.clientX, left0, travel, max };
    bar.classList.add('dragging');
    try {
      bar.setPointerCapture(e.pointerId);
    } catch {
      /* synthetic pointer in a test - the drag still tracks without capture */
    }
    // Stops the press selecting the grid's text as the pointer sweeps across it.
    e.preventDefault();
  }

  private _barMove(e: PointerEvent): void {
    const d = this._barDrag;
    const sc = this._scrollerEl;
    if (!d || !sc) return;
    const left = Math.max(0, Math.min(d.travel, d.left0 + (e.clientX - d.x0)));
    // Setting scrollLeft fires scroll, which re-measures the thumb and moves it.
    sc.scrollLeft = (left / d.travel) * d.max;
    e.preventDefault();
  }

  private _barUp(e: PointerEvent): void {
    if (!this._barDrag) return;
    this._barDrag = null;
    const bar = e.currentTarget as HTMLElement;
    bar.classList.remove('dragging');
    try {
      bar.releasePointerCapture(e.pointerId);
    } catch {
      /* never captured */
    }
  }

  private get _orientation(): 'days-as-columns' | 'days-as-rows' {
    return this._config?.orientation === 'days-as-rows' ? 'days-as-rows' : 'days-as-columns';
  }

  /**
   * The two orientations share everything that matters — the same events, the
   * same lane packing, the same colours, the same uniform-lattice rule. Only the
   * axis each one runs along differs, so `placeWeek`'s `column` is read as a
   * sub-column in one and a stacked sub-row in the other.
   */
  private _renderGrid(
    days: Date[],
    all: ScheduleEvent[],
    axis: { start: number; end: number },
  ): TemplateResult {
    return this._orientation === 'days-as-rows'
      ? this._renderRowsGrid(days, all, axis)
      : this._renderColumnsGrid(days, all, axis);
  }

  /** Days down the left, time across the top — the printed-timetable shape. */
  private _renderRowsGrid(
    days: Date[],
    all: ScheduleEvent[],
    axis: { start: number; end: number },
  ): TemplateResult {
    const cfg = this._config!;
    const laneH = cfg.day_height ?? DEFAULTS.day_height;
    const hourW = cfg.hour_width ?? DEFAULTS.hour_width;

    // `full` draws the whole day; `focused` (the default) fits the axis to this
    // calendar's own events, which is everything the school grid depends on.
    const fullDay = this._calendarMode === 'full';
    const spanStart = fullDay ? 0 : axis.start;
    const spanEnd = fullDay ? 24 * 60 : axis.end;
    const span = spanEnd - spanStart;

    // `adaptive` fits the span to the card, so every x is a PERCENTAGE of the
    // axis and the grid reflows on resize with nothing measured in JS. `fixed`
    // keeps a constant pixels-per-hour and lets the grid overflow into the
    // scroller. Everything below is written in terms of pos() + unit so the two
    // paths share one code path rather than forking the renderer.
    const adaptive = this._widthMode === 'adaptive';
    const axisW = Math.round((span / 60) * hourW);
    const unit = adaptive ? '%' : 'px';
    /** The far end of the axis in whatever unit pos() speaks. */
    const axisEnd = adaptive ? 100 : axisW;
    const pos = (minutes: number) =>
      ((minutes - spanStart) / span) * (adaptive ? 100 : axisW);
    /** The block floor in whatever unit pos() speaks. pos() is linear, so the
        floor's own duration measured from the start of the span is the same
        length anywhere along it. */
    const minBlockW = pos(spanStart + MIN_BLOCK_MINUTES) - pos(spanStart);
    /**
     * How close to the far end an hour label has to be before it is pulled back
     * inside instead of straddling the tick.
     *
     * MEASURED, not a constant, because the answer is "half a label" and only
     * one of the two modes states position in pixels. In adaptive the axis is
     * 100% of a box whose width is only known at runtime, so a fixed 0.5% - what
     * this used to be - is half a label at 4000px and a twentieth of one at 200.
     * That is what let the last label hang past the end: on a week ending 17:00 it
     * lands at 99.1%, inside a 0.5% margin, so it stayed centred, overhung by
     * 7px, and gave the card a scrollbar in the mode that is supposed to fit.
     */
    const edge = adaptive
      ? (HOUR_LABEL_HALF_PX / Math.max(1, this._axisPx || axisW)) * 100
      : HOUR_LABEL_HALF_PX;

    const perDay = days.map((d) => eventsForDay(all.filter((e) => !e.allDay), d));
    // Only the calendar on screen may claim a lane. Handing placeWeek every
    // configured entity reserved an empty lane per hidden calendar, which
    // doubled the row height as soon as a second calendar was configured.
    const laneEntities = this._active ? [this._active.entity] : [];
    const placement = placeWeek(perDay, cfg.lane_mode ?? DEFAULTS.lane_mode, laneEntities);
    const rowH = placement.columns * laneH;

    const allDay = days.map((d) => eventsForDay(all.filter((e) => e.allDay), d));

    const allHours: number[] = [];
    for (let m = Math.ceil(spanStart / 60) * 60; m <= spanEnd; m += 60) allHours.push(m);

    // How wide an hour actually lands. In fixed mode that is hour_width by
    // definition; in adaptive it depends on the card, so it comes off the
    // measured host width less the day column and the panel's padding.
    const availW = Math.max(160, (this._hostWidth || 1000) - RDAY_W - PANEL_PAD * 2);
    const pxPerHour = adaptive ? availW / (span / 60) : hourW;
    const hourStep = Math.max(1, Math.ceil(MIN_HOUR_PX / pxPerHour));
    const hours = allHours.filter((_m, i) => i % hourStep === 0);

    const todayIdx = days.findIndex((d) => sameDay(d, this._now));
    // Nothing to scroll to when the whole span already fits.
    this._focusPx =
      fullDay && !adaptive
        ? Math.max(0, Math.round(((axis.start - FOCUS_LEAD_MIN - spanStart) / span) * axisW))
        : 0;

    return html`
      <div
        class="rgrid dir-${this._navDir} ${this._receded ? 'dimmed' : ''} ${this._editMode
          ? 'editing'
          : ''}"
        style="--row-h:${rowH}px; --lane-h:${laneH}px"
      >
        <div
          class="rframe"
          @animationend=${() => {
            this._navDir = 'none';
          }}
        >
          <!-- Outside the scroller on purpose. As a sticky child it bulged
               during the rubber-band: overscroll drives scrollLeft negative,
               and sticky only ever pushes an element right, so it travelled
               with the content. Out here it cannot move at all, while the hours
               keep their bounce. -->
          <div class="rdays">
            <div class="rcorner"></div>
            ${days.map(
              (d, i) => html`
                <div
                  class="rday ${i % 2 ? 'alt' : ''} ${i === todayIdx ? 'today' : ''}"
                  @pointerdown=${(e: PointerEvent) =>
                    this._pressStart(e, d, i, labelPress(this._nowMinutes))}
                  @contextmenu=${(e: Event) => {
                    if (this._editMode) e.preventDefault();
                  }}
                >
                  <span class="dow">${this._fmtDowLong(d)},</span>
                  <span class="dnum">${this._fmtDate(d)}</span>
                  ${this._press?.idx === i && this._press.kind === 'label'
                    ? html`<div class="press-ghost head" style=${this._press.style}></div>`
                    : nothing}
                </div>
              `,
            )}
          </div>

          <div class="rscroll" @scroll=${(e: Event) => this._onHScroll(e)}>
            <div class="rinner" style="--axis-w:${adaptive ? '100%' : `${axisW}px`}">
              <div class="rtimes">
                ${hours.map(
                  (m) =>
                    html`<div
                      class="rhr ${pos(m) < 0.5 ? 'first' : ''} ${pos(m) >= axisEnd - edge
                        ? 'last'
                        : ''}"
                      style="left:${pos(m)}${unit}"
                    >
                      ${this._fmtHour(m)}
                    </div>`,
                )}
              </div>

              ${days.map((d, i) => {
                const dayStart = startOfDay(d).getTime();
                return html`
                  <div
                    class="rcanvas ${i % 2 ? 'alt' : ''}"
                    @pointerdown=${(e: PointerEvent) =>
                      this._pressStart(e, d, i, {
                        axis: 'x',
                        start: spanStart,
                        span,
                        // NO minimum width, unlike a real block. The floor is
                        // there so a five-minute lesson is still readable; on
                        // the ghost it made a five-minute SLOT draw twelve
                        // minutes wide and reach into the lesson after it, which
                        // read as the gap not working at all. It has to tell the
                        // truth about what it is claiming, however thin.
                        kind: 'slot',
                        ghost: (f, t) =>
                          `left:${pos(f)}${unit}; width:${pos(t) - pos(f)}${unit};
                           top:0; height:100%`,
                      })}
                    @contextmenu=${(e: Event) => {
                      if (this._editMode) e.preventDefault();
                    }}
                  >
                    ${this._press?.idx === i && this._press.kind === 'slot'
                      ? html`<div class="press-ghost" style=${this._press.style}></div>`
                      : nothing}
                    <div class="rlines">
                      ${hours.map(
                        (m) => html`<div class="rline" style="left:${pos(m)}${unit}"></div>`,
                      )}
                    </div>
                    ${allDay[i].map(
                      (ev) => html`
                        <div
                          class="ev rev"
                          style="left:0; width:100%; top:0; height:${laneH}px;
                                 animation-name:${this._evAnim}; animation-delay:${i * STAGGER_MS}ms;
                                 ${blockStyle(this._colorForEvent(ev), this._minContrast)}"
                          @click=${() => this._pickEvent(ev)}
                        >
                          <div class="ev-in"><div class="ev-name">${ev.summary}</div></div>
                        </div>
                      `,
                    )}
                    ${placement.days[i].map(({ ev, column }) => {
                      const st = Math.max(spanStart, minsFrom(ev.start, dayStart));
                      const eRaw = minsFrom(ev.end, dayStart);
                      const en = Math.min(spanEnd, eRaw <= st ? st + 15 : eRaw);
                      if (en <= spanStart || st >= spanEnd) return nothing;
                      const left = pos(st);
                      // Floor in the CURRENT unit - px when fixed, % when
                      // adaptive - by measuring the floor's own duration
                      // through pos(), rather than pinning a pixel min-width
                      // that means a different length of time in each mode.
                      const width = Math.max(pos(en) - left, minBlockW);
                      return html`
                        <div
                          class="ev rev"
                          style="left:${left}${unit}; width:${width}${unit};
                                 top:${column * laneH}px; height:${laneH}px;
                                 animation-name:${this._evAnim}; animation-delay:${i * STAGGER_MS}ms;
                                 ${blockStyle(this._colorForEvent(ev), this._minContrast)}"
                          @click=${() => this._pickEvent(ev)}
                        >
                          <div class="ev-in">
                            <div class="ev-name">${ev.summary}</div>
                            <div class="ev-time">
                              ${this._fmtTime(ev.start)} – ${this._fmtTime(ev.end)}
                            </div>
                          </div>
                        </div>
                      `;
                    })}
                  </div>
                `;
              })}
            </div>
          </div>
        </div>
        ${this._hThumb
          ? html`<div
              class="hbar"
              @pointerdown=${(e: PointerEvent) => this._barDown(e)}
              @pointermove=${(e: PointerEvent) => this._barMove(e)}
              @pointerup=${(e: PointerEvent) => this._barUp(e)}
              @pointercancel=${(e: PointerEvent) => this._barUp(e)}
            >
              <div
                class="hthumb"
                style="left:${this._hThumb.left}%; width:${this._hThumb.width}%"
              ></div>
            </div>`
          : nothing}
      </div>
    `;
  }

  /** Days across the top, time down the left — the calendar shape. */
  private _renderColumnsGrid(
    days: Date[],
    all: ScheduleEvent[],
    axis: { start: number; end: number },
  ): TemplateResult {
    // This orientation has no scroller, so `full` simply means a taller card.
    // Reassigned rather than handled in render(), which feeds both renderers:
    // the rows one needs the true event bounds to know where to scroll to.
    if (this._calendarMode === 'full') axis = { start: 0, end: 24 * 60 };
    const cfg = this._config!;
    const hourH = cfg.hour_height ?? DEFAULTS.hour_height;
    const span = axis.end - axis.start;
    const bodyH = Math.round((span / 60) * hourH);

    const perDay = days.map((d) => eventsForDay(all.filter((e) => !e.allDay), d));
    // Only the calendar on screen may claim a lane. Handing placeWeek every
    // configured entity reserved an empty lane per hidden calendar, which
    // doubled the row height as soon as a second calendar was configured.
    const laneEntities = this._active ? [this._active.entity] : [];
    const placement = placeWeek(perDay, cfg.lane_mode ?? DEFAULTS.lane_mode, laneEntities);
    const allDay = days.map((d) => eventsForDay(all.filter((e) => e.allDay), d));
    const hasAllDay = allDay.some((l) => l.length > 0);

    const hours: number[] = [];
    for (let m = Math.ceil(axis.start / 60) * 60; m <= axis.end; m += 60) hours.push(m);

    const cols = days.length;
    return html`
      <div
        class="grid dir-${this._navDir} ${this._receded ? 'dimmed' : ''} ${this._editMode
          ? 'editing'
          : ''}"
        style="--cols:${cols}; --sub:${placement.columns}; --body-h:${bodyH}px"
        @animationend=${() => {
          this._navDir = 'none';
        }}
      >
        <div class="hdr">
          <div class="corner"></div>
          ${days.map(
            (d, i) => html`
              <div
                class="dayhead ${i % 2 ? 'alt' : ''}"
                @pointerdown=${(e: PointerEvent) =>
                  this._pressStart(e, d, i, labelPress(this._nowMinutes))}
                @contextmenu=${(e: Event) => {
                  if (this._editMode) e.preventDefault();
                }}
              >
                <span class="dow">${this._fmtDowLong(d)},</span>
                <span class="dnum">${this._fmtDate(d)}</span>
                ${this._press?.idx === i && this._press.kind === 'label'
                  ? html`<div class="press-ghost head" style=${this._press.style}></div>`
                  : nothing}
              </div>
            `,
          )}
        </div>

        ${hasAllDay
          ? html`
              <div class="allday">
                <div class="gut-lbl">all-day</div>
                ${allDay.map(
                  (list) => html`
                    <div class="ad-cell">
                      ${list.map(
                        (ev) => html`
                          <div
                            class="ad"
                            style=${blockStyle(this._colorForEvent(ev), this._minContrast)}
                            @click=${() => this._pickEvent(ev)}
                          >
                            ${ev.summary}
                          </div>
                        `,
                      )}
                    </div>
                  `,
                )}
              </div>
            `
          : nothing}

        <div class="body">
          <div class="lines">
            ${hours.map(
              (m) => html`<div class="line" style="top:${pct(m, axis)}"></div>`,
            )}
          </div>
          <div class="gutter">
            ${hours.map(
              (m) => html`<div class="hr" style="top:${pct(m, axis)}">${this._fmtHour(m)}</div>`,
            )}
          </div>
          ${days.map((d, i) =>
            this._renderDay(d, i, placement.days[i], placement.columns, axis, bodyH),
          )}
        </div>
      </div>
    `;
  }

  private _renderDay(
    day: Date,
    dayIdx: number,
    placed: Array<{ ev: ScheduleEvent; column: number }>,
    columns: number,
    axis: { start: number; end: number },
    bodyH: number,
  ): TemplateResult {
    const span = axis.end - axis.start;
    const dayStart = startOfDay(day).getTime();

    return html`
      <div
        class="day ${dayIdx % 2 ? 'alt' : ''}"
        @pointerdown=${(e: PointerEvent) =>
          this._pressStart(e, day, dayIdx, {
            axis: 'y',
            start: axis.start,
            span,
            kind: 'slot',
            // No minimum height, for the reason the rows grid has no minimum
            // width: the ghost is the slot, not a block.
            ghost: (f, t) =>
              `top:${((f - axis.start) / span) * bodyH}px;
               height:${((t - f) / span) * bodyH}px;
               left:0; width:100%`,
          })}
        @contextmenu=${(e: Event) => {
          if (this._editMode) e.preventDefault();
        }}
      >
        ${this._press?.idx === dayIdx && this._press.kind === 'slot'
          ? html`<div class="press-ghost" style=${this._press.style}></div>`
          : nothing}
        ${placed.map(({ ev, column }) => {
          // Clip to the day so an event crossing midnight still draws sanely.
          const s = Math.max(axis.start, minsFrom(ev.start, dayStart));
          const eRaw = minsFrom(ev.end, dayStart);
          const e = Math.min(axis.end, eRaw <= s ? s + 15 : eRaw);
          if (e <= axis.start || s >= axis.end) return nothing;
          const topPx = ((s - axis.start) / span) * bodyH;
          const hPx = Math.max(MIN_BLOCK_PX, ((e - s) / span) * bodyH);
          const color = this._colorForEvent(ev);
          const compact = hPx < 46;
          return html`
            <div
              class="ev ${compact ? 'compact' : ''} ${this._selected?.key === ev.key ? 'sel' : ''}"
              style="top:${topPx}px; height:${hPx}px;
                     left:calc(${column} * (100% / ${columns}));
                     width:calc(100% / ${columns});
                     animation-name:${this._evAnim}; animation-delay:${dayIdx * STAGGER_MS}ms;
                     ${blockStyle(color, this._minContrast)}"
              @click=${() => this._pickEvent(ev)}
            >
              <div class="ev-in">
                <div class="ev-name">${ev.summary}</div>
                ${compact
                  ? nothing
                  : html`<div class="ev-time">
                      ${this._fmtTime(ev.start)} – ${this._fmtTime(ev.end)}
                    </div>`}
              </div>
            </div>
          `;
        })}
      </div>
    `;
  }

  /**
   * Narrow fallback. Deliberately minimal for v0.1.0 — the phone design is a
   * later pass; this exists so the card is not broken when it lands on one.
   */
  private _renderList(days: Date[], all: ScheduleEvent[]): TemplateResult {
    // One running index across the whole list, so the cascade sweeps top to
    // bottom rather than restarting at each day. Capped, because 30-odd rows at
    // the grid's per-row pace would take the best part of two seconds.
    let row = 0;
    // The list has no time axis to press against, so a press means that day at
    // the current clock time — the same default the + button uses. The target is
    // the DAY HEADING and nothing else: the list has no empty space to press,
    // and a press on the block as a whole had to draw its feedback somewhere,
    // which ended up as a stray outlined row at the foot of the day. The
    // heading is a real thing to press, and it can light up in place. Both
    // grids now carry the same gesture on their own day cells, so a press on a
    // day label means the same thing whichever layout the card is in.
    const headPress = labelPress(this._nowMinutes);
    return html`
      <div
        class="list ${this._receded ? 'dimmed' : ''} ${this._editMode
          ? 'editing'
          : ''} dir-${this._navDir}"
        @animationend=${() => {
          this._navDir = 'none';
        }}
      >
        ${days.map((d, i) => {
          const evs = eventsForDay(all, d).sort(
            (a, b) => a.start.getTime() - b.start.getTime(),
          );
          return html`
            <div class="ld">
              <div
                class="ld-head ${sameDay(d, this._now) ? 'today' : ''}"
                @pointerdown=${(e: PointerEvent) => this._pressStart(e, d, i, headPress)}
                @contextmenu=${(e: Event) => {
                  if (this._editMode) e.preventDefault();
                }}
              >
                <!-- The row lives in an inner box so the heading itself is a
                     plain block: an absolutely positioned child of a FLEX
                     container does not resolve inset:0 against the padding box
                     here, and the overlay came up 6px short of the heading it
                     is supposed to cover. -->
                <span class="ld-head-in">
                  <span class="dow">${this._fmtDowLong(d)},</span>
                  <span class="dnum">${this._fmtDate(d)}</span>
                </span>
                ${this._press?.idx === i && this._press.kind === 'label'
                  ? html`<div class="press-ghost head" style=${this._press.style}></div>`
                  : nothing}
              </div>
              ${evs.length
                ? evs.map(
                    (ev) => html`
                      <div
                        class="lr"
                        style="animation-name:${this._evAnim};
                               animation-delay:${Math.min(
                                 row++ * LIST_STAGGER_MS,
                                 LIST_STAGGER_CAP_MS,
                               )}ms"
                        @click=${() => this._pickEvent(ev)}
                      >
                        <span class="lr-bar" style="background:${this._colorForEvent(ev)}"></span>
                        <span class="lr-time">
                          ${ev.allDay
                            ? 'all day'
                            : html`${this._fmtTime(ev.start)}<br />${this._fmtTime(ev.end)}`}
                        </span>
                        <span class="lr-name">${ev.summary}</span>
                      </div>
                    `,
                  )
                : html`<div class="lr empty">Nothing scheduled</div>`}
            </div>
          `;
        })}
      </div>
    `;
  }

  /* ---- the date and time pickers ------------------------------------
   *
   * Built rather than borrowed. `<input type="date">` and `<input type="time">`
   * are small, keyboard-shaped controls that follow the BROWSER's locale, so on
   * this setup they showed 12-hour time inside a card configured for 24 — and on
   * a wall tablet they are close to unusable with a finger.
   *
   * These are the two iOS shapes instead: a month grid for a date, a scrolling
   * drum for a time, both with 44px targets, opened inline under the row rather
   * than in a modal on top of a modal.
   * ------------------------------------------------------------------ */

  /** Snap a wheel column to the row nearest its resting position. */
  private _onWheelScroll(ev: Event, kind: 'hour' | 'minute', field: 'startTime' | 'endTime'): void {
    const el = ev.currentTarget as HTMLElement;
    window.clearTimeout(this._wheelTimers[kind]);
    // Debounced rather than driven by `scrollend`, which Safari only learned
    // recently and this has to work on the family's phones today.
    this._wheelTimers[kind] = window.setTimeout(() => {
      const index = Math.round(el.scrollTop / WHEEL_ITEM_H);
      const d = this._draft;
      if (!d) return;
      const [h, m] = (d[field] || '00:00').split(':').map(Number);
      const hour = kind === 'hour' ? Math.min(23, Math.max(0, index)) : h;
      const minute = kind === 'minute' ? Math.min(59, Math.max(0, index)) : m;
      const p = (n: number) => String(n).padStart(2, '0');
      const next = `${p(hour)}:${p(minute)}`;
      if (next === d[field]) return;
      if (field === 'startTime') this._patchStart({ startTime: next });
      else this._patchDraft({ endTime: next });
    }, 140);
  }

  private _wheelTimers: Record<string, number> = {};

  /** Put every open wheel at its selected row. Called from updated(). */
  /**
   * Send a drum to one row, which is how a MOUSE drives this thing.
   *
   * The wheels were built for a thumb and only ever responded to a drag, which
   * on a desktop leaves a control you have to fling with a trackpad to set a
   * time. Both routes below just scroll the column; the existing debounced
   * scroll handler is what commits the value, so there is one path to the draft
   * however the row was chosen.
   */
  private _spinWheel(col: HTMLElement, index: number, max: number): void {
    const to = Math.min(max, Math.max(0, index)) * WHEEL_ITEM_H;
    col.scrollTo({ top: to, behavior: this._reducedMotion ? 'auto' : 'smooth' });
  }

  /** One notch of the mouse wheel is one row, over whichever column is hovered. */
  private _onWheelTick(e: WheelEvent, max: number): void {
    const dir = Math.sign(e.deltaY);
    if (!dir) return;
    // Owned here: without this the scroll runs on and the panel, the sheet or
    // the dashboard behind it moves as well.
    e.preventDefault();
    e.stopPropagation();
    const col = e.currentTarget as HTMLElement;
    this._spinWheel(col, Math.round(col.scrollTop / WHEEL_ITEM_H) + dir, max);
  }

  private _positionWheels(): void {
    const cols = this.renderRoot?.querySelectorAll<HTMLElement>('.wheel-col');
    if (!cols?.length) return;
    for (const col of cols) {
      const index = Number(col.dataset.index ?? 0);
      col.scrollTop = index * WHEEL_ITEM_H;
    }
  }

  private _renderWheel(field: 'startTime' | 'endTime'): TemplateResult {
    const value = this._draft?.[field] ?? '00:00';
    const [h, m] = value.split(':').map(Number);
    const hours: number[] = [];
    for (let i = 0; i < 24; i++) hours.push(i);
    const minutes: number[] = [];
    for (let i = 0; i < 60; i++) minutes.push(i);
    const pad = (n: number) => String(n).padStart(2, '0');
    const hourLabel = (n: number) => {
      if (!this._hour12) return pad(n);
      const twelve = n % 12 === 0 ? 12 : n % 12;
      return `${twelve} ${n < 12 ? 'AM' : 'PM'}`;
    };
    return html`
      <div class="wheel" style="--wheel-h:${WHEEL_ITEM_H * WHEEL_ROWS}px">
        <div class="wheel-band"></div>
        <div
          class="wheel-col"
          data-index=${h}
          @scroll=${(e: Event) => this._onWheelScroll(e, 'hour', field)}
          @wheel=${(e: WheelEvent) => this._onWheelTick(e, 23)}
        >
          <div class="wheel-pad"></div>
          ${hours.map(
            (n) => html`<div
              class="wheel-item ${n === h ? 'sel' : ''}"
              @click=${(e: Event) =>
                this._spinWheel((e.currentTarget as HTMLElement).parentElement!, n, 23)}
            >
              ${hourLabel(n)}
            </div>`,
          )}
          <div class="wheel-pad"></div>
        </div>
        <div class="wheel-sep">:</div>
        <div
          class="wheel-col"
          data-index=${m}
          @scroll=${(e: Event) => this._onWheelScroll(e, 'minute', field)}
          @wheel=${(e: WheelEvent) => this._onWheelTick(e, 59)}
        >
          <div class="wheel-pad"></div>
          ${minutes.map(
            (n) => html`<div
              class="wheel-item ${n === m ? 'sel' : ''}"
              @click=${(e: Event) =>
                this._spinWheel((e.currentTarget as HTMLElement).parentElement!, n, 59)}
            >
              ${pad(n)}
            </div>`,
          )}
          <div class="wheel-pad"></div>
        </div>
      </div>
    `;
  }

  private _renderCalendar(selected: string, pick: (iso: string) => void): TemplateResult {
    const shown = this._pickerMonth ?? { y: new Date().getFullYear(), m: new Date().getMonth() };
    const first = new Date(shown.y, shown.m, 1);
    // Monday-first, like the rest of the card.
    const lead = (first.getDay() + 6) % 7;
    const days = new Date(shown.y, shown.m + 1, 0).getDate();
    const cells: Array<Date | null> = [];
    for (let i = 0; i < lead; i++) cells.push(null);
    for (let i = 1; i <= days; i++) cells.push(new Date(shown.y, shown.m, i));
    const p = (n: number) => String(n).padStart(2, '0');
    const monthName = first.toLocaleDateString(this._lang, { month: 'long', year: 'numeric' });
    const dows: string[] = [];
    for (let i = 0; i < 7; i++) {
      dows.push(new Date(2024, 0, 1 + i).toLocaleDateString(this._lang, { weekday: 'narrow' }));
    }
    // The cells are reused across a month change, so the animation is restarted
    // by alternating its NAME — the same trick the event blocks use. The offset
    // travels with the direction, and is zero on the first open, where there is
    // no previous month for the new one to have come from.
    const anim = this._calEpoch % 2 ? 'calDayB' : 'calDayA';
    const from = this._calDir * 22;
    return html`
      <div class="cal" style="--cal-from:${from}px">
        <div class="cal-head">
          <button class="cal-nav" @click=${() => this._stepMonth(-1)} aria-label="Previous month">
            <ha-icon icon="mdi:chevron-left"></ha-icon>
          </button>
          <span class="cal-month" style="animation-name:${anim}">${monthName}</span>
          <button class="cal-nav" @click=${() => this._stepMonth(1)} aria-label="Next month">
            <ha-icon icon="mdi:chevron-right"></ha-icon>
          </button>
        </div>
        <div class="cal-grid">
          ${dows.map((d) => html`<div class="cal-dow">${d}</div>`)}
          ${cells.map((d, i) => {
            // By ROW, not by cell: forty-two separate delays reads as a ripple
            // across the grid, which is busy. Six reads as the month arriving.
            const delay = Math.floor(i / 7) * 26;
            if (!d) return html`<div></div>`;
            const iso = `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
            return html`
              <button
                class="cal-day ${iso === selected ? 'sel' : ''} ${sameDay(d, this._now)
                  ? 'today'
                  : ''}"
                style="animation-name:${anim}; animation-delay:${delay}ms"
                @click=${() => {
                  pick(iso);
                  this._closePicker();
                }}
              >
                ${d.getDate()}
              </button>
            `;
          })}
        </div>
      </div>
    `;
  }

  /**
   * A foldable group: a header row with a chevron, and content that springs.
   *
   * The content stays MOUNTED and is collapsed rather than removed. Lit dropping
   * it would make opening and closing instant, with nothing to animate — the
   * same reason the all-day time chip is collapsed instead of conditional.
   */
  private _renderFold(
    label: string,
    summary: string,
    open: boolean,
    toggle: () => void,
    content: TemplateResult,
    /** For a fold that can hold an open month grid, which outgrows the default. */
    tall = false,
  ): TemplateResult {
    return html`
      <div class="ed-group">
        <button
          class="ed-row ed-disclose"
          aria-expanded=${open ? 'true' : 'false'}
          @click=${() => {
            toggle();
            this._confirmDelete = false;
          }}
        >
          <span class="ed-lbl">${label}</span>
          <span class="ed-sub">${summary}</span>
          <ha-icon class="ed-chev ${open ? 'open' : ''}" icon="mdi:chevron-down"></ha-icon>
        </button>
        <div class="ed-fold ${open ? 'open' : ''} ${tall ? 'tall' : ''}">
          <div class="ed-fold-in">${content}</div>
        </div>
      </div>
    `;
  }

  /** A panel is on screen while it is open, and while it is collapsing away. */
  private _showPicker(field: Exclude<PickerField, null>): boolean {
    return this._openPicker === field || this._pickerClosing === field;
  }

  /** One row of the form whose value opens a picker under it. */
  private _renderPickerRow(
    label: string,
    dateField: 'startDate' | 'endDate',
    timeField: 'startTime' | 'endTime',
  ): TemplateResult {
    const d = this._draft!;
    const date = new Date(`${d[dateField]}T00:00`);
    const dateLabel = Number.isNaN(date.getTime())
      ? d[dateField]
      : date.toLocaleDateString(this._lang, { weekday: 'short', day: 'numeric', month: 'short' });
    const timeLabel = this._hour12
      ? new Date(`2000-01-01T${d[timeField]}`).toLocaleTimeString(this._lang, {
          hour: 'numeric',
          minute: '2-digit',
        })
      : d[timeField];
    return html`
      <div class="ed-row">
        <span class="ed-lbl">${label}</span>
        <span class="ed-vals picks">
          <button
            class="ed-chip ${this._openPicker === dateField ? 'on' : ''}"
            @click=${() => this._togglePicker(dateField)}
          >
            ${dateLabel}
          </button>
          <!-- Kept in the DOM when all-day is on, not removed. Lit dropping the
               element would give an instant disappearance and nothing to animate
               back in; collapsing it lets both directions spring. -->
          <button
            class="ed-chip time ${d.allDay ? 'gone' : ''} ${this._openPicker === timeField
              ? 'on'
              : ''}"
            tabindex=${d.allDay ? '-1' : '0'}
            aria-hidden=${d.allDay ? 'true' : 'false'}
            @click=${() => {
              if (!d.allDay) this._togglePicker(timeField);
            }}
          >
            <span class="chip-in">${timeLabel}</span>
          </button>
        </span>
      </div>
      ${this._showPicker(dateField)
        ? html`<div class="ed-picker" data-field=${dateField}>
            ${this._renderCalendar(d[dateField], (iso) =>
              dateField === 'startDate'
                ? this._patchStart({ startDate: iso })
                : this._patchDraft({ endDate: iso }),
            )}
          </div>`
        : nothing}
      ${this._showPicker(timeField) && !d.allDay
        ? html`<div class="ed-picker" data-field=${timeField}>
            ${this._renderWheel(timeField)}
          </div>`
        : nothing}
    `;
  }

  /* ---- location lookup ---------------------------------------------- */

  /**
   * Search as the user types, debounced, with the previous request dropped.
   *
   * Aborting matters more than the debounce does: without it a slow answer for
   * "gym" can land after a fast one for "gymnastika praha" and replace the good
   * suggestions with stale ones.
   */
  private _searchLocation(text: string): void {
    this._patchDraft({ location: text });
    if (this._placeTimer) clearTimeout(this._placeTimer);
    this._placeAbort?.abort();
    if (text.trim().length < MIN_QUERY_LEN) {
      this._places = [];
      this._placesBusy = false;
      return;
    }
    this._placesBusy = true;
    this._placeTimer = setTimeout(() => {
      const ctrl = new AbortController();
      this._placeAbort = ctrl;
      // Biased to the house, so a club down the road outranks one abroad.
      const home = this.hass?.states?.['zone.home']?.attributes;
      void searchPlaces(text, {
        lat: typeof home?.latitude === 'number' ? home.latitude : undefined,
        lon: typeof home?.longitude === 'number' ? home.longitude : undefined,
        lang: this._lang?.split('-')[0],
        signal: ctrl.signal,
      }).then((places) => {
        if (ctrl.signal.aborted) return;
        this._places = places;
        this._placesBusy = false;
      });
    }, 320);
  }

  /**
   * Choosing a suggestion fills the field and stops there.
   *
   * It used to open the map as well, which is an interruption: picking from the
   * list IS the answer, and the map is for the times it is not. The coordinates
   * are kept, so opening the map afterwards starts in the right place without
   * having to geocode the text again.
   */
  private _pickPlace(place: Place): void {
    this._patchDraft({ location: place.label });
    this._places = [];
    this._mapPoint = { lat: place.lat, lon: place.lon };
    this._mapWanted = true;
  }

  /**
   * Borrow Home Assistant's Leaflet, once per session.
   *
   * Called from EVERY path that opens the map — there are two, the map button
   * and picking a suggestion, and having only the button ask for it left the
   * other one showing the static preview for no reason anyone could see.
   */
  private async _ensureLeaflet(): Promise<void> {
    if (this._leaflet) return;
    const L = await loadLeaflet();
    this._leaflet = L;
    this._leafletOk = !!L;
  }

  /**
   * Show the map for whatever is in the location box.
   *
   * A place picked from the list already has its coordinates. Anything typed by
   * hand, or loaded from an existing event, is only text — so it is geocoded on
   * demand here rather than kept, because Google's event has nowhere to store a
   * latitude and the text is the only thing that survives a save.
   */
  private async _toggleMap(): Promise<void> {
    if (this._mapOpen) {
      this._mapOpen = false;
      return;
    }
    this._mapOpen = true;
    this._mapWanted = true;
    // Borrowed from Home Assistant on first use, then remembered. Failure is not
    // fatal: the static preview below renders the same tiles without panning.
    await this._ensureLeaflet();
    if (this._mapPoint) return;
    const text = this._draft?.location?.trim();
    if (!text) return;
    this._placesBusy = true;
    const found = await searchPlaces(text, { limit: 1 });
    this._placesBusy = false;
    if (found.length) this._mapPoint = { lat: found[0].lat, lon: found[0].lon };
  }

  /**
   * The map, interactive where it can be.
   *
   * Leaflet is Home Assistant's own, borrowed at runtime — see loadLeaflet. When
   * it is unavailable the same tiles are laid out statically instead, which
   * still shows WHERE the place is and only loses the panning.
   *
   * The pin does not move: it is fixed to the centre and the MAP moves under it.
   * That is the phone convention, and it avoids asking a finger to hit a 14px
   * target that is also the thing being dragged.
   */
  /* ---- repeat rules -------------------------------------------------- */

  /**
   * Open and close the inline picker panel, in height.
   *
   * Imperative rather than CSS, and height rather than max-height, because the
   * panel is a month grid one time and a pair of drums the next — 330px and
   * 220px — and one max-height covering both means the taller one crawls and
   * the shorter one is over before it starts. Measuring is the only way both
   * land on the same curve.
   *
   * Runs from updated(), which is the first moment the panel exists and has a
   * height to measure.
   */
  private _animatePicker(): void {
    const closing = this._pickerClosing;
    // Nothing to do while it is open: the way IN is the CSS on .ed-picker, which
    // opens the box on a plain ease and drops the content in on a spring. Only
    // the way out needs script, because a collapse has to start from a height
    // that is only known by measuring.
    if (!closing || closing === this._openPicker) return;
    if (this._pickerOutField === closing) return;

    if (this._reducedMotion) {
      this._pickerClosing = null;
      return;
    }
    // By data-field, never by document order: switching from one picker to
    // another puts two of them on screen at once, one opening and one
    // collapsing, and querySelector would hand back whichever came first.
    const el = this.renderRoot?.querySelector(
      `.ed-picker[data-field="${closing}"]`,
    ) as HTMLElement | null;
    if (!el) {
      this._pickerClosing = null;
      return;
    }

    this._pickerOutField = closing;
    this._pickerOutAnim?.cancel();
    const anim = el.animate(
      [
        { height: `${el.scrollHeight}px`, opacity: 1, transform: 'none' },
        { height: '0px', opacity: 0, transform: 'translateY(-8px)' },
      ],
      { duration: 240, easing: 'cubic-bezier(0.4, 0, 0.9, 1)', fill: 'forwards' },
    );
    this._pickerOutAnim = anim;
    // Unmounted only once it has finished shrinking. A second close landing
    // mid-flight cancels this one, and its own finish does the removing.
    anim.finished
      .then(() => {
        if (this._pickerOutAnim !== anim) return;
        this._pickerOutField = null;
        this._pickerClosing = null;
      })
      .catch(() => undefined);
  }

  /**
   * Animate the "Repeat every" row through a reflow.
   *
   * "week" becoming "weeks" makes that button wider, which makes the group
   * wider, which — the group being right-aligned — shoves the stepper left. All
   * of it landed in one frame.
   *
   * Widths are what is animated, NOT positions. Animate a translate and the
   * boxes glide while the container's border snaps to its new size around them;
   * animate the widths and the layout does the rest for free, so the stepper
   * slides left because the thing beside it is genuinely growing.
   *
   * Only the BUTTONS are animated. The .seg around them is inline-flex and
   * sizes to its contents, so it follows them frame by frame; animating it as
   * well gave it a width of its own that disagreed with the sum of its children
   * mid-flight, and the row jolted back into line at the end.
   *
   * Call _flipCapture BEFORE the state change; updated() plays it after.
   */
  private _flipCapture(): void {
    if (this._reducedMotion) {
      this._flipFrom = null;
      return;
    }
    const row = this.renderRoot?.querySelector('.rec-every');
    if (!row) return;
    this._flipFrom = [...row.querySelectorAll<HTMLElement>('.seg-btn')].map((el) => ({
      el,
      w: el.getBoundingClientRect().width,
    }));
  }

  private _flipPlay(): void {
    const from = this._flipFrom;
    if (!from) return;
    this._flipFrom = null;
    for (const { el, w } of from) {
      if (!el.isConnected) continue;
      const now = el.getBoundingClientRect().width;
      // Most of them do not move; only the words that gained an s do.
      if (Math.abs(now - w) < 0.5) continue;
      el.animate(
        // An EMPTY final keyframe means "whatever the layout says", so it lands
        // on the natural width instead of a measured one a fraction of a pixel
        // away from it. A measured endpoint is a guaranteed hop on the last
        // frame, which is exactly what a re-alignment jolt looks like.
        [{ width: `${w}px` }, {}],
        {
          duration: 380,
          // NOT the spring. Overshooting a WIDTH makes the row bulge past where
          // it is going and come back, and four buttons overshooting by four
          // different amounts is a wobble, not a settle.
          easing: 'cubic-bezier(0.32, 0.72, 0, 1)',
          fill: 'none',
        },
      );
    }
  }

  /** Step the month, with the direction the grid should slide from. */
  private _stepMonth(by: number): void {
    const shown = this._pickerMonth ?? { y: this._now.getFullYear(), m: this._now.getMonth() };
    this._pickerMonth = { y: shown.y, m: shown.m + by };
    this._calDir = by;
    // Lit REUSES the day cells across a month change, and a CSS animation only
    // restarts when the name changes. Alternating it is what makes the cascade
    // play again on every step rather than once ever.
    this._calEpoch++;
  }

  /**
   * The colour the whole form is accented with.
   *
   * Follows the colour PICKER rather than the event it was opened from, so a
   * new event has an accent before it exists and changing the colour shows at
   * once. For an existing event the two agree: colorId was read off the same
   * map _colorForEvent resolves through.
   */
  private get _draftAccent(): string {
    const d = this._draft;
    if (!d) return 'var(--ssc-fg)';
    return d.colorId
      ? (GOOGLE_EVENT_COLORS.find(([id]) => id === d.colorId)?.[1] ?? this._colorFor(d.entity))
      : this._colorFor(d.entity);
  }

  /** The draft's start as a Date, which every repeat label is generated from. */
  private get _draftStart(): Date {
    const d = this._draft;
    const at = new Date(`${d?.startDate ?? ''}T${d?.allDay ? '00:00' : (d?.startTime ?? '00:00')}`);
    return Number.isNaN(at.getTime()) ? new Date(this._now) : at;
  }

  /** Open the custom window on a working copy, seeded from whatever is set. */
  private _openCustom(): void {
    const start = this._draftStart;
    this._custom = this._draft?.repeat
      ? { ...this._draft.repeat, byDay: [...this._draft.repeat.byDay] }
      : {
          freq: 'WEEKLY',
          interval: 1,
          byDay: [RFC_DAYS[start.getDay()]],
          end: { kind: 'never' },
        };
    this._openPicker = null;
    this._pickerClosing = null;
    this._endsOpen = false;
    clearTimeout(this._customCloseTimer);
    this._customClosing = false;
    this._customOpen = true;
  }

  private _patchCustom(patch: Partial<Recurrence>): void {
    if (!this._custom) return;
    this._custom = { ...this._custom, ...patch };
  }

  /** What the folded Ends row says when it is shut. */
  private get _endsSummary(): string {
    const end = this._custom?.end;
    if (!end || end.kind === 'never') return 'Never';
    if (end.kind === 'after') {
      return `After ${end.count} occurrence${end.count === 1 ? '' : 's'}`;
    }
    const on = new Date(`${end.date}T00:00`);
    return `On ${
      Number.isNaN(on.getTime())
        ? end.date
        : on.toLocaleDateString(this._lang, { year: 'numeric', month: 'short', day: 'numeric' })
    }`;
  }

  /**
   * The repeat options: Google's six, then Custom.
   *
   * Radio rows rather than a dropdown. The card already speaks in rows — the
   * recurrence scope above it is the same control — and a native select on a
   * wall tablet opens the browser's own list, at the browser's own size, in the
   * browser's own locale.
   */
  private _renderRepeat(): TemplateResult {
    const d = this._draft!;
    const start = this._draftStart;
    const chosen = matchPreset(d.repeat, start, this._lang);
    const rows: Array<{ key: string; label: string; pick: () => void }> = [
      ...repeatPresets(start, this._lang).map((p) => ({
        key: p.key,
        label: p.label,
        pick: () => this._patchDraft({ repeat: p.rule }),
      })),
      {
        key: 'custom',
        label: chosen === 'custom' ? describeRepeat(d.repeat, start, this._lang) : 'Custom…',
        pick: () => this._openCustom(),
      },
    ];
    return html`
      ${rows.map(
        (row) => html`
          <button
            class="ed-row scope ${chosen === row.key ? 'sel' : ''}"
            role="radio"
            aria-checked=${chosen === row.key ? 'true' : 'false'}
            @click=${row.pick}
          >
            <span class="ed-lbl">${row.label}</span>
            ${row.key === 'custom'
              ? html`<ha-icon class="ed-chev" icon="mdi:tune-variant"></ha-icon>`
              : html`<span class="radio"><span class="radio-dot"></span></span>`}
          </button>
        `,
      )}
    `;
  }

  /**
   * −/+ around a number, at a size a finger can hit.
   *
   * The current value arrives as a GETTER, not a number: two taps inside one
   * frame would otherwise both read the value this render captured and land on
   * the same result, because the re-render between them has not happened yet.
   */
  private _renderStepper(
    read: () => number,
    min: number,
    max: number,
    set: (n: number) => void,
    label: string,
    /** Whether the value is live. A dead one must not wear the accent. */
    on = true,
  ): TemplateResult {
    const value = read();
    const clamp = (n: number) => Math.min(max, Math.max(min, n));
    return html`
      <span class="stepper ${on ? 'on' : ''}">
        <button
          class="st-btn"
          aria-label=${`One fewer ${label}`}
          ?disabled=${value <= min}
          @click=${() => set(clamp(read() - 1))}
        >
          <ha-icon icon="mdi:minus"></ha-icon>
        </button>
        <input
          class="st-val"
          type="text"
          inputmode="numeric"
          aria-label=${label}
          .value=${String(value)}
          @change=${(e: Event) => {
            const n = parseInt((e.target as HTMLInputElement).value, 10);
            set(Number.isFinite(n) ? clamp(n) : value);
          }}
        />
        <button
          class="st-btn"
          aria-label=${`One more ${label}`}
          ?disabled=${value >= max}
          @click=${() => set(clamp(read() + 1))}
        >
          <ha-icon icon="mdi:plus"></ha-icon>
        </button>
      </span>
    `;
  }

  /**
   * The custom recurrence window.
   *
   * Google's dialog, in this card's language: every row of it is a control that
   * already exists elsewhere in the form, so it inherits the 44px targets and
   * the springs rather than introducing a third idiom.
   *
   * Nothing here touches the draft until Done. Cancel is free, and a half-built
   * rule — "every 2 weeks on no days at all" — never reaches it.
   */
  private _renderCustomModal(): TemplateResult | typeof nothing {
    // Kept mounted through the exit, the same way a picker panel is.
    if ((!this._customOpen && !this._customClosing) || !this._custom) return nothing;
    const r = this._custom;
    const units: Array<[Freq, string]> = [
      ['DAILY', r.interval === 1 ? 'day' : 'days'],
      ['WEEKLY', r.interval === 1 ? 'week' : 'weeks'],
      ['MONTHLY', r.interval === 1 ? 'month' : 'months'],
      ['YEARLY', r.interval === 1 ? 'year' : 'years'],
    ];
    const start = this._draftStart;
    const until = r.end.kind === 'on' ? r.end.date : this._defaultUntil;
    const count = r.end.kind === 'after' ? r.end.count : 13;
    const untilLabel = new Date(`${until}T00:00`).toLocaleDateString(this._lang, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
    return html`
      <div class="recwrap ${this._customClosing ? 'out' : ''}">
        <!-- The accent is set HERE as well as on the sheet: this window is a
             SIBLING of it, not a child, so it inherits nothing from it. Without
             this the chosen day painted itself dark-on-nothing and vanished. -->
        <div
          class="recmodal"
          style="--accent:${this._draftAccent}"
          @click=${(e: Event) => e.stopPropagation()}
          @touchstart=${(e: TouchEvent) => this._onDragStart(e)}
          @touchmove=${(e: TouchEvent) => this._onDragMove(e)}
          @touchend=${(e: TouchEvent) => this._onDragEnd(e)}
          @touchcancel=${(e: TouchEvent) => this._onDragEnd(e)}
        >
        <div class="mm-head">
          <span class="mm-title">Custom recurrence</span>
          <button class="mm-close" aria-label="Close" @click=${() => this._closeCustom(false)}>
            <ha-icon icon="mdi:close"></ha-icon>
          </button>
        </div>
        <div class="rec-body">
          <div class="ed-row rec-every">
            <span class="ed-lbl">Repeat every</span>
            <span class="ed-vals">
              ${this._renderStepper(
                () => this._custom?.interval ?? 1,
                1,
                99,
                (n) => {
                  // 1 -> 2 pluralises every unit word, which reflows the row.
                  this._flipCapture();
                  this._patchCustom({ interval: n });
                },
                'interval',
              )}
              <span class="seg">
                ${units.map(
                  ([freq, word]) => html`
                    <button
                      class="seg-btn ${r.freq === freq ? 'on' : ''}"
                      @click=${() => {
                        this._flipCapture();
                        this._patchCustom({ freq });
                      }}
                    >
                      ${word}
                    </button>
                  `,
                )}
              </span>
            </span>
          </div>

          <!-- Collapsed rather than dropped when it does not apply, so switching
               to weeks and back springs instead of jumping. -->
          <div class="rec-days ${r.freq === 'WEEKLY' ? 'open' : ''}">
            <div class="rec-days-in">
              <div class="ed-head">Repeat on</div>
              <div class="dow-row">
                ${WEEK_ORDER.map((code, i) => {
                  const on = r.byDay.includes(code);
                  const letter = new Date(2024, 0, 1 + i).toLocaleDateString(this._lang, {
                    weekday: 'narrow',
                  });
                  return html`
                    <button
                      class="dow-btn ${on ? 'on' : ''}"
                      aria-pressed=${on ? 'true' : 'false'}
                      @click=${() => {
                        const next = on
                          ? r.byDay.filter((x) => x !== code)
                          : [...r.byDay, code];
                        // Never all off: a weekly rule with no days repeats on
                        // the start's own day anyway, so an empty row would be a
                        // control that silently does nothing.
                        this._patchCustom({
                          byDay: next.length ? next : [RFC_DAYS[start.getDay()]],
                        });
                      }}
                    >
                      ${letter}
                    </button>
                  `;
                })}
              </div>
            </div>
          </div>

          <!-- Folded like Location and Colour. Most rules never end, so the
               three rows that say how one does are two taps away rather than a
               third of the window; the summary carries the answer when they
               are shut. -->
          ${this._renderFold(
            'Ends',
            this._endsSummary,
            this._endsOpen,
            () => {
              this._endsOpen = !this._endsOpen;
              if (!this._endsOpen) this._closePicker();
            },
            html`
              <!-- Whole ROWS, not just the dots. The dot is 24px of a 44px row
                   and was the only live part of it, so tapping the obvious
                   place - the word, the date, anywhere across - did nothing. -->
              <button
                class="ed-row scope ${r.end.kind === 'never' ? 'sel' : ''}"
                role="radio"
                aria-checked=${r.end.kind === 'never' ? 'true' : 'false'}
                @click=${() => {
                  this._closePicker();
                  this._patchCustom({ end: { kind: 'never' } });
                }}
              >
                <span class="ed-lbl">Never</span>
                <span class="radio"><span class="radio-dot"></span></span>
              </button>

              <div
                class="ed-row scope ends ${r.end.kind === 'on' ? 'sel' : ''}"
                role="radio"
                aria-checked=${r.end.kind === 'on' ? 'true' : 'false'}
                @click=${() => this._patchCustom({ end: { kind: 'on', date: until } })}
              >
                <span class="ed-lbl">On</span>
                <button
                  class="ed-chip ${this._openPicker === 'untilDate' ? 'on' : ''}"
                  @click=${(e: Event) => {
                    // Its own job on top of the row's: select, then open the
                    // month grid. Stopped here so the row does not re-select
                    // underneath and reset the date it is showing.
                    e.stopPropagation();
                    this._patchCustom({ end: { kind: 'on', date: until } });
                    this._togglePicker('untilDate');
                  }}
                >
                  ${untilLabel}
                </button>
                <span class="radio"><span class="radio-dot"></span></span>
              </div>
              ${this._showPicker('untilDate')
                ? html`<div class="ed-picker" data-field="untilDate">
                    ${this._renderCalendar(until, (iso) =>
                      this._patchCustom({ end: { kind: 'on', date: iso } }),
                    )}
                  </div>`
                : nothing}

              <div
                class="ed-row scope ends ${r.end.kind === 'after' ? 'sel' : ''}"
                role="radio"
                aria-checked=${r.end.kind === 'after' ? 'true' : 'false'}
                @click=${() => {
                  this._closePicker();
                  this._patchCustom({ end: { kind: 'after', count } });
                }}
              >
                <span class="ed-lbl">After</span>
                <!-- Stopped, and this one MUST be: the row's handler would run
                     after the step and write the count back as it was. -->
                <span class="stop" @click=${(e: Event) => e.stopPropagation()}>
                  ${this._renderStepper(
                    () => (this._custom?.end.kind === 'after' ? this._custom.end.count : count),
                    1,
                    999,
                    (n) => this._patchCustom({ end: { kind: 'after', count: n } }),
                    'occurrences',
                    r.end.kind === 'after',
                  )}
                </span>
                <span class="ed-sub occ">occurrences</span>
                <span class="radio"><span class="radio-dot"></span></span>
              </div>
            `,
            // Only while the month grid is actually inside it. max-height is a
            // CEILING, and one four times the content's height opens the clip
            // in a quarter of the time — the three rows on their own snapped
            // open in 80ms of a 360ms move.
            this._showPicker('untilDate'),
          )}

          <div class="rec-says">${describeRepeat(r, start, this._lang)}</div>
        </div>
        <div class="mm-foot">
          <span class="mm-addr"></span>
          <button class="ed-btn small" @click=${() => this._closeCustom(false)}>Cancel</button>
          <button class="ed-btn primary small" @click=${() => this._closeCustom(true)}>
            Done
          </button>
        </div>
        </div>
      </div>
    `;
  }

  /**
   * Close the custom window, keeping it on screen for the length of its exit.
   *
   * `apply` is the difference between Done and Cancel, and it is the only one:
   * the rule was being edited on a copy, so walking away from it costs nothing.
   */
  private _closeCustom(apply: boolean): void {
    if (!this._customOpen) return;
    if (apply) this._patchDraft({ repeat: this._custom });
    this._customOpen = false;
    this._openPicker = null;
    this._pickerClosing = null;
    clearTimeout(this._customCloseTimer);
    if (this._reducedMotion) {
      this._custom = null;
      return;
    }
    this._customClosing = true;
    this._customCloseTimer = setTimeout(() => {
      this._customClosing = false;
      this._custom = null;
    }, 200);
  }

  /** Teardown, for the paths where the whole form is going away anyway. */
  private _cancelCustom(): void {
    clearTimeout(this._customCloseTimer);
    this._customOpen = false;
    this._customClosing = false;
    this._custom = null;
    this._openPicker = null;
    this._pickerClosing = null;
  }

  /** A year out, which is where Google's own "On" date starts. */
  private get _defaultUntil(): string {
    const d = this._draftStart;
    d.setFullYear(d.getFullYear() + 1);
    return splitLocal(d).date;
  }

  /**
   * The location picker, as a window of its own.
   *
   * It was a 505x360 panel wedged into the edit form, and at that size you
   * cannot get your bearings, let alone find a side entrance — the user's word
   * for it was "useless", and they were right. Choosing a place on a map is its
   * own task and it gets the whole screen.
   *
   * Tapping picks, immediately, and the field behind updates as you go. The
   * button says Done rather than "use this location" because the choice was
   * already made by the tap; this only closes the window.
   */
  private _renderMapModal(): TemplateResult | typeof nothing {
    if (!this._mapOpen) return nothing;
    const p = this._mapPoint;
    return html`
      <link rel="stylesheet" href=${LEAFLET_CSS} />
      <div class="mapmodal" @click=${(e: Event) => e.stopPropagation()}>
        <div class="mm-head">
          <span class="mm-title">Choose a location</span>
          <button class="mm-close" aria-label="Close" @click=${() => (this._mapOpen = false)}>
            <ha-icon icon="mdi:close"></ha-icon>
          </button>
        </div>
        <div class="mm-body">
          ${!p
            ? html`<div class="map-none">
                ${this._placesBusy
                  ? 'Looking that up…'
                  : 'Search for an address first, or open this from a place that has one.'}
              </div>`
            : this._leafletOk
              ? html`
                  <div class="map live">
                    <div class="map-canvas"></div>
                    <span class="map-credit">${BASEMAPS[this._baseMap].attribution}</span>
                  </div>
                `
              : // Leaflet could not be borrowed. Still shows WHERE the place is,
                // just without panning — better than an empty window.
                html`
                  <div class="map static-fallback" style="--map-h:340px">
                    ${(() => {
                      const { base, labels } = previewTiles(p.lat, p.lon, 16, 520, 340, 'Light');
                      const tile = (t: { url: string; left: number; top: number }) =>
                        html`<img src=${t.url} alt="" style="left:${t.left}px; top:${t.top}px" />`;
                      return html`
                        <div class="map-layer">${base.map(tile)}</div>
                        <div class="map-layer labels">${labels.map(tile)}</div>
                        <div class="map-pin"></div>
                      `;
                    })()}
                  </div>
                `}
        </div>
        <div class="mm-foot">
          <span class="mm-addr">${this._draft?.location || 'Tap the map to pick a place.'}</span>
          <a
            class="ed-btn small"
            href=${mapsLink(this._draft?.location ?? '', p?.lat, p?.lon)}
            target="_blank"
            rel="noopener noreferrer"
          >
            <ha-icon icon="mdi:open-in-new"></ha-icon>
          </a>
          <button class="ed-btn primary small" @click=${() => (this._mapOpen = false)}>Done</button>
        </div>
      </div>
    `;
  }


  /**
   * Build the Leaflet map once its container is in the DOM, or tear it down.
   *
   * Called from updated(), because the container only exists after a render and
   * Leaflet measures it on construction — building it earlier gives a map that
   * thinks it is 0x0 and renders one tile in the corner.
   */
  private _syncLeaflet(): void {
    const wanted = this._mapOpen && !!this._mapPoint && this._leafletOk;
    const box = this.renderRoot?.querySelector('.map-canvas') as HTMLElement | null;
    if (!wanted || !box) {
      if (this._leafletMap) {
        this._leafletMap.remove();
        this._leafletMap = null;
        this._leafletMarker = null;
      }
      return;
    }
    if (this._leafletMap) {
      // Already built. Recentre only when the map was just opened or the place
      // came from the search list — NOT after a tap, which would haul the map
      // back under the finger that had just moved it.
      if (this._mapWanted) {
        this._mapWanted = false;
        this._leafletMap.setView([this._mapPoint!.lat, this._mapPoint!.lon], 16);
        this._leafletMarker?.setLatLng([this._mapPoint!.lat, this._mapPoint!.lon]);
      }
      this._leafletMap.invalidateSize();
      return;
    }
    const L = this._leaflet;
    if (!L) return;
    const map = L.map(box, {
      attributionControl: false,
      zoomControl: true,
      scrollWheelZoom: true,
      tap: true,
    }).setView([this._mapPoint!.lat, this._mapPoint!.lon], 16);
    this._applyBaseMap(map, L);
    // A marker you can put anywhere, and drag once it is there. Tapping the map
    // IS the gesture — the earlier version kept the pin at the centre and made
    // you drag the map under it and then press a button to confirm, which is two
    // indirect steps to do what pointing at the thing already said.
    // A divIcon, not Leaflet's default. The default is a PNG resolved against
    // Leaflet's own relative image path, which does not exist here — it rendered
    // as a broken-image box. This needs no file, and it matches the pin the
    // static preview draws.
    const marker = L.marker([this._mapPoint!.lat, this._mapPoint!.lon], {
      draggable: true,
      keyboard: false,
      icon: L.divIcon({
        className: 'ssc-pin',
        html: '<span></span>',
        iconSize: [22, 22],
        iconAnchor: [11, 11],
      }),
    }).addTo(map);
    marker.on('dragend', () => {
      const p = marker.getLatLng();
      void this._pickAt(p.lat, p.lng);
    });
    map.on('click', (e: { latlng: { lat: number; lng: number } }) => {
      marker.setLatLng(e.latlng);
      void this._pickAt(e.latlng.lat, e.latlng.lng);
    });
    this._leafletMarker = marker;
    this._leafletMap = map;
    // One shot, after layout settles inside the sheet.
    setTimeout(() => map.invalidateSize(), 120);
  }

  /**
   * Put the chosen basemap on the map, replacing whatever was there.
   *
   * Drawn at full strength: the earlier version darkened the tiles to match the
   * card, which on an already-sparse basemap left almost nothing visible. A map
   * you cannot read is not worth matching the furniture.
   */
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  private _applyBaseMap(map: any, L: any): void {
    for (const layer of this._baseLayers) map.removeLayer(layer);
    this._baseLayers = [];
    const spec = BASEMAPS[this._baseMap];
    const opts = { maxNativeZoom: spec.maxNativeZoom, maxZoom: 19 };
    const base = L.tileLayer(spec.url, opts).addTo(map);
    this._baseLayers.push(base);
    if (spec.overlay) {
      this._baseLayers.push(L.tileLayer(spec.overlay, opts).addTo(map));
    }
  }

  /**
   * Point at something and it becomes the location.
   *
   * Straight into the field, with no confirmation step: the tap already said
   * which place, and a second button asking "really?" is the thing that made the
   * first version of this useless. The field is a text box — if the answer is
   * wrong, typing over it is right there.
   */
  private async _pickAt(lat: number, lon: number): Promise<void> {
    if (this._mapPickSeq === undefined) this._mapPickSeq = 0;
    const seq = ++this._mapPickSeq;
    this._mapPoint = { lat, lon };
    const found = await reverseGeocode(lat, lon, { lang: this._lang?.split('-')[0] });
    // A slower answer for an earlier tap must not overwrite a later one.
    if (seq !== this._mapPickSeq || !found) return;
    this._patchDraft({ location: found.label });
    this._places = [];
  }

  /** All-day on or off, closing any time wheel that no longer applies. */
  private _setAllDay(on: boolean): void {
    if (on && (this._openPicker === 'startTime' || this._openPicker === 'endTime')) {
      this._closePicker();
    }
    this._patchDraft({ allDay: on });
  }

  /**
   * The edit form.
   *
   * iOS-shaped — a grouped list of labelled rows, then the actions — but square,
   * because this card has no rounded corners anywhere and one rounded box would
   * look like a mistake rather than a flourish.
   *
   * Nothing here writes until Save is pressed. The draft is a copy, so Cancel is
   * genuinely free and a re-render mid-typing cannot rebind the form to a
   * different event.
   */
  private _renderEditor(): TemplateResult | typeof nothing {
    const d = this._draft;
    if (!d) return nothing;
    const accent = this._draftAccent;
    const scopes: Array<[EditScope, string]> = [
      ['instance', 'This event'],
      ['future', 'This and future'],
      ['series', 'All events'],
    ];
    return html`
      <div
        class="scrim"
        @click=${() => {
          // One layer at a time, outermost first: a tap outside the custom
          // window closes IT, not the form it was opened from.
          if (this._customOpen) this._closeCustom(false);
          else if (this._mapOpen) this._mapOpen = false;
          else this._closeEditor();
        }}
      >
        ${this._renderMapModal()} ${this._renderCustomModal()}
        <div
          class="sheet editor ${this._mapOpen || this._customOpen ? 'behind' : ''}"
          style="--accent:${accent}"
          @click=${(e: Event) => e.stopPropagation()}
          @touchstart=${(e: TouchEvent) => this._onDragStart(e)}
          @touchmove=${(e: TouchEvent) => this._onDragMove(e)}
          @touchend=${(e: TouchEvent) => this._onDragEnd(e)}
          @touchcancel=${(e: TouchEvent) => this._onDragEnd(e)}
        >
          <input
            class="ed-title"
            .value=${d.summary}
            placeholder=${d.isNew ? 'New event' : 'Title'}
            aria-label="Title"
            @input=${(e: Event) =>
              this._patchDraft({ summary: (e.target as HTMLInputElement).value })}
          />

          <div class="ed-group">
            <label class="ed-row">
              <span class="ed-lbl">All-day</span>
              <input
                type="checkbox"
                class="ed-check"
                .checked=${d.allDay}
                @change=${(e: Event) =>
                  this._setAllDay((e.target as HTMLInputElement).checked)}
              />
            </label>
            ${this._renderPickerRow('Starts', 'startDate', 'startTime')}
            ${this._renderPickerRow('Ends', 'endDate', 'endTime')}
          </div>

          ${d.recurring
            ? html`
                <div class="ed-group">
                  <div class="ed-head">Applies to</div>
                  ${scopes.map(
                    ([value, label]) => html`
                      <button
                        class="ed-row scope ${this._scope === value ? 'sel' : ''}"
                        role="radio"
                        aria-checked=${this._scope === value ? 'true' : 'false'}
                        @click=${() => {
                          this._scope = value;
                          this._confirmDelete = false;
                        }}
                      >
                        <span class="ed-lbl">${label}</span>
                        <!-- A drawn radio, not the native one: accent-color can
                             paint it but nothing can animate it, and the dot
                             springing in is the whole point here. -->
                        <span class="radio"><span class="radio-dot"></span></span>
                      </button>
                    `,
                  )}
                  <!-- Three separate branches rather than one interpolated
                       string, so Lit builds a NEW element per scope and the
                       entry animation actually re-runs. Swapping the text inside
                       one element changes nothing a CSS animation can see. -->
                  ${this._scope === 'instance'
                    ? html`<div class="ed-note">Only the occurrence you opened changes.</div>`
                    : this._scope === 'future'
                      ? html`<div class="ed-note">
                          This occurrence and every later one. Earlier ones are left alone.
                        </div>`
                      : html`<div class="ed-note">
                          Every occurrence, including ones already past.
                        </div>`}
                </div>
              `
            : nothing}

          <!-- Repeat, colour and details all fold, and all sit after the
               recurrence options: what a change APPLIES TO is the decision with
               consequences, so it comes before the cosmetic ones. Repeat leads
               the three because it is the one that changes how many events
               exist, and it is offered only when creating - see _openEditor. -->
          ${d.isNew
            ? this._renderFold(
                'Repeat',
                describeRepeat(d.repeat, this._draftStart, this._lang),
                this._repeatOpen,
                () => {
                  this._repeatOpen = !this._repeatOpen;
                },
                this._renderRepeat(),
              )
            : nothing}
          ${this._renderFold(
            'Colour',
            d.colorId
              ? (GOOGLE_EVENT_COLORS.find(([id]) => id === d.colorId)?.[2] ?? '')
              : "Calendar's colour",
            this._colorOpen,
            () => {
              this._colorOpen = !this._colorOpen;
            },
            html`
              <!-- Google's own picker: round swatches in a grid with a tick on
                   the one that is set. -->
              <div class="sw-grid">
                <button
                  class="sw none ${d.colorId === '' ? 'sel' : ''}"
                  title="The calendar's own colour"
                  aria-label="The calendar's own colour"
                  @click=${() => this._patchDraft({ colorId: '' })}
                >
                  ${d.colorId === '' ? html`<ha-icon icon="mdi:check"></ha-icon>` : nothing}
                </button>
                ${GOOGLE_EVENT_COLORS.map(
                  ([id, hex, name]) => html`
                    <button
                      class="sw ${d.colorId === id ? 'sel' : ''}"
                      style="--sw:${hex}"
                      title=${name}
                      aria-label=${name}
                      @click=${() => this._patchDraft({ colorId: id })}
                    >
                      ${d.colorId === id ? html`<ha-icon icon="mdi:check"></ha-icon>` : nothing}
                    </button>
                  `,
                )}
              </div>
            `,
          )}
          ${this._renderFold(
            'Details',
            d.location || d.description
              ? [d.location, d.description].filter(Boolean).join(' · ').slice(0, 40)
              : 'Location, notes',
            this._detailsOpen,
            () => {
              this._detailsOpen = !this._detailsOpen;
            },
            html`
              <div class="ed-row loc">
                <span class="ed-lbl">Location</span>
                <span class="ed-vals">
                  <input
                    type="text"
                    placeholder="Search an address"
                    autocomplete="off"
                    .value=${d.location}
                    @input=${(e: Event) =>
                      this._searchLocation((e.target as HTMLInputElement).value)}
                  />
                  <button
                    class="ed-mapbtn ${this._mapOpen ? 'on' : ''}"
                    ?disabled=${!d.location.trim()}
                    aria-label="Show on a map"
                    title="Show on a map"
                    @click=${() => void this._toggleMap()}
                  >
                    <ha-icon icon="mdi:map-outline"></ha-icon>
                  </button>
                </span>
              </div>
              <!-- Suggestions sit under the field, not over it: the form is
                   already inside a sheet, and a second floating layer on a phone
                   ends up half off the screen. -->
              ${this._places.length
                ? html`
                    <div class="loc-list">
                      ${this._places.map(
                        (place) => html`
                          <button class="loc-item" @click=${() => this._pickPlace(place)}>
                            <ha-icon icon="mdi:map-marker-outline"></ha-icon>
                            <span class="loc-text">
                              <span class="loc-name">${place.name}</span>
                              ${place.detail
                                ? html`<span class="loc-detail">${place.detail}</span>`
                                : nothing}
                            </span>
                          </button>
                        `,
                      )}
                    </div>
                  `
                : nothing}
              <div class="ed-row notes">
                <span class="ed-lbl">Notes</span>
                <textarea
                  rows="2"
                  placeholder="None"
                  .value=${d.description}
                  @input=${(e: Event) =>
                    this._patchDraft({ description: (e.target as HTMLTextAreaElement).value })}
                ></textarea>
              </div>
            `,
          )}

          ${this._editError
            ? html`<div class="ed-error">${this._editError}</div>`
            : nothing}

          <div class="ed-actions">
            <!-- Nothing to delete yet. Cancel is the way out of a new event,
                 and it is already the next button along. -->
            ${d.isNew
              ? nothing
              : html`<button
                  class="ed-btn danger ${this._confirmDelete ? 'armed' : ''}"
                  ?disabled=${this._busy}
                  @click=${() => void this._deleteDraft()}
                >
                  ${this._busy && this._confirmDelete
                    ? 'Deleting…'
                    : this._confirmDelete
                      ? 'Tap again to delete'
                      : 'Delete'}
                </button>`}
            <span class="ed-spacer"></span>
            <button class="ed-btn" ?disabled=${this._busy} @click=${() => this._closeEditor()}>
              Cancel
            </button>
            <button
              class="ed-btn primary"
              ?disabled=${this._busy}
              @click=${() => void this._saveDraft()}
            >
              <!-- Silent during a delete: that button is doing the talking,
                   and two buttons announcing different jobs at once is one
                   of them lying. -->
              ${this._busy && !this._confirmDelete
                ? d.isNew
                  ? 'Adding…'
                  : 'Saving…'
                : d.isNew
                  ? 'Add'
                  : 'Save'}
            </button>
          </div>
        </div>
      </div>
    `;
  }

  private _renderSheet(): TemplateResult | typeof nothing {
    if (this._draft) return this._renderEditor();
    const ev = this._selected;
    if (!ev) return nothing;
    return html`
      <div class="scrim" @click=${() => this._closeSheet()}>
        <div
          class="sheet"
          style="--accent:${this._colorForEvent(ev)}"
          @click=${(e: Event) => e.stopPropagation()}
        >
          <div class="sh-name">${ev.summary}</div>
          <div class="sh-time">
            ${ev.allDay
              ? `${this._fmtDate(ev.start)} · all day`
              : `${this._fmtDow(ev.start)} ${this._fmtDate(ev.start)} · ${this._fmtTime(
                  ev.start,
                )} – ${this._fmtTime(ev.end)}`}
          </div>
          <div class="sh-cal">
            <span class="dot" style="background:${this._colorFor(ev.entity)}"></span>
            ${this._nameFor(ev.entity)}
          </div>
          ${ev.location ? html`<div class="sh-row">${ev.location}</div>` : nothing}
          ${ev.description ? html`<div class="sh-row">${ev.description}</div>` : nothing}
        </div>
      </div>
    `;
  }

  private get _lang(): string | undefined {
    return this.hass?.locale?.language;
  }

  /**
   * Home Assistant's own setting wins by default, but a timetable is written in
   * 24h in most of the world regardless of what the rest of the frontend does,
   * and '1:55 PM' does not fit a 45-minute block. `time_format` pins it here
   * without touching the global setting.
   */
  private get _hour12(): boolean {
    const cfg = this._config?.time_format ?? DEFAULTS.time_format;
    if (cfg === '12') return true;
    if (cfg === '24') return false;
    const f = this.hass?.locale?.time_format;
    if (f === '12') return true;
    if (f === '24') return false;
    return (
      new Intl.DateTimeFormat(this._lang, { hour: 'numeric' }).resolvedOptions().hour12 ?? false
    );
  }

  /** 24h is built by hand: Intl pads the hour to "08:25" whatever you ask for. */
  private _fmtTime(d: Date): string {
    if (!this._hour12) return `${d.getHours()}:${pad2(d.getMinutes())}`;
    return new Intl.DateTimeFormat(this._lang, {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(d);
  }

  private _fmtHour(minutes: number): string {
    const h = Math.floor(minutes / 60) % 24;
    if (!this._hour12) return `${h}:${pad2(minutes % 60)}`;
    const d = new Date(2000, 0, 1, h, minutes % 60);
    return new Intl.DateTimeFormat(this._lang, { hour: 'numeric', hour12: true }).format(d);
  }

  private _fmtDow(d: Date): string {
    return new Intl.DateTimeFormat(this._lang, { weekday: 'short' }).format(d);
  }

  private _fmtDowLong(d: Date): string {
    return new Intl.DateTimeFormat(this._lang, { weekday: 'long' }).format(d);
  }

  /** "Sep 7th". The suffix is English-only, so other locales keep a bare number. */
  private _fmtDate(d: Date): string {
    const month = new Intl.DateTimeFormat(this._lang, { month: 'short' }).format(d);
    return `${month} ${d.getDate()}${ordinalSuffix(d.getDate(), this._lang)}`;
  }

  static styles = css`
    /*
     * Sizing and weight carry the hierarchy here, never colour. Every piece of
     * text is full-strength foreground; what changes between a subject name and
     * its time is size and weight. Grey secondary text was tried and rejected -
     * on a wall tablet at arm's length it simply reads as unreadable rather than
     * as unimportant.
     *
     * The card sits on the THEME's own card background, the same fill every
     * other card in this config uses. An earlier draft floated a translucent
     * white panel on the page background and it came out muddy grey.
     */
    :host {
      --ssc-font: system-ui, 'SF Pro Display', 'SF Pro Text', Inter, 'Helvetica Neue', Roboto,
        sans-serif;
      --ssc-fg: var(--primary-text-color, #fff);
      --ssc-line: rgba(255, 255, 255, 0.13);
      --ssc-line-strong: rgba(255, 255, 255, 0.22);
      /* Column banding. Deliberately tiny: it should guide the eye along a row
         without ever reading as two different kinds of day. */
      --ssc-band: rgba(255, 255, 255, 0.042);
      --ssc-gutter: 62px;
      --ssc-spring: cubic-bezier(0.34, 1.42, 0.64, 1);
      --ssc-glide: cubic-bezier(0.22, 1, 0.36, 1);
      /* Week transition. A long, heavily front-loaded ease — most of the
         distance is covered early and it settles slowly, which is what reads as
         iOS rather than as a linear slide. The block cascade uses a gentler
         spring than --ssc-spring: at this duration the sharper one overshoots
         far enough to look like a bounce. */
      /* How far the schedule recedes behind the open calendar menu. Opacity is
         how much is faded OUT: 0.1 leaves a tenth showing, i.e. 90% gone. Lift
         and scale are the fold — the cells drop back and shrink, so they read as
         folding away from the menu rather than merely dimming under it. */
      --ssc-dim-opacity: 0.1;
      --ssc-dim-lift: 18px;
      --ssc-dim-scale: 0.9;
      --ssc-dim-lift-list: 26px;
      --ssc-dim-scale-list: 0.86;
      --ssc-week-ease: cubic-bezier(0.32, 0.72, 0, 1);
      --ssc-week-dur: 560ms;
      --ssc-block-ease: cubic-bezier(0.24, 1.12, 0.4, 1);
      --ssc-block-dur: 620ms;
      /* custom elements default to inline, and inline boxes measure width 0 in a
         ResizeObserver, which would wedge layout auto in list mode */
      display: block;
      font-family: var(--ssc-font);
      color: var(--ssc-fg);
    }
    ha-card {
      background: var(--ha-card-background, var(--card-background-color, #1c1c1e));
      border-radius: 0;
      color: var(--ssc-fg);
      overflow: hidden;
      position: relative;
    }
    .panel {
      padding: 18px;
      box-sizing: border-box;
    }

    .head {
      position: relative;
      display: flex;
      align-items: flex-start;
      gap: 12px;
      margin-bottom: 14px;
    }
    /* Buttons and the week range share the right-hand column, the range tucked
       under them, so the heading has the whole left side to itself. */
    .head-right {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 14px;
      flex: 0 0 auto;
    }
    /* Centred on the CARD, not between its neighbours. As a flex item the
       group would sit wherever the title happened to end, and forcing it with
       equal flex bases on the side groups squashes a long calendar name.
       Taken out of flow it lands on the centre line whatever the sides do. */
    .mode-toggles {
      position: absolute;
      left: 50%;
      top: 0;
      transform: translateX(-50%);
      display: flex;
      align-items: center;
      gap: 15px;
    }
    /* Narrow chrome. The phone LAYOUT is still undesigned, but the header must
       not visibly break while it waits: the title has to fit, and the week pill
       is redundant next to a date range it would otherwise push onto its own
       line. */
    .narrow {
      padding: 13px 13px 14px;
      /* The list's week animation is a 34% slide. Without this it becomes
         page-wide overflow and the phone grows a scrollbar along the bottom
         every time the week changes. */
      overflow-x: hidden;
    }
    /* The phone header WRAPS: the calendar name takes the first row and the
       week nav sits under it. On one row, four 44px buttons leave about 69px
       for the name, which cut a two-word calendar name down to its first - and the
       name is the thing that says whose week you are looking at. Wrapping is
       what lets the buttons stay full size AND the name stay whole. */
    .narrow .head {
      flex-wrap: wrap;
      /* 6px off the shared 14px — the other 6px went onto .head-right's top
         margin, so the block moves down without the header growing. */
      margin-bottom: 6px;
    }
    .narrow .titles {
      flex: 1 1 100%;
    }
    /* Left-aligned once wrapped. Right-aligning a full-width second row put
       the week nav on the opposite side of the card from the calendar name it
       belongs to, with a gap between them; under the name it reads as one
       header block. */
    /* The header wraps on a phone, so the buttons and the week range sit UNDER
       the calendar name rather than beside it. That block is pushed down 12px
       from the name and left only 8px clear of the schedule below (the shared
       .head margin is 14px), so it reads as belonging to the week it labels
       rather than floating between the two. Moving it down without also closing
       the gap underneath would just make the header taller. */
    .narrow .head-right {
      flex: 1 1 100%;
      align-items: flex-start;
      margin-top: 12px;
    }
    .narrow .head-right .range {
      justify-content: flex-start;
    }
    /* First day only, so the gap under the header is controlled by the header's
       own margin-bottom and nothing else. .ld's padding is on every day group,
       so changing it there would move Tuesday away from Monday too. */
    .narrow .list > .ld:first-child {
      padding-top: 0;
    }
    .narrow .pick-btn .pick-name {
      font-size: 20px;
    }
    .narrow .pick-btn .av {
      width: 28px;
      height: 28px;
    }
    .narrow .range {
      font-size: 13px;
      white-space: nowrap;
    }
    .narrow .pill {
      font-size: 12px;
    }
    /* 10% under the grid's 44px. The phone had been at 37px with a 7px gap,
       which quietly undid the tablet sizing pass - .narrow .tools overrode the
       wider gap, so the extra air never reached the list layout and the buttons
       read noticeably smaller than the same controls on the tablet. 40px keeps a
       comfortable thumb target while giving a narrow header back some air. The
       gap stays at the shared 15px, and the calendar NAME absorbs the
       difference by ellipsising. */
    .narrow .btn {
      width: 40px;
      height: 40px;
    }
    .narrow .btn ha-icon {
      --mdc-icon-size: 23px;
    }
    /* A row, so the edit-mode pill can sit beside the calendar name. The picker
       keeps min-width:0 so a long name still ellipsises rather than pushing the
       pill off the card. */
    .titles {
      min-width: 0;
      flex: 1 1 auto;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .head-right .range {
      margin-top: 0;
      justify-content: flex-end;
    }
    .range {
      display: flex;
      align-items: center;
      gap: 9px;
      margin-top: 8px;
      font-size: 15px;
      font-weight: 400;
      letter-spacing: 0;
    }
    /* Avatar, name and chevron are one target. The menu expands with the same
       max-height/opacity move the Protect card's camera strip uses. */
    /* inline-block so the picker is only as wide as its own contents. As a
       block it filled .titles, and the menu's min-width:100% then stretched to
       the whole card. */
    /* inline-block so the menu's min-width:100% measures the BUTTON and not the
       whole header - see the menu rules below. max-width lets it shrink inside
       .titles: without it the picker kept its natural width on a phone, spilled
       out of its flex item and painted over the week-nav buttons (measured as a
       9px overlap on the mobile Schedules view at a 404px card). */
    .picker {
      position: relative;
      display: inline-block;
      max-width: 100%;
      min-width: 0;
    }
    .pick-btn,
    .pick-item {
      display: flex;
      align-items: center;
      min-width: 0;
      max-width: 100%;
      gap: 12px;
      padding: 4px 8px 4px 4px;
      border: none;
      background: transparent;
      color: var(--ssc-fg);
      font: inherit;
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;
      transition: background 0.15s ease;
    }
    .pick-btn:hover,
    .pick-item:hover {
      background: rgba(255, 255, 255, 0.1);
    }
    /* The name is the part that gives way when the header runs out of room:
       the avatar and chevron stay whole and a long calendar name ellipsises,
       which beats either overlapping the buttons or wrapping the header. */
    .pick-name {
      font-weight: 700;
      white-space: nowrap;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    /* The heading. There is no separate card title, so this carries that role —
       and matches Home Assistant's own card header exactly, tokens included, so
       it sits at the same weight and size as every other card on the dashboard.
       Notably that is font-weight NORMAL, not bold. */
    .pick-btn .pick-name {
      font-family: var(--ha-card-header-font-family, inherit);
      font-size: var(--ha-card-header-font-size, var(--ha-font-size-2xl, 24px));
      font-weight: var(--ha-font-weight-normal, 400);
      letter-spacing: -0.012em;
      line-height: var(--ha-line-height-condensed, 1.2);
    }
    .pick-btn .av {
      width: 34px;
      height: 34px;
    }
    .pick-btn .av.init {
      font-size: 17px;
    }
    .pick-btn.static {
      cursor: default;
      padding-right: 4px;
    }
    .pick-btn.static:hover {
      background: transparent;
    }
    .pick-item .pick-name {
      font-size: 16px;
      letter-spacing: -0.2px;
    }
    .av {
      width: 26px;
      height: 26px;
      border-radius: 50%;
      object-fit: cover;
      flex: 0 0 auto;
      display: grid;
      place-items: center;
    }
    .av.init {
      font-size: 14px;
      font-weight: 700;
      color: #fff;
    }
    .pick-chev {
      --mdc-icon-size: 24px;
      transition: transform 220ms var(--ssc-week-ease);
    }
    .pick-chev.open {
      transform: rotate(180deg);
    }
    .pick-menu {
      position: absolute;
      top: calc(100% + 4px);
      left: 0;
      z-index: 20;
      /* At least as wide as the button, otherwise sized by the longest calendar
         name in the list. */
      min-width: 100%;
      width: max-content;
      max-width: 80vw;
      display: flex;
      flex-direction: column;
      background: var(--ha-card-background, var(--card-background-color, #1c1c1e));
      box-shadow: 0 10px 28px rgba(0, 0, 0, 0.5);
      max-height: 0;
      opacity: 0;
      overflow: hidden;
      pointer-events: none;
      transition:
        max-height 0.22s ease,
        opacity 0.22s ease;
    }
    .pick-menu.open {
      max-height: 320px;
      opacity: 1;
      pointer-events: auto;
    }
    .pick-item {
      padding: 9px 14px 9px 10px;
      width: 100%;
      box-sizing: border-box;
    }
    .pick-item.sel {
      background: rgba(255, 255, 255, 0.13);
    }

    /* One below the date beside it - 15px range, 14px pill - in the grid, and
       13/12 in the list. It was a flat 12px, which read as a footnote next to
       the date rather than as the label for the week being shown. */
    .pill {
      font-size: 14px;
      font-weight: 700;
      letter-spacing: 0.3px;
      padding: 3px 9px;
      background: rgba(255, 255, 255, 0.14);
      white-space: nowrap;
    }
    /* Says the card is armed, in the place the eye already goes for "whose week
       is this". Red because edit mode is the only state where a tap can change
       somebody's timetable. Same face and size as the week pill by design. */
    .edit-pill {
      background: rgba(255, 71, 51, 1);
      color: #fff;
      flex: 0 0 auto;
      align-self: center;
      animation: editPillIn 420ms var(--ssc-spring) both;
    }
    /* The + reads as a sibling of the Edit Mode pill: same height, same face,
       square rather than lozenge-wide because it holds a glyph and not a word.
       It follows the pill in rather than arriving with it, so the eye is told
       "armed" first and "and here is what you can do" second. */
    .add-pill {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex: 0 0 auto;
      align-self: center;
      border: none;
      padding: 3px 7px;
      color: var(--ssc-fg);
      /* family only - size and weight come from .pill, and the shorthand would
         take the parent's size instead. line-height is NOT inherited by a
         button: the browser's own sheet sets it to normal, which is what left
         this chip 2px shorter than the pill next to it. */
      font-family: inherit;
      line-height: inherit;
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;
      animation: editPillIn 420ms var(--ssc-spring) 90ms both;
      transition: background 0.15s ease, transform 0.15s ease;
    }
    /* A zero-width space, so the button takes the same line box the word pills
       do and the two chips are exactly the same height. A fixed px height
       cannot track that: the same rule measures 23px beside the tablet pill and
       25 beside the phone's, the line-height coming from the theme. The icon is
       kept under 1em so the strut, not the glyph, is what sets the height. */
    .add-pill::before {
      content: '\\200b';
    }
    .add-pill ha-icon {
      --mdc-icon-size: 1.3em;
      width: 1.3em;
      height: 1.3em;
      /* The ha-svg-icon INSIDE ha-icon is inline-flex, so it sits on a text
         baseline and the line box's descender pushed the glyph ~3px below
         centre — the box measured dead centre while the ink did not. Zeroing
         the line box is what removes that; the flex centring covers the rest. */
      display: flex;
      align-items: center;
      justify-content: center;
      line-height: 0;
    }
    .add-pill:hover {
      background: rgba(255, 255, 255, 0.24);
    }
    .add-pill:active {
      transform: scale(0.9);
    }
    /* Arrives from behind the calendar name and settles — the same spring the
       blocks use, so it reads as part of the card rather than bolted on. */
    @keyframes editPillIn {
      from {
        opacity: 0;
        transform: translateX(-10px) scale(0.82);
      }
      to {
        opacity: 1;
        transform: none;
      }
    }

    /* The wash on entering edit mode. Covers the whole card, ignores the
       pointer, and is gone in under half a second — long enough to register,
       short enough that it never gets in the way of the tap that follows. */
    /* Entering edit mode, in three layers over the same 700ms.
       A flat rectangle fading out is a screen dimmer, not a flash - which is
       what the first two attempts were. What makes this read is that the layers
       decay at DIFFERENT rates: the wash is gone in a fifth of a second, the
       edge glow lingers behind it, and the card itself takes a small knock. */
    .mode-flash {
      position: absolute;
      inset: 0;
      z-index: 30;
      pointer-events: none;
    }
    /* 1. The wash. Full strength in the first frame and mostly gone by 180ms,
          so the eye catches an afterimage rather than a red screen. */
    .mode-flash::before {
      content: '';
      position: absolute;
      inset: 0;
      background: rgba(255, 71, 51, 1);
      animation: flashWash 900ms cubic-bezier(0.16, 1, 0.3, 1) both;
    }

    /* LEAVING edit mode. NOT the entry played backwards — reversing it verbatim
       builds the red up and then cuts it, which reads as something starting, the
       exact opposite of what it has to say.

       Entering is an impact: full strength instantly, then decay. Leaving is a
       RELEASE: the red is already there, it lets go of the edges and drains
       outward, and it never reaches the strength the entry does. Quieter and a
       little quicker, because nothing is being warned about any more. */
    .mode-flash.out::before {
      animation: flashDrainWash 620ms cubic-bezier(0.22, 1, 0.36, 1) both;
    }
    .mode-flash.out::after {
      animation: flashDrain 620ms cubic-bezier(0.22, 1, 0.36, 1) both;
    }
    @keyframes flashDrainWash {
      0% {
        opacity: 0.2;
      }
      100% {
        opacity: 0;
      }
    }
    /* Pulled outward and away rather than blooming in from the edges. */
    @keyframes flashDrain {
      0% {
        opacity: 0.62;
        transform: scale(1);
      }
      100% {
        opacity: 0;
        transform: scale(1.22);
      }
    }
    /* 2. The bloom — a radial VIGNETTE, not an inset shadow.
          An inset shadow is drawn inward from the edges however it is tuned, so
          it always ends up looking like a red border sitting on the card; that
          was the "still too red at the end". A radial gradient with a long
          falloff has no edge to hug, and it is gone well before the animation
          ends rather than lingering at a tenth of a percent. */
    .mode-flash::after {
      content: '';
      position: absolute;
      inset: 0;
      background: radial-gradient(
        130% 120% at 50% 50%,
        rgba(255, 71, 51, 0) 38%,
        rgba(255, 71, 51, 0.55) 78%,
        rgba(255, 71, 51, 0.9) 100%
      );
      animation: flashBloom 900ms cubic-bezier(0.16, 1, 0.3, 1) both;
    }
    /* Smoothed out rather than cliff-edged: the old curve dropped from 0.62 to
       0.14 in a quarter of the run and then crawled, which is the "raw" part. */
    @keyframes flashWash {
      0% {
        opacity: 0.55;
      }
      18% {
        opacity: 0.3;
      }
      46% {
        opacity: 0.08;
      }
      100% {
        opacity: 0;
      }
    }
    @keyframes flashBloom {
      0% {
        opacity: 0.9;
        transform: scale(1);
      }
      60% {
        opacity: 0.12;
        transform: scale(1.06);
      }
      /* Zero well before the end, so nothing is left painted on the card while
         the knock finishes settling. */
      82%,
      100% {
        opacity: 0;
        transform: scale(1.1);
      }
    }
    /* 3. The knock. The card gives a little under the flash and springs back —
          the physical half of the effect, and the half that makes it feel like
          something happened TO the card rather than on top of it. */
    .panel.flash {
      animation: flashKnock 620ms var(--ssc-spring) both;
    }
    .panel.flash-out {
      animation: flashKnockOut 620ms var(--ssc-spring) both;
    }
    @keyframes flashKnock {
      0% {
        transform: scale(0.982);
      }
      100% {
        transform: none;
      }
    }
    /* The card breathes back OUT as the red lets go, rather than being knocked
       in. Same spring, opposite sense. */
    @keyframes flashKnockOut {
      0% {
        transform: scale(1.012);
      }
      100% {
        transform: none;
      }
    }
    .panel.reduce ~ .mode-flash {
      animation: none;
      display: none;
    }

    /* The overflow menu hangs off the RIGHT edge: its button is the last one in
       the header, so a left-aligned menu would run off the card. */
    .tools-menu-wrap {
      position: relative;
      display: inline-flex;
    }
    /* The overflow menu gets a POPOVER animation rather than the picker's
       max-height one. With two items its content is 88px against a 320px
       max-height, so the shared transition revealed all of it in the first 61ms
       of 220 and read as instant. Transform and opacity do not care how tall the
       content is, so this lands the same however many items it ends up with. */
    /* The same unfold the calendar picker uses — the real work of the
       transition is the SCHEDULE receding behind it (see _receded), which is
       what was missing and what made this look static.

       The one difference is the max-height, sized to this menu's own content.
       Sharing the picker's 320px meant the 84px here was fully revealed in the
       first 61ms of the transition, with the rest animating empty space. The
       doubled class beats .pick-menu.open, which is otherwise equally specific
       and comes earlier. */
    .menu-right {
      left: auto;
      right: 0;
    }
    .menu-right.menu-right.open {
      max-height: 104px;
    }
    /* Finger-sized gaps. On the kiosk tablet these sat 3px apart and the wrong
       button got hit; 40px targets need real space between them, not just size. */
    .tools {
      display: flex;
      align-items: center;
      gap: 15px;
      flex: 0 0 auto;
    }
    .btn {
      display: grid;
      place-items: center;
      width: 44px;
      height: 44px;
      padding: 0;
      border: none;
      border-radius: 0;
      background: rgba(255, 255, 255, 0.08);
      color: var(--ssc-fg);
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;
      transition: background 0.15s ease, transform 0.12s ease;
    }
    .btn:hover {
      background: rgba(255, 255, 255, 0.17);
    }
    .btn:active {
      transform: scale(0.92);
    }
    /* On = the non-default setting, so a glance says the view has been
       reshaped from what the YAML asked for. Same inversion as today's cell.
       This MUST come after :hover. Both selectors have the same specificity,
       so when .btn.on sat earlier in the sheet the hover grey won and a
       pressed button went grey instead of white - and on a touch screen the
       hover state sticks after the tap, so it stayed grey. */
    .btn.on,
    .btn.on:hover {
      background: var(--ssc-today-cell, #ededed);
      color: var(--ssc-today-cell-fg, #16161a);
    }
    .btn.off {
      opacity: 0.3;
      pointer-events: none;
    }
    .btn ha-icon {
      --mdc-icon-size: 25px;
    }
    .btn.spin ha-icon {
      animation: spin 850ms linear infinite;
    }
    .warn {
      display: grid;
      place-items: center;
      width: 40px;
      height: 40px;
      color: var(--error-color, #ff6b6b);
    }
    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }

    .dot {
      width: 12px;
      height: 12px;
      flex: 0 0 auto;
    }

    /* THE LATTICE. One grid template shared by the header, the all-day strip and
       the body, so a column edge is the same x in all three. Days are 1fr each:
       an empty Friday is exactly as wide as a busy Monday, always. */
    .hdr,
    .allday,
    .body {
      display: grid;
      grid-template-columns: var(--ssc-gutter) repeat(var(--cols), 1fr);
    }
    /* One line, "Wednesday, Sep 9". The weekday is what the eye lands on, so it
       carries the weight; the date is the same colour two sizes down. */
    .dayhead {
      display: flex;
      flex-direction: row;
      align-items: baseline;
      justify-content: center;
      gap: 5px;
      padding: 5px 4px 10px;
      text-align: center;
      line-height: 1.15;
    }
    .dayhead.alt {
      background: var(--ssc-band);
    }
    .dayhead .dow {
      font-size: 16px;
      font-weight: 700;
      flex: 0 1 auto;
      letter-spacing: -0.2px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      max-width: 100%;
    }
    .dayhead .dnum {
      font-size: 14px;
      font-weight: 400;
    }

    .allday {
      margin-bottom: 8px;
      align-items: start;
    }
    .gut-lbl {
      font-size: 13px;
      font-weight: 500;
      padding-right: 10px;
      text-align: right;
      align-self: center;
    }
    .ad-cell {
      display: flex;
      flex-direction: column;
      gap: 4px;
      padding: 0 3px;
    }
    .ad {
      font-size: 14px;
      font-weight: 600;
      padding: 5px 9px;
      background: var(--fill);
      color: #fff;
      cursor: pointer;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .body {
      position: relative;
      height: var(--body-h);
      border-top: 1px solid var(--ssc-line-strong);
    }

    /* ------------------------------------------------------------------ *
     * days-as-rows: the same lattice, transposed. Day labels down the
     * left, the hour axis across the top, blocks sized along x. Colour,
     * type and contrast handling are shared with the other orientation --
     * only the axes swap.
     * ------------------------------------------------------------------ */
    .rgrid {
      --rday-w: 172px;
      position: relative;
      /* Room for the scrollbar BELOW the last day's row rather than lying over
         it. The bar is an overlay, so without this it clips Friday. */
      padding-bottom: 18px;
    }
    /* Only the hour columns scroll. The title, week range and buttons above stay
       put, and the date column is a sibling of the scroller rather than a child
       of it -- see the note in the template. */
    .rframe {
      display: flex;
      align-items: flex-start;
    }
    .rdays {
      flex: 0 0 var(--rday-w);
      box-sizing: border-box;
    }
    .rscroll {
      flex: 1 1 auto;
      min-width: 0;
      /* The whole grid is PAINTED here rather than placed in the content. A
         scroll container's own background sits on its border box and does not
         move when the content rubber-bands, so the ruling holds and a bounce
         reads as the grid carrying on rather than as flat card.

         Only the ROW BANDING is painted here. It is constant along x, so it
         needs no phase and cannot fall out of register with the content, and
         because it does not move it fills the area a bounce exposes.

         The vertical hour lines are NOT painted: they are elements inside each
         row. Painting them needs background-attachment local to keep them in
         register with the blocks through a bounce, and that drops the scroller
         onto the main thread, which loses the rubber-band entirely. Elements
         move with the content for free and cost nothing.
         (No backticks in this comment: one ends the css template literal and
         the error surfaces hundreds of lines away.)

         The second layer masks the hour axis so the banding does not run up
         behind the times: a tiled gradient repeats in BOTH directions from its
         position, so the strip above y=31 would otherwise show the tail of the
         previous cycle as a grey band. */
      background-image:
        linear-gradient(
          var(--ha-card-background, var(--card-background-color, #1c1c1e)),
          var(--ha-card-background, var(--card-background-color, #1c1c1e))
        ),
        linear-gradient(
          to bottom,
          transparent 0,
          transparent var(--row-h),
          var(--ssc-band) var(--row-h),
          var(--ssc-band) 100%
        );
      background-position:
        0 0,
        0 31px;
      /* ONE CYCLE PER TILE, and let background-repeat do the repeating. Using a
         repeating-gradient at auto size instead makes the tile as wide as the
         scrollport, so its internal rhythm is cut mid-cycle and every tile edge
         injects a stray line off the hour. That is what put extra verticals
         between the real ones. */
      background-size:
        100% 31px,
        100% calc(var(--row-h) * 2);
      background-repeat: no-repeat, repeat;
      overflow-x: auto;
      overflow-y: hidden;
      overscroll-behavior-x: contain;
      -webkit-overflow-scrolling: touch;
      touch-action: pan-x pan-y;
      scrollbar-width: none; /* the custom thumb below replaces it */
    }
    .rscroll::-webkit-scrollbar {
      display: none;
    }
    .rinner {
      width: var(--axis-w);
      box-sizing: border-box;
      /* Closes the far end of the axis, mirroring the 2px the day column draws
         at the near end. Without it the grid just stopped. */
      border-right: 2px solid var(--ssc-line-strong);
    }
    /* The two halves are aligned by sharing these heights, not by living in one
       grid: corner to rtimes, rday to rcanvas. The corner carries only the
       horizontal rule -- the column's own side borders start at the first day
       row, so no stubs hang above it. */
    /* No top or bottom rule: the grid reads as floating rather than boxed in. */
    .rcorner,
    .rtimes {
      height: 30px;
      box-sizing: border-box;
    }
    .rtimes {
      position: relative;
    }
    .rhr {
      position: absolute;
      bottom: 7px;
      transform: translateX(-50%);
      font-size: 14px;
      font-weight: 500;
      font-variant-numeric: tabular-nums;
      white-space: nowrap;
    }
    /* A label sitting on x=0 would have half of it outside the axis and read as
       ":00", so that one is left-aligned. The test is against ~0 rather than a
       pixel threshold because pos() is a percentage in adaptive mode, where a
       22px threshold would have caught the first five hours. */
    .rhr.first {
      transform: none;
    }
    /* And the one ON the far end would hang past it, which in adaptive mode is
       enough overflow to give the scroller a few stray pixels to scroll. */
    .rhr.last {
      transform: translateX(-100%);
    }
    .rday,
    .rcanvas {
      height: var(--row-h);
      box-sizing: border-box;
    }
    .rday.alt {
      background: var(--ssc-band);
    }
    .rday {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: flex-start;
      gap: 1px;
      padding: 0 12px 0 10px;
      line-height: 1.15;
      /* Both lines are 2px against the hour grid's 1px, so the column reads as
         fixed furniture rather than another scrolling gridline. They live on the
         cells, not the column, so nothing hangs above the first day row. */
      border-left: 2px solid var(--ssc-line-strong);
      border-right: 2px solid var(--ssc-line-strong);
    }
    .rday .dow {
      font-size: 16px;
      font-weight: 700;
      letter-spacing: -0.2px;
    }
    .rday .dnum {
      font-size: 14px;
      font-weight: 400;
    }
    /* Today: the day/date cell only, inverted out of the dark card so it reads
       at a glance without touching the blocks themselves. */
    .rday.today,
    .rday.alt.today {
      background: var(--ssc-today-cell, #ededed);
      color: var(--ssc-today-cell-fg, #16161a);
    }
    .rcanvas {
      position: relative;
    }
    /* Elements, not paint — see the note on .rscroll's background. They sit
       inside the rows, so they never reach up into the hour labels. */
    .rlines {
      position: absolute;
      inset: 0;
      pointer-events: none;
    }
    .rline {
      position: absolute;
      top: 0;
      bottom: 0;
      border-left: 1px solid var(--ssc-line);
    }
    /* Same block, laid out along x instead of y: a 1px right inset keeps
       back-to-back lessons legible now the fills are opaque. */
    .ev.rev {
      padding: 1px 1px 1px 0;
    }
    .ev.rev .ev-in {
      padding: 5px 9px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      /* Same 1px as the date column, so name-over-time reads identically in
         both. The generic .ev-time margin is for the other orientation. */
      gap: 1px;
    }
    .ev.rev .ev-time {
      margin-top: 0;
    }
    /* One line, always. The axis is scaled so ~16 characters fit; anything
       longer truncates and the full title is in the detail sheet. Wrapping to a
       second line was tried and makes rows of different-length titles ragged. */
    .ev.rev .ev-name {
      font-size: 15px;
      line-height: 1.2;
      display: block;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    /* 13px, not 12: measured on the tablet as the hardest thing on the card
       to read at arm's length. One pixel is the whole budget - the block is
       only 72px tall and has to hold the name above this. */
    .ev.rev .ev-time {
      font-size: 13px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    /* Overlay scrollbar. Chrome on the tablet draws a permanent chunky native
       bar that steals a row of pixels and never fades, so the native one is
       hidden and this mirrors the platform behaviour: visible while scrolling,
       gone about a second after it stops. */
    /* Spans the hour columns only. The day column does not scroll -- it is
       sticky -- so a track running under it would imply otherwise. */
    /* Centred in the whole gap below the last row, which is .rgrid's 18px of
       padding PLUS the panel's own 18px — hence the negative offset, which
       drops it past .rgrid's edge into the panel's padding. Centring inside
       .rgrid alone left it sitting high. Always visible whenever there is
       something to scroll to: fading it out was misleading, the card looked
       complete when there was more week off to the right. */
    /* The bar is a 16px-tall grab target with the 6px rail drawn inside it. A
       6px target is fine for a finger on the content itself, which scrolls
       directly, but it is a miserable thing to hit with a mouse - and this is
       the only way to scroll with one, since the native bar is hidden. */
    .hbar {
      position: absolute;
      left: var(--rday-w);
      right: 0;
      bottom: -8px;
      height: 16px;
      cursor: pointer;
      touch-action: none;
    }
    /* The rail, so the bar reads as something you can aim at rather than a lone
       floating thumb. Drawn on the bar's own box, centred in the grab area. */
    .hbar::before {
      content: '';
      position: absolute;
      left: 0;
      right: 0;
      top: 5px;
      height: 6px;
      border-radius: 3px;
      background: rgba(255, 255, 255, 0.08);
    }
    .hthumb {
      position: absolute;
      top: 5px;
      height: 6px;
      border-radius: 3px;
      background: rgba(255, 255, 255, 0.42);
      cursor: grab;
    }
    .hbar:hover .hthumb {
      background: rgba(255, 255, 255, 0.6);
    }
    /* On the BAR, not the thumb: during a drag the pointer is captured by the
       bar and routinely leaves the thumb, and the cursor has to stay grabbing. */
    .hbar.dragging {
      cursor: grabbing;
    }
    .hbar.dragging .hthumb {
      cursor: grabbing;
      background: rgba(255, 255, 255, 0.75);
    }

    .rgrid.dir-fwd .rframe {
      animation: inFromRight var(--ssc-week-dur) var(--ssc-week-ease) both;
    }
    .rgrid.dir-back .rframe {
      animation: inFromLeft var(--ssc-week-dur) var(--ssc-week-ease) both;
    }
    .list.dir-fwd {
      animation: listInRight var(--ssc-week-dur) var(--ssc-week-ease) both;
    }
    .list.dir-back {
      animation: listInLeft var(--ssc-week-dur) var(--ssc-week-ease) both;
    }
    .lines {
      position: absolute;
      top: 0;
      bottom: 0;
      left: var(--ssc-gutter);
      right: 0;
      pointer-events: none;
      z-index: 2;
    }
    .line {
      position: absolute;
      left: 0;
      right: 0;
      border-top: 1px solid var(--ssc-line);
    }
    .gutter {
      position: relative;
    }
    .hr {
      position: absolute;
      right: 11px;
      transform: translateY(-50%);
      font-size: 14px;
      font-weight: 500;
      font-variant-numeric: tabular-nums;
      white-space: nowrap;
    }
    .day {
      position: relative;
      border-left: 1px solid var(--ssc-line);
    }
    .day.alt {
      background: var(--ssc-band);
    }

    /* ---- press-and-hold on empty space ------------------------------- *
     *
     * Half a second is a long time to hold something that gives nothing back,
     * so the slot draws itself while the finger is down: it is the only signal
     * that the press has been noticed AND the only preview of where the event
     * will land. It fills as the hold completes, so letting go early visibly
     * abandons something rather than silently doing nothing.
     *
     * Selection and the long-press callout are off in edit mode only. Outside
     * it the grid is ordinary text again, and turning either off globally would
     * make the card the one thing on the dashboard you cannot copy out of.
     */
    .rgrid.editing .rcanvas,
    .rgrid.editing .rday,
    .grid.editing .day,
    .grid.editing .dayhead,
    .list.editing .ld-head {
      -webkit-touch-callout: none;
      -webkit-user-select: none;
      user-select: none;
      cursor: cell;
    }
    /* Every day label is a press target, and each holds its own overlay. */
    .rday,
    .dayhead {
      position: relative;
    }
    .press-ghost {
      position: absolute;
      z-index: 2;
      box-sizing: border-box;
      pointer-events: none;
      background: rgba(255, 255, 255, 0.14);
      border: 2px solid var(--ssc-fg, #fff);
      /* animation-duration comes inline, off the same constant the timer uses -
         the fill has to finish exactly when the sheet opens, not near it. */
      animation-name: pressHold;
      animation-timing-function: cubic-bezier(0.33, 0, 0.2, 1);
      animation-fill-mode: both;
    }
    /* Fills the day label that is being held — the cell down the left of the
       transposed grid, the heading across the top of the other one, or the day
       heading in the list. It never covers the timeline beside it: what is
       being claimed is the DAY, and the time comes from the clock. */
    /* height:100%, not inset:0. Measured: with top and bottom both zero the box
       came out 6px short — the heading's bottom padding — while height:100%
       resolves against the full padding box every time. Do not "simplify" this
       back to inset. */
    .press-ghost.head {
      top: 0;
      left: 0;
      right: 0;
      height: 100%;
    }
    @keyframes pressHold {
      0% {
        opacity: 0;
        transform: scale(0.86);
      }
      45% {
        opacity: 0.5;
        transform: scale(1);
      }
      100% {
        opacity: 1;
        transform: scale(1);
      }
    }

    .ev {
      position: absolute;
      box-sizing: border-box;
      padding: 0 2px 1px;
      cursor: pointer;
      z-index: 3;
      -webkit-tap-highlight-color: transparent;
      /* Fill mode BACKWARDS, never both. Both pins the end state after the
         animation finishes, which outranks the dimmed rule below and freezes
         the cells. Backwards still covers the staggered delay, and the end state
         is the element's normal CSS anyway.
         (No backticks anywhere in this literal - one ends it and the error lands
         hundreds of lines away. This is the second time.) */
      animation: evIn var(--ssc-block-dur) var(--ssc-block-ease) backwards;
    }
    /* Each block is its own query container, so one that is too narrow for its
       time line can drop it and hand the room to the name. Width-driven rather
       than mode-driven: the same block is 144px in fixed mode and 36px in
       adaptive over a whole day, and it has to read in both. */
    .ev {
      container-type: inline-size;
    }
    /* Measured: the time is 65-80px of digits, while a 36px block has 18px of
       content box once padding is taken. It cannot fit at any font size, and
       keeping it truncated BOTH lines to a single letter and an ellipsis.
       Dropping it, and pulling the padding in, gets most subject names fully
       legible instead - which is the only thing worth reading at that size. */
    @container (max-width: 90px) {
      .ev.rev .ev-time {
        display: none;
      }
      /* text-align, but NOT align-items: center. As a centred flex item the
         name sizes to its CONTENT, so a long one overflowed the block on both
         sides and you were left reading its middle - "/ MG" out of
         "ICT / MGeo". Stretched to the block instead, a short name still
         centres and a long one clips from the start with an ellipsis, which
         is the half worth keeping. */
      .ev.rev .ev-in {
        padding: 4px 3px;
        text-align: center;
      }
      .ev.rev .ev-name {
        letter-spacing: -0.3px;
      }
    }
    /* Opaque: the event's colour, nothing of the grid behind it showing through,
       and square. The label is white the way Google's own calendar draws it. */
    .ev-in {
      height: 100%;
      box-sizing: border-box;
      padding: 7px 10px;
      overflow: hidden;
      background: var(--fill);
      color: #fff;
      transition: transform 160ms var(--ssc-glide), filter 160ms ease;
    }
    .ev:active .ev-in {
      transform: scale(0.97);
    }
    .ev.sel .ev-in {
      filter: brightness(1.3);
    }
    .ev-name {
      font-size: 17px;
      font-weight: 700;
      line-height: 1.18;
      letter-spacing: -0.25px;
      overflow: hidden;
      text-overflow: ellipsis;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
    }
    /* Same colour as the name, two steps down in size and three in weight. That
       is the entire hierarchy mechanism in this card. */
    .ev-time {
      margin-top: 2px;
      font-size: 13px;
      font-weight: 400;
      font-variant-numeric: tabular-nums;
      white-space: nowrap;
    }
    .ev.compact .ev-in {
      padding: 4px 10px;
      display: flex;
      align-items: center;
    }
    .ev.compact .ev-name {
      font-size: 15px;
      -webkit-line-clamp: 1;
    }
    @keyframes evIn {
      from {
        opacity: 0;
        transform: translateY(9px) scale(0.965);
      }
      to {
        opacity: 1;
        transform: none;
      }
    }
    /* Identical to evIn. Alternating between the two is what restarts the
       cascade when the calendar menu closes — a CSS animation only restarts on a
       change of NAME. */
    @keyframes evInB {
      from {
        opacity: 0;
        transform: translateY(9px) scale(0.965);
      }
      to {
        opacity: 1;
        transform: none;
      }
    }

    /* While the calendar menu is open the schedule recedes: dimmed to a fifth
       and the cells folded most of the way back out, so the menu is plainly the
       thing in focus.
       The transitions live on the DIMMED rule only, so going in is a glide and
       coming out is instant — the entry cascade then replays over the top and
       carries the fade back in itself. Two overlapping fades looked like a
       flicker. */
    .rgrid.dimmed .rframe,
    .grid.dimmed .body,
    .grid.dimmed .hdr {
      opacity: var(--ssc-dim-opacity, 0.1);
      transition: opacity 240ms var(--ssc-glide);
    }
    .rgrid.dimmed .ev,
    .grid.dimmed .ev {
      transform: translateY(var(--ssc-dim-lift, 9px)) scale(var(--ssc-dim-scale, 0.963));
      transition: transform 240ms var(--ssc-glide);
    }
    /* The list recedes further than the grid does. It is the phone layout, the
       rows are big targets, and there is no fine ruling to lose — so it can take
       a deeper fold without turning to mush. */
    .list.dimmed {
      opacity: var(--ssc-dim-opacity, 0.1);
      transition: opacity 240ms var(--ssc-glide);
    }
    .list.dimmed .lr,
    .list.dimmed .ld-head {
      transform: translateY(var(--ssc-dim-lift-list, 26px))
        scale(var(--ssc-dim-scale-list, 0.86));
      transition: transform 260ms var(--ssc-glide);
    }


    /* Week navigation: the whole lattice slides a short distance and fades. The
       blocks re-run their own stagger on top, so the new week assembles rather
       than snapping. */
    .grid.dir-fwd .body,
    .grid.dir-fwd .hdr {
      animation: inFromRight var(--ssc-week-dur) var(--ssc-week-ease) both;
    }
    .grid.dir-back .body,
    .grid.dir-back .hdr {
      animation: inFromLeft var(--ssc-week-dur) var(--ssc-week-ease) both;
    }
    /* The fold: the lattice arrives slightly small and settles to size as it
       fades up, which is what stops a pure slide reading as a jump cut. Paired
       with the imperative fade-out in _navigate - the week goes one way, the
       next one comes from the other. */
    @keyframes inFromRight {
      from {
        opacity: 0;
        transform: translateX(30px) scale(0.985);
      }
      to {
        opacity: 1;
        transform: none;
      }
    }
    @keyframes inFromLeft {
      from {
        opacity: 0;
        transform: translateX(-30px) scale(0.985);
      }
      to {
        opacity: 1;
        transform: none;
      }
    }

    /* The week range travels with the schedule, but a short distance and on its
       own timing. It is one line of text a few centimetres wide: the lattice's
       30px reads as a slide there and as a lurch here.

       Deliberately SHORTER than --ssc-week-dur. The dir class is cleared by the
       content's own animationend, so an animation that outlasted it would have
       the class pulled out from under it mid-move; finishing first means the
       clear lands on an element already at rest. */
    .range.dir-fwd {
      animation: rangeInRight 420ms var(--ssc-week-ease) both;
    }
    .range.dir-back {
      animation: rangeInLeft 420ms var(--ssc-week-ease) both;
    }
    @keyframes rangeInRight {
      from {
        opacity: 0;
        transform: translateX(14px);
      }
      to {
        opacity: 1;
        transform: none;
      }
    }
    @keyframes rangeInLeft {
      from {
        opacity: 0;
        transform: translateX(-14px);
      }
      to {
        opacity: 1;
        transform: none;
      }
    }

    /* The shared 30px nudge is invisible across a full-width list, where it was
       reported as almost undetectable. The list gets a real slide of its own,
       without disturbing the grid that shares inFromRight/inFromLeft. */
    @keyframes listInRight {
      from {
        opacity: 0;
        transform: translateX(34%) scale(0.985);
      }
      to {
        opacity: 1;
        transform: none;
      }
    }
    @keyframes listInLeft {
      from {
        opacity: 0;
        transform: translateX(-34%) scale(0.985);
      }
      to {
        opacity: 1;
        transform: none;
      }
    }

    .list {
      display: flex;
      flex-direction: column;
      /* The whole gap between one day's last event and the next day's heading
         is this plus the two groups' own padding: 4 + 15 + 8 = 27px. */
      gap: 15px;
    }
    .ld {
      padding: 8px 10px 4px;
    }
    /* Padding and the negative margin are on EVERY heading, not just today's,
       so the text stays on the same left edge whichever day it is and only the
       fill changes. */
    .ld-head {
      display: block;
      padding: 6px 10px;
      margin: 0 -10px 4px;
      /* Holds the press overlay, which fills it. */
      position: relative;
    }
    .ld-head-in {
      display: flex;
      align-items: baseline;
      gap: 8px;
    }
    /* Same inversion as the grid's day cell. */
    .ld-head.today {
      background: var(--ssc-today-cell, #ededed);
      color: var(--ssc-today-cell-fg, #16161a);
    }
    .ld-head .dow {
      font-size: 17px;
      font-weight: 700;
      letter-spacing: -0.2px;
    }
    .ld-head .dnum {
      font-size: 14px;
      font-weight: 400;
    }
    .lr {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 9px 10px;
      margin: 0 -10px;
      border-top: 1px solid var(--ssc-line);
      cursor: pointer;
      animation: evIn var(--ssc-block-dur) var(--ssc-block-ease) backwards;
    }
    /* Banding alternates per EVENT ROW, not per day. The day heading is the
       first child, so a row's own index is one behind its child index: odd
       children are the even rows, which is what gets banded. The negative margin
       lets the band run to the card's edges past .ld's padding. */
    .lr:nth-child(odd) {
      background: var(--ssc-band);
    }
    .lr-bar {
      width: 5px;
      align-self: stretch;
      flex: 0 0 auto;
    }
    .lr-time {
      font-size: 13px;
      font-weight: 400;
      line-height: 1.25;
      font-variant-numeric: tabular-nums;
      min-width: 52px;
    }
    .lr-name {
      font-size: 17px;
      font-weight: 700;
      letter-spacing: -0.2px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .lr.empty {
      font-size: 15px;
      font-weight: 400;
      opacity: 0.55;
      cursor: default;
      animation: none;
    }

    /* FIXED, not absolute. In the list layout the card is far taller than the
       viewport, so an absolutely-positioned scrim centres itself in the CARD —
       which put the sheet somewhere down the page, out of sight until you
       scrolled to it. Fixed centres it in the viewport in both layouts.
       The wash is light because the schedule behind it already recedes; the
       two together were near-black. */
    .scrim {
      position: fixed;
      inset: 0;
      display: grid;
      place-items: center;
      background: rgba(0, 0, 0, 0.32);
      z-index: 10;
      animation: fadeIn 180ms ease both;
    }
    .sheet {
      min-width: 240px;
      max-width: 76%;
      background: var(--ha-card-background, #1c1c1e);
      padding: 18px 20px 20px;
      box-shadow: 0 16px 40px rgba(0, 0, 0, 0.55);
      border-top: 5px solid var(--accent);
      /* BACKWARDS, not both. Both pins the end state after the animation, which
         outranks the rubber band's transform and leaves the sheet unable to
         move — the same trap the event blocks hit. */
      animation: sheetIn 460ms var(--ssc-block-ease) backwards;
    }
    .sh-name {
      font-size: 24px;
      font-weight: 700;
      letter-spacing: -0.4px;
      line-height: 1.18;
    }
    .sh-time {
      margin-top: 12px;
      font-size: 17px;
      font-weight: 600;
    }
    .sh-cal {
      display: flex;
      align-items: center;
      gap: 9px;
      margin-top: 10px;
      font-size: 15px;
      font-weight: 400;
    }
    .sh-row {
      margin-top: 10px;
      font-size: 15px;
      font-weight: 400;
      line-height: 1.4;
    }

    /* ---- the edit form -------------------------------------------------
       Shaped like an iOS grouped list - labelled rows in banded groups, the
       actions last - but SQUARE, because nothing in this card has a rounded
       corner and one rounded box here would read as a mistake. Wider than the
       read-only sheet, and scrollable, because a form has to fit a phone in
       landscape with a keyboard over half of it. */
    .sheet.editor {
      width: 520px;
      max-width: 94vw;
      max-height: 90vh;
      overflow-y: auto;
      padding: 16px 18px 18px;
      /* Stops a scroll that reaches the end of this box from continuing into
         the week behind it. The case where the box does not scroll AT ALL is
         not this property's to solve - see _onDragMove. */
      overscroll-behavior: contain;
    }
    /* The rubber band. The offset is written straight to the element during the
       drag, with no transition, and the class is added on release so the spring
       is the only animated part of the gesture. */
    .sheet.editor,
    .recmodal {
      transform: translateY(var(--rubber, 0px));
    }
    .sheet.editor.springing,
    .recmodal.springing {
      transition: transform 520ms var(--ssc-spring);
    }
    .panel.reduce ~ .scrim .sheet.editor.springing,
    .panel.reduce ~ .scrim .recmodal.springing {
      transition: none;
    }
    .ed-title {
      width: 100%;
      box-sizing: border-box;
      background: transparent;
      border: none;
      border-bottom: 1px solid var(--ssc-line-strong);
      color: var(--ssc-fg);
      font-family: inherit;
      font-size: 22px;
      font-weight: 700;
      letter-spacing: -0.3px;
      padding: 2px 0 10px;
      outline: none;
    }
    .ed-title:focus {
      border-bottom-color: var(--accent);
    }
    .ed-group {
      margin-top: 16px;
      background: var(--ssc-band);
    }
    .ed-head {
      padding: 10px 12px 9px;
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 0.4px;
      text-transform: uppercase;
      opacity: 0.75;
    }
    .ed-row {
      display: flex;
      align-items: center;
      gap: 12px;
      min-height: 44px;
      padding: 6px 12px;
      border-top: 1px solid var(--ssc-line);
    }
    /* The group's first row sits against the heading or the group edge, so it
       needs no rule above it. */
    .ed-row:first-child,
    .ed-head + .ed-row {
      border-top: none;
    }
    .ed-lbl {
      flex: 0 0 auto;
      min-width: 78px;
      font-size: 15px;
      font-weight: 600;
    }
    .ed-vals {
      flex: 1 1 auto;
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 8px;
      min-width: 0;
    }
    /* No flex gap on a picker row: the time chip carries its own margin so the
       space between the two chips can collapse with the chip itself. A class
       rather than :has(), which iOS Safari only learned in 15.4 and this has to
       work on whatever phone is in the house. */
    .ed-vals.picks {
      gap: 0;
    }
    /* The tappable value on a date or time row — iOS's grey value chip, square.
       44px tall because this is the control a finger actually aims at. */
    .ed-chip {
      border: 1px solid transparent;
      background: rgba(255, 255, 255, 0.09);
      color: var(--ssc-fg);
      font-family: inherit;
      font-size: 15px;
      font-weight: 600;
      font-variant-numeric: tabular-nums;
      padding: 0 14px;
      min-height: 40px;
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;
      transition: background 0.15s ease;
    }
    .ed-chip:hover {
      background: rgba(255, 255, 255, 0.14);
    }
    /* Open, and showing its picker below. Inverted rather than merely tinted, so
       which of the four rows you are editing is never in question. */
    .ed-chip.on {
      background: var(--ssc-today-cell, #ededed);
      color: var(--ssc-today-cell-fg, #16161a);
    }
    /* The time chip collapses rather than disappearing when all-day goes on, so
       both directions can spring. Everything that contributes to its width has
       to be in the transition — max-width alone leaves the padding and the flex
       gap behind, and the row jumps by the difference. */
    .ed-chip.time {
      margin-left: 8px;
      max-width: 160px;
      overflow: hidden;
      white-space: nowrap;
      transform-origin: right center;
      transition:
        max-width 0.4s var(--ssc-spring),
        padding 0.4s var(--ssc-spring),
        margin 0.4s var(--ssc-spring),
        opacity 0.26s ease,
        transform 0.4s var(--ssc-spring);
    }
    .ed-chip.time .chip-in {
      display: block;
    }
    .ed-chip.time.gone {
      max-width: 0;
      padding-left: 0;
      padding-right: 0;
      margin-left: 0;
      border-width: 0;
      opacity: 0;
      transform: scale(0.6);
      pointer-events: none;
    }
    /* Two animations, not one. The OUTER box opens the space it needs on a
       plain ease, because height overshooting would shove the rest of the form
       up and back; the INNER content drops in on the overshooting spring, which
       is where the elastic settle actually belongs. Running the spring on the
       height instead looks like a glitch. */
    .ed-picker {
      border-top: 1px solid var(--ssc-line);
      background: rgba(0, 0, 0, 0.18);
      overflow: hidden;
      animation: pickerOpen 260ms var(--ssc-week-ease) both;
    }
    .ed-picker > * {
      animation: pickerDrop 420ms var(--ssc-spring) both;
    }
    @keyframes pickerOpen {
      from {
        max-height: 0;
        opacity: 0;
      }
      to {
        max-height: 460px;
        opacity: 1;
      }
    }
    @keyframes pickerDrop {
      from {
        transform: translateY(-14px) scale(0.94);
        opacity: 0;
      }
      to {
        transform: none;
        opacity: 1;
      }
    }

    /* ---- month grid ---- */
    .cal {
      padding: 8px 10px 12px;
    }
    .cal-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
    }
    .cal-month {
      font-size: 16px;
      font-weight: 700;
    }
    .cal-nav {
      width: 40px;
      height: 40px;
      display: grid;
      place-items: center;
      border: none;
      background: transparent;
      color: var(--ssc-fg);
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;
    }
    .cal-nav:hover {
      background: rgba(255, 255, 255, 0.08);
    }
    .cal-grid {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      gap: 2px;
      margin-top: 6px;
    }
    /* The month arriving. Two names for one animation so that alternating them
       restarts it on every step - see _stepMonth. The offset comes in as a
       custom property, signed by the direction of travel, so a month stepped
       forward slides in from the right and back from the left. */
    .cal-month,
    .cal-day {
      animation-duration: 300ms;
      animation-timing-function: var(--ssc-block-ease);
      animation-fill-mode: backwards;
    }
    @keyframes calDayA {
      from {
        opacity: 0;
        transform: translateX(var(--cal-from, 0px));
      }
      to {
        opacity: 1;
        transform: none;
      }
    }
    @keyframes calDayB {
      from {
        opacity: 0;
        transform: translateX(var(--cal-from, 0px));
      }
      to {
        opacity: 1;
        transform: none;
      }
    }
    .cal-dow {
      text-align: center;
      font-size: 12px;
      font-weight: 700;
      opacity: 0.6;
      padding-bottom: 4px;
    }
    /* 40px square: the smallest a day can be and still be hit reliably with a
       thumb, which is the whole reason this replaced the native picker. */
    .cal-day {
      min-height: 40px;
      border: none;
      background: transparent;
      color: var(--ssc-fg);
      font-family: inherit;
      font-size: 15px;
      font-variant-numeric: tabular-nums;
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;
    }
    .cal-day:hover {
      background: rgba(255, 255, 255, 0.08);
    }
    .cal-day.today {
      font-weight: 700;
      box-shadow: inset 0 0 0 1px var(--ssc-line-strong);
    }
    .cal-day.sel {
      background: var(--ssc-today-cell, #ededed);
      color: var(--ssc-today-cell-fg, #16161a);
      font-weight: 700;
    }

    /* ---- time drum ----
       Two scroll-snap columns with a fixed band across the middle. The padding
       rows are what let the first and last values reach the centre. */
    .wheel {
      position: relative;
      display: flex;
      align-items: stretch;
      justify-content: center;
      gap: 6px;
      height: var(--wheel-h);
      padding: 0 10px;
    }
    .wheel-band {
      position: absolute;
      left: 10px;
      right: 10px;
      top: calc(50% - 22px);
      height: 44px;
      background: rgba(255, 255, 255, 0.08);
      pointer-events: none;
    }
    .wheel-col {
      flex: 0 1 120px;
      overflow-y: scroll;
      scroll-snap-type: y mandatory;
      scrollbar-width: none;
      -webkit-overflow-scrolling: touch;
      text-align: center;
    }
    .wheel-col::-webkit-scrollbar {
      display: none;
    }
    .wheel-pad {
      height: calc(var(--wheel-h) / 2 - 22px);
    }
    .wheel-item {
      height: 44px;
      line-height: 44px;
      scroll-snap-align: center;
      /* A row is a target, not just something to drag past — see _spinWheel. */
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;
      font-size: 20px;
      font-weight: 600;
      font-variant-numeric: tabular-nums;
      opacity: 0.45;
      transition: opacity 0.15s ease;
    }
    .wheel-item:hover {
      opacity: 0.8;
    }
    .wheel-item.sel {
      opacity: 1;
      font-weight: 700;
    }
    .wheel-sep {
      align-self: center;
      font-size: 20px;
      font-weight: 700;
      opacity: 0.5;
    }

    /* ---- colour swatches, Google's shape ----
       ROUND, which is the one place this card breaks its own no-radius rule:
       the palette is lifted from Google Calendar deliberately, so that it is
       recognisably the same control, and a grid of squares is not it. */
    /* Six across, at roughly Google's own size. They were 42px, which on a
       12-swatch grid dominated the form; the grid is a glance-and-tap target,
       not the point of the screen. */
    .sw-grid {
      display: grid;
      grid-template-columns: repeat(6, 1fr);
      gap: 10px;
      padding: 12px;
      justify-items: center;
    }
    .sw {
      width: 26px;
      height: 26px;
      border-radius: 50%;
      border: none;
      padding: 0;
      display: grid;
      place-items: center;
      background: var(--sw, transparent);
      color: #fff;
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;
      transition:
        transform 0.2s var(--ssc-spring),
        box-shadow 0.2s ease;
    }
    .sw:hover {
      transform: scale(1.08);
    }
    .sw:active {
      transform: scale(0.94);
    }
    .sw ha-icon {
      --mdc-icon-size: 17px;
      /* A tick has to read on banana as well as on tomato. */
      filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.45));
    }
    /* "Whatever the calendar is" — an outline, because it is the ABSENCE of an
       override rather than a twelfth colour. Google's picker puts a + here; this
       is not adding anything, so a slashed ring says it better. */
    .sw.none {
      box-shadow: inset 0 0 0 2px var(--ssc-line-strong);
      color: var(--ssc-fg);
      position: relative;
      overflow: hidden;
    }
    .sw.none::after {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(
        to bottom right,
        transparent calc(50% - 1px),
        var(--ssc-line-strong) calc(50% - 1px),
        var(--ssc-line-strong) calc(50% + 1px),
        transparent calc(50% + 1px)
      );
    }
    .sw.none.sel::after {
      display: none;
    }
    .sw.sel {
      box-shadow: 0 0 0 2px var(--ha-card-background, #1c1c1e), 0 0 0 4px var(--ssc-fg);
    }

    /* ---- the foldable groups ----
       Content stays mounted and collapses, so both directions animate. The
       height rides a plain ease while the CONTENT springs: a height that
       overshoots shoves everything below it and snaps back, which reads as a
       bug, whereas content that overshoots reads as weight. */
    .ed-fold {
      max-height: 0;
      opacity: 0;
      overflow: hidden;
      transition:
        max-height 0.36s var(--ssc-week-ease),
        opacity 0.2s ease;
    }
    .ed-fold.open {
      max-height: 320px;
      opacity: 1;
    }
    /* A fold that can hold an open month grid. max-height is a ceiling, not the
       height, so the only cost of a generous one is that the CLIP finishes
       early - and the spring on .ed-fold-in is what the eye is following. */
    .ed-fold.tall.open {
      max-height: 680px;
    }
    .ed-fold-in {
      transform: translateY(-12px) scale(0.96);
      opacity: 0;
      transition:
        transform 0.44s var(--ssc-spring),
        opacity 0.3s ease;
    }
    .ed-fold.open .ed-fold-in {
      transform: none;
      opacity: 1;
    }
    /* Springs too, rather than turning on a linear ease — it is the one part of
       the row that moves, so it carries the whole gesture. */
    .ed-chev {
      transition: transform 0.44s var(--ssc-spring);
    }

    /* ---- location lookup and its map ---- */
    .ed-row.loc .ed-vals {
      gap: 8px;
    }
    .ed-mapbtn {
      flex: 0 0 auto;
      width: 40px;
      height: 40px;
      display: grid;
      place-items: center;
      border: none;
      background: rgba(255, 255, 255, 0.09);
      color: var(--ssc-fg);
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;
      transition:
        background 0.2s ease,
        transform 0.3s var(--ssc-spring);
    }
    .ed-mapbtn:hover {
      background: rgba(255, 255, 255, 0.16);
    }
    .ed-mapbtn.on {
      background: var(--ssc-today-cell, #ededed);
      color: var(--ssc-today-cell-fg, #16161a);
      transform: scale(1.06);
    }
    .ed-mapbtn[disabled] {
      opacity: 0.4;
      cursor: default;
    }
    .loc-list {
      display: flex;
      flex-direction: column;
      border-top: 1px solid var(--ssc-line);
      background: rgba(0, 0, 0, 0.18);
      animation: pickerOpen 260ms var(--ssc-week-ease) both;
      overflow: hidden;
    }
    .loc-item {
      display: flex;
      align-items: center;
      gap: 10px;
      min-height: 48px;
      padding: 8px 12px;
      border: none;
      border-bottom: 1px solid var(--ssc-line);
      background: transparent;
      color: var(--ssc-fg);
      font: inherit;
      text-align: left;
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;
      transition: background 0.15s ease;
    }
    .loc-item:last-child {
      border-bottom: none;
    }
    .loc-item:hover {
      background: rgba(255, 255, 255, 0.07);
    }
    .loc-item ha-icon {
      flex: 0 0 auto;
      --mdc-icon-size: 20px;
      opacity: 0.6;
    }
    .loc-text {
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 1px;
    }
    .loc-name {
      font-size: 15px;
      font-weight: 600;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .loc-detail {
      font-size: 13px;
      opacity: 0.65;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    /* The preview. Tiles are absolutely placed inside a clipped box — no map
       library, because the only interaction is "look at it", and Home
       Assistant's own Leaflet comes with CARTO tiles that are stamped
       "API KEY REQUIRED" right across them (verified by rendering ha-map).
       Esri needs no key. */
    .map {
      position: relative;
      height: var(--map-h, 170px);
      overflow: hidden;
      background: #1a1a1e;
    }
    .map-layer {
      position: absolute;
      inset: 0;
    }
    /* Esri's "Dark Gray" basemap is a MID grey — against a card on rgb(32,27,37)
       it reads as a bright slab dropped into the form. Pulled down to the card's
       own darkness, with the label layer pushed the other way so street names
       stay readable through it. */
    .map-layer img {
      position: absolute;
      width: 256px;
      height: 256px;
      filter: brightness(0.42) contrast(1.15) saturate(0.8);
    }
    .map-layer.labels img {
      filter: brightness(1.25) contrast(1.1);
    }
    .map-pin {
      position: absolute;
      left: 50%;
      top: 50%;
      width: 14px;
      height: 14px;
      margin: -7px 0 0 -7px;
      border-radius: 50%;
      background: rgba(255, 71, 51, 1);
      box-shadow:
        0 0 0 3px rgba(255, 255, 255, 0.9),
        0 2px 8px rgba(0, 0, 0, 0.6);
      animation: pinDrop 460ms var(--ssc-spring) both;
    }
    @keyframes pinDrop {
      from {
        transform: translateY(-16px) scale(0.4);
        opacity: 0;
      }
      to {
        transform: none;
        opacity: 1;
      }
    }
    .map-open {
      position: absolute;
      right: 8px;
      top: 8px;
      z-index: 500;
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 7px 10px;
      background: rgba(0, 0, 0, 0.72);
      color: #fff;
      font-size: 13px;
      font-weight: 600;
      text-decoration: none;
    }
    .map-open ha-icon {
      --mdc-icon-size: 16px;
    }
    .map-none {
      padding: 18px 12px;
      font-size: 14px;
      opacity: 0.7;
    }

    /* ---- the location picker window ----
       Its own window, not a panel inside the form. Choosing a place on a map is
       a task in itself and it needs room: the inline version was 505x360 and you
       could not get your bearings in it. */
    /* Centred and CAPPED. At inset:3vh 3vw it filled a desktop screen, which put
       its close button right beside the pop-up's own — two X's side by side —
       and made a village map the size of a wall. Big enough to navigate, small
       enough to still read as a window over the card. */
    .mapmodal {
      position: fixed;
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%);
      width: min(860px, 92vw);
      height: min(620px, 88vh);
      z-index: 40;
      display: flex;
      flex-direction: column;
      background: var(--ha-card-background, #1c1c1e);
      box-shadow: 0 24px 70px rgba(0, 0, 0, 0.7);
      animation: sheetIn 380ms var(--ssc-block-ease) both;
    }
    /* Centred by a FLEX WRAPPER, not by translate(-50%, -50%).
       The window is animated, and a transform keyframe replaces the centring
       one outright — so the panel started each open with its top-left corner ON
       the centre point and flew in from the bottom right. Nothing short of
       repeating the offset in every keyframe fixes that, and then every future
       keyframe has to remember. A wrapper leaves transform free.
       It ignores the pointer so that a tap beside the window still reaches the
       scrim underneath, which is what closes it. */
    .recwrap {
      position: fixed;
      inset: 0;
      z-index: 40;
      display: flex;
      align-items: center;
      justify-content: center;
      pointer-events: none;
    }
    /* Sized to its own content rather than to a map: a dialog of six rows has
       no reason to be 620px tall, and Google's is a narrow column. It scrolls
       rather than growing, because the day circles plus an open month grid is
       taller than a phone. */
    .recmodal {
      pointer-events: auto;
      /* Wide enough for "Repeat every [1] [day week month year]" on one line at
         the sizes above; below that .rec-every wraps rather than squashing. */
      width: min(540px, 94vw);
      max-height: 88vh;
      display: flex;
      flex-direction: column;
      background: var(--ha-card-background, #1c1c1e);
      box-shadow: 0 24px 70px rgba(0, 0, 0, 0.7);
      transform-origin: center;
      /* BACKWARDS, like the sheet. Fill mode both would pin transform:none
         after the entry and the rubber band could not move it.
         (No backticks in this comment - one ends the css literal.) */
      animation: recIn 420ms var(--ssc-spring) backwards;
    }
    .recwrap.out .recmodal {
      animation: recOut 190ms cubic-bezier(0.4, 0, 1, 1) both;
    }
    /* Rises into place with the overshoot the rest of the card uses, and leaves
       on a plain accelerating ease - an exit that springs reads as arriving. */
    @keyframes recIn {
      from {
        opacity: 0;
        transform: scale(0.9) translateY(18px);
      }
      to {
        opacity: 1;
        transform: none;
      }
    }
    @keyframes recOut {
      from {
        opacity: 1;
        transform: none;
      }
      to {
        opacity: 0;
        transform: scale(0.96) translateY(8px);
      }
    }
    .rec-body {
      flex: 1 1 auto;
      overflow-y: auto;
      overscroll-behavior: contain;
      padding-bottom: 4px;
    }
    /* The rule in words, under the controls that built it. Two people have to
       agree here - what you set and what it means - and the second one is the
       only thing that will be true a year from now. */
    .rec-says {
      padding: 14px 12px 4px;
      font-size: 14px;
      font-weight: 600;
      opacity: 0.8;
    }
    /* Collapsed, not dropped, so switching units springs. Same trick as the
       all-day time chip. */
    .rec-days {
      display: grid;
      grid-template-rows: 0fr;
      transition: grid-template-rows 0.42s var(--ssc-spring);
    }
    .rec-days.open {
      grid-template-rows: 1fr;
    }
    .rec-days-in {
      overflow: hidden;
      min-height: 0;
    }
    .dow-row {
      display: flex;
      gap: 6px;
      padding: 0 12px 10px;
    }
    .dow-btn {
      flex: 1 1 0;
      height: 42px;
      border: 1px solid var(--ssc-line);
      background: transparent;
      color: var(--ssc-fg);
      font-family: inherit;
      font-size: 15px;
      font-weight: 700;
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;
      transition:
        background 0.2s ease,
        transform 0.32s var(--ssc-spring),
        color 0.2s ease;
    }
    .dow-btn.on {
      background: var(--accent);
      border-color: var(--accent);
      color: var(--ssc-today-cell-fg, #16161a);
    }
    .dow-btn:active {
      transform: scale(0.92);
    }
    /* Wraps instead of overlapping. Flex items squashed below their content
       width do not politely shrink here - the stepper is a fixed-size control,
       so the row simply ran the two on top of each other on a narrow card. */
    .rec-every {
      flex-wrap: wrap;
      row-gap: 10px;
    }
    .rec-every .ed-vals {
      margin-left: auto;
      display: inline-flex;
      align-items: center;
      gap: 10px;
    }
    /* The unit picker: one control, four states, sized for a finger. */
    .seg {
      display: inline-flex;
      border: 1px solid var(--ssc-line);
    }
    .seg-btn {
      min-width: 52px;
      padding: 0 10px;
      height: 40px;
      border: none;
      border-left: 1px solid var(--ssc-line);
      background: transparent;
      color: var(--ssc-fg);
      font-family: inherit;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;
      transition: background 0.2s ease;
    }
    .seg-btn:first-child {
      border-left: none;
    }
    /* The accent, exactly as the chosen weekday below it wears it. A grey fill
       reads as "disabled" sitting directly above a pink one, which is the
       opposite of what it means. */
    .seg-btn.on {
      background: var(--accent);
      border-color: var(--accent);
      color: var(--ssc-today-cell-fg, #16161a);
    }
    .stepper {
      display: inline-flex;
      align-items: center;
      border: 1px solid var(--ssc-line);
    }
    .st-btn {
      width: 40px;
      height: 40px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border: none;
      background: transparent;
      color: var(--ssc-fg);
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;
      transition: background 0.2s ease, opacity 0.2s ease;
    }
    .st-btn ha-icon {
      --mdc-icon-size: 18px;
    }
    .st-btn[disabled] {
      opacity: 0.3;
      cursor: default;
    }
    .st-val {
      width: 44px;
      height: 40px;
      border: none;
      border-left: 1px solid var(--ssc-line);
      border-right: 1px solid var(--ssc-line);
      background: transparent;
      color: var(--ssc-fg);
      font-family: inherit;
      font-size: 16px;
      font-weight: 700;
      text-align: center;
      font-variant-numeric: tabular-nums;
    }
    /* The number is the value the row is about, so it carries the accent too —
       but only while the row it sits in is the live one. The occurrence count
       under an unselected "After" is a number nothing is using. */
    .stepper.on .st-val {
      background: var(--accent);
      color: var(--ssc-today-cell-fg, #16161a);
      border-color: var(--accent);
      font-weight: 700;
    }
    .st-val:focus {
      outline: none;
    }
    .stepper:not(.on) .st-val:focus {
      background: rgba(255, 255, 255, 0.07);
    }
    /* The two Ends rows that carry a control: a DIV, because the value inside
       them is its own button and a button inside a button is not markup. The
       whole row is the target all the same — see the handlers. */
    .ed-row.scope.ends {
      display: flex;
      gap: 10px;
      cursor: pointer;
    }
    .ed-row.scope.ends .ed-lbl {
      flex: 1 1 auto;
      min-width: 0;
    }
    /* Wrapper whose only job is to swallow clicks bound for the row. */
    .stop {
      display: inline-flex;
      align-items: center;
    }
    .ed-sub.occ {
      flex: 0 0 auto;
    }
    /* The Custom row ends in an icon where every row above it ends in a radio,
       and the radio is what carries the margin that pushes it there. */
    .ed-row.scope .ed-chev {
      margin-left: auto;
    }
    /* The form stays put underneath but stops competing for attention. */
    .sheet.editor.behind {
      opacity: 0.25;
      pointer-events: none;
    }
    .mm-head {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 10px 12px 16px;
      border-bottom: 1px solid var(--ssc-line);
    }
    .mm-title {
      flex: 1 1 auto;
      font-size: 17px;
      font-weight: 700;
    }
    .mm-close {
      width: 44px;
      height: 44px;
      display: grid;
      place-items: center;
      border: none;
      background: transparent;
      color: var(--ssc-fg);
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;
    }
    .mm-close:hover {
      background: rgba(255, 255, 255, 0.09);
    }
    /* The map takes every pixel left over. */
    .mm-body {
      flex: 1 1 auto;
      min-height: 0;
      position: relative;
    }
    .mm-body .map {
      position: absolute;
      inset: 0;
      height: auto;
    }
    .mm-foot {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 12px;
      border-top: 1px solid var(--ssc-line);
    }
    .mm-addr {
      flex: 1 1 auto;
      min-width: 0;
      font-size: 14px;
      line-height: 1.3;
      overflow: hidden;
      text-overflow: ellipsis;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
    }
    .ed-btn.small ha-icon {
      --mdc-icon-size: 18px;
    }
    a.ed-btn {
      display: grid;
      place-items: center;
      text-decoration: none;
    }
    /* ---- the interactive version ---- */
    .map-canvas {
      position: absolute;
      inset: 0;
    }
    /* NO filter on the live map's tiles. Tinting them to match the card was
       what made it unreadable: on a basemap that is already sparse, dropping it
       to 46% brightness leaves nothing to recognise a place by. A map has to be
       legible before it has to be on-brand. */
    .map.live .leaflet-control-zoom a {
      background: rgba(0, 0, 0, 0.72);
      color: #fff;
      border: none;
    }
    .map.live .leaflet-control-zoom a:hover {
      background: rgba(0, 0, 0, 0.88);
    }
    /* The dropped pin. Draggable, so unlike the static preview's pin it must
       NOT ignore the pointer. */
    .ssc-pin {
      display: grid;
      place-items: center;
      cursor: grab;
    }
    .ssc-pin:active {
      cursor: grabbing;
    }
    .ssc-pin span {
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background: rgba(255, 71, 51, 1);
      box-shadow:
        0 0 0 3px rgba(255, 255, 255, 0.92),
        0 2px 8px rgba(0, 0, 0, 0.65);
      animation: pinDrop 380ms var(--ssc-spring) both;
    }
    .map.live .leaflet-container {
      cursor: crosshair;
    }
    /* The maps link lives at the TOP right: the form's action bar is sticky and
       overlays the bottom of the map whenever the sheet is not scrolled all the
       way down, which hid anything placed there. */
    /* Attribution, as Esri's terms require. */
    .map-credit {
      position: absolute;
      left: 8px;
      bottom: 8px;
      z-index: 500;
      padding: 3px 7px;
      background: rgba(0, 0, 0, 0.6);
      color: #fff;
      font-size: 11px;
      pointer-events: none;
    }
    .map-addr {
      flex: 1 1 auto;
      min-width: 0;
      font-size: 13px;
      line-height: 1.3;
      opacity: 0.8;
      overflow: hidden;
      text-overflow: ellipsis;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
    }
    .ed-btn.small {
      flex: 0 0 auto;
      min-height: 36px;
      padding: 8px 12px;
      font-size: 14px;
    }

    /* ---- the details disclosure ---- */
    .ed-disclose {
      width: 100%;
      box-sizing: border-box;
      border: none;
      background: transparent;
      color: var(--ssc-fg);
      font-family: inherit;
      text-align: left;
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;
    }
    .ed-sub {
      flex: 1 1 auto;
      min-width: 0;
      text-align: right;
      font-size: 14px;
      opacity: 0.6;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .ed-chev {
      flex: 0 0 auto;
      --mdc-icon-size: 22px;
      opacity: 0.7;
    }
    .ed-chev.open {
      transform: rotate(180deg);
    }

    /* One rule for every text-ish control in the form. The dark scheme is set
       explicitly so any native control comes up dark too, rather than flashing a
       white panel over a dark card. */
    .ed-vals input,
    .ed-row textarea {
      background: rgba(255, 255, 255, 0.07);
      border: 1px solid transparent;
      color: var(--ssc-fg);
      color-scheme: dark;
      font-family: inherit;
      font-size: 15px;
      padding: 7px 9px;
      min-width: 0;
      outline: none;
    }
    .ed-vals input[type='text'] {
      flex: 1 1 auto;
    }
    .ed-vals input:focus,
    .ed-row textarea:focus {
      border-color: var(--accent);
    }
    .ed-row.notes {
      align-items: flex-start;
      padding-top: 10px;
    }
    .ed-row.notes .ed-lbl {
      padding-top: 8px;
    }
    .ed-row textarea {
      flex: 1 1 auto;
      resize: vertical;
      line-height: 1.35;
    }
    .ed-check {
      margin-left: auto;
      width: 20px;
      height: 20px;
      accent-color: var(--accent);
    }
    .ed-row.scope {
      cursor: pointer;
      width: 100%;
      box-sizing: border-box;
      border: none;
      border-top: 1px solid var(--ssc-line);
      background: transparent;
      color: var(--ssc-fg);
      font: inherit;
      text-align: left;
      -webkit-tap-highlight-color: transparent;
      transition: background 0.28s var(--ssc-week-ease);
    }
    .ed-row.scope {
      position: relative;
      overflow: hidden;
    }
    .ed-row.scope.sel {
      background: rgba(255, 255, 255, 0.07);
    }
    /* A bar that wipes down the left edge of the chosen row. This is the part
       that carries the change at a glance — a dot 20px wide at the far right of
       a 400px row is not something the eye catches, however well it springs. */
    .ed-row.scope::before {
      content: '';
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 4px;
      background: var(--accent);
      transform: scaleY(0);
      transform-origin: top center;
      transition: transform 0.42s var(--ssc-spring);
    }
    .ed-row.scope.sel::before {
      transform: scaleY(1);
    }
    /* And the label leans in with it. */
    .ed-row.scope .ed-lbl {
      transition:
        transform 0.42s var(--ssc-spring),
        font-weight 0.2s ease;
    }
    .ed-row.scope.sel .ed-lbl {
      transform: translateX(6px);
      font-weight: 700;
    }
    .radio {
      margin-left: auto;
      flex: 0 0 auto;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      display: grid;
      place-items: center;
      box-shadow: inset 0 0 0 2px var(--ssc-line-strong);
      transition:
        box-shadow 0.3s var(--ssc-week-ease),
        transform 0.42s var(--ssc-spring);
    }
    .scope.sel .radio {
      box-shadow: inset 0 0 0 2px var(--accent);
      transform: scale(1.12);
    }
    /* Springs in from nothing and settles past full size. Bigger than before,
       and it rotates as it lands so the arrival has some weight to it. */
    .radio-dot {
      width: 14px;
      height: 14px;
      border-radius: 50%;
      background: var(--accent);
      transform: scale(0) rotate(-90deg);
      transition: transform 0.46s var(--ssc-spring);
    }
    .scope.sel .radio-dot {
      transform: scale(1) rotate(0deg);
    }
    /* Says in words what the chosen scope will do. The three options differ by
       exactly one word otherwise, and "future" is the one nobody should have to
       guess about - it cannot be undone. */
    /* Ruled off, or it reads as a caption belonging to the last option rather
       than to whichever one is selected. */
    .ed-note {
      padding: 9px 12px 10px;
      border-top: 1px solid var(--ssc-line);
      font-size: 13px;
      line-height: 1.35;
      opacity: 0.8;
      animation: noteIn 360ms var(--ssc-spring) both;
    }
    @keyframes noteIn {
      from {
        opacity: 0;
        transform: translateY(-6px);
      }
      to {
        opacity: 0.8;
        transform: none;
      }
    }
    .ed-error {
      margin-top: 14px;
      padding: 10px 12px;
      background: rgba(255, 71, 51, 0.16);
      border-left: 3px solid rgba(255, 71, 51, 1);
      font-size: 14px;
      line-height: 1.35;
    }
    /* Pinned to the bottom of the sheet, not the bottom of the content. The form
       is taller than a phone once the recurrence options are in it, and Save
       scrolling off the screen is the one thing a form must never do. The
       negative offset and matching padding cancel the sheet's own bottom
       padding, so it sits flush against the edge rather than floating. */
    .ed-actions {
      position: sticky;
      bottom: -18px;
      z-index: 1;
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 18px;
      padding: 10px 0 18px;
      background: var(--ha-card-background, #1c1c1e);
      box-shadow: 0 -10px 14px -6px var(--ha-card-background, #1c1c1e);
    }
    .ed-spacer {
      flex: 1 1 auto;
    }
    .ed-btn {
      border: none;
      background: rgba(255, 255, 255, 0.1);
      color: var(--ssc-fg);
      font-family: inherit;
      font-size: 15px;
      font-weight: 600;
      padding: 11px 16px;
      min-height: 44px;
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;
      transition: background 0.15s ease;
    }
    .ed-btn:hover {
      background: rgba(255, 255, 255, 0.16);
    }
    .ed-btn[disabled] {
      opacity: 0.5;
      cursor: default;
    }
    /* The same inversion today's heading and the armed week pill use — NOT the
       event's accent. The accent is whatever colour the calendar happens to be,
       and on a red calendar it made Save and Delete the same colour: the one
       pair of buttons in the card that must never be confused for each other. */
    .ed-btn.primary {
      background: var(--ssc-today-cell, #ededed);
      color: var(--ssc-today-cell-fg, #16161a);
      font-weight: 700;
    }
    .ed-btn.danger {
      background: transparent;
      color: rgba(255, 71, 51, 1);
    }
    /* Armed, after the first press. Filled rather than merely re-labelled: the
       second press is the irreversible one and it should not look like the
       first. */
    .ed-btn.danger.armed {
      background: rgba(255, 71, 51, 1);
      color: #fff;
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
      }
    }
    @keyframes sheetIn {
      from {
        opacity: 0;
        transform: scale(0.9) translateY(10px);
      }
    }

    /* Stillness, gated on a CLASS rather than straight on the media query.

       As a bare @media block there was no way to opt back in: a machine whose OS
       has animations turned off system-wide got a card with no week transition
       and a refresh button whose spinner never span, and no amount of config
       could bring them back. .reduce is put on by _reducedMotion, which reads
       the media query but lets animations:always overrule it.
       (No backticks in this comment: one ends the css template literal.) */
    .panel.reduce .ev,
    .panel.reduce .lr,
    .panel.reduce .sheet,
    .panel.reduce .scrim,
    .panel.reduce .grid.dir-fwd .body,
    .panel.reduce .grid.dir-fwd .hdr,
    .panel.reduce .grid.dir-back .body,
    .panel.reduce .grid.dir-back .hdr,
    .panel.reduce .rgrid.dir-fwd .rframe,
    .panel.reduce .rgrid.dir-back .rframe,
    .panel.reduce .list.dir-fwd,
    .panel.reduce .list.dir-back,
    .panel.reduce .range.dir-fwd,
    .panel.reduce .range.dir-back {
      animation: none;
    }
    .panel.reduce .btn.spin ha-icon {
      animation: none;
    }
    /* The edit form's own motion, off with everything else. The chip keeps its
       collapse - it is a layout change, not a flourish - but loses the spring. */
    .panel.reduce ~ .sheet .ed-picker,
    .panel.reduce ~ .sheet .ed-picker > *,
    .panel.reduce ~ .scrim .ed-picker,
    .panel.reduce ~ .scrim .ed-picker > *,
    .panel.reduce ~ .scrim .ed-note,
    .panel.reduce ~ .scrim .cal-day,
    .panel.reduce ~ .scrim .cal-month,
    .panel.reduce ~ .scrim .recmodal,
    .panel.reduce .edit-pill,
    .panel.reduce .add-pill {
      animation: none;
    }
    /* The press ghost keeps its job without the growth: it is an affordance, not
       a flourish, and a press with no feedback at all reads as a dead card. */
    .panel.reduce .press-ghost {
      animation: none;
      opacity: 1;
    }
    .panel.reduce ~ .scrim .radio-dot,
    .panel.reduce ~ .scrim .ed-fold,
    .panel.reduce ~ .scrim .ed-fold-in,
    .panel.reduce ~ .scrim .ed-chip.time,
    .panel.reduce .menu-right {
      transition: none;
    }
    .panel.reduce .ev-in {
      transition: none;
    }
  `;
}

/** Accept `entity: 'calendar.x'`, `entities: ['calendar.x']` or the object form. */
function normaliseSources(config: SimpleScheduleCardConfig): CalendarSourceConfig[] {
  const raw = config.entities ?? (config.entity ? [config.entity] : []);
  const out: CalendarSourceConfig[] = [];
  for (const item of raw) {
    if (typeof item === 'string') out.push({ entity: item });
    else if (item && typeof item.entity === 'string') out.push({ ...item });
  }
  return out;
}

/**
 * Blocks are their colour at FULL opacity — no alpha, nothing of the grid
 * showing through — darkened just enough that the white label reads on them.
 *
 * Google's palette is built for Google's UI, which puts DARK text on those
 * fills. White on Flamingo is 2.9:1, which is why the raw palette looks washed
 * out here. `--accent` keeps the TRUE colour for the legend swatch and list bar,
 * which carry no text and should stay vivid.
 */
function blockStyle(color: string, minContrast: number): string {
  return `--accent:${color}; --fill:${darkenForContrast(color, minContrast)};`;
}

/**
 * "Alex's calendar" -> "Alex's Calendar", matching how Google lists them.
 *
 * Only the first letter of each word is touched — the rest is left exactly as
 * it came, so an acronym such as ICT is not flattened to Ict, and the letter
 * after an apostrophe is not capitalised into Alex'S.
 */
function titleCase(text: string): string {
  return text.replace(/(^|\s)(\p{L})/gu, (_m, lead: string, ch: string) => lead + ch.toUpperCase());
}

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

const ORDINALS: Record<string, string> = { one: 'st', two: 'nd', few: 'rd', other: 'th' };

/**
 * English ordinal suffix. Gated on the language because Intl.PluralRules reports
 * "other" for locales that have no ordinal categories, which would cheerfully
 * append "th" to a Czech date.
 */
function ordinalSuffix(day: number, lang: string | undefined): string {
  if (lang && !lang.toLowerCase().startsWith('en')) return '';
  try {
    return ORDINALS[new Intl.PluralRules('en', { type: 'ordinal' }).select(day)] ?? '';
  } catch {
    return '';
  }
}

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function pct(minutes: number, axis: { start: number; end: number }): string {
  return `${((minutes - axis.start) / (axis.end - axis.start)) * 100}%`;
}

function minsFrom(d: Date, dayStartMs: number): number {
  return (d.getTime() - dayStartMs) / 60000;
}

declare global {
  interface Window {
    customCards?: Array<Record<string, unknown>>;
  }
}
window.customCards = window.customCards || [];
window.customCards.push({
  type: 'simple-schedule-card',
  name: 'Simple Schedule Card',
  description: 'A whole week of calendar events as a proportional time grid',
  preview: false,
});
console.info(
  `%c SIMPLE-SCHEDULE-CARD %c v${CARD_VERSION} `,
  'color:#fff;background:#0a84ff;font-weight:700;border-radius:3px 0 0 3px;padding:2px 4px',
  'color:#0a84ff;background:#222;border-radius:0 3px 3px 0;padding:2px 4px',
);
