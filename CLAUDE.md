# CLAUDE.md — working notes for AI agents

Guidance for Claude Code (or any AI agent) continuing work on this card. It records the
architecture and, more importantly, the **non-obvious decisions and dead ends** that are not
visible from the code, so a later session does not rediscover them the hard way.

## What this is

`simple-schedule-card` — a Home Assistant Lovelace card drawing a whole week of calendar
events as a proportional time grid. Lit 3 + TypeScript, built with Vite into a single
self-contained ESM file. No calendar library, no chart library: the grid is CSS grid plus
absolutely-positioned blocks.

## Layout

```
src/card.ts                  the card — config, render, styles, formatting
src/types.ts                 config and event shapes
src/data/week.ts             week windows, the time axis, event parsing
src/data/lanes.ts            column assignment
src/data/colors.ts           per-calendar colour resolution
src/data/calendar-source.ts  the WebSocket subscription
tests/                       vitest over the four pure modules
dist/simple-schedule-card.js the built bundle. COMMITTED on purpose (HACS installs it).
```

The four `src/data` modules are pure and tested. Keep them that way — the lane packing in
particular is where subtle bugs live, and it is far cheaper to catch in vitest than in a
browser.

## The thing to understand first

**The subject is the WEEK, not the next few events.** Every stock and HACS calendar card was
tried and rejected before this was written, and the blocker is structural rather than
cosmetic: they are all "upcoming" lists anchored on now, so on a Wednesday they cannot show
you Monday. A school timetable on a kitchen tablet is exactly the case they cannot serve. If
a change makes the card more about "what's next" than "what the week looks like", it is wrong.

**The grid is a uniform lattice.** In the user's own words: *"Monday 6am to 8am with events on
it should be the same size as Friday, same slot, without any events on it."* Identical column
widths, one shared time scale, and a column subdivision resolved once for the whole week and
applied to every day alike.

This is **not** a rule that geometry may never derive from the data — an earlier draft
over-read it that way and pinned the axis and the lane count to config, which was corrected.
`day_start: auto` and the `days` toggle are both legitimate. The rule is that when the geometry
changes, **everything rescales together**. Never let one crowded day change only its own column.

## Non-obvious decisions

### The axis is proportional, and that was a real choice

Three models were considered: a fixed hourly grid (the obvious one), period rows derived from
the distinct start/end pairs in the week, and a proportional axis. The timetable this was built
for starts periods at 07:40, 08:30, 09:30, 10:20 with an hour of lunch, so a fixed hourly grid
misaligns every single block — it was rejected on sight. Period rows match the printed
timetable exactly and waste no space, but one afternoon activity at an odd time adds a whole
row across every day, and they cannot express duration at all. Proportional survives arbitrary
afterschool activities, which is the direction this is growing.

### Grouping is by SOURCE CALENDAR, never by summary or by time gap

An earlier draft had a `merge_adjacent` option that merged back-to-back events with the same
title within a gap tolerance. That was a misreading and is gone. The intended model: each kind
of activity gets its own calendar entity (`calendar.alex_school`, `calendar.alex_gymnastics`,
…), and the entity is the grouping key. Do not reintroduce title matching or gap tolerances.

`by_source` resolves the widest sub-division any single calendar needs anywhere in the week and
gives **every** calendar that many sub-columns. Giving each calendar only what it needs would
break the lattice.

### Touching events share a column, overlapping ones do not

`packSubColumns` frees a lane when `laneEnd <= ev.start`. Back-to-back lessons (08:30–09:15
then 09:30–10:15) and exactly abutting ones (11:05–12:05 then 12:05–12:50) are a *sequence*,
not an overlap, and must stack in one column. Using `<` instead would put every consecutive
lesson in its own column and halve the width of the entire grid. Covered by tests.

### The subscription pushes; it does not poll

`calendar/event/subscribe` takes a fixed `{entity_id, start, end}` window and the entity pushes
a fresh list on every state write, debounced 1s server-side. There is no interval anywhere in
this card except the 30s tick that moves the now-line.

The push payload is the **flat** shape from `CalendarEvent.as_dict()` — `start` and `end` are
plain ISO strings. The REST view `/api/calendars/<id>` returns a **different**, nested shape
(`{"dateTime": ...}`) via `_api_event_dict_factory`. The two are not interchangeable; this card
only ever speaks the flat one.

Window strings are sent as **naive local ISO**, no zone suffix. The backend validates with
`cv.datetime` then applies `dt_util.as_local()`, so a naive string is read in HA's own zone —
which is what a timetable means by "Monday morning". Sending a UTC 'Z' string shifts the window
by the offset.

### Google is a 15-minute cache and no card can shorten that by asking differently

