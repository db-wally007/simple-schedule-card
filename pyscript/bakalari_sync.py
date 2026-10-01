"""
Hourly runner for the Bakalari -> Google Calendar mirror (bakalari/bakalari_sync.py).

The mirror itself is plain Python and runs as a SUBPROCESS: plain Python can be
tested outside Home Assistant, and a subprocess cannot stall HA's event loop the way
pyscript's interpreter can. This file schedules it, passes it its settings, and when
something changed refreshes the calendar entity - so the change shows now instead of
after the Google integration's 15-minute cache - and re-runs the colour helper, so a
new lesson gets its colour at once rather than at the helper's next tick.

Settings, in the `pyscript:` block of configuration.yaml:

    bakalari_sync_url: https://<school>.bakalari.cz      required
    bakalari_sync_calendar: calendar.<name>               required
    bakalari_sync_weekdays: [0, 1, 2, 3, 4]               Monday = 0
    bakalari_sync_weeks_ahead: 3
    bakalari_sync_color_id: "4"                           Google event colour id

Credentials are NOT settings: BAKALARI_USERNAME / BAKALARI_PASSWORD come from the
container environment, which the subprocess inherits. Until they are set the worker
exits quietly with "skipped".

Run it by hand with the service pyscript.bakalari_sync_run.
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


@time_trigger("cron(7 * * * *)")
def bakalari_sync_hourly():
    _run()


@service
def bakalari_sync_run():
    """Run the Bakalari mirror now."""
    _run()


def _run():
    url = _cfg("url")
    calendar = _cfg("calendar")
    if not url or not calendar:
        log.warning("bakalari_sync: bakalari_sync_url / bakalari_sync_calendar not configured")
        return
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
        log.error(f"bakalari_sync: could not run the worker: {err}")
        return

    if res.returncode != 0:
        log.error(f"bakalari_sync: worker failed: {res.stderr.decode(errors='replace')[-600:]}")
        return

    lines = res.stdout.decode(errors="replace").strip().splitlines()
    last = lines[-1] if lines else "{}"
    try:
        summary = json.loads(last)
    except ValueError:
        summary = {}
    log.info(f"bakalari_sync: {last}")

    if summary.get("created") or summary.get("restored") or summary.get("deleted"):
        homeassistant.update_entity(entity_id=calendar)
        if service.has_service("pyscript", "simple_schedule_colors_sync"):
            task.sleep(COLOUR_SETTLE_S)
            pyscript.simple_schedule_colors_sync()
