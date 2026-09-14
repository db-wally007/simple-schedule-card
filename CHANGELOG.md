# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and this project uses
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [3.0.0] - 2026-09-15

A **month grid**. v1 drew a week, v2 let you change it; v3 adds a second SHAPE, for calendars
whose events are dates rather than appointments — bin collections, birthdays, term dates. A time
axis for those is an empty grid with a few marks in it.

Major because `calendar_mode` gained a third value that is not another zoom level on a time axis
but a different layout entirely, and because two sizing options were **removed** rather than
retuned (see Removed). Nothing about a week grid changes; a card that does not ask for `monthly`
behaves exactly as it did.

### Added — month mode

- `calendar_mode: monthly`, per calendar, alongside `focused` and `full`. Seven columns divide
  the card so a month never scrolls sideways — the one deliberate departure from
  `view_width_mode: fixed`, because a month you have to scroll to finish is not a month.
- **Only the weeks a month actually touches**: four, five or six. An earlier cut always drew six,
  which left September carrying a whole week of October under it. The rows share a fixed total,
  so a five-row month has taller cells rather than a shorter card and nothing jumps as you page.
- A cell prints **as many events as fit** and folds the rest into "N more" — measured from the
  rendered cell rather than configured, and clamped between a one-event and a three-event height.
  On a short window a cell hands back its breathing room when that buys a whole extra event.
- **A tap anywhere in a cell opens that day**, in a panel that prints each event's start AND end
  time — one more thing than Google's own version of it, because "4am" says nothing useful about
  a collection that runs until 10. The panel stays open behind the detail sheet, so a second
  event from the same day does not mean finding the cell again.
- `month_mode_show_times`, per calendar: a timetable's 08:30 is the point, while bin day is always
  04:00 and saying so four times a month is noise.
- The header's mode toggle now cycles **focused → full → monthly**, and in a month the arrows step
  months, the pill counts in months, and the period moves to the middle of the header at 24px —
  it is the answer to "which month am I in", and it was the smallest thing on screen.
- The detail sheet has a **close button**, in every view and mode. The scrim always closed it, but
  nothing said so.

### Fixed

- **Two freezes, and one of them took Home Assistant down with it.** `sync()`'s early-out tested a
  key that is set several awaits before the first subscription lands, so re-entry during that gap
  restarted the whole round — and the card calls it from `updated()`, which fires on every state
  change in the house. Ten re-entrant calls produced **30 subscriptions instead of 3**, each asking
  HA to expand months of recurrences on the event loop that also serves the websocket. Paging a
  month now waits for the paging to settle, and only the window landed on is ever asked for.
- **A frozen tab with no network traffic to explain it**: the month measurement was reading
  geometry *through* the entry animation, which scales cells as they arrive, so every frame
  produced a different answer and every answer was another render. It now waits for the animation
  to finish. A second, related loop — deriving available height from a position the grid's own
  height moves — is bounded by remembering the heights already tried.
- `animations: off` never actually stopped the block, list and cell cascades. Those elements carry
  `animation-name` inline, which outranks any selector; the reduce rules needed `!important`.
- The "today" button was permanently greyed out in a month: it tested the week offset, which never
  moves there.

### Removed

- `month_mode_max_events` and `month_mode_cell_height`. Both asked the YAML to state a number only
  the rendered card can know — the same calendar has 110px cells in a six-week August and 161px
  cells in a four-week February, and any fixed count is wrong in one of them. The fit is measured
  instead. Month mode now has no size configuration at all.

## [2.0.0] - 2026-09-13

The card can now **write**. v1.0.0 was read-only by decision; v2.0.0 adds an explicit edit mode
that can change, delete and create events, with a repeat rule, a colour, and a location picked
off a map.

It is a **mode**, not an edit button on every block, because this card is a wall display first:
a timetable that can be changed by a stray tap is worse than one that cannot be changed at all.
Turning it on takes two deliberate actions and the header says so, in red, for as long as it
lasts.

Major because editing needs a helper Home Assistant cannot replace. `pyscript/simple_schedule_edit.py`
talks to the Google API directly — the `google` integration declares CREATE and DELETE only and
has no `async_update_event` at all, so core's `calendar/event/update` refuses; the service
that does exist has no rrule field and nothing in core can set a colour. Without the helper the
card still works exactly as it did; edit mode simply reports that the service is missing.

