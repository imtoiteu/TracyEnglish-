"""
Stage 1 — build the CEFR-levelled headword list.

Source: the CEFR-J Wordlist (A1–B2) and the Octanove Vocabulary Profile (C1–C2), both
released under CC BY-SA 4.0 through the Open Language Profiles project. These are
research-grade lists: each headword carries the CEFR level at which learners are expected
to control it, together with its part of speech.

This gives the vocabulary system a defensible spine. We are not inventing which words are
"A2" — we are using a published profile and saying so.
"""

from __future__ import annotations

import csv
import io
import re

from common import log, step, write_json
from sources import source

CEFRJ_URL = "https://raw.githubusercontent.com/openlanguageprofiles/olp-en-cefrj/master/cefrj-vocabulary-profile-1.5.csv"
OCTANOVE_URL = "https://raw.githubusercontent.com/openlanguageprofiles/olp-en-cefrj/master/octanove-vocabulary-profile-c1c2-1.0.csv"

LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"]
LEVEL_RANK = {level: index for index, level in enumerate(LEVELS)}

# The CEFR-J list uses long-form word-class names; the platform uses short tags.
POS_MAP = {
    "noun": "noun",
    "verb": "verb",
    "adjective": "adjective",
    "adverb": "adverb",
    "preposition": "preposition",
    "pronoun": "pronoun",
    "conjunction": "conjunction",
    "determiner": "determiner",
    "interjection": "interjection",
    "exclamation": "interjection",
    "auxiliary verb": "verb",
    "modal verb": "verb",
    "modal": "verb",
    "number": "number",
    "article": "determiner",
    "infinitive marker": "particle",
    "particle": "particle",
    "phrase": "phrase",
    "idiom": "phrase",
}

HEADWORD_RE = re.compile(r"^[a-z][a-z'-]*$")


def _normalise_headword(raw: str) -> str | None:
    """
    CEFR-J headwords sometimes bundle spelling variants ("a.m./A.M./am/AM") or carry
    disambiguating suffixes. Take the first variant and reject anything that is not a
    single ordinary word.
    """
    value = raw.strip().split("/")[0].strip()
    value = re.sub(r"\s*\(.*?\)\s*", "", value)
    value = value.strip().lower()
    if not value or not HEADWORD_RE.match(value) or len(value) < 2:
        return None
    return value


def _parse(csv_text: str, source_id: str) -> list[dict]:
    rows: list[dict] = []
    reader = csv.DictReader(io.StringIO(csv_text))
    for row in reader:
        head = _normalise_headword(row.get("headword", ""))
        if not head:
            continue
        level = (row.get("CEFR") or "").strip().upper()
        if level not in LEVEL_RANK:
            continue
        pos_raw = (row.get("pos") or "").strip().lower()
        pos = POS_MAP.get(pos_raw, pos_raw or "other")
        if pos == "phrase":
            continue
        rows.append({"word": head, "pos": pos, "cefr": level, "source": source_id})
    return rows


def run() -> list[dict]:
    step("Stage 1 — CEFR-levelled headword list")

    from common import fetch_text

    cefrj = _parse(fetch_text(CEFRJ_URL), "cefrj")
    log(f"CEFR-J Wordlist 1.5: {len(cefrj)} usable rows")
    octanove = _parse(fetch_text(OCTANOVE_URL), "octanove")
    log(f"Octanove C1/C2 1.0: {len(octanove)} usable rows")

    # One entry per (word, pos). Where a word appears at several levels — as it does when
    # a noun and a verb sense are profiled separately — keep the lowest, because that is
    # the level at which a learner first meets the form.
    merged: dict[tuple[str, str], dict] = {}
    for row in cefrj + octanove:
        key = (row["word"], row["pos"])
        current = merged.get(key)
        if current is None or LEVEL_RANK[row["cefr"]] < LEVEL_RANK[current["cefr"]]:
            merged[key] = row

    # Collapse to headwords, remembering every profiled word class.
    words: dict[str, dict] = {}
    for (word, pos), row in merged.items():
        entry = words.setdefault(
            word,
            {"word": word, "cefr": row["cefr"], "pos": [], "sources": []},
        )
        if pos not in entry["pos"]:
            entry["pos"].append(pos)
        if row["source"] not in entry["sources"]:
            entry["sources"].append(row["source"])
        if LEVEL_RANK[row["cefr"]] < LEVEL_RANK[entry["cefr"]]:
            entry["cefr"] = row["cefr"]

    ordered = sorted(words.values(), key=lambda e: (LEVEL_RANK[e["cefr"]], e["word"]))
    for entry in ordered:
        entry["pos"].sort()

    by_level: dict[str, int] = {}
    for entry in ordered:
        by_level[entry["cefr"]] = by_level.get(entry["cefr"], 0) + 1
    log("by level: " + ", ".join(f"{lvl} {by_level.get(lvl, 0)}" for lvl in LEVELS))

    write_json(
        "vocabulary/headwords.json",
        {
            "generatedBy": "scripts/ingest/s01_wordlist.py",
            "sources": [source("cefrj"), source("octanove")],
            "count": len(ordered),
            "byLevel": by_level,
            "words": ordered,
        },
    )
    return ordered


if __name__ == "__main__":
    run()
