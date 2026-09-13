"""
simple_schedule_colors — publish Google Calendar's PER-EVENT colours for
simple-schedule-card.

Why this exists
---------------
Google gives every event an optional colour of its own (Lunch yellow, lessons
salmon), separate from the colour of the calendar it lives on. `gcal_sync` asks
Google for that field, parses it, and Home Assistant writes it to disk with the
rest of the synced event -- but `_get_calendar_event()` in the `google`
integration copies only eight fields into Home Assistant's own `CalendarEvent`,
and colour is not one of them. The dataclass has no colour field at all, so no
card, template or service can ever see it. Only the calendar-level colour
survives, which is why every event in a calendar comes out the same shade.

This reads the colour back out of the store Home Assistant has already written
and publishes it as a small JSON file the card fetches. No Google API calls, no
credentials, no extra network traffic: the data is already on disk, it is simply
not reachable through any supported API.

If this script is not running the card falls back to the calendar-level colour,
so it is entirely optional.

PERFORMANCE -- READ BEFORE EDITING
----------------------------------
pyscript does not run Python, it walks an AST, roughly two orders of magnitude
slower than CPython. An earlier version of this file recursed through every node
of the 3.4 MB store looking for events, on a `cron(* * * * *)` trigger. Each run
took minutes, runs piled up on each other, a core sat at 100% and Home
Assistant's event loop starved until the container was restarted.

So, two rules here:

  * Navigate the KNOWN PATH below. Never scan or recurse the document. The path
    costs ~3.5k iterations; a blind walk costs ~500k node visits.
  * Keep the interval far longer than a run takes, and hold the _RUNNING guard.
    Polling fast buys nothing anyway: the Google coordinator only syncs every
    15 minutes, so the data underneath cannot change faster than that.

`json.loads` is native C and cheap. It is YOUR OWN LOOPS that cost.

Store layout (an implementation detail of the google integration, and the one
thing here that could break on a Home Assistant upgrade -- see _extract):

    data
      <calendar_key>
        event_sync
          <account>
            items
              <event_id> -> { ical_uuid, summary, color_id, ... }

It also keeps each calendar's OWN colour and NAME in step with Google. Home Assistant
copies that colour once, when the calendar entity is first registered, and never
looks again -- so recolouring a calendar in Google silently has no effect, and
events with no per-event colour keep rendering in whatever shade was current on
import day. This lists the calendars through the integration's own authenticated
service and writes any change into the entity registry, which is the same field
the entity-settings colour picker sets. Google stays the single place you pick
colours, and Home Assistant's own calendar panel benefits too, not just the card.

Configuration (all optional), under `pyscript:` in configuration.yaml:

    pyscript:
      simple_schedule_colors_out: /config/www/simple-schedule-card-data
      simple_schedule_colors_palette:      # override any Google colour id
        "5": "#e7ba51"
      simple_schedule_colors_sync_calendars: false   # stop touching the registry
                                                     # (colour AND name)

Exposes `pyscript.simple_schedule_colors_sync` to refresh on demand.
"""

import glob
import json
import os
import re
import time

# Fallback only. The live palettes are fetched from Google's colors endpoint
# (see _fetch_palettes) so nothing here is guessed; these values are used only if
# that call fails, and they are what the endpoint returns today anyway.
#
# They are NOT what the Google web UI paints in dark mode -- it darkens them --
# so if you have eyedroppered a colour off your screen and want an exact match,
# override the id you care about via `simple_schedule_colors_palette`.
EVENT_PALETTE = {
    "1": "#7986cb",   # Lavender
    "2": "#33b679",   # Sage
    "3": "#8e24aa",   # Grape
    "4": "#e67c73",   # Flamingo
    "5": "#f6bf26",   # Banana
    "6": "#f4511e",   # Tangerine
    "7": "#039be5",   # Peacock
    "8": "#616161",   # Graphite
    "9": "#3f51b5",   # Blueberry
    "10": "#0b8043",  # Basil
    "11": "#d50000",  # Tomato
}

STORAGE_GLOB = "/config/.storage/google.*"
DEFAULT_OUT = "/config/www/simple-schedule-card-data"
OUT_NAME = "event-colors.json"

# Set while a sync is in flight. Two runs must never overlap: that is what took
# Home Assistant down the first time.
_RUNNING = False
# entity_id -> the Google summary we have already reloaded for, so a rename that
# never converges cannot put the config entry into a reload loop.
_NAME_RELOAD_TRIED = {}