### Added — edit mode

- The refresh button became a **⋯ menu** holding Refresh and Enter Edit Mode. Refresh moved into
  it rather than sitting beside it: the header already carries four buttons on a phone, and a
  fifth for something used occasionally would have cost the calendar name the width it needs.
- A red **Edit Mode** pill beside the calendar name, and a wash of red across the whole card on
  the way in and a different one on the way out. The pill alone is a small thing in a corner, and
  this is the one state where a tap changes somebody's timetable.
- Tapping an event opens it for **editing**. For a recurring event the form asks what the change
  applies to — this event, this and future, or all events — and Delete takes two presses.
- **Date and time pickers built for a finger**: a month grid with 40px days and a two-column drum
  with 44px rows, opened inline under the row. `<input type="date">` and `<input type="time">`
  were the first cut: they are keyboard-shaped controls that follow the BROWSER's locale, so a
  card configured for 24-hour showed `09:00 AM`. The drum takes a mouse too — click a number to
  go to it, or use the scroll wheel over whichever column you are pointing at.
- **Colour**, from Google's own eleven-colour palette plus "the calendar's colour".
- **Location** with address search as you type, biased towards `zone.home`, and a full-screen map
  picker: pan and zoom, tap anywhere to pick that spot, drag the pin to adjust. Both halves are
  keyless — Home Assistant has no geocoder, and the OAuth token the calendar integration holds is
  scoped to Calendar and will not authenticate Google Places.

### Added — creating events

- **Press and hold empty timeline** for about half a second: the slot fills in under your finger
  and the form opens set to that day and time. A press into a gap fills exactly that gap — a
  timetable is mostly five- and fifteen-minute gaps between lessons, so the new event is cut short
  at whatever starts next and held back to whatever ended last.
- **Press and hold a day's own cell** — the label down the left of the transposed grid, across the
  top of the other one, or a day heading in the list — for that day at the current time. Only that
  cell lights up.
- **A + beside the Edit Mode pill**, for today at the next quarter hour. In the list layout there
  is no timeline to press against, so the + and the day headings are the two ways in there.
- **Repeat**, folded away under the times, offering Google's own list generated from the event's
  own date — Daily, Weekly on Tuesday, Monthly on the second Tuesday, Annually on September 8,
  Every weekday — plus a **Custom recurrence** window: every N days/weeks/months/years, which
  weekdays, and an end that is never, on a date, or after a count. It says the rule back to you in
  words, because that sentence is the part still true in a year.

### Added — elsewhere

- `animations: always | auto | off`. A machine whose OS has animations switched off system-wide
  reports `prefers-reduced-motion` and lost every transition here with no way to opt back in.
- The horizontal scrollbar is a real control: drag the thumb, click the track. It had been an
  indicator you could not touch, which on a desktop is a scrollbar that does not work.
- Three weeks are cached rather than one, so stepping through weeks quickly never lands on an
  empty grid while the next push arrives.
- The week pill always names the week — "This Week", "In 3 Weeks", "In 2 Months", "1 Year Ago" —
  coarsening as the distance grows. It used to go blank past one week either side, which left the
  list layout with nothing at all naming the week.

### Fixed

- **Recolouring one occurrence repainted the whole series.** The colour helper mapped colours by
  event uid, and every occurrence of a recurring event shares one — so "this event only" set the
  uid entry and every other occurrence fell through to it. An exception now lives only under its
  own recurrence id. The write to Google was correct throughout; only the display was wrong.
- **Saving or deleting handed back the unchanged week** for three or four seconds while the change
  travelled Google → Home Assistant → card, which reads as a failed edit. The form now stays up,
  still saying so, until the week behind it has actually caught up.
- **A dialog that fits the screen no longer scrolls the page behind it.** A box with nothing to
  scroll is not a scroll container, so the drag went straight through; the same drag did nothing
  once the form was tall enough to scroll. It now takes the gesture and answers with resistance.
- The last hour label could hang past the end of the axis, giving the card a scrollbar in the mode
  whose whole job is to fit.
- The calendar picker overlapped the week navigation on a phone, and the phone never received the
  larger buttons or the extra air the tablet pass added.

