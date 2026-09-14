"""
simple_schedule_edit — create, change and delete Google Calendar events for
simple-schedule-card.

Why this exists
---------------
Home Assistant cannot change a Google event. The `google` integration declares
`CREATE_EVENT | DELETE_EVENT` and nothing else, and has no `async_update_event`
method at all, so core's `calendar/event/update` websocket command refuses with
"Calendar does not support event update". The entities here report
`supported_features: 3`, which is exactly those two bits.

What core does offer is also narrower than it looks:

  * `calendar.create_event` (the SERVICE) has no rrule field, so it cannot make a
    recurring event. Only the websocket command can.
  * Deleting one occurrence writes an EXDATE into the series and is one-way.
  * There is no way to set an event's colour through any of it.

So this talks to Google directly, using the credentials the integration already
holds: the OAuth token from `.storage/core.config_entries` and the client id and
secret from `.storage/application_credentials`. Nothing new to configure, and no
second authorisation — it acts as the same account the integration does.

WHOSE COLOURS YOU SEE, AND WHY THAT MATTERS HERE
------------------------------------------------
An event's colour is per Google ACCOUNT, not per event. On a calendar the family
account owns but a family member works in from their own account, colours that
member sets are invisible to every other account, this one included. Writing a
colour here therefore sets it for the account the integration is signed in as —
which is the account Home Assistant reads back, so it will show on the card. It
does not touch, and cannot see, what anyone else has set for themselves.

Content is different: summary, times, description, location, recurrence and
deletion live on the event itself, so a change made here is a change everyone
with access sees.

PERFORMANCE AND SAFETY — READ BEFORE EDITING
---------------------------------------------
pyscript walks an AST rather than running Python, roughly two orders of magnitude
slower than CPython, and it runs inside Home Assistant's event loop. See
`simple_schedule_colors.py` for the outage a tight loop in here once caused.

  * Network I/O uses Home Assistant's own aiohttp session and is awaited. A bare
    urlopen would block the whole instance for the round trip, and the usual
    escape hatch is closed: `task.executor` REFUSES functions defined in a
    pyscript file, because they are AST objects rather than real Python ones.
    That is also why the store reads are done inline, as the colours helper does.
  * These services WRITE to a real calendar. Each one resolves its target and
    refuses rather than guessing: an unknown entity, a calendar that is not
    Google's, or a missing event id is an error, never a best effort.
  * Nothing here retries on its own. A failed write is reported and left alone,
    because a retry that half-succeeded on a recurring series is much worse than
    an error message.
"""

import datetime
import json
import os
import time
import urllib.parse

from homeassistant.helpers.aiohttp_client import async_get_clientsession

CONFIG_ENTRIES = "/config/.storage/core.config_entries"
ENTITY_REGISTRY = "/config/.storage/core.entity_registry"
APP_CREDENTIALS = "/config/.storage/application_credentials"

API_ROOT = "https://www.googleapis.com/calendar/v3"
TOKEN_URL = "https://oauth2.googleapis.com/token"
HTTP_TIMEOUT = 20

# Refresh this long before the token actually expires, so a call that starts just
# under the wire does not land just over it.
TOKEN_SKEW_S = 120

# Google's own event palette. The API takes the ID, not the hex, and rejects
# anything outside 1-11.
COLOR_IDS = {
    "1": "#a4bdfc",   # Lavender
    "2": "#7ae7bf",   # Sage
    "3": "#dbadff",   # Grape
    "4": "#ff887c",   # Flamingo
    "5": "#fbd75b",   # Banana
    "6": "#ffb878",   # Tangerine
    "7": "#46d6db",   # Peacock
    "8": "#e1e1e1",   # Graphite
    "9": "#5484ed",   # Blueberry
    "10": "#51b749",  # Basil
    "11": "#dc2127",  # Tomato
}

# Scope of a change to a recurring event.
#
#   instance — this one occurrence, by patching the occurrence's own id
#   future   — this one and every later one, leaving the past alone
#   series   — every occurrence there has ever been, by patching the master
#
# Only the first and last are single API calls. Google has no "this and
# following" operation: what its own UI does, and what happens here, is to cap
# the existing series with an UNTIL just before this occurrence and — for an
# edit — start a NEW series from it. That means a future-scoped edit produces a
# new event id, exactly as it does in Google Calendar itself.
SCOPE_INSTANCE = "instance"
SCOPE_FUTURE = "future"
SCOPE_SERIES = "series"
SCOPES = (SCOPE_INSTANCE, SCOPE_FUTURE, SCOPE_SERIES)