# pyscript sandboxes builtins.open (it does not write), so all file I/O here is
# low-level os.open/os.read/os.write. glob is loop-protected by HA and goes
# through task.executor.

def _cfg(name, default):
    cfg = pyscript.config
    if isinstance(cfg, dict):
        val = cfg.get("simple_schedule_colors_" + name)
        if val is not None:
            return val
    return default


def _write_bytes(path, data):
    tmp = path + ".tmp"
    fd = os.open(tmp, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o644)
    try:
        os.write(fd, data)
    finally:
        os.close(fd)
    os.replace(tmp, path)  # atomic: the card never fetches a half-written file


def _read_json(path):
    """Parse a JSON file via low-level os I/O; None if missing or corrupt."""
    try:
        fd = os.open(path, os.O_RDONLY)
        try:
            chunks = []
            while True:
                chunk = os.read(fd, 1048576)
                if not chunk:
                    break
                chunks.append(chunk)
        finally:
            os.close(fd)
        return json.loads(b"".join(chunks).decode("utf-8"))
    except (OSError, ValueError):
        return None


def _google_service():
    """The first loaded Google config entry's authenticated API service."""
    for entry in hass.config_entries.async_entries("google"):
        runtime = getattr(entry, "runtime_data", None)
        service = getattr(runtime, "service", None)
        if service is not None:
            return service
    return None


def _fetch_palettes():
    """Google's own colour definitions: (event palette, calendar palette).

    `colors.get` returns both maps keyed by the same ids that appear on an
    event's `color_id` and in a calendar's colour field. Fetching them means no
    hex value here is guessed. Google notes the palette rarely changes, so a
    failure is not worth retrying hard -- the built-in EVENT_PALETTE covers it.
    """
    service = _google_service()
    if service is None:
        return {}, {}
    try:
        colors = service.async_get_colors()
    except Exception as err:  # noqa: BLE001
        log.warning(f"simple_schedule_colors: could not fetch colour palette: {err}")
        return {}, {}
    events = {k: v.background for k, v in (colors.event or {}).items() if v.background}
    calendars = {k: v.background for k, v in (colors.calendar or {}).items() if v.background}
    return events, calendars


def _palette(from_google):
    """Built-in fallback, then Google's live palette, then the user's overrides."""
    merged = {}
    merged.update(EVENT_PALETTE)
    merged.update(from_google or {})
    override = _cfg("palette", None)
    if isinstance(override, dict):
        for key, value in override.items():
            merged[str(key)] = value
    return merged


def _extract(data, palette, by_uid, by_recurrence_id):
    """Walk the KNOWN path only. See the performance note at the top.

    `data` is the store's inner mapping of calendar_key -> calendar. Every level
    is defensive: if a Home Assistant upgrade reshapes the store this quietly
    finds nothing rather than raising, and the card falls back to calendar-level
    colour. Counting events lets the caller notice that case.
    """
    seen = 0
    if not isinstance(data, dict):
        return seen

    for calendar in data.values():
        if not isinstance(calendar, dict):
            continue
        event_sync = calendar.get("event_sync")
        if not isinstance(event_sync, dict):
            continue
        for account in event_sync.values():
            if not isinstance(account, dict):
                continue
            items = account.get("items")
            if not isinstance(items, dict):
                continue
            for event in items.values():
                seen += 1
                color_id = event.get("color_id")
                if not color_id:
                    # No per-event colour: the event inherits its calendar's
                    # colour, which the card already knows. Emitting nothing
                    # lets it fall through rather than pinning it to a guess.
                    continue
                hex_color = palette.get(str(color_id))
                if not hex_color:
                    continue
                # A singly-modified occurrence of a recurring series carries its
                # own colour and its own id. The card sees that id as
                # `recurrence_id` and checks this map first, so the exception
                # beats the series it belongs to.
                #
                # It must go in THAT MAP ONLY. Every occurrence of a series
                # shares one ical_uuid, so writing an exception's colour under
                # the uid as well repainted the entire series with it: recolour
                # one Monday and every Monday changed, which is precisely what
                # "this event only" promises not to do. by_uid carries
                # SERIES-level colour — the master, which has no
                # recurring_event_id — and one-off events, nothing else.
                if event.get("recurring_event_id"):
                    if event.get("id"):
                        by_recurrence_id[event["id"]] = hex_color
                    continue
                uid = event.get("ical_uuid")
                if uid:
                    by_uid[uid] = hex_color
    return seen