### Changed

- **The week gesture is buttons, not swipe.** An interactive swipe was built and removed: on a
  wall tablet it competed with the horizontal scroll of the grid itself, and the result read as
  unfinished rather than as fluid. The arrows are unambiguous and do not fight the axis.

### Notes for anyone upgrading

- Nothing in an existing config changes meaning, and the card stays read-only until edit mode is
  turned on.
- Editing needs `pyscript/simple_schedule_edit.py` installed and the Google config entry in
  `calendar_access: read_write`. Per-event colour also needs `pyscript/simple_schedule_colors.py`,
  as it did in v1.

## [1.0.0] - 2026-09-11

First stable release. The transposed grid began as an experiment for side-by-side comparison
and became the card: `orientation: days-as-rows` is what everything below is tuned for, and
`days-as-columns` remains as the calendar-shaped alternative.

What v1.0.0 settles: the week is the subject, the lattice is uniform, the grid is read-only,
colours come from Google rather than from config, and each calendar carries its own shape.
Creating, editing and deleting events are deliberately **not** in it.

### Added — the detail sheet

- The sheet **centres on the viewport**, not on the card. It was positioned absolutely inside
  `ha-card`, and in the list layout the card is far taller than the window — so centring it in
  the card put it somewhere down the page, out of sight until you scrolled to it.

- Opening an event now **recedes the schedule** exactly as opening the calendar menu does:
  dimmed to a tenth with the cells folded back, in both the grid and the list. One predicate
  drives both, so the two cannot drift apart, and closing replays the entry cascade the same
  way. The scrim's own wash lightened accordingly — with the schedule receding behind it, the
  two together were near-black.

### Removed

- `show_legend`, which had no effect: the legend went away when the card moved to one calendar
  at a time behind the picker, and the option was never read.

### Added

- **`orientation: days-as-rows`** — transposes the grid into the printed-timetable shape: days
  down the left, hours across the top, blocks sized along x. `days-as-columns` (the calendar
  shape) remains the default and is untouched.

  Both orientations share the events, the lane packing, the colours, the contrast handling and
  the uniform-lattice rule; only the axis each runs along differs, so `placeWeek`'s `column` is
  read as a sub-column in one and a stacked sub-row in the other.

- **`day_height`** (default `74`), the per-lane row height for `days-as-rows`, mirroring what
  `hour_height` does for the other orientation.

### Changed — the axis is the schedule, not the clock hours around it

- **`day_start`/`day_end: auto` now return the exact first start and last end**, not those
  rounded out to whole hours. The week begins at 07:40 because that is when the first lesson
  begins, so the first block sits flush at the left edge instead of behind forty minutes of
  empty grid. Rounding was the original behaviour and it wasted a column on every screen.

- **The scroll range is exactly the schedule, and the void a bounce used to show is fixed by
  painting rather than by content.** Scrolled fully left the first block is flush; fully right,
  the last. There is nowhere empty to get stranded.

  Three content-based attempts failed first, and the reasoning is worth keeping:

  - stopping the axis at the last event left flat card background on any bounce;
  - an hour of ruled grid either side became *real scrollable area*, because a scroll
    container's range is its content — so the card could come to rest in blank time;
  - the whole day, midnight to midnight, is what Apple and Google do, but they show ~14 hours
    at once on a vertical axis. Here the viewport holds about five hours, so a day is five
    screens of mostly nothing.

  The whole grid is now **painted on the scroller** rather than placed in the content: vertical
  hour lines, an opaque strip masking the hour axis, and the horizontal row banding, in three
  background layers. A scroll container's own background sits on its border box and does not
  move when the content rubber-bands, so the ruling holds and a bounce reads as the grid
  carrying on.

  Only the **row banding** is painted. It is constant along x, so it needs no phase, cannot
  fall out of register with the content, and because it does not move it fills the area a bounce
  exposes.

  The **hour lines are elements** inside each row, not paint. Painting them needs
  `background-attachment: local` to keep them in register with the blocks through a bounce, and
  that drops the scroller onto the main thread — which loses the rubber-band altogether.
  Elements move with the content for free. They also sit inside the rows, so they never reach up
  into the hour labels.

### Fixed