# Cached access token, so a burst of edits does not re-read the store each time.
# {"token": str, "expires_at": float}
_TOKEN = {}


# --------------------------------------------------------------------------- #
# Plumbing
# --------------------------------------------------------------------------- #

def _read_json(path):
    """
    Read a JSON file with low-level I/O.

    `builtins.open` is sandboxed in pyscript, and `task.executor` is NOT an
    option either: it rejects anything defined in a pyscript file, because those
    are AST objects rather than real Python functions ("pyscript functions can't
    be called from task.executor"). So this reads on the event loop, exactly as
    simple_schedule_colors.py does. os.read is native and the stores here are a
    megabyte or so; json.loads is C. It is YOUR OWN LOOPS that cost in pyscript.
    """
    fd = os.open(path, os.O_RDONLY)
    try:
        chunks = []
        while True:
            chunk = os.read(fd, 1 << 20)
            if not chunk:
                break
            chunks.append(chunk)
    finally:
        os.close(fd)
    return json.loads(b"".join(chunks).decode("utf-8"))


def _session():
    """Home Assistant's shared aiohttp session."""
    return async_get_clientsession(hass)


async def _http(method, url, headers=None, json_body=None, form=None):
    """
    One HTTP round trip, properly async.

    aiohttp rather than urllib because this runs ON Home Assistant's event loop:
    a blocking urlopen would freeze the whole instance for the round trip, and
    the usual escape hatch - handing it to task.executor - is closed here (see
    _read_json). Returns (status, parsed-json-or-None) and never raises for an
    HTTP error status; the caller decides what a 404 means.
    """
    resp = await _session().request(
        method, url, headers=headers, json=json_body, data=form, timeout=HTTP_TIMEOUT
    )
    status = resp.status
    text = await resp.text()
    resp.release()
    if not text:
        return status, None
    try:
        return status, json.loads(text)
    except ValueError:
        return status, {"raw": text[:400]}


async def _google_entry():
    """The google config entry, or None."""
    store = _read_json(CONFIG_ENTRIES)
    for entry in store["data"]["entries"]:
        if entry.get("domain") == "google":
            return entry
    return None


async def _access_token():
    """
    A valid access token for the integration's account.

    Home Assistant refreshes its own copy on its own schedule, so the stored
    token is usually current and is used as-is. When it is not, this refreshes
    with the stored refresh token and keeps the result IN MEMORY ONLY — writing
    back to .storage behind Home Assistant's back would race its own refresh.
    """
    now = time.time()
    if _TOKEN.get("token") and _TOKEN.get("expires_at", 0) > now + TOKEN_SKEW_S:
        return _TOKEN["token"]

    entry = await _google_entry()
    if not entry:
        raise ValueError("no Google config entry — is the integration set up?")
    token = entry["data"]["token"]

    if token.get("expires_at", 0) > now + TOKEN_SKEW_S:
        _TOKEN["token"] = token["access_token"]
        _TOKEN["expires_at"] = token["expires_at"]
        return _TOKEN["token"]

    creds = _read_json(APP_CREDENTIALS)
    client = None
    for item in creds["data"]["items"]:
        if item.get("domain") == "google":
            client = item
            break
    if not client:
        raise ValueError("no Google application credentials on file")

    status, payload = await _http(
        "POST",
        TOKEN_URL,
        form={
            "client_id": client["client_id"],
            "client_secret": client["client_secret"],
            "refresh_token": token["refresh_token"],
            "grant_type": "refresh_token",
        },
    )
    if status != 200 or not payload.get("access_token"):
        raise ValueError(f"token refresh failed ({status}): {payload}")

    _TOKEN["token"] = payload["access_token"]
    _TOKEN["expires_at"] = time.time() + payload.get("expires_in", 3600)
    return _TOKEN["token"]