`CalendarSyncUpdateCoordinator` has `MIN_TIME_BETWEEN_UPDATES = 15 minutes`, and its
`async_get_events()` returns from `self.data` — the local cached timeline, never a live API
call. REST, the `calendar.get_events` service and the subscription are all equally stale.
Do not "fix" perceived staleness by switching transports; it will not help.

The only lever is `homeassistant.update_entity`, which reaches
`CoordinatorEntity.async_update` → `coordinator.async_request_refresh()`, whose debouncer is
`immediate=True`. It is wired behind `force_refresh`, deliberately **off by default and
lightly tested** — the user explicitly deprioritised it for v0.1.0.

### Calendar colour is in entity-registry OPTIONS, not in `hass.entities`

`CalendarEntity.initial_color` writes `{"calendar": {"color": …}}` into entity registry
options, fed from Google's `backgroundColor`. It is **not** in the display dict the frontend
preloads — `_as_display_dict` special-cases only `sensor` options — so `hass.entities` will
never have it. Fetch it with `config/entity_registry/get_entries`, which returns `extended_dict`
(including `options`) and carries **no** `@require_admin`, so a non-admin kiosk user can call
it.

`get_initial_entity_options()` runs only at **initial registration**, so calendars added before
that HA release have no colour at all. The palette fallback is not optional decoration.

The colour is validated against `/^#[0-9a-f]{6}$/i` before use because it is interpolated
straight into a style attribute.

### `:host { display: block }` is load-bearing

Custom elements default to `display: inline`, and inline boxes measure width 0 in a
ResizeObserver — which would wedge `layout: auto` permanently in list mode. The layout switch
is the same mechanism as `unifi-protect-timeline-card`.

Unmeasured first paint renders the **grid**, not the list: this is a tablet card first, and a
grid-to-grid settle beats a visible list-to-grid flip.

### Build config

`vite.config.ts` sets `esbuild.tsconfigRaw` with `experimentalDecorators: true` and
`useDefineForClassFields: false`. This is **load-bearing**: without it esbuild compiles Lit 3's
`@customElement`/`@property`/`@state` as TC39 standard decorators and the card dies at runtime
with "Configuration error". `rollupOptions.external: []` bundles lit, because HA does not
reliably expose bare specifiers to dashboard resources.

**Never put a backtick inside a comment in the `css` template literal.** It terminates the
literal and the error surfaces hundreds of lines away. This has broken sibling cards in this
config four times.

### The visual rules are not negotiable defaults

v0.1.0 was built in the house minimal style — translucent white panels, 12px grey captions —
and was rejected outright: *"too small and extremely hard to read... the greyish background,
ewww."* Three rules came out of that and must survive future edits:

1. **Sit on the theme's card background.** `var(--ha-card-background)`, the same fill every
   other card uses. Do not float a translucent panel on the page background — on this theme
   (`ha-card-background: rgb(32,27,37)` over `background-color: rgb(50,46,68)`) it renders a
   muddy grey.
2. **No grey text. Ever.** Every string is full-strength `--primary-text-color`. Importance is
   carried by **size and weight only** — a subject name is 17px/700, its time 13px/400. At
   arm's length on a wall tablet, dimmed text reads as unreadable rather than as secondary.
   `--ssc-dim`/`--ssc-dimmer` were deleted rather than left unused so they cannot creep back.
3. **Err large.** This is read from across a room, not from a desk. When a size is in doubt,
   the bigger one is right.

Column banding (`--ssc-band`, 4% white on alternate days) exists so the eye tracks along a row.
Keep it faint: strong enough to read as two kinds of day is worse than none.

v0.3.0 added three more, from the same user, in the same spirit:

4. **Square. Everywhere.** No `border-radius` on anything — card, blocks, buttons, chips,
   sheet, legend swatches. If you add an element, it is square.
5. **No transparency on event blocks.** They are the calendar's colour at full opacity. Because
   those colours come from Google and range from pale lilac to near-black, the label colour is
   picked per block by `readableOn()` (WCAG relative luminance) rather than fixed to white —
   white on `#cd74e6` is a 2.9:1 contrast and unreadable.
6. **No current-day or current-time markers at all.** No now-line, no today tint, no accent on
   today's header. `show_next`-style "what's happening now" affordances were explicitly not
   wanted; the card shows a week, flat.

7. **Event labels are always white.** v0.3.0 briefly picked black or white per block by
   luminance; the user asked for plain white and that is settled. The consequence is handled at
   the FILL end instead: `min_contrast` (default 4.5) darkens any fill until white reads on it.
   Do not reintroduce per-block text colour, and do not "fix" washed-out blocks by lightening —
   Google's palette assumes dark text (white on Flamingo is 2.9:1, on Banana 1.6:1), so the
   fill is what has to move.

### Never invent content