- **Stray vertical lines between the hour lines.** The painted grid used
  `repeating-linear-gradient` at `auto` size, which makes the tile as wide as the scrollport —
  so its internal rhythm was cut mid-cycle and every tile edge injected a line off the hour.
  Each layer is now a single-cycle tile sized explicitly (`var(--hour-w) 100%` for the hour
  lines, `100% calc(var(--row-h) * 2)` for the banding) with `background-repeat` doing the
  repeating. Verified the tile width matches the hour spacing exactly.

### Added

- **The calendar is now the heading**, and the `title` option is gone. Avatar, the calendar's own
  name and — with more than one configured — a chevron, all one button; the menu lists every
  calendar and selecting one runs the same slide-and-cascade the week arrows use, direction taken
  from where it sits in the list. A single calendar renders the same heading without the chevron.

  Names are capitalised the way Google lists them (`Alex's calendar` to `Alex's Calendar`). Only
  the first letter of each word is touched, so `ICT` is not flattened to `Ict` and the letter
  after an apostrophe is not raised into `Alex'S`.

  The heading matches Home Assistant's own card header exactly, tokens included —
  `--ha-card-header-font-size`, `--ha-font-weight-normal`, `-0.012em` — so it sits at the same
  size and weight as every other card on the dashboard. Note that is weight **normal**, not
  bold.

  The menu is sized by its longest calendar name rather than by the card. The picker is
  `inline-block`: as a block it filled the header, and the menu's `min-width: 100%` then
  stretched with it.

  It closes on a click anywhere outside, or on Escape. The listener sits on `document` and tests
  `composedPath()` — the card is inside a shadow root, so a click outside it never bubbles
  anywhere the card can see.

  **While the menu is open the schedule recedes**: dimmed to a fifth with the cells folded most
  of the way back out, so the menu is plainly what is in focus. Closing replays the entry
  cascade, exactly as though the calendar had just been opened.

  Two details make that work. The block animation's fill mode had to change from `both` to
  `backwards` — `both` pins the end state once the animation finishes, which outranks the dimmed
  rule and freezes the cells mid-grid. And the cascade is genuinely *restarted* by alternating
  between two identical keyframe sets, since a CSS animation only restarts when its name
  changes; re-rendering with the same name leaves the finished animation where it stood.

  The transitions live on the dimmed rule alone, so dimming glides and undimming is instant —
  the replayed cascade then carries the fade back in by itself. Transitioning both ways put two
  overlapping fades on the same pixels and read as a flicker.

  One calendar is shown at a time. All of them are subscribed to, so switching is instant, and
  the time axis and the weekend rule are scoped to the calendar on screen — one calendar's 04:00
  collection must not rescale another's grid, nor add weekend rows to it.

  The name is always the calendar's own name in Home Assistant. `name` is gone from the
  per-entity config, as is `color`: colours come from Google via the helper now.

- **`person`** on a calendar entry, whose picture becomes the avatar. The picture lives on the
  PERSON rather than on a Home Assistant user — a person can have one without having a login at
  all, which is exactly the case for a child's calendar. `/api/image/serve/…` is served with
  `requires_auth = False`, so a plain `<img>` works with no token handling. Without a person, or
  without a picture, the avatar is the first letter of the calendar's name on its own colour.

- **`view_width_mode`** on a calendar entry, `fixed` (the default) or `adaptive`. Fixed gives
  every hour the same pixel width whatever the screen and lets the grid scroll; adaptive fits
  the whole span into the card so nothing scrolls. It combines freely with `calendar_mode`, and
  all four combinations were measured: gridlines evenly spaced in each, scrolling present in the
  two fixed ones and absent in the two adaptive ones.

  Adaptive positions everything in **percentages** rather than pixels, so the grid reflows on
  resize with nothing measured in JavaScript. Both paths share one `pos()` + unit, rather than
  forking the renderer.

  **The hour axis thins itself out when space runs short.** An hour narrower than 64px starts
  skipping labels and gridlines together — a whole day adaptive in a 1200px card labels every
  two hours, and at 900px every four. Without it, 24 hours at ~42px each ran the labels into one
  smear of digits. Fixed mode at 192px an hour never trips it.