async def _calendar_id(entity_id):
    """
    Resolve a calendar entity to the Google calendar id behind it.

    The registry's unique_id is the account email, a hyphen, then the calendar
    id. The email is stripped by LENGTH using the config entry's own unique_id
    rather than by splitting on the first hyphen, because an account address is
    allowed to contain one and a wrong split here would edit the wrong calendar.
    """
    registry = _read_json(ENTITY_REGISTRY)
    found = None
    for ent in registry["data"]["entities"]:
        if ent.get("entity_id") == entity_id:
            found = ent
            break
    if not found:
        raise ValueError(f"{entity_id} is not in the entity registry")
    if found.get("platform") != "google":
        raise ValueError(f"{entity_id} is a {found.get('platform')} calendar, not Google")

    entry = await _google_entry()
    prefix = (entry or {}).get("unique_id")
    unique = found.get("unique_id") or ""
    if prefix and unique.startswith(prefix + "-"):
        return unique[len(prefix) + 1:]
    raise ValueError(f"cannot read a calendar id out of unique_id {unique!r}")


async def _api(method, path, body=None, params=None):
    token = await _access_token()
    url = API_ROOT + path
    if params:
        url = url + "?" + urllib.parse.urlencode(params)
    status, payload = await _http(
        method, url, headers={"Authorization": "Bearer " + token}, json_body=body
    )
    if status >= 400:
        message = payload
        if isinstance(payload, dict):
            err = payload.get("error")
            if isinstance(err, dict):
                message = err.get("message", err)
        raise ValueError(f"Google API {method} {path} failed ({status}): {message}")
    return payload


def _rfc3339(value, all_day):
    """
    Normalise a time into the shape Google's start/end objects take.

    Dates and date-times are different FIELDS, not different formats, and mixing
    them is a 400.

    A naive time is sent as naive plus an explicit `timeZone`, rather than being
    resolved to an offset here. Two reasons. Google rejects a bare local time
    outright - "Missing time zone definition for start time" - and, more
    importantly, the obvious fix of calling .astimezone() would resolve it
    against the CONTAINER's clock, which is not necessarily Home Assistant's.
    A timetable saying 08:30 means 08:30 where the school is, so Home Assistant's
    own configured zone is the authority. It is also the same convention the
    card's subscription window uses.
    """
    if all_day:
        return {"date": str(value)[:10]}
    text = str(value).strip().replace(" ", "T")
    parsed = datetime.datetime.fromisoformat(text)
    if parsed.tzinfo is not None:
        return {"dateTime": parsed.isoformat()}
    return {"dateTime": parsed.isoformat(), "timeZone": hass.config.time_zone}


def _master_id(event_id):
    """The series id behind an occurrence id (`<master>_<utc stamp>`)."""
    if "_" in event_id:
        return event_id.split("_", 1)[0]
    return event_id


def _start_dt(event):
    """An event's start as an aware datetime, whether it is timed or all-day."""
    start = event.get("start") or {}
    if start.get("dateTime"):
        return datetime.datetime.fromisoformat(start["dateTime"])
    parsed = datetime.datetime.fromisoformat(start["date"])
    return parsed.replace(tzinfo=datetime.timezone.utc)


