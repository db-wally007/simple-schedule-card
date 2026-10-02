"""
Runner for the Bakalari -> Google Calendar mirror (bakalari/bakalari_sync.py).

The mirror itself is plain Python and runs as a SUBPROCESS: plain Python can be
tested outside Home Assistant, and a subprocess cannot stall HA's event loop the way
pyscript's interpreter can. This file starts it, passes it its settings, and when
something changed refreshes the calendar entity - so the change shows now instead of
after the Google integration's 15-minute cache - and re-runs the colour helper, so a
new lesson gets its colour at once rather than at the helper's next tick.

There is deliberately NO schedule in here. Call pyscript.bakalari_sync_run from a
Home Assistant SCRIPT, on an automation's schedule: a pyscript timer leaves no run
history, so a failing sync would only ever reach the log. The action RETURNS the
outcome - {"ok": true, ...counts} or {"ok": false, "error": "..."} - because an
exception raised here is caught and logged by pyscript and never reaches the
caller. The calling script checks `ok` and stops with an error, which records a
failed run that monitoring can see. For example:

    - action: pyscript.bakalari_sync_run
      response_variable: sync
    - if: "{{ not (sync is mapping and sync.ok | default(false)) }}"
      then:
        - stop: Bakalari sync failed
          error: true

Settings, in the `pyscript:` block of configuration.yaml:

    bakalari_sync_url: https://<school>.bakalari.cz      required
    bakalari_sync_calendar: calendar.<name>               required
    bakalari_sync_weekdays: [0, 1, 2, 3, 4]               Monday = 0
    bakalari_sync_weeks_ahead: 3
    bakalari_sync_color_id: "4"                           Google event colour id

Credentials are NOT settings: BAKALARI_USERNAME / BAKALARI_PASSWORD come from the
container environment, which the subprocess inherits. Without them the run FAILS.
"""

import json
import subprocess

WORKER = "/config/www/simple-schedule-card/bakalari/bakalari_sync.py"
TIMEOUT_S = 240
# The colour helper reads the Google integration's store, which HA writes a few
# seconds after the refresh; measured ~6s end to end, so this leaves margin.
COLOUR_SETTLE_S = 15


def _cfg(name, default=None):
    cfg = pyscript.config
    if isinstance(cfg, dict):
        val = cfg.get("bakalari_sync_" + name)
        if val is not None:
            return val
    return default


def _failed(reason):
    log.error(f"bakalari_sync: {reason}")
    return {"ok": False, "error": reason}


@service(supports_response="optional")
def bakalari_sync_run():
    """Run the Bakalari mirror now. Returns ok, and the counts or the error."""
    url = _cfg("url")
    calendar = _cfg("calendar")
    if not url or not calendar:
        return _failed("bakalari_sync_url / bakalari_sync_calendar are not configured")
    weekdays = _cfg("weekdays", [0, 1, 2, 3, 4])
    if isinstance(weekdays, (list, tuple)):
        # A list, not a generator: pyscript's interpreter has no generator expressions.
        weekdays = ",".join([str(d) for d in weekdays])
    cmd = [
        "python3", _cfg("worker", WORKER),
        "--url", str(url),
        "--calendar", str(calendar),
        "--weekdays", str(weekdays),
        "--weeks-ahead", str(_cfg("weeks_ahead", 3)),
        "--color-id", str(_cfg("color_id", "")),
    ]
    try:
        # subprocess.run is a native function, so it may be handed to the executor;
        # this keeps the network calls off Home Assistant's event loop.
        res = task.executor(subprocess.run, cmd, capture_output=True, timeout=TIMEOUT_S)
    except (OSError, subprocess.SubprocessError) as err:
        return _failed(f"could not run the worker: {err}")

    if res.returncode != 0:
        detail = res.stderr.decode(errors="replace").strip().splitlines()
        reason = detail[-1] if detail else f"worker exited {res.returncode}"
        # The worker prefixes its own name; _failed adds it again.
        return _failed(reason.removeprefix("bakalari_sync: "))

    lines = res.stdout.decode(errors="replace").strip().splitlines()
    try:
        summary = json.loads(lines[-1]) if lines else None
    except ValueError:
        summary = None
    if not isinstance(summary, dict):
        return _failed("the worker returned no summary")
    log.info(f"bakalari_sync: {lines[-1]}")

    if summary.get("created") or summary.get("restored") or summary.get("deleted"):
        homeassistant.update_entity(entity_id=calendar)
        if service.has_service("pyscript", "simple_schedule_colors_sync"):
            task.sleep(COLOUR_SETTLE_S)
            pyscript.simple_schedule_colors_sync()

    result = {"ok": True}
    result.update(summary)
    return result