- **`calendar_mode`** on a calendar entry, `focused` (the default) or `full`. Focused fits the
  time axis to that calendar's own events, so a school week runs first lesson to last. Full
  draws the whole day for a calendar whose events are scattered and whose empty hours are worth
  seeing — a 04:00 bin collection says more with the rest of the day around it — and opens
  scrolled to just before the first event rather than on an empty small hours.

  It is per calendar, so switching between a focused and a full one re-fits the axis each time.

- **`days: auto`**, now the default: Mon–Fri normally, expanding to the full week as soon as
  Saturday *or* Sunday has an event. The window subscribed to was always seven days, so this is
  purely a rendering decision — nothing extra is fetched.

  Both weekend days appear together, deliberately. Showing only the day that has something would
  make the grid six columns one week and seven the next, so a column would be a different width
  each time; both-or-neither keeps two widths in play instead of three.

### Changed — week transition timing

- The week change was too quick to read as motion at all. The frame slide goes from 320ms to
  **560ms** on `cubic-bezier(0.32, 0.72, 0, 1)` — a long, heavily front-loaded ease that covers
  most of the distance early and settles slowly, which is what reads as iOS rather than as a
  linear slide. Travel widened from 16px to 28px so there is something to see.

- The block cascade goes from 420ms to **620ms**, and the per-row stagger from 26ms to
  **55ms** — at 26ms the five rows arrived as one. The last row now settles at 840ms.

- The cascade uses a gentler spring than the card's `--ssc-spring`: at 620ms the sharper curve
  overshoots far enough to look like a bounce rather than a settle.

### Also

- Event text is centred vertically in its block.
- Times drop the leading zero in 24-hour mode — `8:00`, `7:40 – 8:25`. Intl pads the hour
  whatever you ask of it, so 24-hour strings are built by hand.
- Dates carry an ordinal suffix: `Sep 7th`, `Sep 11th`. English only — `Intl.PluralRules`
  reports "other" for locales with no ordinal categories, which would append "th" to a Czech
  date.
- No top or bottom rule on the grid, so it reads as floating rather than boxed in.
- The week range moves under the navigation buttons, on the right, leaving the heading the whole
  left side of the card.
- The card's padding is uniform on all four sides.
- In the narrow list layout the banding alternates per **event row** rather than per day, and
  today's day heading is inverted to match the grid's day cell.
- The list layout gained the motion the grid already had: the calendar menu makes it recede, and
  a week or calendar change slides it in with the rows cascading behind. The list recedes
  **further** than the grid — `scale(0.86)` against `0.9`, lifted 26px against 18px — because it
  is the phone layout, the rows are large, and there is no fine ruling to lose in the fold.

  Its cascade runs per **row** rather than per day, sweeping top to bottom, at 22ms a row capped
  at 520ms: the grid's 55ms-per-day works out to nearly two seconds across a week of individual
  events, and the cap keeps the tail from dragging on a heavy day. Measured 34 rows sweeping
  0, 22, 44 … 520ms, settling at 1.14s.
- A 2px rule closes the far end of the grid, mirroring the one the day column draws at the near
  end. It had never been there in any combination.
- The scrollbar is centred in the gap below the last row, and **no longer fades**: it is visible
  whenever there is more schedule off-screen. Fading it out was misleading — the card looked
  complete when there was more week to the right. It is now also measured on render rather than
  only on scroll, so it is there before you touch anything, which is when it is most useful.

- A rule now closes the grid at the bottom, mirroring the one under the hour labels.

- **`hour_width`** (default `200`), a FIXED horizontal scale in pixels per hour rather than
  stretching the week to the card. A block is then the same width on every screen, and a title
  of a given length always fits: 200px/hour puts ~133px of text inside a 45-minute block, which
  is about 16 characters at the block's 15px/600 face (measured with canvas `measureText`, not
  estimated). A normal school day is therefore wider than the card, which is what the scroller
  is for.

- **Horizontal scrolling of the grid only.** The title, week range and buttons stay put while
  the schedule scrolls under them, and the day-name column is sticky so you can still tell which
  row you are reading. The native scrollbar is hidden in favour of an overlay thumb that appears
  while scrolling and fades about a second after it stops — Chrome on the tablet otherwise draws
  a permanent chunky bar that steals a row of pixels and never fades.

