#!/usr/bin/env python3
"""
Bakalari -> Google Calendar mirror.

Reads a pupil's timetable from a school's Bakalari API and mirrors every lesson into
a Google calendar that Home Assistant already shows, so simple-schedule-card draws
it with no changes of its own. Lunch, clubs and anything else the family adds by
hand live in the same calendar and are never touched.

Run hourly by pyscript/bakalari_sync.py, which passes the settings below from the
`pyscript:` config. By hand:

    BAKALARI_USERNAME=... BAKALARI_PASSWORD=... python3 bakalari_sync.py \
        --url https://<school>.bakalari.cz --calendar calendar.<name> --dry-run

The rules:

1. Bakalari is mirrored exactly as it is: its own times (including the 25+25 minute
   halves of a split lesson), its subject abbreviation as the title reduced to plain
   ASCII, the description "Source Bakalari". A lesson Bakalari marks Canceled or
   Removed is not a lesson, so it is not in the calendar.
2. A mirrored lesson CANNOT BE EDITED. Any change made by hand - title, time, colour,
   notes, moving it to another day - is put back to the Bakalari version on the next
   run. Google changes an event's etag on any edit, which is how it is noticed.
3. A mirrored lesson CAN BE DELETED, and a deleted lesson never comes back. Not on
   the next run, not if Bakalari cancels and reinstates it. A different lesson in the
   same slot (a substitution) is a different lesson and does appear.
4. A lesson Bakalari cancels or drops is deleted from the calendar.
5. Future only. A lesson that has started is left alone, so history is never
   rewritten.
6. Events this script did not create are invisible to it: it only ever acts on
   event ids recorded in its own state file.

Event ids are deterministic - a hash of the lesson - so neither a crash between an
insert and its record nor a lost state file can produce a duplicate: Google answers
a reused id with 409, even when the event behind it has been deleted.

Credentials: BAKALARI_USERNAME / BAKALARI_PASSWORD from the environment only, never
written to disk. Google: the Google integration's own OAuth token from .storage,
refreshed in memory only, as pyscript/simple_schedule_edit.py does - no second login.

Exit status: 0 with a JSON summary as the LAST stdout line (the runner parses it), 1
on an error with the reason on stderr. Missing credentials IS an error: a sync that
cannot run has failed, and the monitoring has to see it - a quiet skip is exactly
how a lost credential would go unnoticed for weeks.
"""

import argparse
import datetime
import fcntl
import hashlib
import json
import os
import sys
import time
import unicodedata
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path
from zoneinfo import ZoneInfo

DESCRIPTION = "Source Bakalari"
# Every mirrored event's id starts with this, and Google makes the uid from the id
# (<id>@google.com). simple-schedule-card's `read_only_uid_prefix: bakalari` keys
# off it to open these lessons read-only. Eight letters, because Google's own ids
# are random base32hex: a short prefix like "bak" would match one hand-made event
# in ~33,000, this one in ~10^12.
ID_PREFIX = "bakalari"
TIMEZONE = ZoneInfo("Europe/Prague")
# Bakalari's own words for a lesson that is not happening.
NOT_HAPPENING = ("Canceled", "Removed")
# State entries for lessons this far in the past are dropped from the file.
PRUNE_AFTER_DAYS = 14

GOOGLE_API = "https://www.googleapis.com/calendar/v3"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"

# State values for one lesson.
SYNCED = "synced"        # created by this script; kept matching Bakalari
DELETED = "deleted"      # deleted by hand: never created again
REMOVED = "removed"      # deleted by this script because Bakalari dropped it

# Filled in from the command line by main().
SETTINGS = {}


class SyncError(Exception):
    """Anything that stops a run. Raised BEFORE a change is made where possible."""


# --- HTTP -------------------------------------------------------------------------