def _sync():
    global _RUNNING
    if _RUNNING:
        log.warning("simple_schedule_colors: previous sync still running, skipping")
        return None
    _RUNNING = True
    try:
        started = time.monotonic()
        event_palette_google, calendar_palette = _fetch_palettes()
        palette = _palette(event_palette_google)
        by_uid = {}
        by_recurrence_id = {}
        seen = 0
        stores = 0

        reload_entries = set()
        try:
            _, reload_entries = _sync_calendar_meta(calendar_palette)
        except Exception as err:  # noqa: BLE001 - event colours must still publish
            log.warning(f"simple_schedule_colors: calendar metadata sync failed: {err}")

        # Prefer Home Assistant's IN-MEMORY store. LocalCalendarStore buffers
        # writes to disk for STORAGE_SAVE_DELAY_SECONDS (120s), so the file on
        # disk lags a sync by up to two minutes -- which makes a "refresh now"
        # button useless for colours. The in-memory copy is updated the moment
        # the coordinator finishes. The file is only a fallback for when the
        # config entry is not loaded.
        for entry in hass.config_entries.async_entries("google"):
            runtime = getattr(entry, "runtime_data", None)
            store = getattr(runtime, "store", None)
            if store is None:
                continue
            try:
                data = store.async_load()
            except Exception as err:  # noqa: BLE001
                log.warning(f"simple_schedule_colors: in-memory store unreadable: {err}")
                continue
            stores += 1
            seen += _extract(data, palette, by_uid, by_recurrence_id)

        if not stores:
            for path in task.executor(glob.glob, STORAGE_GLOB):
                store_file = _read_json(path)
                if store_file is None:
                    log.warning(f"simple_schedule_colors: could not read {path}")
                    continue
                stores += 1
                seen += _extract(store_file.get("data"), palette, by_uid, by_recurrence_id)

        elapsed_ms = int((time.monotonic() - started) * 1000)
        out_dir = _cfg("out", DEFAULT_OUT)
        os.makedirs(out_dir, exist_ok=True)
        _write_bytes(
            os.path.join(out_dir, OUT_NAME),
            json.dumps(
                {
                    "version": 1,
                    "generated": int(time.time()),
                    "elapsed_ms": elapsed_ms,
                    "events_seen": seen,
                    "stores": stores,
                    "by_uid": by_uid,
                    "by_recurrence_id": by_recurrence_id,
                }
            ).encode("utf-8"),
        )
        # Last, so a reload cannot pull the store out from under the pass above.
        for entry_id in reload_entries:
            try:
                hass.config_entries.async_reload(entry_id)
            except Exception as err:  # noqa: BLE001
                log.warning(f"simple_schedule_colors: entry reload failed: {err}")

        if not seen:
            log.warning(
                "simple_schedule_colors: no events found. The google store layout may "
                "have changed on a Home Assistant upgrade; see _extract()."
            )
        return elapsed_ms
    finally:
        _RUNNING = False


def _usable_color(color):
    """Reject the colorId-shaped values Google hands back for palette calendars.

    `calendarList.list` only returns true `backgroundColor` when the request asks
    for `colorRgbFormat=true`. gcal_sync's CalendarListRequest has no such
    option and never sends it, so calendars using one of Google's stock palette
    colours come back with their palette INDEX sitting in the colour field:
    #000001, #000005, #000008, #00000a are ids 1, 5, 8 and 10, not near-black.

    Writing those would paint a calendar black. There is no reliable way to map
    an index back to a hex value from here -- the palette that would resolve it
    lives behind a separate colors.get call -- so these are skipped and whatever
    colour Home Assistant already has is left alone.
    """
    if not isinstance(color, str):
        return False
    if not re.match(r"^#[0-9a-fA-F]{6}$", color):
        return False
    red = int(color[1:3], 16)
    green = int(color[3:5], 16)
    blue = int(color[5:7], 16)
    return not (red == 0 and green == 0 and blue <= 32)


def _palette_index(color):
    """The palette id hiding in an index-shaped colour, else None.

    Google only returns a true `backgroundColor` when the request sets
    `colorRgbFormat=true`. gcal_sync's CalendarListRequest has no such option and
    never sends it, so a calendar using one of Google's stock palette colours
    comes back with its palette INDEX in the colour field: #000001, #000005,
    #000008 and #00000a are ids 1, 5, 8 and 10, not near-black. Painting those
    literally turns a calendar black, so they are resolved through the calendar
    palette instead.
    """
    if not isinstance(color, str) or not re.match(r"^#[0-9a-fA-F]{6}$", color):
        return None
    value = int(color[1:], 16)
    return str(value) if 1 <= value <= 32 else None