- **Today's day/date cell** is inverted — near-white fill, near-black text — so the current day
  reads at a glance. The cell only; the blocks in that row are untouched.

- The week pill now also reads **Next week** and **Previous week**, not just *This week*. Beyond
  one week either side there is no pill: the date range itself is the clearer label and nobody
  reads "in seven weeks" off a wall.

Event names are one line, always, truncating with an ellipsis; the full title is in the detail
sheet. Wrapping to two lines was tried first and left rows of mixed-length titles ragged.
Row height is 72px, down from 74. A 45-minute block is 144px.

The scrollbar sits BELOW the last day's row rather than over it, and its track spans the hour
columns only. The thumb is sized in fractions rather than pixels so it scales to that narrower
track.

**The date column lives outside the scroller**, as a flex sibling rather than a sticky child.
Sticky was not enough: rubber-band overscroll drives `scrollLeft` negative, and a sticky element
only ever gets pushed in the positive direction, so at the extremes it travelled with the
content and visibly bulged. Out of the scroll container it cannot move under any circumstances,
while the hour columns keep their bounce on both edges. The two halves are aligned by sharing
the row heights — corner to time axis, day cell to canvas — rather than by sitting in one grid.
Its two borders are 2px against the hour grid's 1px, so it reads as fixed furniture.

## [0.9.1] - 2026-09-10

### Added

- The helper now notices a calendar **renamed in Google** and reloads that config entry, so the
  new name reaches Home Assistant on the normal interval instead of needing a manual reload.

  It reloads rather than writing the name, because `original_name` cannot be written from
  outside: the live entity re-asserts it the instant the registry entry changes. Measured — the
  entry returned by `async_update_entity` carries the new name, the very next read does not,
  while an `icon` set in the same call sticks. Only the integration re-reading its calendar list
  updates it, and that happens on entry setup.

  A rename is reloaded **once**. If the names still disagree afterwards (a prefix rule, a user
  override in entity settings) it is not retried, so a name that never converges cannot put the
  config entry into a reload loop.

  Matching is on the calendar's Google id, the tail of the entity's unique_id, which does not
  change on a rename — so the entity, its entity_id, its history and its events all survive.

## [0.9.0] - 2026-09-10

### Changed

- **The refresh button now refreshes everything**, in the order the data actually flows: force
  the calendars to re-poll Google, wait for that to land, have the colour helper republish from
  the freshly updated store, then re-subscribe and re-read both colour sources. Previously it
  only re-read what Home Assistant already held, which meant a change made in Google was simply
  not there yet and the button appeared to do nothing.

  The `force_refresh` option is gone with it — refreshing is what the button is for, so it is no
  longer opt-in. Both the calendar re-poll and the helper call are best-effort; the card still
  refreshes what it can if either is absent.

- **The helper reads Home Assistant's in-memory event store**, not the file on disk.
  `LocalCalendarStore` buffers writes for 120 seconds, so the file lags a sync by up to two
  minutes — long enough to make a "refresh now" button useless for colours. The in-memory copy
  is current the moment the coordinator finishes. The file remains a fallback for when the
  config entry is not loaded. A run is also faster for it: ~370 ms against ~1 s.

- **Toolbar buttons sit 10px apart** rather than 3px. On the kiosk tablet the wrong button was
  easy to hit; 40px targets need real space between them, not just size.

### Removed

- `force_refresh`.

## [0.8.0] - 2026-09-10

### Changed

- **Palettes come from Google, not from a table in this repo.** The helper calls
  `colors.get`, which returns both the calendar and the event palette keyed by the same ids
  that appear on a calendar's colour field and an event's `color_id`. The built-in
  `EVENT_PALETTE` is now only a fallback for when that call fails — and it was measurably
  wrong: the live endpoint returns `#ff887c` for Flamingo where the widely-published table says
  `#e67c73`, `#fbd75b` for Banana against `#f6bf26`, and so on.

### Fixed

- **Calendars on a stock palette colour now sync properly** instead of being skipped. 0.7.0
  detected the index-shaped values Google returns and left those calendars alone; the calendar
  palette from `colors.get` resolves them, so `#00000a` becomes Basil's real hex rather than
  near-black or nothing. All nine calendars on this instance now carry their true Google colour.

## [0.7.0] - 2026-09-10

### Added

