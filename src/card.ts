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

const CARD_VERSION = '0.1.0';

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
  layout: 'auto' as const,
  layout_breakpoint: 560,
};

/** Minimum block height. Below this a 15-minute activity has no readable label. */
const MIN_BLOCK_PX = 28;
/** The same idea along the other axis, for the transposed grid. */
const MIN_BLOCK_W_PX = 40;
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
  }

  public disconnectedCallback(): void {
    super.disconnectedCallback();
    if (this._tick) clearInterval(this._tick);
    this._tick = undefined;
    if (this._spinTimer) clearTimeout(this._spinTimer);
    this._spinTimer = undefined;
    this._hostRo?.disconnect();
    this._hostRo = undefined;
    this._setPicker(false);
    this._subs.stop();
  }

  protected updated(changed: PropertyValues): void {
    super.updated(changed);
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

  private async _ensureSubscribed(): Promise<void> {
    const w = this._window;
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
  private get _receded(): boolean {
    return this._pickerOpen || !!this._selected;
  }

  /** Close the detail sheet, replaying the entry cascade as the menu does. */
  private _closeSheet(): void {
    if (!this._selected) return;
    this._selected = undefined;
    this._animEpoch++;
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
    // Same slide the week arrows use, direction taken from where the calendar
    // sits in the list, so the motion says which way you moved.
    this._navDir = idx > this._activeIdx ? 'fwd' : 'back';
    this._activeIdx = idx;
    this._selected = undefined;
  }

  private _goWeek(delta: number): void {
    this._navDir = delta > 0 ? 'fwd' : 'back';
    this._weekOffset += delta;
    this._selected = undefined;
  }

  private _goToday(): void {
    if (this._weekOffset === 0) return;
    this._navDir = this._weekOffset > 0 ? 'back' : 'fwd';
    this._weekOffset = 0;
    this._selected = undefined;
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
      const w = this._window;
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
    const all = this._subs.events.filter((e) => e.entity === activeEntity);
    const timed = all.filter((e) => !e.allDay);
    const axis = axisBounds(timed, cfg.day_start ?? DEFAULTS.day_start, cfg.day_end ?? DEFAULTS.day_end);
    const list = this._mode === 'list';

    return html`
      <ha-card>
        <div class="panel ${list ? 'narrow' : ''}">
          ${this._renderHead(w.days)}
          ${list ? this._renderList(w.days, all) : this._renderGrid(w.days, all, axis)}
        </div>
        ${this._renderSheet()}
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
   * The pill next to the date range. Only the three weeks either side of now get
   * one — past that the range itself is the clearer label, and "in 7 weeks" is
   * not something anyone reads off a wall.
   */
  private get _weekLabel(): string | null {
    if (this._weekOffset === 0) return 'This week';
    if (this._weekOffset === 1) return 'Next week';
    if (this._weekOffset === -1) return 'Previous week';
    return null;
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
    const range = days.length
      ? `${this._fmtDate(days[0])} – ${this._fmtDate(days[days.length - 1])}`
      : '';
    return html`
      <div class="head">
        <div class="titles">${this._renderPicker()}</div>
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
          ${(cfg.show_refresh ?? DEFAULTS.show_refresh)
            ? html`<button
                class="btn ${this._refreshing ? 'spin' : ''}"
                @click=${() => void this._refresh()}
                aria-label="Refresh"
              >
                <ha-icon icon="mdi:refresh"></ha-icon>
              </button>`
            : nothing}
          </div>
          <div class="range">
            ${range}${this._weekLabel
              ? html`<span class="pill">${this._weekLabel}</span>`
              : nothing}
          </div>
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
        class="rgrid dir-${this._navDir} ${this._receded ? 'dimmed' : ''}"
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
                >
                  <span class="dow">${this._fmtDowLong(d)},</span>
                  <span class="dnum">${this._fmtDate(d)}</span>
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
                      class="rhr ${pos(m) < 0.5 ? 'first' : ''} ${pos(m) >= axisEnd - 0.5
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
                  <div class="rcanvas ${i % 2 ? 'alt' : ''}">
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
                          @click=${() => (this._selected = ev)}
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
                      const width = pos(en) - left;
                      return html`
                        <div
                          class="ev rev"
                          style="left:${left}${unit}; width:${width}${unit};
                                 min-width:${MIN_BLOCK_W_PX}px;
                                 top:${column * laneH}px; height:${laneH}px;
                                 animation-name:${this._evAnim}; animation-delay:${i * STAGGER_MS}ms;
                                 ${blockStyle(this._colorForEvent(ev), this._minContrast)}"
                          @click=${() => (this._selected = ev)}
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
          ? html`<div class="hbar">
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
        class="grid dir-${this._navDir} ${this._receded ? 'dimmed' : ''}"
        style="--cols:${cols}; --sub:${placement.columns}; --body-h:${bodyH}px"
        @animationend=${() => {
          this._navDir = 'none';
        }}
      >
        <div class="hdr">
          <div class="corner"></div>
          ${days.map(
            (d, i) => html`
              <div class="dayhead ${i % 2 ? 'alt' : ''}">
                <span class="dow">${this._fmtDowLong(d)},</span>
                <span class="dnum">${this._fmtDate(d)}</span>
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
                            @click=${() => (this._selected = ev)}
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
      <div class="day ${dayIdx % 2 ? 'alt' : ''}">
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
              @click=${() => (this._selected = ev)}
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
    return html`
      <div
        class="list ${this._receded ? 'dimmed' : ''} dir-${this._navDir}"
        @animationend=${() => {
          this._navDir = 'none';
        }}
      >
        ${days.map((d) => {
          const evs = eventsForDay(all, d).sort(
            (a, b) => a.start.getTime() - b.start.getTime(),
          );
          return html`
            <div class="ld">
              <div class="ld-head ${sameDay(d, this._now) ? 'today' : ''}">
                <span class="dow">${this._fmtDowLong(d)},</span>
                <span class="dnum">${this._fmtDate(d)}</span>
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
                        @click=${() => (this._selected = ev)}
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

  private _renderSheet(): TemplateResult | typeof nothing {
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
      gap: 8px;
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
      gap: 10px;
    }
    /* On = the non-default setting, so a glance says the view has been
       reshaped from what the YAML asked for. Same inversion as today's cell. */
    .btn.on {
      background: var(--ssc-today-cell, #ededed);
      color: var(--ssc-today-cell-fg, #16161a);
    }
    /* Narrow chrome. The phone LAYOUT is still undesigned, but the header must
       not visibly break while it waits: the title has to fit, and the week pill
       is redundant next to a date range it would otherwise push onto its own
       line. */
    .narrow {
      padding: 13px 13px 14px;
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
      display: none;
    }
    .narrow .tools {
      gap: 7px;
    }
    .narrow .btn {
      width: 34px;
      height: 34px;
    }
    .narrow .btn ha-icon {
      --mdc-icon-size: 20px;
    }
    .titles {
      min-width: 0;
      flex: 1 1 auto;
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
    .picker {
      position: relative;
      display: inline-block;
    }
    .pick-btn,
    .pick-item {
      display: flex;
      align-items: center;
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
    .pick-name {
      font-weight: 700;
      white-space: nowrap;
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

    .pill {
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.3px;
      padding: 3px 9px;
      background: rgba(255, 255, 255, 0.14);
    }
    /* Finger-sized gaps. On the kiosk tablet these sat 3px apart and the wrong
       button got hit; 40px targets need real space between them, not just size. */
    .tools {
      display: flex;
      align-items: center;
      gap: 10px;
      flex: 0 0 auto;
    }
    .btn {
      display: grid;
      place-items: center;
      width: 40px;
      height: 40px;
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
    .btn.off {
      opacity: 0.3;
      pointer-events: none;
    }
    .btn ha-icon {
      --mdc-icon-size: 23px;
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
    .ev.rev .ev-time {
      font-size: 12px;
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
    .hbar {
      position: absolute;
      left: var(--rday-w);
      right: 0;
      bottom: -3px;
      height: 6px;
      pointer-events: none;
    }
    .hthumb {
      position: absolute;
      top: 0;
      height: 6px;
      border-radius: 3px;
      background: rgba(255, 255, 255, 0.42);
    }

    .rgrid.dir-fwd .rframe,
    .list.dir-fwd {
      animation: inFromRight var(--ssc-week-dur) var(--ssc-week-ease) both;
    }
    .rgrid.dir-back .rframe,
    .list.dir-back {
      animation: inFromLeft var(--ssc-week-dur) var(--ssc-week-ease) both;
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
    @keyframes inFromRight {
      from {
        opacity: 0;
        transform: translateX(28px);
      }
    }
    @keyframes inFromLeft {
      from {
        opacity: 0;
        transform: translateX(-28px);
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
      display: flex;
      align-items: baseline;
      gap: 8px;
      padding: 6px 10px;
      margin: 0 -10px 4px;
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
      animation: sheetIn 460ms var(--ssc-block-ease) both;
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

    @media (prefers-reduced-motion: reduce) {
      .ev,
      .lr,
      .sheet,
      .scrim,
      .grid.dir-fwd .body,
      .grid.dir-fwd .hdr,
      .grid.dir-back .body,
      .grid.dir-back .hdr,
      .rgrid.dir-fwd .rframe,
      .rgrid.dir-back .rframe,
      .list.dir-fwd,
      .list.dir-back {
        animation: none;
      }
      .btn.spin ha-icon {
        animation: none;
      }
      .ev-in {
        transition: none;
      }
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
