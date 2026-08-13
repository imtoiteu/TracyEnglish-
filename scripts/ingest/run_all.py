"""
Run the whole content pipeline.

    python3 scripts/ingest/run_all.py            # everything, resuming from cache
    python3 scripts/ingest/run_all.py 4 5 6      # only the named stages

Stages are ordered by dependency and each one caches its downloads, so re-running is cheap
and a run interrupted halfway picks up where it stopped.
"""

from __future__ import annotations

import sys
import time

from common import ensure_dirs, log, step, write_json
from sources import export as export_sources

STAGES = {
    1: ("CEFR-levelled headword list", "s01_wordlist"),
    2: ("Wiktionary enrichment", "s02_wiktionary"),
    3: ("Tatoeba bilingual sentences", "s03_tatoeba"),
    4: ("VOA Learning English articles", "s04_voa"),
    5: ("Wikimedia Commons pronunciation audio", "s05_audio"),
    6: ("Grammar topics", "s06_grammar"),
    7: ("Vocabulary assembly", "s07_vocabulary"),
}


def main(selected: list[int]) -> int:
    ensure_dirs()
    started = time.time()

    write_json("sources.json", export_sources())

    for number in sorted(selected):
        name, module_name = STAGES[number]
        step(f"[{number}/{len(STAGES)}] {name}")
        module = __import__(module_name)
        try:
            module.run()
        except Exception as exc:  # noqa: BLE001
            log(f"stage {number} failed: {exc}")
            return 1

    log(f"pipeline finished in {time.time() - started:.0f}s")
    return 0


if __name__ == "__main__":
    args = [int(a) for a in sys.argv[1:] if a.isdigit()]
    sys.exit(main(args or list(STAGES)))
