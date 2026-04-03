#!/usr/bin/env python3
"""
Read Claude CLI stderr/stdout from stdin. If a line matches e.g.
  resets 6pm (Europe/London)
print two lines: seconds_to_sleep (int), then reset instant ISO8601.
Exit 0 on success, 2 if no parse / no zoneinfo, 3 if sleep would exceed CLAUDE_LIMIT_MAX_SLEEP_SEC.
"""

import os
import re
import sys
from datetime import datetime, timedelta


def main() -> None:
    text = sys.stdin.read()
    m = re.search(
        r"resets\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b\s*\(([^)]+)\)",
        text,
        re.I,
    )
    m24 = None
    if not m:
        m24 = re.search(r"resets\s+(\d{1,2}):(\d{2})\b\s*\(([^)]+)\)", text, re.I)

    try:
        from zoneinfo import ZoneInfo
    except ImportError:
        sys.exit(2)

    if m:
        hour = int(m.group(1))
        minute = int(m.group(2) or 0)
        ap = m.group(3).lower()
        tz_name = m.group(4).strip()
        if ap == "pm" and hour != 12:
            hour += 12
        if ap == "am" and hour == 12:
            hour = 0
    elif m24:
        hour = int(m24.group(1))
        minute = int(m24.group(2))
        tz_name = m24.group(3).strip()
        if hour > 23 or minute > 59:
            sys.exit(2)
    else:
        sys.exit(2)

    try:
        tz = ZoneInfo(tz_name)
    except Exception:
        sys.exit(2)

    now = datetime.now(tz)
    target = now.replace(hour=hour, minute=minute, second=0, microsecond=0)
    if target <= now:
        target += timedelta(days=1)

    buffer_sec = int(os.environ.get("CLAUDE_LIMIT_RESET_BUFFER_SEC", "60"))
    delta = int((target - now).total_seconds()) + buffer_sec
    if delta < 30:
        delta = 30

    max_sec = int(os.environ.get("CLAUDE_LIMIT_MAX_SLEEP_SEC", "172800"))
    if delta > max_sec:
        sys.exit(3)

    print(delta)
    print(target.isoformat())


if __name__ == "__main__":
    try:
        main()
    except SystemExit:
        raise
    except Exception:
        sys.exit(2)
