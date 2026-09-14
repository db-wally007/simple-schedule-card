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

### Three weeks are subscribed, and the cache is additive

`_subWindow` spans the week on screen plus one either side, and
`CalendarSubscriptions` **accumulates**: a push replaces only what it overlaps and leaves
everything outside its window cached. Both halves are needed. A one-week window meant that
stepping the week re-subscribed to a span nothing was cached for, so the calendar sat empty for
the second or two until the push landed — very visible when clicking through weeks quickly.
Widening the window alone would not have fixed it either, because the old code replaced the whole
per-entity list on every push.

The contract, covered in `tests/calendar-source.spec.ts`: a push is the complete truth **for its
own window only**, so an event it no longer contains is deleted, and weeks fetched earlier
survive. A failed push (`events: null`) leaves the cache alone — the last good answer beats a
blank grid, and `failed` is what marks it stale. `clear()` exists so the refresh button cannot
show a week it did not just re-fetch.

Because the cache spans three weeks, anything that reasons about ONE week has to filter — by day
via `eventsForDay`, or by range. `render()` does this before `axisBounds`, which would otherwise
scale the axis to three weeks of events.

### The week change is two halves, and the fade-out has to be imperative

A CSS `.dir-*` rule can only animate a week **in**, because the old week's DOM stops existing the
moment the state changes. So `_navigate` animates the outgoing content out with WAAPI, and only
then applies the change; the arriving week gets the CSS slide plus a re-run of the cell cascade
(`_animEpoch++` — Lit reuses the row and block elements, and a CSS animation only restarts on a
change of NAME). Measured end to end: fade out 0–235ms, swap, slide and fold in to ~790ms, cells
cascading top to bottom to ~1.2s.

**Two traps, both of which have bitten:**

- `fill: 'forwards'` on the out-half keeps holding `opacity: 0` over the element the new week
  renders into. It must be cancelled in the `updated()` that follows the change, never left to
  expire.
- Cancel the *right* animation. The first version kept a boolean "cancel what is in `_navAnims`"
  flag, but a click arriving mid-fade commits the pending change and starts a new fade **in the
  same tick**, so by render time the flag cancelled the animation that had only just begun. Its
  commit never ran, the week stayed put, and the next click flushed it — every navigation one
  click behind, permanently, because the fault re-armed itself each time. Finished fade-outs now
  move into a separate `_staleAnims` list, and only that list is cancelled.

### Reduced motion is gated on a CLASS, not on a bare media query

`.panel.reduce` carries the "hold still" rules, and `_reducedMotion` decides when it goes on:
`animations: auto` (default) reads `prefers-reduced-motion`, `always` overrules it, `off` forces
it. As a bare `@media` block there was no way back in — a Windows machine with *Settings →
Accessibility → Visual effects → Animation effects* off reports reduce, and the card lost its
week transition AND its refresh spinner with no config that could say otherwise, while the same
dashboard animated normally on a Mac. Both dashboards in the parent config now set
`animations: always`.

Any new animation needs its selector added to that `.panel.reduce` list — a rule that is not in
it will keep running when the card has been asked to be still.

### The horizontal scrollbar is a real control, not an indicator

`.rscroll` hides the native bar (`scrollbar-width: none`) and `.hbar`/`.hthumb` are drawn in its
place. That was `pointer-events: none` for a long time, which is fine on a touch kiosk where the
content is dragged directly, and bad anywhere with a mouse: a thing shaped exactly like a
scrollbar that cannot be grabbed is worse than none at all. It now drags, and a press on the
empty track jumps the thumb to the pointer and continues as a drag.

Two things to keep right if it is touched: the thumb's travel is `track width − thumb width`,
not the track width, or the mapping drifts as the thumb gets wider; and the 16px `.hbar` is a
grab target with the 6px rail drawn inside it via `::before`, so don't collapse it back to the
rail's height.

### Google is a 15-minute cache and no card can shorten that by asking differently

`CalendarSyncUpdateCoordinator` has `MIN_TIME_BETWEEN_UPDATES = 15 minutes`, and its
`async_get_events()` returns from `self.data` — the local cached timeline, never a live API
call. REST, the `calendar.get_events` service and the subscription are all equally stale.
Do not "fix" perceived staleness by switching transports; it will not help.

The only lever is `homeassistant.update_entity`, which reaches
`CoordinatorEntity.async_update` → `coordinator.async_request_refresh()`, whose debouncer is
`immediate=True`. It is wired behind `force_refresh`, deliberately **off by default and
lightly tested** — the user explicitly deprioritised it for v0.1.0.

### Writing to a calendar goes around Home Assistant, not through it

`pyscript/simple_schedule_edit.py` talks to the Google API directly. That is not a shortcut — HA
genuinely cannot do it. The `google` integration declares `CREATE_EVENT | DELETE_EVENT` and has
no `async_update_event` at all, so core's `calendar/event/update` websocket command refuses with
"Calendar does not support event update". `supported_features: 3` on the entities is exactly
those two bits. On top of that the `calendar.create_event` SERVICE has no rrule field, so it
cannot make a recurring event, and nothing in core can set a colour.

The helper reuses the integration's own credentials — token from `core.config_entries`, client
id/secret from `application_credentials` — so there is no second authorisation and it acts as the
same account the integration reads back as.

Resolution chain, all of it verified: `entity_id` → entity registry `unique_id` → strip the
config entry's `unique_id` (the account email) **by length**, not by splitting on the first
hyphen, because an address may contain one and a wrong split edits the wrong calendar.

Recurring scope is the part that matters for a timetable:

- `instance` PATCHes the occurrence's own id (`<master>_<utc stamp>`).
- `series` PATCHes the master.
- `future` has no Google operation behind it. What Google's own UI does, and what this does, is
  cap the existing series with an `UNTIL` one second before the occurrence — and for an edit,
  start a NEW series from it carrying every field the edit did not mention. So a future-scoped
  edit produces a new event id, exactly as it does in Google Calendar.

**An RRULE cannot be capped before its own DTSTART.** Google keeps the starting occurrence
whatever `UNTIL` says, so "this and future" from the FIRST occurrence left exactly one event
standing — found by testing, not by reading. Both services now check `_is_first_occurrence` and
fall back to acting on the whole series, which is what the user meant anyway.

A series edit correctly leaves an already-detached occurrence's own time and colour alone, and the
cap survives a DST boundary (a 15:00 series stays 15:00 local across the October change). Both
measured.

**Two pyscript traps, both hit while building this:**

