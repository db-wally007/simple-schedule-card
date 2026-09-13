# Simple Schedule Card

A Home Assistant Lovelace card that draws a **whole week** of calendar events as a
proportional timetable — days down the left, hours across the top.

It was written because every stock and HACS calendar card shows "the next N days" from
right now. On a Wednesday they cannot show you Monday, which is exactly what a school
timetable on a kitchen tablet is for.

![A school week on a tablet](screenshots/tablet.png)

On a narrow screen it falls back to a day-grouped list:

<img src="screenshots/phone.png" width="320" alt="The list fallback on a phone">

## What's in it

- **The current week, always.** Monday is still on screen on Friday afternoon. Arrows step
  to any other week and a button returns to this one.
- **A proportional axis.** Blocks are sized and positioned by their real start and end, so
  a 45-minute lesson and a two-hour club are visibly different, and the gaps between them
  are real gaps. Irregular period boundaries — 07:40, 08:30, 09:30, 10:20 — need no
  configuration.
- **A uniform lattice.** Any hour band occupies the same pixels in every row, and an empty
  Friday is exactly as tall as a busy Monday. The lane count is resolved once for the whole
  week and applied to every day alike, so one crowded morning never leaves the other days'
  blocks twice as thick.
- **Several people's calendars**, switched from the heading, each with its own avatar,
  colour and time axis.