- The colour helper now also **keeps each calendar's own colour in step with Google**, so
  Google is the only place you pick colours. Home Assistant copies a calendar's colour once,
  when the entity is first registered, and never looks again — recolouring in Google silently
  had no effect, and any event without a per-event colour kept rendering in whatever shade was
  current on import day. The helper lists the calendars through the integration's own
  authenticated service and writes changes into the entity registry, the same field the
  entity-settings colour picker sets. Home Assistant's own calendar panel benefits too.

  Disable with `simple_schedule_colors_sync_calendars: false`.

- The card re-reads calendar colours on a 10-minute TTL instead of once, so a colour the helper
  changes in the background appears without a page reload.

### Fixed

- Colours that are actually palette **indexes** are now skipped rather than written. Google only
  returns a true `backgroundColor` when the request sets `colorRgbFormat=true`; gcal_sync's
  `CalendarListRequest` has no such option and never sends it, so calendars on a stock palette
  colour come back with their index in the colour field — `#000001`, `#000005`, `#000008`,
  `#00000a` are ids 1, 5, 8 and 10, not near-black. Writing those painted four calendars black.

## [0.6.0] - 2026-09-10

### Added

- **`min_contrast`** (default `4.5`). Each block's fill is darkened until white text on it
  reaches that contrast ratio.

  Google's palette is built for Google's own UI, which puts **dark** text on those fills. White
  on Flamingo `#e67c73` is 2.9:1 and white on Banana `#f6bf26` is 1.6:1, which is why the raw
  palette looked washed out here. Darkening scales the channels, so hue survives and only
  lightness is removed — the same move Google's dark mode makes. A fill that already passes is
  left untouched (Basil and Graphite both do), and the search finds the *least* darkening that
  works rather than a flat multiplier.

  Set `3.5` for a brighter grid, or `0` to use Google's palette exactly as-is.

- The legend swatch and the list row's bar keep the **true** colour. They carry no text, so
  there is nothing to darken for.

## [0.5.0] - 2026-09-10

### Added

- **Google's real per-event colours**, via an optional pyscript helper
  (`pyscript/simple_schedule_colors.py`). Lunch comes out Banana and the lessons Flamingo
  because that is what they are in Google — no colours named in the card config.

  Home Assistant downloads that colour and then discards it: `gcal_sync` requests `colorId`,
  parses it, and HA persists it in `.storage/google.*`, but `_get_calendar_event()` copies only
  eight fields into `CalendarEvent` and colour is not one. The helper reads it back out of the
  store HA has already written — no Google API calls, no credentials, no extra network traffic —
  and publishes `/local/simple-schedule-card-data/event-colors.json` for the card.

  Entirely optional. Without it the card falls back to calendar-level colour exactly as before;
  a missing file is the normal uninstalled case and is never treated as an error.

- `color_helper` config: `false` to ignore the helper, or a path to point elsewhere.

### Changed

- A block's colour is now resolved most-specific-first: an explicit `event_colors` title match,
  then the helper's per-event colour, then the calendar's colour, then the palette.
- Events carry `uid` and `recurrenceId` so a singly-modified occurrence can take its own colour
  ahead of the series it belongs to.

## [0.4.0] - 2026-09-10

### Removed

- **`subject_names`.** Gone entirely, config option and all.

### Added

- **`event_colors`** — colour by event title, e.g. `Lunch: '#f4c542'`. Matched
  case-insensitively against the whole summary, and it wins over every calendar-level colour.

  This exists because **Home Assistant does not expose Google's per-event colours.** Google
  returns a `colorId` on every event and `gcal_sync` parses it, but
  `_get_calendar_event()` in `components/google/calendar.py` copies exactly eight fields into
  `CalendarEvent` — start, end, summary, description, location, uid, recurrence_id, rrule —
  and colour is not among them. The dataclass has no colour field at all, so no card of any
  kind can see it. The only colour that reaches a card is the **calendar's** own
  `backgroundColor`, which is a different Google field. Painting one event yellow in Google
  therefore cannot reach the card; naming it in `event_colors` can.

### Changed

- **Event labels are always white**, the way Google's own calendar draws them. The
  luminance-based black/white picker added in 0.3.0 is gone; a pale fill is low contrast here
  exactly as it is in Google.