def _capped_recurrence(recurrence, until_dt):
    """
    The same recurrence rules, but stopping just before `until_dt`.

    Any existing UNTIL or COUNT is dropped first — they are alternative ways of
    saying where a series ends and Google rejects both at once. UNTIL is written
    as UTC with a Z, which is the only form valid for a timed series.
    """
    stamp = until_dt.astimezone(datetime.timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    out = []
    for line in recurrence or []:
        if not line.upper().startswith("RRULE"):
            out.append(line)
            continue
        kept = []
        for piece in line.split(";"):
            key = piece.split("=", 1)[0].upper()
            if ":" in key:
                key = key.split(":", 1)[1]
            if key in ("UNTIL", "COUNT"):
                continue
            kept.append(piece)
        out.append(";".join(kept) + ";UNTIL=" + stamp)
    return out


async def _series_master(calendar, master):
    """The master event, refusing anything that is not actually a series."""
    quoted = urllib.parse.quote(calendar)
    event = await _api("GET", f"/calendars/{quoted}/events/{urllib.parse.quote(master)}")
    if not event.get("recurrence"):
        raise ValueError(f"{master} is not a recurring event — scope 'future' does not apply")
    return event


def _is_first_occurrence(master_event, instance):
    """
    Is this occurrence the one the series starts on?

    It matters because an RRULE cannot be capped before its own DTSTART: Google
    keeps the starting occurrence whatever UNTIL says, so "this and future" from
    the first occurrence would leave exactly one event behind — which is neither
    what was asked for nor something the user could see a reason for. Measured,
    not assumed: a future-delete from the first occurrence left it standing.
    """
    return _start_dt(instance) <= _start_dt(master_event)


async def _cap_series_before(calendar, master_event, instance):
    """
    Stop a series just before one of its occurrences, leaving earlier ones alone.

    One second before the occurrence starts, so the occurrence itself is excluded
    while anything earlier that day survives.
    """
    quoted = urllib.parse.quote(calendar)
    cutoff = _start_dt(instance) - datetime.timedelta(seconds=1)
    await _api(
        "PATCH",
        f"/calendars/{quoted}/events/{urllib.parse.quote(master_event['id'])}",
        {"recurrence": _capped_recurrence(master_event.get("recurrence"), cutoff)},
    )


def _event_body(summary, start, end, all_day, description, location, rrule, color_id):
    """Only the fields actually given — PATCH must not blank what it omits."""
    body = {}
    if summary is not None:
        body["summary"] = summary
    if start is not None:
        body["start"] = _rfc3339(start, all_day)
    if end is not None:
        body["end"] = _rfc3339(end, all_day)
    if description is not None:
        body["description"] = description
    if location is not None:
        body["location"] = location
    if rrule is not None:
        body["recurrence"] = [rrule] if rrule else []
    if color_id is not None:
        key = str(color_id)
        if key == "":
            # An explicit CLEAR, which is a different thing from not mentioning
            # the colour at all: omitting the field leaves whatever is there,
            # while null removes it so the event falls back to the calendar's
            # own colour. Without this there was no way to undo a colour.
            body["colorId"] = None
        elif key not in COLOR_IDS:
            raise ValueError(f"color_id must be one of {sorted(COLOR_IDS)}, got {color_id!r}")
        else:
            body["colorId"] = key
    return body


def _check_scope(scope):
    if scope not in SCOPES:
        raise ValueError(f"scope must be one of {SCOPES}, got {scope!r}")


async def _repoll(entity_id):
    """
    Make Home Assistant pick the change up now rather than in fifteen minutes.

    The Google coordinator serves reads from a cache it refreshes on an interval,
    so without this the card would show the old version until that came round.
    Best effort: the write already succeeded, and failing the whole call because
    the refresh was slow would be a lie.
    """
    try:
        await service.call(
            "homeassistant", "update_entity", entity_id=[entity_id], blocking=True
        )
    except Exception as err:
        log.warning(f"simple_schedule_edit: re-poll failed: {err}")


# --------------------------------------------------------------------------- #
# Services
# --------------------------------------------------------------------------- #

@service
async def simple_schedule_event_update(
    entity_id=None,
    event_id=None,
    scope=SCOPE_INSTANCE,
    summary=None,
    start=None,
    end=None,
    all_day=False,
    description=None,
    location=None,
    rrule=None,
    color_id=None,
):
    """yaml
name: Simple Schedule — update event
description: >-
  Change a Google Calendar event. This is the operation Home Assistant itself
  cannot do: the google integration declares CREATE and DELETE only.
fields:
  entity_id:
    description: The calendar entity holding the event.
    required: true
    example: calendar.alex_school
    selector:
      entity:
        domain: calendar
  event_id:
    description: >-
      Google's event id. For scope "instance" this must be the occurrence's own
      id, which looks like <master>_<utc stamp>.
    required: true
    example: 1bmtd19r3daog41b140p6v7sl9_20260907T101000Z
    selector:
      text:
  scope:
    description: Change this one occurrence, or every occurrence in the series.
    default: instance
    selector:
      select:
        options: [instance, future, series]
  summary:
    description: New title. Omit to leave it alone.
    selector:
      text:
  start:
    description: New start, local time. Omit to leave it alone.
    example: "2026-09-07 12:10:00"
    selector:
      text:
  end:
    description: New end, local time.
    example: "2026-09-07 12:55:00"
    selector:
      text:
  all_day:
    description: Treat start and end as dates rather than times.
    default: false
    selector:
      boolean:
  description:
    selector:
      text:
  location:
    selector:
      text:
  rrule:
    description: >-
      Recurrence rule for the series, e.g. RRULE:FREQ=WEEKLY;BYDAY=MO,TU. Only
      meaningful with scope "series". An empty string clears it.
    selector:
      text:
  color_id:
    description: >-
      Google palette id 1-11, or an empty string to CLEAR the event's own colour
      so it falls back to the calendar's. Omitting the field leaves the colour
      untouched, which is not the same thing.
    selector:
      select:
        options: ["1","2","3","4","5","6","7","8","9","10","11"]
"""
    if not entity_id or not event_id:
        raise ValueError("entity_id and event_id are both required")

    body = _event_body(summary, start, end, all_day, description, location, rrule, color_id)
    if not body:
        raise ValueError("nothing to change — pass at least one field")

    _check_scope(scope)
    calendar = await _calendar_id(entity_id)
    quoted = urllib.parse.quote(calendar)

    if scope == SCOPE_FUTURE:
        result = await _split_series(calendar, event_id, body)
    else:
        target = _master_id(event_id) if scope == SCOPE_SERIES else event_id
        result = await _api(
            "PATCH", f"/calendars/{quoted}/events/{urllib.parse.quote(target)}", body
        )

    await _repoll(entity_id)
    log.info(f"simple_schedule_edit: updated {event_id} on {entity_id} ({scope})")
    return {"id": result.get("id"), "summary": result.get("summary"), "scope": scope}


async def _split_series(calendar, event_id, body):
    """
    "This and future" for an EDIT: cap the old series, start a new one.

    Google has no single call for this, and neither does its own UI — it does
    exactly this split, which is why editing future occurrences there also gives
    you a new event. The new series inherits every field of the old master that
    the edit does not mention, so a change of title does not silently drop the
    location or the colour.
    """
    quoted = urllib.parse.quote(calendar)
    master = _master_id(event_id)
    if master == event_id:
        raise ValueError("scope 'future' needs an occurrence id, not a series id")

    instance = await _api("GET", f"/calendars/{quoted}/events/{urllib.parse.quote(event_id)}")
    old_master = await _series_master(calendar, master)
    # From the very first occurrence, "this and future" IS the whole series, and
    # a split would leave an empty husk of the original behind.
    if _is_first_occurrence(old_master, instance):
        return await _api(
            "PATCH", f"/calendars/{quoted}/events/{urllib.parse.quote(master)}", body
        )
    await _cap_series_before(calendar, old_master, instance)

    fresh = {}
    for field in ("summary", "description", "location", "colorId", "recurrence",
                  "transparency", "visibility"):
        if field in old_master and old_master[field] is not None:
            fresh[field] = old_master[field]
    # The new series starts where this occurrence does, unless the edit moved it.
    fresh["start"] = instance.get("start")
    fresh["end"] = instance.get("end")
    # Whatever the caller actually changed wins, and the capped UNTIL must not
    # come along with it — the new series is the one that carries on.
    fresh["recurrence"] = _uncapped(old_master.get("recurrence"))
    for key, value in body.items():
        fresh[key] = value
    return await _api("POST", f"/calendars/{quoted}/events", fresh)


def _uncapped(recurrence):
    """The recurrence rules with any UNTIL or COUNT removed."""
    out = []
    for line in recurrence or []:
        if not line.upper().startswith("RRULE"):
            out.append(line)
            continue
        kept = []
        for piece in line.split(";"):
            key = piece.split("=", 1)[0].upper()
            if ":" in key:
                key = key.split(":", 1)[1]
            if key in ("UNTIL", "COUNT"):
                continue
            kept.append(piece)
        out.append(";".join(kept))
    return out


@service
async def simple_schedule_event_delete(entity_id=None, event_id=None, scope=SCOPE_INSTANCE):
    """yaml
name: Simple Schedule — delete event
description: >-
  Delete one occurrence or a whole recurring series. Deleting a single
  occurrence writes an exception into the series and cannot be undone from here.
fields:
  entity_id:
    required: true
    selector:
      entity:
        domain: calendar
  event_id:
    required: true
    selector:
      text:
  scope:
    default: instance
    selector:
      select:
        options: [instance, future, series]
"""
    if not entity_id or not event_id:
        raise ValueError("entity_id and event_id are both required")

    _check_scope(scope)
    calendar = await _calendar_id(entity_id)
    quoted = urllib.parse.quote(calendar)

    if scope == SCOPE_FUTURE:
        master = _master_id(event_id)
        if master == event_id:
            raise ValueError("scope 'future' needs an occurrence id, not a series id")
        instance = await _api("GET", f"/calendars/{quoted}/events/{urllib.parse.quote(event_id)}")
        master_event = await _series_master(calendar, master)
        if _is_first_occurrence(master_event, instance):
            # Nothing precedes it, so "this and future" is the whole series — and
            # capping would leave the starting occurrence standing on its own.
            await _api("DELETE", f"/calendars/{quoted}/events/{urllib.parse.quote(master)}")
        else:
            # Capping the series IS the delete: everything from this occurrence
            # on stops existing, and everything before it is untouched.
            await _cap_series_before(calendar, master_event, instance)
        target = master
    else:
        target = _master_id(event_id) if scope == SCOPE_SERIES else event_id
        await _api("DELETE", f"/calendars/{quoted}/events/{urllib.parse.quote(target)}")

    await _repoll(entity_id)
    log.info(f"simple_schedule_edit: deleted {event_id} on {entity_id} ({scope})")
    return {"id": target, "scope": scope}


@service
async def simple_schedule_event_create(
    entity_id=None,
    summary=None,
    start=None,
    end=None,
    all_day=False,
    description=None,
    location=None,
    rrule=None,
    color_id=None,
):
    """yaml
name: Simple Schedule — create event
description: >-
  Create an event, optionally recurring. Unlike calendar.create_event this can
  take an rrule and a colour.
fields:
  entity_id:
    required: true
    selector:
      entity:
        domain: calendar
  summary:
    required: true
    selector:
      text:
  start:
    required: true
    example: "2026-09-07 12:10:00"
    selector:
      text:
  end:
    required: true
    example: "2026-09-07 12:55:00"
    selector:
      text:
  all_day:
    default: false
    selector:
      boolean:
  description:
    selector:
      text:
  location:
    selector:
      text:
  rrule:
    example: RRULE:FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR
    selector:
      text:
  color_id:
    selector:
      select:
        options: ["1","2","3","4","5","6","7","8","9","10","11"]
"""
    if not entity_id or not summary or not start or not end:
        raise ValueError("entity_id, summary, start and end are all required")

    body = _event_body(summary, start, end, all_day, description, location, rrule, color_id)
    calendar = await _calendar_id(entity_id)
    quoted = urllib.parse.quote(calendar)
    result = await _api("POST", f"/calendars/{quoted}/events", body)

    await _repoll(entity_id)
    log.info(f"simple_schedule_edit: created {result.get('id')} on {entity_id}")
    return {"id": result.get("id"), "summary": result.get("summary")}


@service
async def simple_schedule_event_probe(entity_id=None, event_id=None, path=None):
    """yaml
name: Simple Schedule — probe event
description: >-
  Read one event back from Google exactly as the API returns it. Read-only, and
  the quickest way to check what an id actually points at before changing it.
fields:
  entity_id:
    required: true
    selector:
      entity:
        domain: calendar
  event_id:
    required: true
    selector:
      text:
"""
    if not entity_id:
        raise ValueError("entity_id is required")
    calendar = await _calendar_id(entity_id)
    # A raw path, for exploring endpoints the card does not otherwise touch.
    # Debug-only: this service exists to answer "what does Google actually say".
    if path:
        raw = await _api("GET", path.replace("{cal}", urllib.parse.quote(calendar)))
        log.warning(f"simple_schedule_edit: probe PATH {path} -> {raw}")
        return raw
    if not event_id:
        raise ValueError("event_id is required")
    quoted = urllib.parse.quote(calendar)
    event = await _api("GET", f"/calendars/{quoted}/events/{urllib.parse.quote(event_id)}")
    # EVERY key, not a whitelist. A whitelist here once hid the answer: the
    # question was "where is this event's colour", and a field the list did not
    # mention cannot be ruled out by a probe that never prints it.
    out = dict(event)
    # Logged as well as returned: a pyscript @service is not registered with
    # supports_response, so a caller over the REST API cannot read the return
    # value at all. The log is the only way to see what Google actually said.
    log.warning(f"simple_schedule_edit: probe {event_id} -> {out}")
    return out