- **Colours that match Google**, including per-event colours, which no calendar card can
  show on its own — see [Colours](#colours).
- **Push updates.** Events arrive over `calendar/event/subscribe`, so the grid reflects a
  change as soon as Home Assistant knows about it. Nothing polls.
- A detail sheet on tap.
- **Read-only until you say otherwise.** An explicit [edit mode](#editing-events) — behind a
  menu, announced in red while it lasts — lets you change, delete and create events, set a
  repeat rule and a colour, and pick a location off a map. Off, the card behaves exactly as it
  did before it could write.

## Requirements

| | |
|---|---|
| Home Assistant | 2024.4 or newer (`calendar/event/subscribe`) |
| Calendar | Any `calendar.*` entity — Google, Local Calendar, CalDAV, … |
| Per-calendar colour | HA 2026.2+ stores one automatically for calendars registered after that release. Older ones fall back to a built-in palette. |
| Editing (optional) | [pyscript](https://github.com/custom-components/pyscript) plus `pyscript/simple_schedule_edit.py` from this repo, and a Google config entry in `calendar_access: read_write`. Without it the card is read-only, exactly as v1 was. |
| Per-event colour (optional) | pyscript plus `pyscript/simple_schedule_colors.py`. |

## Install

**HACS** — add this repository as a custom repository of type **Dashboard**, install, then
add the resource `/local/simple-schedule-card/dist/simple-schedule-card.js` as a JavaScript
module.

**Manual** — copy `dist/simple-schedule-card.js` into `config/www/` and register it under
*Settings → Dashboards → Resources*.

## Usage

The minimum:

```yaml
type: custom:simple-schedule-card
entity: calendar.school
orientation: days-as-rows
```

A school timetable with a sibling's on the same card:

```yaml
type: custom:simple-schedule-card
orientation: days-as-rows
entities:
  - entity: calendar.alex_school
    person: person.alex
  - entity: calendar.sam_school
    person: person.sam
  - entity: calendar.family
    person: person.jo
    calendar_mode: full
    view_width_mode: adaptive
time_format: '24'
```

## Options

| Option | Type | Default | Description |
|---|---|---|---|
| `type` | string | **required** | `custom:simple-schedule-card` |
| `entity` | string | – | A single calendar. Shorthand for a one-item `entities`. |
| `entities` | list | – | One or more calendars. Each is either an `entity_id` string or the object below. Wins over `entity` when both are given. |
| `orientation` | `days-as-columns` \| `days-as-rows` | `days-as-columns` | Which axis the days run along. `days-as-rows` is the printed-timetable shape and the one everything below is tuned for; `days-as-columns` is the calendar shape, days across the top and time down the left. |
| `days` | `auto` \| `mon-fri` \| `mon-sun` | `auto` | Which days are drawn. `auto` draws Mon–Fri and adds **both** weekend days as soon as either has an event. The card always fetches the full seven. |
| `day_start` | `HH:MM` \| `auto` | `07:00` | Start of the time axis. `auto` uses the week's earliest event exactly, applied to every day together. Ignored under `calendar_mode: full`. |
| `day_end` | `HH:MM` \| `auto` | `15:00` | End of the time axis. `auto` uses the week's latest event. |
| `hour_width` | number | `192` | `days-as-rows`: pixels per hour. Sized so a 45-minute block holds about 16 characters. |
| `day_height` | number | `72` | `days-as-rows`: pixels per lane within a day's row. |
| `hour_height` | number | `84` | `days-as-columns`: pixels per hour. |
| `lane_mode` | `by_source` \| `packed` | `by_source` | How a day is divided into lanes — see below. |
| `time_format` | `auto` \| `12` \| `24` | `auto` | `auto` follows Home Assistant's own setting. Pin it to `24` for a timetable without changing the rest of the frontend. |
| `show_refresh` | boolean | `true` | Show the refresh button. |
| `show_mode_toggles` | boolean | `true` | Show the two mode toggles in the middle of the header — see below. Turn them off for a kiosk nobody should be reshaping. |
| `mode_toggle_icons` | `crop` \| `timeline` \| `calendar` \| `arrows` | `crop` | Which icons those toggles use. Purely cosmetic; all four say the same thing. |
| `animations` | `auto` \| `always` \| `off` | `auto` | `auto` follows the operating system's reduce-motion setting. `always` animates regardless — see below. `off` never animates. |
| `layout` | `auto` \| `grid` \| `list` | `auto` | `auto` picks by the card's own measured width. |
| `layout_breakpoint` | number | `560` | Width in px below which `auto` uses the list. |
| `event_colors` | map | `{}` | Colour by event title, e.g. `Lunch: '#f4c542'`. Matched case-insensitively on the whole summary. An explicit override that beats everything, including the colour helper. |
| `min_contrast` | number | `4.5` | Minimum contrast between a block's fill and its white label; lighter fills are darkened until they pass. `3.5` for a brighter grid, `0` to use Google's palette untouched. |
| `color_helper` | boolean \| string | `true` | Use the per-event colours published by the pyscript helper. `false` ignores it; a string points at a different path. |

Each entry in `entities`:

| Option | Type | Default | Description |
|---|---|---|---|
| `entity` | string | **required** | A `calendar.*` entity id. |
| `person` | string | – | A `person.*` whose picture becomes the calendar's avatar. |
| `calendar_mode` | `focused` \| `full` | `focused` | `focused` fits the time axis to that calendar's own events. `full` draws the whole day, midnight to midnight, and opens scrolled to the first event. |
| `view_width_mode` | `fixed` \| `adaptive` | `fixed` | `fixed` gives every hour `hour_width` pixels, so a block of a given length looks the same on any screen and the grid scrolls when the day is wider than the card. `adaptive` fits the whole span into the card, so nothing scrolls. `days-as-rows` only. |

There is deliberately **no `name`** and **no `color`** per calendar. Both come from Home
Assistant, and the colour helper keeps them in step with Google.

The two per-calendar modes combine freely:

| | `fixed` | `adaptive` |
|---|---|---|
| **`focused`** | the school-timetable default: constant block widths, scrolls past the edge | the week squeezed into the card, no scrolling |
| **`full`** | the whole day at full size — a lot of scrolling, every hour legible | the whole day at a glance, hours compressed to fit |

### The calendar is the heading

Avatar, the calendar's own name and — with more than one configured — a chevron, all one
button. There is no separate card title. The name comes from Home Assistant and cannot be
overridden; renaming in Google reaches the card through the helper. Words are capitalised
the way Google lists them, leaving acronyms and apostrophes alone.

**One calendar is shown at a time.** All configured calendars are subscribed to, so
switching is instant. The time axis and the weekend rule are scoped to whichever calendar is
on screen, so one calendar's early start cannot rescale another's grid — and
`calendar_mode`/`view_width_mode` are per calendar for the same reason: a timetable and a
household calendar want different shapes.

The picture lives on the **person**, not on a Home Assistant user — a person can have one
without having a login at all — so `person:` points at a person even for someone who can
sign in. Without it, the avatar is the first letter of the calendar's name on the calendar's
own colour.

Opening the menu, or an event's detail sheet, dims the schedule and folds the blocks away
behind it; closing replays the week's entry animation.

### The mode toggles

Two buttons centred in the header flip the **active** calendar's `calendar_mode` and
`view_width_mode` without editing YAML. The width one appears only under `days-as-rows`, which
is the orientation with a horizontal axis to fit, and neither appears in the list layout, which
has no time axis at all.

Each button shows the mode it is currently **in**, not the one it would switch to — a toggle
that displays its own destination reads backwards the moment you look away — and inverts when it
is on the non-default setting, so a glance says whether the view has been reshaped.

Overrides are keyed by entity, so each calendar keeps its own shape while the card is open, and
they are **session only**: the configuration stays the source of truth and a reload returns to
it.

Note that `full` + `adaptive` squeezes twenty-four hours into the card, which puts a 45-minute
lesson at about 36px. That is the combination working as intended — `full` was meant for a
sparse calendar whose empty hours are worth seeing — but for a dense timetable `full` wants
`fixed`, so the hours stay legible and the grid scrolls.

### Editing events

The card is read-only until you put it into **edit mode**, from the ⋯ menu in the
header (which also holds Refresh). While it is on, a red **Edit Mode** pill sits
beside the calendar name, and tapping an event opens it for editing instead of
just showing it.

It is a mode rather than an edit button on every event because this card is a
wall display first: a timetable that can be changed by a stray tap is worse than
one that cannot be changed at all. Turning it on takes two deliberate actions and
the header says so, in red, for as long as it lasts.

**Adding one** works two ways, both only in edit mode:

- **Press and hold an empty part of the timeline.** After about half a second
  the slot you are holding fills in, and the new-event form opens already set to
  that day and time — rounded down to the nearest quarter hour, half an hour
  long. Let go early, or slide your finger, and nothing happens: the grid is
  also what a tablet gets held by. Holding an existing event does nothing
  either; that is a tap to open.
- **Press and hold a day's own cell** — the label down the left of the
  transposed grid, or across the top of the other one. Only that cell lights up,
  and you get that day at the current time. It is the same gesture the list
  offers on its day headings, so a day label means the same thing in all three
  layouts.
- **The + beside the Edit Mode pill**, which starts at today and the next
  quarter hour.

In the list layout — the phone — there is no timeline to press against, so the
day heading and the + are the only two ways in.

**A press into a gap fills exactly that gap.** A timetable is mostly five- and
fifteen-minute gaps between lessons, so the new event is cut short at whatever
starts next, and held back to whatever ended last — press between a lesson
ending at 10:15 and one starting at 10:20 and you get 10:15–10:20, not half an
hour lying across the next lesson. With nothing in the way it is the full half
hour.

The new event lands on the calendar currently on screen, and its form is the
edit form minus the things that do not apply yet: no Delete, no recurrence
scope — it is not a series until you say so, which is the next row.

**Repeat** folds away under the times, and offers Google's own list, generated
from the event's own date: *Does not repeat*, *Daily*, *Weekly on Tuesday*,
*Monthly on the second Tuesday*, *Annually on September 8*, *Every weekday
(Monday to Friday)*, and **Custom…**.

Custom is Google's dialog in this card's furniture: repeat every N
days/weeks/months/years, and which weekdays for a weekly rule. **Ends** folds
away under its own chevron — most rules never end — showing what is set when it
is shut, and opening onto *Never*, *On* a date, or *After* a count. Tap anywhere
on those rows, not just the dot. It says the rule back to you in words at the
bottom — *"Every 2 weeks on Monday and Wednesday, until 8 Dec 2026"* — because
that sentence is the thing that will still be true in a year. Nothing is written
until **Done**, and the days run Monday-first like the rest of the card rather
than Sunday-first like Google.

Whatever is live wears the calendar's colour: the chosen unit, the chosen days,
and the numbers themselves. A count under an unselected row stays plain, because
nothing is using it.

Repeat is offered when **creating** only. Changing the rule on a series that
already exists is a different operation, tangled up with the scope question
above it, and the form hides the row rather than showing one that lies.

For a recurring event the form asks what the change applies to:

| | |
|---|---|
| **This event** | only the occurrence you opened. The default. |
| **This and future** | this one and every later one; earlier ones are left alone. |
| **All events** | every occurrence, including ones already past. |

Delete takes two presses — the second one is irreversible, and typing anything in
the form disarms it again.

On a phone the form owns the gesture whether or not it has anything to scroll:
drag one that fits on screen and it gives a little and springs back, rather than
quietly scrolling the week behind it.

Saving and deleting hold the form open, still saying so, until the week behind it
has actually caught up — usually under two seconds. A write travels Google → Home
Assistant → card, and closing the moment Google said yes handed you back the
unchanged week for a few seconds, which reads as a failed edit.

The date and time fields are the card's own, not the browser's: a month grid with
40px days, and a scrolling drum for the time with 44px rows. They follow
`time_format`, so a card set to 24-hour shows 24-hour. Moving the start carries
the end along with it, keeping the event the same length. The time drum takes a
mouse as well as a thumb: click a number to go to it, or use the scroll wheel —
hours if you are hovering over hours, minutes if over minutes. Stepping the month
brings the new one in from the side it came from, a row at a time, and the panel
collapses on the way out instead of blinking away.

**Colour** sets Google's per-event colour, from its eleven-colour palette, plus
an empty slot meaning "whatever colour the calendar is". Note that event colour
is per Google *account* — see the section below — so this sets it for the account
Home Assistant is signed in as, which is the one the card reads back.

**Location** searches as you type and offers real addresses, biased towards
`zone.home` so a club down the road outranks one in another country. Picking one
fills the field and opens a map underneath.

The map button opens a **full-screen picker**: pan and zoom it, then **tap
anywhere to pick that spot** — the pin moves there and the address goes straight
into the field behind. Drag the pin to adjust, and **Done** closes it. So a place
with no useful address — a pitch, a car park, a side entrance — can be chosen by
pointing at it.

**Open in Maps** hands the place to the device's own maps app, which is also the
way to see it in Google's detail: the card's own tiles are Esri's keyless
topographic map, which names streets and draws buildings but has no house
numbers or business names.

The map borrows Home Assistant's own Leaflet, loaded on first use. If that is
ever unavailable it falls back to a still image of the same tiles: you lose the
panning, not the map.

Both halves are keyless. Home Assistant has no geocoder — nothing in core turns
text into a place, and the HACS `places` integration goes the other way, from
coordinates to an address — so the search is [Photon](https://photon.komoot.io),
which is built for type-ahead and allows browser requests. Google's own Places
Autocomplete would need a second API key with billing attached; the token the
calendar integration holds is scoped to Calendar and will not authenticate it.
The map tiles are Esri Canvas, because Home Assistant's own map card uses CARTO
and every CARTO basemap now returns tiles stamped "API KEY REQUIRED".

**Location and notes** sit last and stay folded away until there is something in
them. A school lesson has neither, and on the common event those two rows were
most of the form's height and all of it blank.

**This needs the pyscript helper** (`pyscript/simple_schedule_edit.py`). Home
Assistant cannot change a Google event on its own: the integration declares
create and delete only, so the helper talks to Google directly using the
credentials the integration already holds. Without it installed the card still
works; edit mode will simply report that the service is missing.

Recolouring a single occurrence with **This event** leaves the rest of the
series alone, as it should — but note this needs the colour helper at v1.1 or
later. Before that it mapped colours by event uid, which every occurrence of a
series shares, so one recoloured Monday repainted every Monday in the card. The
write to Google was always correct; only the display was wrong.

### If nothing animates

The card holds still when the operating system asks it to, and that setting is
easy to have on without knowing it — Windows' *Settings → Accessibility → Visual
effects → Animation effects* and macOS' *Reduce Motion* are both reported to the
browser as `prefers-reduced-motion`. The symptom is total: no week transition at
all, and a refresh button whose spinner sits motionless while it works. The same
dashboard on another machine animates fine.

That is correct behaviour for something being worked at and wrong for a kiosk on
a wall, so `animations: always` overrules it; `off` forces the opposite.

### `lane_mode`

Grouping is by **source calendar** — never by the event's title, and never by how close two
events are in time. Give each kind of activity its own calendar entity and the card does the
rest.

- **`by_source`** (default) gives every configured calendar its own lane inside every day,
  present whether or not it has anything that day. Gymnastics is reliably the same stripe on
  every row. A calendar that overlaps *itself* — a class split into two groups at the same
  hour — sub-divides its own lane, and every other calendar is given the same subdivision so
  the grid stays even.
- **`packed`** pools all calendars into one set of lanes that appear only where events
  genuinely overlap. Denser, but a given calendar is not always in the same place.

Back-to-back events are a *sequence*, not an overlap: 08:30–09:15 followed by 09:30–10:15,
and exactly abutting ones like 11:05–12:05 then 12:05–12:50, share one lane. Only genuine
overlap adds a lane.

### Colours

A calendar's colour is read automatically from the entity registry, where Home Assistant
stores the `backgroundColor` Google reports for that calendar.

**Per-event colours need the optional helper.** If you paint one event yellow in Google
Calendar, that colour never reaches any card on its own: Google returns a `colorId` on every
event and the underlying library parses it, but `_get_calendar_event()` in the `google`
integration copies only eight fields into Home Assistant's `CalendarEvent`, and colour is not
one of them — the dataclass has no colour field. Every calendar card has this limitation.

Home Assistant does still *persist* that colour with the synced event, it simply offers no
way to read it. `pyscript/simple_schedule_colors.py` reads it back out of that store and
publishes it for the card, so blocks match Google one-to-one. See **The colour helper**
below.

If you would rather not run it, either name the event in `event_colors`, or give the
activity its own calendar — a separate `calendar.*` entity carries its own colour and, with
`lane_mode: by_source`, gets its own lane.

### The colour helper

Optional. Requires [pyscript](https://github.com/custom-components/pyscript).

1. Symlink (or copy) `pyscript/simple_schedule_colors.py` into `<config>/pyscript/`.
2. `pyscript.reload`, then call `pyscript.simple_schedule_colors_sync` once.
3. It writes `<config>/www/simple-schedule-card-data/event-colors.json`, refreshing at
   startup and every 15 minutes — the same interval the Google integration itself syncs on,
   so nothing is gained by going faster.

It also keeps each **calendar's** own colour and **name** in step with Google. Home Assistant
copies both once, when the calendar entity is first registered, and never looks again — so
recolouring or renaming a calendar in Google otherwise has no effect. The helper lists the
calendars through the integration's own authenticated service and writes any change into the
entity registry, which is the field both this card and Home Assistant's own calendar panel
read. Turn it off with `simple_schedule_colors_sync_calendars: false`.

Every hex value comes from Google. The helper calls `colors.get`, which returns both the
calendar and the event palette, so nothing is hardcoded — which matters, because Google only
returns a true `backgroundColor` when the request sets `colorRgbFormat=true` and the
underlying library never does. Calendars on a stock palette colour therefore report their
palette *index* (`#00000a` is id 10, not near-black), and the palette resolves it.

Event colours themselves are read from the local store with no API call. A full run is about
a second, most of which is the two palette/calendar-list requests; the event pass over ~3,500
events is ~150 ms of that.

Note that blocks will not look identical to Google. Google puts **dark** text on its fills;
this card uses white, so fills are darkened to keep the label readable — see `min_contrast`.
Raise or lower that to taste.

Google's web UI also darkens its palette in dark mode, so a colour eyedroppered off your
screen will not match the API's value either. Override any colour id if you want the
on-screen shade:

```yaml
pyscript:
  simple_schedule_colors_palette:
    "5": "#e7ba51"    # Banana, as the dark-mode UI paints it
```

### Freshness

Events are pushed over a WebSocket subscription, so anything Home Assistant already knows
appears immediately — nothing polls.

Google's calendar coordinator serves reads from a cache it refreshes every 15 minutes, so an
edit made in Google is not in Home Assistant at all until then. The **refresh button** drives
the whole chain rather than just re-reading: it calls `homeassistant.update_entity` to start
the poll at once, waits for it to land, asks the colour helper to republish, then
re-subscribes and re-reads the colours. A press takes a few seconds and picks up an edit made
in Google seconds earlier.

## Design rules

The card is read from across a room, and that drove most of what it looks like:

- It sits on the theme's own `--ha-card-background`, not on a translucent panel.
- **No grey text.** Importance is carried by size and weight only.
- **Square.** No `border-radius` anywhere.
- **Blocks are opaque**, at the calendar's true colour, with white labels — the fill is
  darkened when white would not read on it, rather than the label changing colour.
- **No today or now markers** in the grid. The card shows a week, flat. (The list marks the
  current day, where there is no column to read it from.)
- Nothing is ever inferred: no glosses, translations or keyword icons. The card renders what
  the calendar says.

## Development

```bash
npm install
npm run typecheck
npm test          # vitest over the pure modules in src/data
npm run build     # single-file ESM bundle into dist/
```

`dist/simple-schedule-card.js` is **committed** so the repo installs through HACS with no
build step. CI rebuilds on every push and warns if the committed bundle has gone stale.

See [CLAUDE.md](CLAUDE.md) for the architecture and the decisions behind it.

## Licence

MIT.