- `task.executor` **refuses functions defined in a pyscript file** ("pyscript functions can't be
  called from task.executor") because they are AST objects, not real Python. Only natives like
  `glob.glob` can be handed to it. So blocking work cannot simply be pushed off the loop: network
  I/O uses HA's own aiohttp session and is awaited, and store reads are done inline, as
  `simple_schedule_colors.py` already does.
- A naive local time is rejected by Google — "Missing time zone definition for start time" — and
  the obvious fix, `.astimezone()`, resolves against the CONTAINER's clock rather than Home
  Assistant's. Send the naive time plus an explicit `timeZone` of `hass.config.time_zone`.

`calendar.get_events` returns `recurrence_id` in exactly the shape these services take as
`event_id`, and the card's `ScheduleEvent.recurrenceId` already carries it.

### Clearing a colour is a THIRD state, not the absence of one

`color_id` has three meanings on the wire and the card must send all three. Set is itself.
**Cleared is an empty string**, which the service turns into a `colorId: null` that removes the
field. Untouched is omitted, so editing a title cannot restate somebody's colour as a side
effect. The first cut had only two — `draft.colorId ? {...} : {}` — so picking the empty swatch
sent nothing, which Google reads as "leave the colour alone": the form said so, the save reported
success, and nothing changed anywhere. There was no way to undo a colour at all.

**The colour is sent only when it MOVED**, and for a sharper reason than tidiness. The form shows
the colour an occurrence INHERITS from its series, so a save that re-sent it would pin that
inherited colour onto the occurrence as its own: nothing looks different, and then recolouring the
series quietly leaves that one behind. `colorIdWas` is remembered on the draft rather than
re-derived at save time, because `_colorIdFor` reads the helper's map and the helper republishes
on its own schedule — asking it again later can answer differently for reasons that have nothing
to do with the user.

Title, times, location and notes are still sent on every save, and that is fine: they come
straight off the event rather than being inferred from something else, so re-sending them is a
true no-op. Colour and recurrence are the two that are guesses or have legality rules attached.

**Clearing an occurrence's colour does not fall back to the CALENDAR.** It falls back to the
series, which may itself be coloured — measured: a cleared occurrence of a Basil series comes
back Basil, not the calendar's pink. The swatch used to be labelled "Calendar's colour", which
promised something the card then visibly did not do; it says **Default** now.

**A colour change needs a longer settle than a content change**, because it travels a longer
chain: Google, then Home Assistant's store, then the pyscript helper's next run, then a JSON file,
then a fetch. Measured after a clear: about six seconds, which is exactly where the shared
`WRITE_SETTLE_MAX_MS` sat — so whether the form waited long enough was a coin toss, and half the
time it closed on the old colour. `WRITE_SETTLE_COLOUR_MS` is separate for that reason.

### A sheet that does not scroll still has to own the gesture

The bug: on a phone, dragging the edit sheet scrolled the WEEK BEHIND IT — but only while the
form was short enough to fit. Open one fold and the same drag in the same place scrolled the form
instead. A box with nothing to scroll is not a scroll container in any meaningful sense, so the
touch goes straight through it.

Two mechanisms, because there are two different cases and neither covers the other:

- `overscroll-behavior: contain` handles a box that IS scrolling and has reached its end. By then
  the gesture belongs to the compositor and `preventDefault` is ignored — the event is no longer
  cancellable — so only the CSS can stop the chain.
- `_onDragMove` handles a box with nowhere to go at all, by cancelling the touch. Nothing is
  overscrolling there, so `overscroll-behavior` never comes into it.

The cancel is also the hook for the rubber band, which is the honest answer to the user's actual
question — "is this thing stuck, or is my finger not working". Give is
`RUBBER_MAX_PX * (1 - exp(-|dy| / RUBBER_SOFT_PX))`: it tapers, so pulling three times as hard
does not move it three times as far. Verified: 60px of pull gives 15px, 200px gives 36px.

Two things to keep right:

- The offset is written straight to the element, never through state. This runs on every
  touchmove, and re-rendering the card sixty times a second to move one box is not a trade worth
  making. The `springing` class is added only on release, so the spring is the one animated part.
- Both `.sheet` and `.recmodal` had to move from `animation-fill-mode: both` to `backwards`.
  Fill `both` pins the end state after the entry animation, which outranks the rubber band's
  transform and leaves the sheet unable to move. The event blocks learned this one first.

The custom-recurrence window scrolls its BODY, so the handlers sit on the window and resolve the
scroller with `_dragScroller` — a body sliding under its own header looks like a broken layout.

### A write is not finished when Google says so

Closing the form the moment the service returned handed back the UNCHANGED week for three or four
seconds — long enough to read as a failed edit — because a write travels Google → Home Assistant →
card and only the first leg had happened. The form now stays up, still saying Saving or Deleting,
until the change is actually on screen: `_settleAfterWrite` re-fetches on a slow beat and compares
`_viewFingerprint()` on a fast one, because those are two different questions (has Google
propagated, and has the push arrived). Measured after: create closes 201ms after the block
appears, an edit 161ms, a delete 41ms.

Three things it gets wrong if they are touched:

- **The fingerprint must be taken BEFORE the service call.** The pyscript services re-poll Home
  Assistant before returning, so by the time a write resolves the push has often already landed —
  and a fingerprint that already holds the answer never changes. That version waited out the full
  timeout on every save; measured at 7s, worse than the bug it was fixing.
- **Re-subscribing alone only re-reads what Home Assistant already has.** A DELETE lagged Google
  by nine seconds that way, while an edit took 1.6s; `forceUpdate` (update_entity) first is what
  makes the two behave alike.
- **Never `clear()` the cache first.** An empty cache makes the fingerprint change to "nothing at
  all", which reads as the answer arriving, and the form closes on a blank week.

Colour is in the fingerprint, so a colour-only edit is noticed too — but the colour map is a file
a helper republishes, so `colourChanged` also has to re-run the helper inside the loop. Without
that the loop has nothing to see and times out.

`_callEdit` deliberately does NOT clear `_busy`; the callers own it, because the write landing is
not the end of the job and dropping the flag in between flicks the button back to Save for a
frame.

### NEVER measure through an animation — the third freeze, and the real one

The cascade scales each cell as it arrives, and `getBoundingClientRect` reports the **transformed**
box. Caught in the act: across successive passes the same date band measured
`31.8 → 32.5 → 33.1 → 33.5` and the same event row `17.3 → 17.7 → 18.0 → 18.3`, with `fit` flipping
4↔3 and `tight` false↔true as it went. Every frame a different `fit`, every `fit` a re-render, and
three taps on the arrow chain the animations so it never stands still — a tab that spins until the
cascade happens to finish, which on a loaded machine is never.

`_measureMonth` now checks `body.getAnimations({subtree: true})` and, if anything is running,
parks itself on `Promise.allSettled(running.map(a => a.finished))` instead of measuring. Deferring
rather than reading `offsetHeight` because the fitting needs the subpixel truth: rounding a row to
18 where it is 18.3 puts four of them in a cell that holds three and a bit.

**Deferring the measurement created a JOLT**, and the cure is the probe frame. With measuring
postponed until the cascade finished, the first paint used the guessed `_monthFit` of 3 and then
visibly reshuffled — three events per cell becoming two and a "5 more", every cell changing height.
So when `_monthLaidOut` does not match the shape being drawn (`rows|calendar`), `.mbody` renders
one PROBE frame: laid out, `visibility: hidden`, `animation: none !important` (the cascade puts
`animation-name` inline, where a plain rule cannot reach it). It is measured there, unanimated and
unseen, and only then revealed to animate in at the right size.

**The probe reveals on a pass that changes NOTHING**, not after a single measurement. Revealing
after one was not enough: stepping from a five-row month to a six-row one measures against the
height the old shape left behind, so the first answer can be a row out and the correction happens
in front of you. A height change alone does not re-render — it is a style write — so `_measureMonth`
asks for the next pass itself; `_monthSeen` caps how many heights may be tried, so it terminates.
Verified across six months at 720px: each appears once, with one content, and never corrects
itself.

**This is the same lesson `_fitDayPeek` already carried** ("the entry animation scales from 0.9 and
a transformed rect corrects against a size the panel is about to stop being") and it was not
carried across. If you add ANY measurement to this card, decide first what it does while the thing
it measures is moving.

Verified at 860px and 720px: every burst — 3 clicks, 20 clicks with no pause, 20 back plus 20
forward — costs **exactly one** real measurement, yielding one `fit`, one `tight`, one height.
15 of 16 passes skip as animating. Idle measures zero times.

### `_measureMonth` FEEDS ITSELF — the second freeze

Distinct from the subscribe storm below, and diagnosed by the fact that **Home Assistant was
perfectly healthy** (sub-millisecond HTTP, no websocket errors) while the browser tab died. No
network traffic to explain it means the loop is entirely in the frontend.

`room` comes from `body.getBoundingClientRect().top` — but the body MOVES when the grid's own
height changes, because the card sits in a popup that reflows around it. So the measurement is an
input to itself. Observed settling from one paging burst:

```
635 → 610 → 488 → 625 → 615 → 625 → 635     body.top: 208.8 → 206.5 → 204.1 → 204
```

It is negative feedback so it usually converges — but 488 is a *two-row* cell height where 635 is
a four-row one. A height that keeps landing on a different `fit` re-renders the card, which
measures again, for ever.

The fix is `_monthSeen`: every height proposed since the last real change is remembered, and
meeting one again means a cycle rather than progress, so the **smallest** is taken — always safe,
never the 488 that would have changed what fits. `_resetMonthSettle()` clears it on the things
that legitimately move the answer (navigation, resize, calendar switch, mode toggle) and on
nothing else — that is the whole point. Verified at 860px and at the fragile 720px (where `fit`
and `tight` both sit on a boundary): 30 rapid clicks settle in ≤13 passes, idle measures **zero**
times, 0 cells clipped.

**The general rule: never derive a layout input from a position the layout output can move.** If
you must, bound it by remembering what you have already tried.

### The card CAN take Home Assistant down — through `calendar/event/subscribe`

It happened on 2026-09-14: stepping the month ten times in quick succession wedged HA
(`python3` pegged, HTTP dead, and the frontend's websocket dropped with
`Client unable to keep up with pending messages. Reached 4096 pending messages`). The card is
frontend JavaScript and cannot block HA's event loop directly — but every `sync()` asks HA to
**expand months of recurrences for every calendar** and push the lot back, and that work runs on
the same event loop that serves the websocket. Enough of those and the frontend starves.

Two compounding faults, both now fixed and both covered by tests in `calendar-source.spec.ts`:

- **`sync()` was re-entrant.** The early-out tested `key === _key && subscribed`, but `_key` is
  set several awaits before the first subscription lands in `_unsubs` — so during that gap the
  guard saw the right key and `subscribed === false` and started the whole round again. The card
  calls `_ensureSubscribed()` from `updated()`, which fires on every state change in the house, so
  the gap gets re-entered constantly. **Measured: ten re-entrant calls produced 30 subscriptions
  instead of 3.** `_syncing` now holds the key for the whole in-flight round.
- **Every window passed through was subscribed to.** Ten taps on the arrow = ten rounds, nine of
  them for windows already gone. `_ensureSubscribed` now waits `SUB_SETTLE_MS` for a moved window
  to settle and subscribes only to the one landed on; an unchanged window still calls straight
  through to the (now correct) no-op.

**Rules for anything that touches this path:** never call `sync()` from a render hook without a
guard that survives its own await; treat a subscription as expensive backend work, not a cheap
client-side registration; and when adding per-render work, remember `updated()` runs on every
state change in the house, not on user actions.

Related: `_measureMonth`/`_fitDayPeek` no longer run on a bare `hass` update either — they force
synchronous layout, and none of those updates can move the grid. Window resize is handled by an
explicit listener, since the host `ResizeObserver` only watches width.

### Month mode is a SHAPE, not a zoom level

`calendar_mode: monthly` sits in the same option as `focused`/`full`, but it is not another
amount of day — it replaces the time axis with a week lattice. `_isMonth` therefore answers
BEFORE the orientation renderers, and it also requires `_mode === 'grid'`: below the layout
breakpoint the list wins, and `_isMonth` going false is what makes every week-shaped rule
(`_goWeek`, the pill, `_window`) quietly return to week semantics with no special cases.

Decisions that were made deliberately and should not be "tidied":

- **Seven columns divide the card.** This is the one place the card departs from
  `view_width_mode: fixed`, whose whole point is a constant px-per-hour that scrolls. A month you
  have to scroll sideways to finish is not a month.
- **Only the weeks the month touches** — `monthRows` — so four, five or six. An earlier version
  drew six always, reasoning that a grid changing height as you page makes the card jump. That
  reasoning was wrong, because of the next point: the rows share a FIXED total, so a five-row
  September simply has taller cells than a six-row August. Nothing moves; the month just stops
  showing a week of the next one. Verified live: Sep'26 5 rows / 129px, Aug'26 6 / 110px,
  Feb'27 4 / 161px, grid 645–660px throughout.
- **Month mode has NO size config**, and two options were deliberately deleted rather than
  retuned: `month_mode_max_events` and `month_mode_cell_height`. Both asked the YAML to state a
  number that only the rendered card knows. `_measureMonth` is the single pass that answers both —
  it reads the cell's padding, the date line, an event row and the row gap off the DOM, works out
  what a cell holding *n* rows would be, and derives the grid height and the event count together.
  Splitting it into two methods meant measuring the same four numbers twice and letting them
  disagree.
- **The cell is clamped in EVENTS, not pixels**: `MONTH_FIT_MIN`/`MONTH_FIT_MAX` (1 and 3), and
  the heights they imply are for **n + 1** rows, because "N more" is a row of its own and a cell
  sized for exactly three events has no room to admit there is a fourth. Measured live: Sep'26
  5 rows × 125px (at the cap), Aug'26 6 × 108 (filling, below the cap), Feb'27 4 × 125 (capped).
- **Filling the window and capping the cell genuinely conflict, and the cap wins.** A four-week
  month on a tall screen hits 125px a cell and leaves ~170px under the grid. That is the deal:
  a month cell that grows without limit stops being a summary and starts competing with the week
  grids. To trade it back, drop the `Math.min(maxH, …)`.
- **Ceil the per-row heights, floor the per-cell height.** The parts are subpixel — a row is
  18.3px — and a cap landing a fraction under what three rows need clips all three: that bug
  showed as 20 of 35 cells overflowing. The fit is then derived from the height the grid *has*
  (`_monthGridH / rows`), not the one just computed, because the write guard can leave the two a
  pixel apart and the events are laid out in the real one.
- `_measureMonth` writes `@state`, so a month measures on one paint and draws on the next. Both
  writes are guarded on the value CHANGING; without that the second render measures and schedules
  a third, forever.
- `MONTH_BREATHE_PX` is the remaining dial: the air held back at the foot of a cell. It is also
  the cell's `padding-bottom`, so the reserved space and the visible space are one number — do
  not split them.
- **A cell carries a bare number, right-aligned, in its own band; the HEADER names the day in
  full.** `_fmtDate` in the cells — "Sep 14th" in all thirty-five — was tried and rejected: it
  says the same thing thirty-five times and crowds the events out.
- **The header is `.rday` REBUILT, box and all** — and getting there took three goes, so do not
  "simplify" it back. Matching only the face (16px/700/−0.2px, full weekday name, "Monday," with
  the comma) was rejected twice: measured side by side the type was already byte-identical, and it
  still looked nothing like the reference, because `.rday` is a flex COLUMN that centres its label
  in a tall cell with air above and below, while `.mdow` was a 16px label crammed against the top
  of a 26px strip with `padding-top: 0`. The box is what carries the resemblance. `.mdow` now
  takes the column layout, the centring, the 10px/12px padding, the 1px gap, a `min-height: 36px`
  (=`.rday`'s two-line block: 18.4 + 1 + 16.1), the band on `.mhead`, and 1px column rules that
  line up with the cells. **When a "make it look like X" note keeps coming back, diff the BOX, not
  the font** — the computed-style dump that settled this is the tool. One thing it does NOT copy:
  `.rday` writes "Monday," and the header writes "Monday", because there a date follows the comma
  and here nothing does.
- **Today is marked in three places, all the same inversion**: the cell, the header column, and
  the day panel's title block. The header column is found with
  `days.findIndex(sameDay(d, now)) % 7`, off the DRAWN days rather than `getDay()` — that keeps it
  honest about Monday-first order and returns -1 when today is not on show, so paging to a distant
  month does not leave a weekday lit for no reason.
- The day panel's name and date live in one `.dp-title` wrapper whose negative margins cancel
  `.daypeek`'s padding, so today's fill reaches the panel edges instead of floating inside them.
  `.dp-close` takes `color: inherit` for the same reason `.mev` does.
- **The day panel's list keeps its 260px cap and padded rows.** Sizing it in whole rows — a fixed
  40px `.dp-row` and a max-height derived from it, so six always fit and seven always scroll — was
  built and REJECTED on how it looked. (If it is ever revisited: `.dp-row` needs `flex: 0 0 <h>`
  alongside the height, because flex items shrink by default and seven rows silently squeezed to
  34px each rather than scrolling.)
- **The day panel stays open behind the detail sheet, and recedes with the grid.** It used to
  close, so every event you looked at dropped you back to the month and a second event from the
  same day meant finding the cell again.
- **The panel's CONTENTS fade; its surface does not.** Two earlier attempts were wrong in the same
  place - a panel is not a cell. Fading the whole thing (`opacity: 0.1`) let the grid read straight
  through it; darkening the whole thing (`filter: brightness`) turned an already-dark surface into
  a black hole punched in the card - and both were shipped, because the check was a computed-style
  dump rather than looking at the screenshot. Keeping the surface at the card's own background and
  fading only `.daypeek > *` leaves a quiet empty panel: opaque, so nothing shows through, and no
  darker than its surroundings, so it is not a hole. The transform still needs `!important`:
  `peekIn` is a `fill: both` animation holding it at `none`.
- **Everything in the grid recedes, including `.mhead`.** The weekday row was left out of the dim
  rule and stayed at full strength - the one bright row in an otherwise receded month.
- **The detail sheet has a close button** (`.sh-close`, top right, absolute, with `.sh-name`
  padded clear of it). The scrim always closed it, but nothing said so.
- **The header recedes too** (`.head.dimmed`), and on `_sheetOpen` — NOT `_receded`. The picker and
  the tools menu both set `_receded` and both live inside the header, so using it there would dim
  the very menu just opened. Opacity is safe for the header where it is not for the panel: there
  is nothing behind it but the card.
- **`.btn.width-toggle.gone` keeps its SLOT** — it fades and slides but no longer collapses its
  width. Collapsing shrank the centred toggle group, which moved the mode button sideways every
  time the month grid came or went, so the control just tapped was no longer under the pointer.
  Measured 0px drift across two full focused→full→monthly cycles. The empty slot is invisible and
  costs nothing.
- **The period sits in the header's centre in MONTH MODE ONLY** (`_isMonth`), at 24px/600 — it was
  15px under the arrows on the right, which is where you go to CHANGE it rather than to read it.
  A week grid names its days in every column heading and needs no such sign, so it keeps the range
  where it always was; moving it everywhere was rejected.
- **The range hangs OUT OF FLOW off `.head-centre`'s LEFT edge** (`position: absolute; left: calc(44px + 16px)`
  — one button plus a gap), so it sits beside the mode button rather than after the whole group.
  As a flex sibling its width was part of what got centred, so the button slid every time the month
  name changed length. The goal is not that the button is dead centre — it is that the button does
  not MOVE, so toggling twice does not require chasing it.
- **The panel's time column shrinks to its content.** A fixed column that aligned every summary on
  the same x (plus a 360px panel) was built, shown, and rejected — it left a gutter between each
  time and its name. 268px and `flex: 0 0 auto`; do not "improve" this again.
- **A tap anywhere in a month cell opens the DAY, never an event.** The rows inside a cell are not
  links; the whole cell is one target and the day panel is where an event is chosen. Empty days
  open too — "nothing on this day" is an answer, and a cell that sometimes responds and sometimes
  does not is worse. This is why `.dp-row` is ~39px and zebra-striped: those rows are now the only
  route to an event, so they are sized as tap targets rather than as lines of text, and the band
  carries the eye from a time to its name across a gap whose width changes every row.
- Following from that, `.mev`/`.mmore` are `div`s with **no hover and no cursor of their own** —
  they were buttons, and a highlight on one event promises it can be tapped when it cannot. The
  pointer and the tap-highlight suppression live on `.mcell`, which is the actual target.
- `_pressDid` exists because of that: a completed press-and-hold also ends in a click, which would
  otherwise bury the creator the hold just opened under a day panel. Set when the hold timer fires,
  cleared on every `_pressStart`.
- **`_fitDayPeek` keeps the panel on screen, and has to run after render**, because the height
  depends on the day's event count — a seven-event panel is 343px against the 180px the old code
  guessed at, so a bottom-row cell opened a panel running off the window with events that could
  not be reached. It measures `offsetWidth`/`offsetHeight`, NOT `getBoundingClientRect`: the entry
  animation scales from 0.9 and a transformed rect corrects against a size the panel is about to
  stop being. Guarded on the position changing.
- **It clamps to the CARD ∩ window, not the window.** Clamping to the window alone was tried and
  was still wrong in both directions: 8px from the left edge of the SCREEN is underneath Home
  Assistant's sidebar, and the right edge overhung the card by ten pixels. What is visible is the
  card. Verified at eight positions including all four corners.
- **A cramped cell trims its breathing room — `MONTH_TRIM_PX`.** On a short window a cell floors
  near 99px, which fits two rows with 11px left over: one event and "4 more", with visible air
  under it, which read as a bug. The date band's lower margin (8px) and the cell's foot (8px) are
  handed back when doing so buys a whole row — never merely to be tighter — via a `tight` class on
  `.mbody`. Measured: 99px goes from 1 event + "4 more" to 2 + "3 more"; at 860px the roomy layout
  returns. **The measured overhead is NORMALISED back to the roomy figures** (`+ MONTH_TRIM_PX`
  when already tight) before anything reasons about it; without that each layout looks correct
  from inside the other and the grid flips every frame. Keep the CSS deltas equal to the constants.
- **Include the BORDER when fitting a month cell.** `.mcell` is border-box with a 1px rule, so its
  height is a pixel more than padding + content. Omitting it cost exactly one pixel, invisible
  until the date font grew by 1px — and then 20 of 35 cells clipped at once. Any change to
  `.mcell`'s box needs `_measureMonth` re-checked with `scrollHeight > clientHeight`.
- **The grid bleeds past the panel's inset** via `margin: 0 calc(-1 * var(--ssc-pad))`. That is
  why `.panel`'s padding is a variable now: the two must not drift apart. The week grids keep the
  inset; only the month reaches the card's edges.
- **Today inverts the WHOLE cell**, matching `.rday.today`. It was a pill around the number, which
  at arm's length is a dot rather than a day. This is why `.mev`/`.mmore` take `color: inherit`
  rather than `--ssc-fg`: a button does not inherit colour on its own, and the rows inside an
  inverted cell have to invert with it. The dots keep their own colours. Today can legitimately
  fall in an `out` cell — 30 September while October is on show — and is not dimmed there.
- The day panel is anchored to the cell and positioned against the GRID, not the viewport, so it
  travels with the card when the dashboard scrolls.

**`animations: off` did not work before this**, and the fix is worth knowing: `.ev`, `.lr` and
`.mcell` all carry `animation-name` INLINE — the staggered cascade needs a per-element delay and
an alternating name — and an inline declaration beats any selector. The reduce rules for those
elements need `!important`. Measured before the fix: cells reported `evInB` with reduce on.

### The repeat rule is READ from Home Assistant, not inferred

`CalendarEvent` carries `rrule` and the push has always included it — measured on a live week,
137 of 146 events. `RawCalendarEvent` declared it and `toScheduleEvent` dropped it on the floor,
which is why v2.0.0 could set a rule but never show one.

`parseRRule` is the inverse of `toRRule` and is deliberately forgiving in ONE direction: anything
it does not fully understand comes back **null**, never a half-read rule. That null is
load-bearing twice over — the detail sheet says nothing rather than something false, and
`canRepeat` hides the editor row rather than offering to overwrite a rule the user was never
shown.

**The line for what to refuse is "can Google's own dialog write it".** An earlier cut also
refused BYMONTHDAY and BYMONTH, which was wrong: Google writes both from its Custom recurrence
dialog, so perfectly ordinary monthly and yearly series came back null and the card went silent
about them. They are now read and written back verbatim, kept on the rule rather than normalised
into the start date, so an unrelated save cannot quietly restate somebody's rule. What stays
refused is what that dialog cannot produce and which therefore arrives only from imports and
other clients: BYSETPOS, BYYEARDAY, BYWEEKNO, sub-daily FREQ, a LIST of month-days, and
multi-positional BYDAY.

The monthly mode control in the custom window exists for the same reason. A monthly series
repeats on a DATE or on a weekday's POSITION, Google offers both, and without the control the
card could read "the second Monday" but never set or clear it.

**Normalise at the boundaries, never in the model.** `toRRule` and `sameRecurrence` each
normalise their own input; `_patchCustom` deliberately does not. The first cut normalised the
working copy on every touch, which meant glancing at the monthly options and coming back threw
away the five weekdays you had picked — and then, worse, `_repeatMoved` reported a change that
had not happened, forced the scope to the whole series, and would have rewritten it. A weekly
rule is also always given its own day explicitly (`_namedDays`), because bare FREQ=WEEKLY means
"the day DTSTART falls on" and only one of those two spellings survives a trip through the unit
picker.

**A singly-modified occurrence is DETACHED and carries no rule at all** — five of thirty-two on a
real school week. The series still has one and every sibling carries it, so `_seriesRule` falls
back to another event with the same uid. Without it the card says "Weekly on Monday" about most of
a series and nothing about the one lesson somebody moved, which reads as that lesson not
repeating.

**A rule belongs to the SERIES.** Google cannot give one occurrence its own, and a PATCH that
tries is rejected — so `_setRepeat` moves the scope off `instance` the moment the rule changes,
and the form greys that row out with a note rather than letting the save fail later. `future`
stays legal: `_split_series` caps the old series and starts a new one carrying the new rule.

The rrule is sent ONLY when it moved (`_repeatMoved`). Sending the unchanged rule on every save
would rewrite the series for a change of title; sending nothing when it HAS moved would drop the
edit silently. An empty string is the service's "clear it", which is what "Does not repeat" means
on an existing series — it collapses to a single event.

### Creating an event: one form, two entry points, and an exclusive end

`_openEditor` and `_openCreator` build the SAME `EventDraft`; `isNew` is the only difference, and
it is what hides Delete and picks `simple_schedule_event_create` over `_update`. Resist the urge
to fork the form — every fix to the pickers, the colour grid or the location field would then
have to be made twice.

**Google's all-day end is EXCLUSIVE.** An all-day event read back from Google already arrives that
way, so the edit path never noticed; a NEW event ticked all-day in the form has `endDate ==
startDate`, which Google rejects outright. `_saveDraft` bumps it a day when it is not already
past the start — only ever on the broken case, so the round trip is untouched.

Press-and-hold, not tap: a tap on a block already opens it, and on a wall tablet the grid is also
what the slate gets held by. `_pressStart` is gated on `_editMode` for the same reason edit mode
exists at all. Three things it has to do, all of which were needed in testing:

- ignore a press that lands on `.ev` (or a list `.lr`) — that is an event, not empty space;
- bind pointermove/up/cancel/scroll on the WINDOW, not the canvas, so a press that ends with the
  finger somewhere else still ends;
- cancel past `PRESS_SLOP_PX` of travel, or holding the card still while scrolling creates events.

**A day LABEL is a press target in every layout**, alongside the timeline itself: the cell down
the left of the transposed grid, the heading across the top of the other, the day heading in the
list. It means that day at the current clock time, which is what `labelPress` builds and
`_fitSlot` then trims.

The label and the timeline row beside it share a day INDEX, so the press records which `kind` of
surface it is on. Without that, pressing a day cell lit up its whole timeline row as well —
`_press.idx === i` was true for both.

**In the LIST the target is the day heading, and nothing else.** A list has no empty space to
press, so a press on the day block as a whole had to draw its feedback somewhere and ended up as a
stray outlined row at the foot of the day, pointing at nothing. The heading is a real thing to
press and can light up in place. That leaves the list with exactly two ways in: the heading and
the + in the header.

Two layout traps met while putting that overlay on the heading, both measured:

- An absolutely positioned child with `top: 0; bottom: 0` came out 6px short — the heading's
  bottom padding — while `height: 100%` filled the padding box exactly. Use the latter.
- `ha-svg-icon` inside `ha-icon` is `inline-flex`, so it rides a TEXT BASELINE: the + in the add
  chip measured dead centre by its box and sat 6px low by its ink. `line-height: 0` on the
  `ha-icon` is what removes the descender.

The two grids disagree about which axis is time, whether it is measured in px or %, and how tall a
row is, so each renderer hands `_pressStart` a `PressGeom` with its own arithmetic rather than
this code trying to reconstruct the layout from the DOM. The list has no time axis at all and
passes `span: 0`, which collapses to "that day at the current time".

The press rounds DOWN onto the 15-minute grid (you pressed a slot, you get that slot) while the +
button rounds UP (it names no time, and starting a quarter of an hour in the past is a worse
guess). Not an inconsistency.

**The ghost has NO minimum size, unlike a real block.** `MIN_BLOCK_MINUTES` exists so a five-minute
lesson is still readable; applied to the ghost it drew a five-minute SLOT twelve minutes wide,
reaching into the lesson after it. The draft underneath was right the whole time, but the outline
is the only thing anyone can see, so it read as "gaps under fifteen minutes do not work". Measured
after the fix: an 11.6px gap gets an 11px ghost, overlapping neither neighbour.

`_fitSlot` then fits the slot to its neighbours, and BOTH halves matter. Cutting the end at the
next event's start is the obvious half. Holding the START at the previous event's end is the one
that was missed first: snapping alone puts a press in the 9:15-9:30 gap back at 9:15, which is
inside the lesson before it whenever that ran to 9:20. Measured on the real timetable: the
five-minute gap between 10:15 and 10:20 gives exactly 10:15-10:20, and the fifteen-minute one
gives 09:15-09:30. `minsFrom(ev.start, dayStart)` is what scopes this to the day — events on
other days fall outside 0-1440 and drop out of both comparisons with no date check.

### Repeat rules live in src/data/recurrence.ts, and only apply to NEW events

RRULE arithmetic is either right or silently wrong a month later, so all of it — the presets, the
RRULE string, the words — is pure and tested rather than inline in the card. The presets are
generated from the event's OWN start: "Weekly on Tuesday" exists only because the event is on a
Tuesday, which is what makes the list read like Google's.

Traps that are in the tests because they are easy to get wrong:

- **UNTIL and COUNT are alternatives.** Google rejects an RRULE carrying both.
- **UNTIL's FORM depends on the series.** A date series takes a bare `YYYYMMDD`; a timed one takes
  UTC with a Z, and a local date-time is a 400. It is the END of the chosen day, so "ends on the
  8th" includes the 8th. The conversion runs against the BROWSER's zone, the same assumption every
  other date in the form already makes.
- **A fifth Tuesday is "last", not "fifth"** — a `BYDAY=5TU` series skips three months in four.
  `weekdayPosition` returns -1 for it, matching what Google offers for the same date.
- **BYDAY is written Monday-first**, like every other day list this card draws. Google's own
  dialog is Sunday-first; the card's convention wins inside the card.

The rule is only offered when CREATING. `_openEditor` sets `repeat: null` and the form hides the
row: changing a rule on a live series is a different operation, entangled with the scope question
sitting right above it, and a row that silently did nothing would be worse than no row.

**A modal is a SIBLING of the sheet, so it inherits nothing from it.** `--accent` is set on
`.sheet.editor`, and the custom-recurrence window needed its own copy — without it the chosen day
painted dark text on an unset background and disappeared. Same applies to anything else the sheet
defines.

Everything live in that window wears the accent — the chosen unit, the chosen weekdays, and the
NUMBERS. `.stepper.on` is what gates it: the occurrence count under an unselected "After" is a
number nothing is using, and painting it would say otherwise. A grey fill sitting directly above a
pink one reads as "disabled", which is the opposite of what a selection means.

**A row is the target, not the dot in it.** The Ends rows each carry a value control, so they are
divs with the click on the ROW — the radio is 24px of a 44px row and was for a while the only live
part of it. The stepper inside one MUST stop propagation: its own handler writes the new count and
the row's handler, running after it on the way up, would write the old one straight back over it.

### The inline picker opens in CSS and closes in script

The way IN was already there: `.ed-picker` opens its box on a plain ease while `.ed-picker > *`
drops in on the spring. Do not add a second opening animation — a script-driven one outranks the
CSS in the cascade and the two fight.

The way OUT has to be script, because a collapse starts from a height only measuring can know, and
because Lit drops a conditional element the instant its condition turns false. `_pickerClosing`
holds the panel mounted for the length of the exit; `_showPicker` is what the templates ask.
Everything that closes a picker while the FORM stays open goes through `_closePicker`; the
teardown paths clear both fields, since there is nothing left on screen to animate against.

Switching straight from one picker to another puts TWO on screen, one opening and one collapsing,
which is why each panel carries `data-field` and `_animatePicker` looks them up by it. A bare
`querySelector('.ed-picker')` returns whichever is first in the document, and half the time that
is the wrong one.

**A transform keyframe REPLACES a centring transform.** `.recmodal` was centred with
`translate(-50%, -50%)` and animated with a keyframe whose `from` set `transform: scale(...)
translateY(...)`. That drops the centring for the length of the animation, so the window began
each open with its top-left corner on the centre point and flew in from the bottom right. Fixing
it by repeating the offset inside every keyframe works and then has to be remembered for ever;
centring with a flex WRAPPER instead leaves `transform` free. The wrapper takes `pointer-events:
none` so a tap beside the window still reaches the scrim that closes it.

Its exit is the `_customClosing` pattern, the same shape as `_pickerClosing`: a flag that keeps
the window mounted for the length of the animation. `_closeCustom(apply)` is the one way out —
Done and Cancel differ only in that argument — while `_cancelCustom` is the teardown for paths
where the whole form is going anyway.

**Reflow inside a row is animated by WIDTH, not by transform.** "week" becoming "weeks" widens
that button, which widens the group, which — the group being right-aligned — shoves the stepper
left, all in one frame. Translating the boxes makes them glide while the container's border snaps
to its new size around them; animating the widths lets layout carry everything else, so the
stepper slides because the thing beside it is genuinely growing. `_flipCapture` before the state
change, `_flipPlay` from `updated()`.

Three details there, each of which produced a visible jolt on its own:

- Animate the BUTTONS only. `.seg` is inline-flex and sizes to its contents, so it follows them
  frame by frame; giving it a width of its own made it disagree with the sum of its children
  mid-flight and snap back into line at the end.
- End on an EMPTY keyframe — `[{width: from}, {}]` — so the last frame is the natural layout
  width. A measured endpoint is a fraction of a pixel off it, and that is a guaranteed hop.
- NOT the spring. Overshooting a width makes the row bulge past its destination and come back,
  and four buttons overshooting by four different amounts is a wobble rather than a settle.
  Springs belong on transforms, which cost no layout.

**`max-height` is a ceiling, not a height.** `.ed-fold`'s 320px is fine for three rows; the 680px
`tall` variant, needed when a month grid is open inside the Ends fold, opened the clip in 80ms of
a 360ms move when the fold held only its three rows. It is applied only while the grid is actually
there.

**A CSS animation only restarts when its NAME changes**, and Lit reuses the calendar cells across a
month step, so the cascade would play once and never again. `calDayA`/`calDayB` alternate on
`_calEpoch` — the same trick the event blocks use with `evIn`/`evInB`. The slide offset is a signed
custom property, so a month stepped forward comes in from the right and back from the left, and
the delay is per ROW rather than per cell: forty-two delays is a ripple, six is a month arriving.

**A `<button>` does not inherit `line-height`** — the browser's own sheet sets it to `normal`.
That is why the + chip came out 2px shorter than the Edit Mode pill beside it. It now carries
`line-height: inherit` and a zero-width-space `::before` strut so its height is the pill's own
line box, whatever the theme sets; the icon is kept under 1em so the strut, not the glyph, is what
sets the height. A hardcoded px height cannot work here: the same rule measures 25px on the
tablet and 25.2 on the phone.

### Address lookup and the map preview are both keyless, and both had to be

Home Assistant has **no geocoder**. Nothing in core turns text into a place; `google_travel_time`
and `waze_travel_time` only measure between points you already have, and the HACS `places`
integration geocodes the other way round, coordinates to address. Google Places Autocomplete
would need a SECOND API key with billing — the OAuth token the calendar integration holds is
scoped to Calendar and will not authenticate Places.

So `src/data/geo.ts` uses **Photon** for search: built for type-ahead, answers partial words, and
sends `Access-Control-Allow-Origin: *` so the card calls it straight from the browser with no
backend. Nominatim also works and is CORS-open, but returned half as many results on the same
fragment and its usage policy discourages autocomplete.

**Do not use an Esri CANVAS basemap for a map anyone has to read.** The Canvas styles are a
backdrop for plotting data on, not a map: no shops, no building names, almost nothing to
recognise a place by. Measured on the same tile, Canvas is 12 kB against OSM standard's 31 kB,
and that difference is all detail. Using one here, and then filtering it down to 46% brightness
to match the card, produced something the user rightly called impossible to see anything in.
**A map has to be legible before it has to be on-brand — do not tint the tiles.**

**Nor `tile.openstreetmap.org`.** Their tile policy forbids third-party apps and their servers
enforce it: every tile came back **403 "Access blocked — App is not following the tile usage
policy of OpenStreetMap's volunteer-run servers"**, rendered as a yellow hazard-striped image
across the whole map. A browser cannot send an identifying User-Agent, so there is no compliant
version of this. It passed a byte-size check — the 403 page is a normal-sized PNG — which is why
**tile sources must be verified by LOADING them in the browser, not by measuring the response.**

The live map uses Esri's **`World_Topo_Map`** — NOT `World_Street_Map`. Compared at zoom 18 over
the user's own village, Street draws one road line and nothing else; Topo draws the buildings and
names the streets. Esri's street rendering thins out badly outside cities, which is exactly where
a child's after-school club is. Canvas survives only in the static fallback preview.

**The keyless ceiling is real.** Topo shows buildings and street names but no house numbers and
no business names. Everything that would match Google needs an API key: Mapy.cz (much the best
for Czech addresses, free key), MapTiler, Thunderforest, Stadia. If better detail is ever asked
for, that is the answer — not another free provider. All three keyless options have now been
tried and measured.

The picker is a **window of its own** (`.mapmodal`, inset 3vh/3vw), not a panel in the edit form.
It was inline at 505x360 and you could not get your bearings in it. Choosing a place on a map is
its own task and needs the screen.

**Judge a tile source by LOOKING at it, at the user's own coordinates.** Byte size lied twice
here: OSM's 403 page is a normal-sized PNG, and Esri Street returns a plausible 4.6 kB tile that
happens to be empty. Render candidates side by side in the browser and screenshot them.

For the map, **do not reach for `ha-map`** — but DO reach for the Leaflet it drags in.

`ha-map` itself is no use: its tiles are CARTO, and every CARTO basemap now comes back stamped
"API KEY REQUIRED" straight across the image (verified by rendering one), and it centres on its
entities rather than an arbitrary point. But loading a map card through `loadCardHelpers()`
assigns **`window.L`** — Leaflet 1.9.4 — and it stays there. `loadLeaflet()` does exactly that,
once, and returns null on any failure so the caller can fall back to the static tile layout.

Four things about that borrowing, all measured:

- The card element must be **CONNECTED**, not merely created: the import happens in its first
  update. Creating it and waiting does nothing. About 100ms, once per page.
- Leaflet's CSS is NOT in the adopted stylesheets — `ha-map` pulls it in with a `<link>` to
  **`/static/images/leaflet/leaflet.css`**, served by Home Assistant itself (14.8 kB). The card
  links the same file into its own shadow root. Without it the tiles render as a pile of
  unpositioned 256px images spilling out of the container.
- `window.L` is assigned once by the chunk. Deleting it does not make a re-import restore it, so
  do not clear it while debugging — that wasted a round here.
- Esri Canvas has real imagery to **z16**; z17+ all return an identical 2521-byte "not yet
  available" placeholder. Hence `maxNativeZoom: 16` with a higher `maxZoom`, so Leaflet upscales
  instead of showing a wall of error tiles.

Filter the tile layers **per layer**, via each `tileLayer`'s `className`. Both layers live in the
same `.leaflet-tile-pane`, so one filter there darkens the street names along with the map they
are sitting on.

Use a **`divIcon`** for the marker. Leaflet's default icon is a PNG resolved against its own
relative image path, which does not exist here — it renders as a broken-image box.

**Tapping the map picks that point**, straight into the field, and the pin is draggable. The
first version pinned the marker to the centre, made you drag the MAP under it and then press a
"Use this" button to confirm; the user's verdict was that it "might as well not be there". A tap
has already said which place — a button asking again is the thing that made it useless. Late
answers are dropped by sequence number, so a slow lookup for an earlier tap cannot overwrite a
later one.

Three things in geo.ts that will bite if they are changed:

- Esri's tile path is **{z}/{y}/{x}**, not the usual {z}/{x}/{y}. Getting it the normal way round
  shows a different part of the world, quite convincingly.
- Esri's "Dark Gray" basemap is a MID grey. Against a card on `rgb(32,27,37)` it reads as a bright
  slab, so the base layer is filtered down and the label layer pushed back up.
- The search aborts the previous request on each keystroke. Without that, a slow answer for "gym"
  lands after a fast one for "gymnastika praha" and replaces good suggestions with stale ones.

Coordinates are deliberately **not stored**: a Google event has nowhere to put them, so the text
is the only thing that survives a save and the map geocodes it again on demand.

### A max-height transition is only as slow as the content is tall

The overflow menu shared the calendar picker's `max-height: 0 → 320px` transition and looked like
it had no animation at all. It did: with two items its content is **88px**, so all of it was
revealed in the first **61ms** of a 220ms transition and the remaining 159ms animated empty space.
The picker looked fine only because it has more items.

Anything whose height varies with its content wants **transform and opacity** instead, which do
not care how tall it is — the menu is a scale-and-fade popover from its top-right corner now.
Where a real height change IS needed (the foldable groups), the height rides a plain ease and the
CONTENT carries the spring: a height that overshoots shoves everything below it and snaps back,
which reads as a bug rather than as elasticity.

Same rule for the all-day time chip and both fold groups: **keep the content mounted and collapse
it**. Letting Lit remove it makes opening and closing instant, with nothing to animate.

### The edit form builds its own date and time pickers, on purpose

`<input type="date">` and `<input type="time">` were the first cut and were replaced. They are
small keyboard-shaped controls sized for a mouse, and they follow the BROWSER's locale rather
than the card's `time_format` — so a card configured for 24-hour showed `09:00 AM`. On a wall
tablet they are close to unusable with a finger.

In their place: a month grid with 40px days, and a two-column scroll-snap drum with 44px rows.
Both open inline under the row, one at a time, the way iOS does it.

Things worth keeping right if they are touched:

- A wheel is positioned by `scrollTop`, which means nothing until the column exists and has a
  height. `_wheelsPending` defers it to the `updated()` after the render.
- The selection is read back on a DEBOUNCED `scroll`, not on `scrollend` — Safari only learned
  that event recently and this has to work on the family's phones now.
- `.wheel-pad` at both ends is what lets the first and last values reach the centre band.
- **A drum built for a thumb is unusable with a mouse** unless it is given the two things a mouse
  expects. Clicking a row scrolls to it, and one notch of the wheel is one row over whichever
  column is hovered — hours if the pointer is over hours, minutes if it is over minutes. Both go
  through `_spinWheel`, which only scrolls the column; the debounced `scroll` handler is still the
  single path to the draft, so there is one place where a row becomes a value however it was
  chosen. The `wheel` handler must `preventDefault` or the scroll runs on into the sheet and the
  dashboard behind it.
- Moving the start carries the end with it (`_patchStart`), preserving the duration. Picking a
  start after the end is the easiest mistake in a form like this, and an error message afterwards
  is a worse answer than the behaviour every calendar app already has.
- **Save must not use `--accent`.** That is the event's own colour, and on a red calendar Save
  came out the same colour as Delete — the one pair of buttons that must never be confused. It
  uses the today-cell inversion.

The colour row maps Google's palette hex back to its id, because the colour helper publishes hex
and the API takes ids. The two agree exactly: the helper fetches that palette from Google's own
colors endpoint. What it cannot do is tell one occurrence's colour from its series', since the
published map is keyed by uid and a whole series shares one — the form may open showing the
series colour. Saving always writes the right thing.

### Event colour is PER ACCOUNT, and the card only ever sees one account's

An event's `colorId` is not a property of the event so much as a property of *that viewer's* copy
of it. On a calendar the family account owns but another family member works in, a colour that
member sets in their own Google account is invisible to every other account — including the one
Home Assistant is authenticated as.

Measured against the live API with the integration's own token, on two calendars the family
account **owns**:

| calendar | event creator | `colorId` returned |
|---|---|---|
| first | `family@…` — the account HA uses | `4` |
| second | `someone-else@…` | `None` on every event |

`accessRole` is `owner` for both, so this is not a permissions problem.

**`eventLabelId` is NOT a red herring — an earlier version of this note said it was, and that was
wrong.** Measured on 2026-09-13, on an event the family account created, in the calendar it owns,
changed from that same account in Google Calendar's own web UI:

```
eventLabelId   64c465cf-0bf2-41ef-bcd8-f2d6338e59bd     <- the colour that was picked
colorId        (absent)
creator        family@...                               <- the account HA uses
```

Google's current UI writes an event **label** — an opaque UUID — where it used to write the legacy
`colorId`. The master of that same series still carries `colorId: 4` from before the change, which
is what made the old "creator" theory look right.

Three consequences, all verified rather than reasoned:

* **`gcal_sync` drops it.** `eventLabelId` appears NOWHERE in `.storage/google.*` — the stored item
  has the full set of parsed fields and `color_id: None`. The colours helper reads that store, so
  the label can never reach it.
* **The UUID cannot be resolved.** `GET /users/me/eventLabels` and
  `GET /calendars/{id}/eventLabels` both 404 on Calendar API v3. There is no public endpoint that
  turns a label id into a colour, so even reading it from the API leaves you holding an opaque id.
* **Writes are unaffected.** A `colorId` written by the card is read back by everything, which is
  why setting a colour from the card works in both directions while setting one in Google's UI
  does not come back.

**When probing Google, dump EVERY key.** The first probe of this used a field whitelist and
reported "no colour on the event", which sent the diagnosis in the wrong direction entirely. A
whitelist cannot rule out a field it never prints.

Three ways out, in the order worth trying:

1. **Colour it from the account HA uses.** The owner's colour is visible to the owner, so it
   reaches the store, the helper and the card. The other member keeps seeing their own colour in
   their own account — per-user overrides win locally.
2. **`event_colors` in the card config**, e.g. `Lunch: '#fbd75b'`. Keyed on the summary, beats
   everything, and needs nothing from Google. Best where a handful of named events want a fixed
   colour.
3. **Add a second Google config entry authenticated as that family member.** The helper globs
   `/config/.storage/google.*` and merges every store it finds into one `by_uid` map, and the
   iCalUID is identical across accounts, so their colours would attach to events fetched through
   the family account's entity with no code change. Costs a second OAuth, duplicate calendar
   entities, and double the sync; only worth it if a lot of colours are set that way.

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
config four times, and this one once more since — quoting a CSS keyword in a comment is enough
to do it, so write fill mode both, not the quoted form.

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

**The two maps are not interchangeable, and mixing them repainted whole series.** Every occurrence
of a recurring event shares one `ical_uuid`; only a singly-modified occurrence has an id of its
own. The helper used to write an exception's colour under BOTH its own id and that shared uid —
so recolouring one Monday with "This event" set the uid entry, every other Monday fell through to
it, and the entire series changed. Exactly what that scope promises not to do, and the write to
Google had been perfectly correct all along.

The rule: an item with `recurring_event_id` goes in `by_recurrence_id` ONLY. `by_uid` carries
series-level colour — the master, which has no `recurring_event_id` — and one-off events, nothing
else. The card looks up the recurrence id first and falls back to the uid, so an exception beats
its series and an untouched occurrence inherits it.

Proving this needs a series whose MASTER colour differs from the exception's. The first attempt
used one whose master was already the colour being tested, which passes either way and proves
nothing.

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

- **Editing.** Done: edit mode, the edit form, delete with all three recurrence scopes, create
  (press-and-hold a slot, or the + beside the pill), and a repeat rule on a new event. What is NOT
  there is changing the repeat rule of an event that already exists — see the recurrence section
  above for why that is a different job.
- **The phone view.** The list renderer exists so the card is not broken on a narrow screen; it
  has had no design pass.
- **Weekends.** `days: mon-sun` works, but nothing has been tuned for it and the user
  explicitly parked it.