def http(method, url, headers=None, body=None, form=None, timeout=30):
    """One request. Returns (status, parsed JSON or {}), never raises on an HTTP status."""
    data = None
    hdrs = dict(headers or {})
    if form is not None:
        data = urllib.parse.urlencode(form).encode()
        hdrs["Content-Type"] = "application/x-www-form-urlencoded"
    elif body is not None:
        data = json.dumps(body).encode()
        hdrs["Content-Type"] = "application/json"
    req = urllib.request.Request(url, data=data, method=method, headers=hdrs)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            raw = resp.read()
            return resp.status, (json.loads(raw) if raw else {})
    except urllib.error.HTTPError as err:
        raw = err.read()
        try:
            payload = json.loads(raw) if raw else {}
        except ValueError:
            payload = {"raw": raw[:300].decode(errors="replace")}
        return err.code, payload
    except (urllib.error.URLError, TimeoutError) as err:
        raise SyncError(f"{method} {url.split('?')[0]} failed: {err}") from err


def read_json(path):
    with open(path, encoding="utf-8") as fh:
        return json.load(fh)


# --- Bakalari ---------------------------------------------------------------------

def bakalari_token(username, password):
    status, payload = http(
        "POST",
        f"{SETTINGS['url']}/api/login",
        form={
            "client_id": "ANDR",  # the fixed id the official mobile app uses
            "grant_type": "password",
            "username": username,
            "password": password,
        },
    )
    if status != 200 or not payload.get("access_token"):
        raise SyncError(f"Bakalari login failed ({status}): {payload.get('error', '')}")
    return payload["access_token"]


def bakalari_week(token, monday):
    """The ACTUAL timetable (changes applied) for the week containing `monday`."""
    status, payload = http(
        "GET",
        f"{SETTINGS['url']}/api/3/timetable/actual?date={monday.isoformat()}",
        headers={"Authorization": f"Bearer {token}"},
    )
    # A failed or empty week must stop the run: treating it as "no lessons" would
    # delete every mirrored lesson in it.
    if status != 200 or not payload.get("Days"):
        raise SyncError(f"Bakalari timetable for {monday} unusable ({status})")
    return payload


def ascii_only(text):
    """Plain ASCII: accents dropped, anything else non-ASCII removed."""
    return unicodedata.normalize("NFKD", text or "").encode("ascii", "ignore").decode().strip()


def hm(minutes):
    return f"{minutes // 60:02d}:{minutes % 60:02d}"


def to_minutes(clock):
    hours, mins = clock.split(":")[:2]
    return int(hours) * 60 + int(mins)