def _sync_calendar_meta(calendar_palette):
    """Keep each Google calendar's colour AND name in step in the entity registry.

    Colour: `CalendarEntity.get_initial_entity_options()` only runs when the
    registry entry is CREATED, so HA's copy is a snapshot from import day and a
    recolour in Google never propagates. Deleting and re-adding the entity does
    not fix it either -- the restore path reuses the deleted entry's saved
    options. Writing the registry directly is the only thing that does, and it is
    exactly what the entity-settings colour picker writes.

    Name: `original_name` cannot be written from here. It is owned by the
    integration -- the live entity re-asserts it the instant the registry entry
    changes, so an external write returns an updated entry and is then silently
    reverted (measured: the returned entry carries the new name, the very next
    read does not, while an `icon` written in the same call sticks). The only
    thing that updates it is the integration re-reading the calendar list, which
    happens on config entry setup. So a detected rename schedules a RELOAD of
    that entry rather than a registry write.

    Both are matched on the calendar's Google id, which is the tail of the
    entity's unique_id and never changes on a rename. Renaming a calendar to
    anything at all keeps the same entity, entity_id, history and events; only
    deleting and recreating it in Google would mint a new id and a new entity.

    A user override set in HA's entity settings always wins: `name` shadows
    `original_name` for display, so writing `original_name` cannot clobber a name
    the user chose deliberately.

    Only writes when a value actually differs, so this is a no-op on almost every
    run and does not churn the registry.
    """
    if _cfg("sync_calendars", True) is False:
        return 0, set()

    from homeassistant.helpers import entity_registry as er

    registry = er.async_get(hass)
    updated = 0
    reload_entries = set()

    for entry in hass.config_entries.async_entries("google"):
        runtime = getattr(entry, "runtime_data", None)
        service = getattr(runtime, "service", None)
        if service is None:
            continue  # entry not loaded yet
        try:
            listing = service.async_list_calendars()
        except Exception as err:  # noqa: BLE001 - never break the colour publish
            log.warning(f"simple_schedule_colors: could not list calendars: {err}")
            continue

        # unique_id is "<account>-<calendar_id>", so the calendar id is a suffix.
        google_entities = [
            ent
            for ent in registry.entities.values()
            if ent.platform == "google" and ent.domain == "calendar"
        ]

        for calendar in listing.items:
            color = getattr(calendar, "background_color", None)
            index = _palette_index(color)
            if index is not None:
                # An index, not a colour -- resolve it, or skip rather than
                # painting the calendar near-black.
                color = calendar_palette.get(index)
            summary = getattr(calendar, "summary", None)

            for ent in google_entities:
                if not ent.unique_id or not ent.unique_id.endswith(calendar.id):
                    continue

                if _usable_color(color):
                    current = (ent.options or {}).get("calendar", {}).get("color")
                    if current != color:
                        registry.async_update_entity_options(
                            ent.entity_id, "calendar", {"color": color}
                        )
                        updated += 1
                        log.info(
                            f"simple_schedule_colors: {ent.entity_id} colour "
                            f"{current} -> {color}"
                        )

                if summary and ent.original_name != summary:
                    # Reload once per distinct rename. If the reload does not
                    # make the names agree -- a prefix rule, a user override --
                    # do not reload again on every tick forever.
                    if _NAME_RELOAD_TRIED.get(ent.entity_id) != summary:
                        _NAME_RELOAD_TRIED[ent.entity_id] = summary
                        reload_entries.add(entry.entry_id)
                        log.info(
                            f"simple_schedule_colors: {ent.entity_id} renamed "
                            f"{ent.original_name!r} -> {summary!r}, reloading entry"
                        )
    return updated, reload_entries


@service
def simple_schedule_colors_sync():
    """Rebuild the per-event colour map now."""
    _sync()


@time_trigger("startup")
def simple_schedule_colors_startup():
    """Publish once at startup so the card has colours on the first paint."""
    _sync()


# Every 15 minutes, matching the google coordinator's own sync interval -- the
# data underneath genuinely cannot change faster than that, so a tighter cron
# would only burn CPU. A measured run is ~160ms, so runs cannot overlap; the
# _RUNNING guard is belt and braces.
@time_trigger("cron(*/15 * * * *)")
def simple_schedule_colors_tick():
    _sync()
