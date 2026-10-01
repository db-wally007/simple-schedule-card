"""
State-machine test for bakalari_sync.py, against a fake Bakalari and a fake Google.

    python3 bakalari/test_bakalari_sync.py

The fake Google mirrors three behaviours of the real one, each verified live before
this was written: an event's etag is stable while nothing changes and moves on any
edit (colour included); a deleted event lists as status "cancelled"; and inserting an
id Google has seen before - even a deleted one - answers 409.
"""

import copy
import datetime
import importlib.util
import os
import sys
import tempfile
from pathlib import Path

HERE = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location("bs", HERE / "bakalari_sync.py")
bs = importlib.util.module_from_spec(spec)
spec.loader.exec_module(bs)

TMP = Path(tempfile.mkdtemp())
bs.SETTINGS.update(url="https://school.example", calendar="calendar.pupil",
                   weekdays={0}, weeks_ahead=3, color_id="4", config_dir=str(TMP),
                   state=str(TMP / "state.json"))
os.environ["BAKALARI_USERNAME"] = "user"
os.environ["BAKALARI_PASSWORD"] = "pass"

# --- fake Bakalari: every weekday has AJ 7:40, Pri 8:30 and a split Hv/Cj at 13:00 ---
CANCELLED = set()  # (date, start-minutes) Bakalari reports as Canceled


def fake_week(token, monday):
    days = []
    for offset in range(5):
        d = monday + datetime.timedelta(days=offset)
        atoms = [
            {"HourId": 1, "SubjectId": "1", "Start": 460, "Duration": 45},
            {"HourId": 2, "SubjectId": "2", "Start": 510, "Duration": 45},
            {"HourId": 6, "SubjectId": "3", "Start": 780, "Duration": 25},
            {"HourId": 6, "SubjectId": "4", "Start": 805, "Duration": 25},
        ]
        for atom in atoms:
            if (d.isoformat(), atom["Start"]) in CANCELLED:
                atom["Change"] = {"ChangeType": "Canceled"}
        days.append({"Date": d.isoformat() + "T00:00:00+02:00", "DayType": "WorkDay",
                     "Atoms": atoms})
    return {"Days": days,
            "Subjects": [{"Id": "1", "Abbrev": "AJ"}, {"Id": "2", "Abbrev": "Pří"},
                         {"Id": "3", "Abbrev": "Hv"}, {"Id": "4", "Abbrev": "Cj"}],
            "Hours": []}


class FakeGoogle:
    def __init__(self):
        self.events = {"lunch": {"id": "lunch", "etag": "L", "status": "confirmed",
                                 "summary": "Lunch"}}
        self.n = 0

    def __call__(self, calendar_id, token):  # stands in for the Google class
        return self

    def _etag(self):
        self.n += 1
        return f"e{self.n}"

    def events_between(self, start, end):
        # Like Google: only what is in the window, deleted ones included.
        out = {}
        for k, ev in self.events.items():
            when = ev.get("start", {}).get("dateTime")
            if when is None or start.isoformat()[:10] <= when[:10] <= end.isoformat()[:10]:
                out[k] = copy.deepcopy(ev)
        return out

    def get(self, event_id):
        ev = self.events.get(event_id)
        return copy.deepcopy(ev) if ev else None

    def insert(self, event_id, body):
        if event_id in self.events:
            return 409, {}
        self.events[event_id] = {"id": event_id, "etag": self._etag(), "status": "confirmed",
                                 **copy.deepcopy(body)}
        return 200, {"etag": self.events[event_id]["etag"]}

    def replace(self, event_id, body):
        ev = self.events[event_id]
        self.events[event_id] = {"id": event_id, "etag": self._etag(),
                                 "status": ev["status"], **copy.deepcopy(body)}
        return 200, {"etag": self.events[event_id]["etag"]}

    def delete(self, event_id):
        ev = self.events.get(event_id)
        if not ev or ev["status"] == "cancelled":
            return 410
        ev["status"] = "cancelled"
        return 204

    def hand_edit(self, event_id, **fields):
        self.events[event_id].update(fields)
        self.events[event_id]["etag"] = self._etag()

    def live(self):
        return {k: v for k, v in self.events.items() if v["status"] == "confirmed"}


G = FakeGoogle()
bs.bakalari_token = lambda user, password: "token"
bs.bakalari_week = fake_week
bs.google_calendar_id = lambda: "pupil@group.calendar.google.com"
bs.google_token = lambda: "google-token"
bs.Google = G

failures = []


def check(name, cond):
    print(("PASS " if cond else "FAIL ") + name)
    if not cond:
        failures.append(name)


def run():
    import contextlib
    import io
    with contextlib.redirect_stdout(io.StringIO()):
        return bs.run(dry_run=False)


def state():
    return bs.load_state()["lessons"]


def find(date, start_hm, title):
    return next(k for k in state() if k.startswith(f"{date} {start_hm}") and k.endswith(title))


def event(key):
    return G.events[state()[key]["id"]]