def wanted_lessons(weeks, now):
    """
    Every future lesson Bakalari has on a mirrored weekday, keyed by date, time and
    title. Also returns the dates Bakalari actually answered for - only lessons on
    those dates may ever be removed.
    """
    lessons = {}
    covered = set()
    for week in weeks:
        subjects = {s["Id"]: s.get("Abbrev", "") for s in week.get("Subjects", [])}
        hours = {h["Id"]: h for h in week.get("Hours", [])}
        for day in week["Days"]:
            date = datetime.date.fromisoformat(day["Date"][:10])
            if date.weekday() not in SETTINGS["weekdays"]:
                continue
            covered.add(date)
            # A holiday or a day off has no lessons - mirrored as nothing.
            if day.get("DayType") != "WorkDay":
                continue
            for atom in day.get("Atoms", []):
                if not (atom.get("SubjectId") or "").strip():
                    continue
                change = atom.get("Change") or {}
                if change.get("ChangeType") in NOT_HAPPENING:
                    continue
                # The atom's own start and length, as Bakalari gives them - this is
                # what keeps a split lesson as two 25-minute halves.
                start = atom.get("Start")
                length = atom.get("Duration")
                if start is None or not length:
                    hour = hours[atom["HourId"]]
                    start = to_minutes(hour["BeginTime"])
                    length = to_minutes(hour["EndTime"]) - start
                begins = datetime.datetime.combine(
                    date, datetime.time(start // 60, start % 60), TIMEZONE
                )
                if begins <= now:
                    continue
                title = ascii_only(subjects.get(atom.get("SubjectId"), "")) or "?"
                key = f"{date.isoformat()} {hm(start)}-{hm(start + length)} {title}"
                lessons[key] = {
                    "title": title,
                    "start": begins,
                    "end": begins + datetime.timedelta(minutes=length),
                }
    return lessons, covered


# --- Google -----------------------------------------------------------------------

def storage(name):
    return Path(SETTINGS["config_dir"]) / ".storage" / name


def google_entry():
    for entry in read_json(storage("core.config_entries"))["data"]["entries"]:
        if entry.get("domain") == "google":
            return entry
    raise SyncError("no Google config entry - is the integration set up?")


def google_token():
    """The integration's access token, refreshed in memory if it has expired."""
    token = google_entry()["data"]["token"]
    if token.get("expires_at", 0) > time.time() + 60:
        return token["access_token"]
    client = next(
        (i for i in read_json(storage("application_credentials"))["data"]["items"]
         if i.get("domain") == "google"),
        None,
    )
    if not client:
        raise SyncError("no Google application credentials on file")
    status, payload = http(
        "POST",
        GOOGLE_TOKEN_URL,
        form={
            "client_id": client["client_id"],
            "client_secret": client["client_secret"],
            "refresh_token": token["refresh_token"],
            "grant_type": "refresh_token",
        },
    )
    if status != 200 or not payload.get("access_token"):
        raise SyncError(f"Google token refresh failed ({status})")
    return payload["access_token"]


def google_calendar_id():
    """
    The Google calendar id behind the calendar entity. The registry unique_id is the
    account email, a hyphen, then the calendar id; the email is stripped by LENGTH,
    because an address may itself contain a hyphen.
    """
    entity = SETTINGS["calendar"]
    found = next(
        (e for e in read_json(storage("core.entity_registry"))["data"]["entities"]
         if e.get("entity_id") == entity),
        None,
    )
    if not found or found.get("platform") != "google":
        raise SyncError(f"{entity} is not a Google calendar in the registry")
    prefix = google_entry().get("unique_id") or ""
    unique = found.get("unique_id") or ""
    if not prefix or not unique.startswith(prefix + "-"):
        raise SyncError(f"cannot read a calendar id out of {unique!r}")
    return unique[len(prefix) + 1:]


def event_body(lesson):
    """
    The one true content of a mirrored lesson. A restore writes ALL of it with a full
    replace, so anything added by hand (a location, a colour, a note) goes too.
    """
    body = {
        "summary": lesson["title"],
        "description": DESCRIPTION,
        # Naive local time plus an explicit zone - Google rejects a naive time on its
        # own, and .astimezone() would resolve against the machine's clock.
        "start": {"dateTime": lesson["start"].strftime("%Y-%m-%dT%H:%M:%S"),
                  "timeZone": str(TIMEZONE)},
        "end": {"dateTime": lesson["end"].strftime("%Y-%m-%dT%H:%M:%S"),
                "timeZone": str(TIMEZONE)},
    }
    if SETTINGS.get("color_id"):
        body["colorId"] = str(SETTINGS["color_id"])
    return body


def body_hash(body):
    return hashlib.sha1(json.dumps(body, sort_keys=True).encode()).hexdigest()


class Google:
    def __init__(self, calendar_id, token):
        self.base = f"{GOOGLE_API}/calendars/{urllib.parse.quote(calendar_id, safe='')}/events"
        self.headers = {"Authorization": f"Bearer {token}"}

    def events_between(self, start, end):
        """id -> event for everything between two times, DELETED events included."""
        found = {}
        params = {
            "timeMin": start.isoformat(),
            "timeMax": end.isoformat(),
            "singleEvents": "true",
            "showDeleted": "true",
            "maxResults": "2500",
        }
        while True:
            status, payload = http("GET", f"{self.base}?{urllib.parse.urlencode(params)}",
                                   headers=self.headers)
            if status != 200:
                raise SyncError(f"Google event list failed ({status})")
            for item in payload.get("items", []):
                found[item["id"]] = item
            if not payload.get("nextPageToken"):
                return found
            params["pageToken"] = payload["nextPageToken"]

    def get(self, event_id):
        """The event, or None if Google no longer has it at all."""
        status, payload = http("GET", f"{self.base}/{event_id}", headers=self.headers)
        if status in (404, 410):
            return None
        if status != 200:
            raise SyncError(f"Google event get failed ({status})")
        return payload

    def insert(self, event_id, body):
        return http("POST", self.base, headers=self.headers, body={"id": event_id, **body})

    def replace(self, event_id, body):
        return http("PUT", f"{self.base}/{event_id}", headers=self.headers, body=body)

    def delete(self, event_id):
        status, _ = http("DELETE", f"{self.base}/{event_id}", headers=self.headers)
        return status


def event_id_for(calendar_id, key, generation):
    """
    Deterministic id: ID_PREFIX + a hex hash, all inside Google's base32hex id
    alphabet (a-v, 0-9). The generation moves on each time the sync itself removes
    the lesson, so a lesson Bakalari cancels and later reinstates gets a fresh id.
    """
    digest = hashlib.sha1(f"{calendar_id}|{key}|{generation}".encode()).hexdigest()
    return f"{ID_PREFIX}{digest}"


# --- State ------------------------------------------------------------------------

def load_state():
    path = Path(SETTINGS["state"])
    if path.exists():
        return read_json(path)
    return {"version": 2, "lessons": {}}


def save_state(state):
    """Written after EVERY change, atomically, so a crash never loses track of an event."""
    path = Path(SETTINGS["state"])
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(".tmp")
    with open(tmp, "w", encoding="utf-8") as fh:
        json.dump(state, fh, indent=1, sort_keys=True)
    os.replace(tmp, path)


def stamp():
    return datetime.datetime.now(TIMEZONE).isoformat(timespec="seconds")


# --- The run ----------------------------------------------------------------------

def run(dry_run):
    username = os.environ.get("BAKALARI_USERNAME")
    password = os.environ.get("BAKALARI_PASSWORD")
    if not username or not password:
        raise SyncError("BAKALARI_USERNAME / BAKALARI_PASSWORD are not set in the environment")

    now = datetime.datetime.now(TIMEZONE)
    this_monday = now.date() - datetime.timedelta(days=now.weekday())
    mondays = [this_monday + datetime.timedelta(weeks=k)
               for k in range(SETTINGS["weeks_ahead"] + 1)]

    # Everything is read before anything is written: a failure here changes nothing.
    token = bakalari_token(username, password)
    weeks = [bakalari_week(token, monday) for monday in mondays]
    wanted, covered = wanted_lessons(weeks, now)

    calendar_id = google_calendar_id()
    google = Google(calendar_id, google_token())
    state = load_state()
    lessons = state["lessons"]
    summary = {"created": 0, "restored": 0, "deleted": 0, "deleted_by_hand": 0}

    def log(action, key, note=""):
        print(f"{'[dry-run] ' if dry_run else ''}{action:<9} {key}{('  - ' + note) if note else ''}")

    def record(key, **fields):
        if dry_run:
            return
        lessons[key] = {**lessons.get(key, {}), **fields, "at": stamp()}
        save_state(state)

    # 1. Every future lesson this script owns: deleted by hand, dropped by Bakalari,
    #    or edited (by hand, or because the wanted content changed) - in that order.
    owned = {
        key: entry for key, entry in lessons.items()
        if entry.get("state") == SYNCED
        and datetime.datetime.fromisoformat(entry["start"]) > now
    }
    on_google = {}
    if owned:
        starts = [datetime.datetime.fromisoformat(e["start"]) for e in owned.values()]
        on_google = google.events_between(
            min(starts) - datetime.timedelta(hours=1),
            max(starts) + datetime.timedelta(days=1),
        )
    for key, entry in sorted(owned.items()):
        event = on_google.get(entry["id"])
        if event is None:
            # Not where it was put: deleted, or moved by hand. Ask for it directly.
            event = google.get(entry["id"])
        if event is None or event.get("status") == "cancelled":
            log("GONE", key, "deleted by hand - will not come back")
            record(key, state=DELETED)
            summary["deleted_by_hand"] += 1
            continue

        begins = datetime.datetime.fromisoformat(entry["start"])
        if key not in wanted:
            if begins.date() not in covered:
                continue
            if not dry_run:
                status = google.delete(entry["id"])
                if status not in (200, 204, 410):
                    raise SyncError(f"Google delete failed ({status}) for {key}")
            log("DELETE", key, "no longer in Bakalari")
            record(key, state=REMOVED, gen=entry.get("gen", 0) + 1)
            summary["deleted"] += 1
            continue

        body = event_body(wanted[key])
        edited = event.get("etag") != entry.get("etag")
        if not edited and entry.get("body") == body_hash(body):
            continue
        if not dry_run:
            status, payload = google.replace(entry["id"], body)
            if status != 200:
                raise SyncError(f"Google restore failed ({status}) for {key}")
            record(key, etag=payload.get("etag"), body=body_hash(body))
        log("RESTORE", key, "edited by hand" if edited else "content updated")
        summary["restored"] += 1

    # 2. Lessons not in the calendar yet.
    for key, lesson in sorted(wanted.items()):
        entry = lessons.get(key, {})
        if entry.get("state") in (SYNCED, DELETED):
            continue
        generation = entry.get("gen", 0)
        event_id = event_id_for(calendar_id, key, generation)
        body = event_body(lesson)
        if dry_run:
            log("CREATE", key)
            summary["created"] += 1
            continue
        status, payload = google.insert(event_id, body)
        if status == 409:
            # The id is already on Google - this run lost track of it (a crash, or a
            # lost state file). Deleted there means deleted for good; live means it
            # is ours, and the next run puts its content right.
            existing = google.get(event_id)
            if existing is None or existing.get("status") == "cancelled":
                log("GONE", key, "found deleted - will not come back")
                record(key, state=DELETED, id=event_id,
                       start=lesson["start"].isoformat(), gen=generation)
                summary["deleted_by_hand"] += 1
            else:
                log("ADOPT", key, "already on Google")
                record(key, state=SYNCED, id=event_id, etag=existing.get("etag"),
                       body=None, start=lesson["start"].isoformat(), gen=generation)
            continue
        if status != 200:
            raise SyncError(f"Google insert failed ({status}) for {key}")
        log("CREATE", key)
        record(key, state=SYNCED, id=event_id, etag=payload.get("etag"),
               body=body_hash(body), start=lesson["start"].isoformat(), gen=generation)
        summary["created"] += 1

    # 3. Forget lessons long past. This only trims the file - Google is not touched.
    cutoff = now - datetime.timedelta(days=PRUNE_AFTER_DAYS)
    stale = [k for k, e in lessons.items()
             if datetime.datetime.fromisoformat(e["start"]) < cutoff]
    if stale and not dry_run:
        for key in stale:
            del lessons[key]
        save_state(state)

    return summary


def main():
    parser = argparse.ArgumentParser(description="Mirror Bakalari lessons into Google Calendar.")
    parser.add_argument("--url", required=True, help="the school's Bakalari address")
    parser.add_argument("--calendar", required=True, help="the Google calendar entity, calendar.x")
    parser.add_argument("--weekdays", default="0,1,2,3,4",
                        help="weekdays to mirror, Monday = 0 (default: 0,1,2,3,4)")
    parser.add_argument("--weeks-ahead", type=int, default=3,
                        help="weeks to mirror after the current one (default: 3)")
    parser.add_argument("--color-id", default="", help="Google event colour id for lessons")
    parser.add_argument("--config-dir", default="/config", help="Home Assistant config dir")
    parser.add_argument("--state", default="", help="state file (default: <config>/bakalari_sync/state.json)")
    parser.add_argument("--dry-run", action="store_true", help="print the plan, change nothing")
    args = parser.parse_args()

    SETTINGS.update(
        url=args.url.rstrip("/"),
        calendar=args.calendar,
        weekdays={int(d) for d in args.weekdays.split(",") if d.strip()},
        weeks_ahead=args.weeks_ahead,
        color_id=args.color_id,
        config_dir=args.config_dir,
        state=args.state or str(Path(args.config_dir) / "bakalari_sync" / "state.json"),
    )
    lock_path = Path(SETTINGS["state"]).with_suffix(".lock")
    lock_path.parent.mkdir(parents=True, exist_ok=True)

    with open(lock_path, "w") as lock:
        try:
            fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        except BlockingIOError:
            print(json.dumps({"skipped": "another run is in progress"}))
            return 0
        try:
            summary = run(args.dry_run)
        except SyncError as err:
            print(f"bakalari_sync: {err}", file=sys.stderr)
            return 1
    print(json.dumps(summary))
    return 0


if __name__ == "__main__":
    sys.exit(main())