## [0.3.0] - 2026-09-10

### Removed

- **The current-day highlight and the current-time line.** With them the `show_now` option is
  gone too, and the clock tick that drove them now only exists to notice midnight so the week
  window follows the date.
- **The coloured bar down the left edge of every block.** The block's own fill carries the
  calendar identity now that it is opaque.
- **All rounded corners.** Card, blocks, buttons, chips, the detail sheet and the legend
  swatches are square.
- **All transparency from event blocks.**

### Changed

- Blocks are painted in the calendar's own colour at **full opacity** — nothing of the grid
  shows through. Because those colours are Google's rather than ours and range from pale lilac
  to near-black, the label colour is chosen per block by WCAG relative luminance
  (`readableOn()`): black on a pale fill, white on a dark one. Fixing the text to white would
  have left `#cd74e6` at a 2.9:1 contrast.
- Consecutive blocks get a 1px bottom inset. Touching events are exact neighbours, and with
  opaque fills they would otherwise merge into one unreadable slab.
- The detail sheet leads with the event's **own summary**. A `subject_names` expansion, if one
  is configured, is now the secondary line rather than replacing the title.

## [0.2.0] - 2026-09-10

A design pass. The first version was rejected as too small, too grey and generally too
minimal to read across a room, which is the only distance that matters for a kitchen tablet.

### Changed

- **The card sits on the theme's own card background** (`--ha-card-background`), the same fill
  every other card in the dashboard uses. v0.1.0 floated a translucent white panel over the
  page background, which on this theme came out a muddy grey.
- **No grey text anywhere.** Hierarchy is carried entirely by size and weight: a subject name
  is 17px/700 and its time 13px/400, both full-strength white. Dimmed secondary text reads as
  *unreadable* rather than as *unimportant* at arm's length, so `--ssc-dim` and
  `--ssc-dimmer` are gone rather than merely unused.
- **Everything is bigger.** Default `hour_height` 62 to 84, subject names 12.5px to 17px,
  hour labels 11px to 14px, title 20px to 26px, buttons 32px to 40px.
- **Day columns alternate in shade** so the eye tracks across a row without losing its place.
  The band is deliberately faint (4%) — enough to guide, never enough to read as two different
  kinds of day.
- **Day headers give the full weekday**: `Wednesday, Sep 9` rather than `WED 9`. The weekday
  carries the weight, the date sits two sizes down in the same colour.
- **Blocks show the full span** (`07:40 – 08:25`), not just the start.
- Narrow-width chrome scales down so the header does not visibly break on a phone while the
  list layout is still undesigned.

## [0.1.0] - 2026-09-10

First working version.

### Added

- A proportional week grid: hours down the left, days across the top, blocks sized and
  positioned by their real start and end. Irregular period boundaries (07:40, 08:30, 09:30,
  10:20, an hour of lunch) need no configuration, which is what ruled out both a fixed hourly
  grid and a period-row table during design.
- The **current** week rather than "the next N days", with arrows to any other week and a
  button back to this one. This is the whole reason the card exists: no stock or HACS calendar
  card can show Monday on a Wednesday.
- A uniform lattice — one shared time scale across all columns, identical column widths, and a
  column subdivision resolved once for the whole week and applied to every day alike. A busy
  Monday never leaves Friday's blocks twice as wide.
- Multiple calendars in one grid, grouped by **source calendar**. `lane_mode: by_source` gives
  each its own column in every day; `packed` pools them and splits only on real overlaps.
- Per-calendar colour read from the entity registry (`options.calendar.color`, which Home
  Assistant fills from Google's own calendar colour), with a config override and a palette
  fallback for calendars registered before that feature existed.
- Live updates over `calendar/event/subscribe` — the entity pushes a fresh list on every state
  write, so nothing polls.
- A refresh button, a now-line across today's column, an all-day strip, and a detail sheet with
  optional `subject_names` expansion.
- `time_format`, to pin the card to 24-hour without changing the rest of the frontend. A
  timetable is written in 24h whatever the frontend is set to, and `1:55 PM` does not fit a
  45-minute block.
- Layout plumbing (`layout`, `layout_breakpoint`) and a minimal day-grouped list for narrow
  widths, so the card is not broken on a phone. The phone view is not designed yet.