s = run()
mondays = sorted({k[:10] for k in state()})
first, second = mondays[0], mondays[1]
check("01 creates 4 lessons per future Monday and nothing on other days",
      s["created"] == 4 * len(mondays)
      and all(datetime.date.fromisoformat(m).weekday() == 0 for m in mondays))
aj, pri, hv, cj = (find(first, "07:40", "AJ"), find(first, "08:30", "Pri"),
                   find(first, "13:00", "Hv"), find(first, "13:25", "Cj"))
check("02 title is plain ASCII (Pří -> Pri)", event(pri)["summary"] == "Pri")
check("03 split lesson exactly as Bakalari has it: 13:00-13:25 + 13:25-13:50",
      "13:00-13:25" in hv and "13:25-13:50" in cj)
check("04 description, colour and the read-only id prefix set",
      event(aj)["description"] == "Source Bakalari" and event(aj)["colorId"] == "4"
      and all(v["id"].startswith(bs.ID_PREFIX) for v in state().values()))
check("05 second run changes nothing", run() == {"created": 0, "restored": 0, "deleted": 0,
                                                 "deleted_by_hand": 0})

aj_id = state()[aj]["id"]
G.hand_edit(aj_id, summary="AJ - bring book", colorId="9", location="Room 12")
s = run()
check("06 hand edit (title, colour, location) is put back",
      s["restored"] == 1 and event(aj)["summary"] == "AJ" and event(aj)["colorId"] == "4"
      and "location" not in event(aj) and state()[aj]["id"] == aj_id)

moved = copy.deepcopy(G.events[aj_id]["start"])
G.hand_edit(aj_id, start={"dateTime": "2099-01-01T07:40:00", "timeZone": "Europe/Prague"})
s = run()
check("07 lesson moved to another day by hand is moved back",
      s["restored"] == 1 and event(aj)["start"] == moved)

pri_id = state()[pri]["id"]
G.events[pri_id]["status"] = "cancelled"
s = run()
check("08 hand delete is respected", s["deleted_by_hand"] == 1
      and state()[pri]["state"] == "deleted" and G.events[pri_id]["status"] == "cancelled")
s = run()
check("09 hand delete never comes back", s["created"] == 0 and len([
    v for v in G.live().values() if v.get("summary") == "Pri"
    and v["start"]["dateTime"].startswith(first)]) == 0)

CANCELLED.add((first, 510))  # Bakalari cancels the lesson that was deleted by hand...
run()
CANCELLED.discard((first, 510))  # ...and reinstates it
s = run()
check("10 deleted by hand stays deleted through a Bakalari cancel + reinstate",
      s["created"] == 0 and state()[pri]["state"] == "deleted")

hv_id = state()[hv]["id"]
CANCELLED.add((first, 780))
s = run()
check("11 lesson Bakalari cancels is deleted", s["deleted"] == 1
      and G.events[hv_id]["status"] == "cancelled" and state()[hv]["state"] == "removed")

CANCELLED.discard((first, 780))
s = run()
check("12 lesson Bakalari reinstates comes back under a fresh id",
      s["created"] == 1 and state()[hv]["state"] == "synced" and state()[hv]["id"] != hv_id)

cj_id = state()[cj]["id"]
G.hand_edit(cj_id, summary="edited")
CANCELLED.add((first, 805))
s = run()
check("13 edited AND cancelled in the same hour: deleted, not restored",
      s["deleted"] == 1 and s["restored"] == 0 and G.events[cj_id]["status"] == "cancelled")
CANCELLED.discard((first, 805))
run()

bs.SETTINGS["color_id"] = "11"
before_ids = {k: v["id"] for k, v in state().items() if v["state"] == "synced"}
s = run()
check("14 a settings change (colour) updates every live lesson in place",
      s["restored"] == len(before_ids) and s["created"] == 0
      and all(G.events[i]["colorId"] == "11" for i in before_ids.values())
      and {k: v["id"] for k, v in state().items() if v["state"] == "synced"} == before_ids)
bs.SETTINGS["color_id"] = "4"
run()

live_before = len(G.live())
Path(bs.SETTINGS["state"]).unlink()
s = run()
check("15 state file lost: no duplicates, and the hand-deleted lesson stays deleted",
      len(G.live()) == live_before and state()[pri]["state"] == "deleted")


def broken(token, monday):
    raise bs.SyncError("Bakalari timetable unusable (503)")


bs.bakalari_week = broken
snapshot = copy.deepcopy(G.events)
try:
    run()
    check("16 Bakalari outage raises", False)
except bs.SyncError:
    check("16 Bakalari outage raises and the calendar is untouched", G.events == snapshot)

check("17 an event the sync did not create is never touched",
      G.events["lunch"] == {"id": "lunch", "etag": "L", "status": "confirmed",
                            "summary": "Lunch"})

print("\nALL PASS" if not failures else f"\n{len(failures)} FAILED: {failures}")
sys.exit(1 if failures else 0)
