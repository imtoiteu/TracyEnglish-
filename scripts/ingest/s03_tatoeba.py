"""
Stage 3 — bilingual example sentences from Tatoeba.

Tatoeba is a corpus of sentences translated by volunteers. The English–Vietnamese subset
gives us something no monolingual source can: a natural English sentence beside a natural
Vietnamese sentence, both written by people, with per-sentence attribution.

These become the example sentences shown on vocabulary cards and the sentence bank the
exercise engine draws on for gap-fill and translation practice.
"""

from __future__ import annotations

import io
import re
import zipfile
from collections import defaultdict

from common import fetch, log, read_json, step, write_json
from sources import source

TATOEBA_URL = "https://www.manythings.org/anki/vie-eng.zip"

_ATTRIBUTION = re.compile(r"#(\d+)\s*\(([^)]+)\)")
_TOKEN = re.compile(r"[a-z][a-z'-]*")

# Very common function words carry no teaching value as an "example of this word".
STOPWORDS = {
    "the", "a", "an", "and", "or", "but", "if", "of", "to", "in", "on", "at", "for",
    "with", "as", "by", "is", "am", "are", "was", "were", "be", "been", "being",
    "do", "does", "did", "have", "has", "had", "it", "its", "this", "that", "these",
    "those", "i", "you", "he", "she", "we", "they", "me", "him", "her", "us", "them",
    "my", "your", "his", "our", "their", "not", "no", "so", "there", "here",
}

# Cheap English lemmatiser: enough to connect "studies"/"studied" back to "study".
_SUFFIXES = [
    ("ies", "y"), ("ied", "y"), ("ying", "y"),
    ("sses", "ss"), ("ches", "ch"), ("shes", "sh"), ("xes", "x"),
    ("ing", ""), ("ed", ""), ("es", ""), ("s", ""),
    ("er", ""), ("est", ""), ("ly", ""),
]


def candidates(token: str) -> set[str]:
    """All plausible dictionary forms of a surface token."""
    out = {token}
    for suffix, replacement in _SUFFIXES:
        if token.endswith(suffix) and len(token) - len(suffix) >= 3:
            stem = token[: -len(suffix)] + replacement
            out.add(stem)
            # "stopped" -> "stop", "running" -> "run"
            if len(stem) > 3 and stem[-1] == stem[-2] and stem[-1] not in "aeiou":
                out.add(stem[:-1])
            # "hoped" -> "hope"
            out.add(stem + "e")
    return out


def _difficulty(english: str) -> str:
    """A rough readability band, used to pick level-appropriate examples."""
    words = english.split()
    longest = max((len(w) for w in words), default=0)
    if len(words) <= 6 and longest <= 8:
        return "A1"
    if len(words) <= 9 and longest <= 10:
        return "A2"
    if len(words) <= 14:
        return "B1"
    if len(words) <= 20:
        return "B2"
    return "C1"


def run() -> None:
    step("Stage 3 — Tatoeba English–Vietnamese sentence pairs")

    archive = zipfile.ZipFile(io.BytesIO(fetch(TATOEBA_URL)))
    raw = archive.read("vie.txt").decode("utf-8")
    log(f"downloaded {len(raw) / 1024:.0f} KB of sentence pairs")

    headwords = {entry["word"] for entry in read_json("vocabulary/headwords.json")["words"]}

    sentences: list[dict] = []
    seen_pairs: set[tuple[str, str]] = set()

    for line in raw.splitlines():
        parts = line.split("\t")
        if len(parts) < 3:
            continue
        english, vietnamese, credit = parts[0].strip(), parts[1].strip(), parts[2]
        if not english or not vietnamese:
            continue
        key = (english.lower(), vietnamese.lower())
        if key in seen_pairs:
            continue
        seen_pairs.add(key)

        contributors = [name for _id, name in _ATTRIBUTION.findall(credit)]
        sentences.append(
            {
                "id": f"tat-{len(sentences) + 1}",
                "en": english,
                "vi": vietnamese,
                "level": _difficulty(english),
                "credit": " & ".join(contributors) if contributors else "tatoeba.org",
            }
        )

    log(f"{len(sentences)} unique English–Vietnamese pairs")

    # Index sentences by the headwords they contain, so a vocabulary card can show real
    # sentences that actually use the word.
    index: dict[str, list[str]] = defaultdict(list)
    for sentence in sentences:
        matched: set[str] = set()
        for token in _TOKEN.findall(sentence["en"].lower()):
            if token in STOPWORDS:
                continue
            for form in candidates(token):
                if form in headwords:
                    matched.add(form)
        for word in matched:
            if len(index[word]) < 8:
                index[word].append(sentence["id"])

    covered = len(index)
    log(f"{covered} headwords have at least one attested sentence ({covered / len(headwords):.0%})")

    by_level: dict[str, int] = defaultdict(int)
    for sentence in sentences:
        by_level[sentence["level"]] += 1
    log("sentence levels: " + ", ".join(f"{k} {v}" for k, v in sorted(by_level.items())))

    write_json(
        "sentences/tatoeba.json",
        {
            "generatedBy": "scripts/ingest/s03_tatoeba.py",
            "source": source("tatoeba"),
            "count": len(sentences),
            "byLevel": dict(sorted(by_level.items())),
            "sentences": sentences,
        },
    )
    write_json(
        "sentences/word-index.json",
        {
            "generatedBy": "scripts/ingest/s03_tatoeba.py",
            "note": "headword -> Tatoeba sentence ids that attest it",
            "count": covered,
            "index": {k: v for k, v in sorted(index.items())},
        },
    )


if __name__ == "__main__":
    run()