An early test config shipped with a **guessed** `subject_names` mapping (`Vv: Art`, `M: Maths`,
…) baked in, which put invented English subject names on screen over the real Czech ones. The
user's reaction to seeing "Art" where their calendar says "Vv" was unambiguous, and the whole
option was then removed at their request. The card renders what the calendar says. Do not add
glosses, translations, icons-by-keyword, or any other inferred content.

### Per-event colour: recovered by the pyscript helper, NOT by any HA API

Google returns a `colorId` on every event and `gcal_sync` parses it onto its model. Home
Assistant then throws it away: `_get_calendar_event()` in `components/google/calendar.py:516`
constructs `CalendarEvent` from exactly eight fields (start, end, summary, description,
location, uid, recurrence_id, rrule) and `CalendarEvent` has no colour field at all. Neither
the REST view nor the subscription can carry what the dataclass cannot hold.

No transport change fixes that — REST, the subscription and `calendar.get_events` are all fed
by the same dataclass. **Do not go looking for an API that exposes it; there isn't one.**

What HA *does* do is persist the colour with the synced event, in
`.storage/google.<entry_id>`, serialised as `color_id` (snake_case — grepping for `colorId`
finds nothing and wrongly suggests the data is absent). `pyscript/simple_schedule_colors.py`
reads it back out of that store and publishes
`/local/simple-schedule-card-data/event-colors.json`; the card fetches it and prefers it over
calendar-level colour. No Google API calls and no credentials: the data is already on disk.

The helper is optional by design. A missing file is the normal "not installed" case — never log
it as an error, never let it break rendering.

Two traps that cost real time here, both now handled in the helper:

* Google returns a calendar's **palette index** in the colour field unless the request sets
  `colorRgbFormat=true`, which gcal_sync never does. `#000001`/`#000005`/`#000008`/`#00000a`
  are ids 1/5/8/10, and writing them literally paints four calendars black. Resolve them
  through the calendar palette from `colors.get`.
* The widely-published Google event-colour hex table is **wrong** for this account: the live
  endpoint returns `#ff887c` for Flamingo, not `#e67c73`. Always prefer `colors.get`; the
  table in the helper is a fallback only.

**Read `pyscript/simple_schedule_colors.py`'s own header before editing it.** An earlier version
recursed every node of the 3.4 MB store on a `cron(* * * * *)` trigger and took Home Assistant
down: pyscript walks an AST rather than executing Python, runs piled up on each other, and a
core sat at 100% until the container was restarted. Navigate the known path, keep the interval
long, hold the `_RUNNING` guard, and measure natively before scheduling anything.

## Conventions

- `getStubConfig()` and the README option table must both list **every** option with its real
  default. Defaults live as `?? <default>` at the point of use, sourced from the `DEFAULTS`
  object.
- Bump the resource `?v=` after **every** rebuild. Bumping alone is not sufficient — HA caches
  the resource list, so a cache-ignoring reload is needed, and any browser verification must
  **assert the loaded bundle URL contains the expected version first**. Skipping that check has
  produced falsely passing tests in this config.
- No `backdrop-filter`. Per-card blur was removed across the whole parent config as a kiosk
  performance hog.
- Animate transform and opacity only, and pair every animated rule with
  `@media (prefers-reduced-motion: reduce)`.

### Two sizing traps that have already cost a session

**The transposed grid overrides the generic block styles.** `.ev.rev .ev-time` sets its own
font size, so editing the generic `.ev-time` rule looks right in the diff and changes nothing
on a `days-as-rows` card. Check which orientation you are actually looking at before changing a
block style.

**Absolute pixel floors break the adaptive layout.** `view_width_mode: adaptive` positions
everything in percentages; a floor stated in pixels means a different length of TIME at every
scale. The block width floor was 40px, which is invisible at 192px/hour (a 45-minute lesson is
144px) and catastrophic over a whole day in adaptive, where 40px is nearly fifty minutes: it
fired on every ordinary lesson, painted 29 of 34 blocks wider than their duration, overlapped
abutting events, and ate the gaps between lessons. Floors along the time axis belong in
MINUTES, converted through `pos()` so they land in px or % as the mode requires.

Relatedly, block labels are sized by **container query**, not by mode: each `.ev` is its own
container and drops its time line below 90px, because the time is 65-80px of digits and cannot
fit a 36px block at any font size — and leaving it there truncates the name as well. Use
`text-align` for that, never `align-items: center`, which sizes the label to its content and
leaves a long name overflowing the block on both sides so you read its middle.

## Not done yet

- **Editing.** v1 is read-only by decision. The Google config entry is already
  `calendar_access: read_write`, so create/update/delete is viable.
- **The phone view.** The list renderer exists so the card is not broken on a narrow screen; it
  has had no design pass.
- **Weekends.** `days: mon-sun` works, but nothing has been tuned for it and the user
  explicitly parked it.
