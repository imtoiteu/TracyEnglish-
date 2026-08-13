"""
Stage 2 — enrich every headword from Wiktionary.

Two wikis are consulted:

*   **en.wiktionary.org** supplies IPA for Received Pronunciation and General American,
    English definitions grouped by word class, usage examples, inflected forms, and the
    Vietnamese translation gloss recorded in the entry's translation table.
*   **vi.wiktionary.org** supplies Vietnamese-language definitions. A large part of that
    wiki's English coverage descends from Hồ Ngọc Đức's Free Vietnamese Dictionary
    Project, so the glosses read like a proper Anh–Việt dictionary rather than a gloss
    translated word by word.

Both are CC BY-SA 4.0 and both are credited in the UI.

The stage checkpoints to JSONL after every batch, so an interrupted run resumes where it
stopped instead of re-fetching thousands of pages.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

from common import CACHE, api_query, chunked, log, read_json, step, write_json
from sources import source
from wikitext import parse_entry, parse_vi_entry

EN_API = "https://en.wiktionary.org/w/api.php"
VI_API = "https://vi.wiktionary.org/w/api.php"

EN_CHECKPOINT = CACHE / "checkpoints" / "enwiktionary.jsonl"
VI_CHECKPOINT = CACHE / "checkpoints" / "viwiktionary.jsonl"

EN_BATCH = 25
VI_BATCH = 25


def _load_checkpoint(path: Path) -> dict[str, dict]:
    if not path.exists():
        return {}
    out: dict[str, dict] = {}
    for line in path.read_text(encoding="utf-8").splitlines():
        if not line.strip():
            continue
        try:
            record = json.loads(line)
        except json.JSONDecodeError:
            continue
        out[record["word"]] = record.get("data")
    return out


def _append(path: Path, word: str, data: dict | None) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("a", encoding="utf-8") as handle:
        handle.write(json.dumps({"word": word, "data": data}, ensure_ascii=False) + "\n")


def fetch_english(words: list[str]) -> dict[str, dict]:
    done = _load_checkpoint(EN_CHECKPOINT)
    todo = [w for w in words if w not in done]
    log(f"en.wiktionary: {len(done)} cached, {len(todo)} to fetch")

    for index, batch in enumerate(chunked(todo, EN_BATCH), start=1):
        try:
            payload = api_query(
                EN_API,
                {
                    "action": "query",
                    "prop": "revisions",
                    "rvprop": "content",
                    "rvslots": "main",
                    "titles": "|".join(batch),
                    "redirects": "1",
                },
            )
        except Exception as exc:  # noqa: BLE001
            log(f"batch failed ({exc}); skipping {batch[0]}…")
            continue

        query = payload.get("query", {})
        # Redirects and normalisation mean the returned title may differ from the request.
        alias: dict[str, str] = {}
        for kind in ("normalized", "redirects"):
            for item in query.get(kind, []) or []:
                alias[item["to"]] = alias.get(item["from"], item["from"])

        received: dict[str, dict | None] = {}
        for page in query.get("pages", []) or []:
            title = page.get("title", "")
            requested = alias.get(title, title)
            if page.get("missing"):
                received[requested] = None
                continue
            try:
                content = page["revisions"][0]["slots"]["main"]["content"]
            except (KeyError, IndexError):
                received[requested] = None
                continue
            received[requested] = parse_entry(content)

        for word in batch:
            data = received.get(word)
            done[word] = data
            _append(EN_CHECKPOINT, word, data)

        if index % 20 == 0:
            log(f"  … {index * EN_BATCH} words")

    return {w: d for w, d in done.items() if d}


def fetch_vietnamese(words: list[str]) -> dict[str, dict]:
    done = _load_checkpoint(VI_CHECKPOINT)
    todo = [w for w in words if w not in done]
    log(f"vi.wiktionary: {len(done)} cached, {len(todo)} to fetch")

    for index, batch in enumerate(chunked(todo, VI_BATCH), start=1):
        try:
            payload = api_query(
                VI_API,
                {
                    "action": "query",
                    "prop": "revisions",
                    "rvprop": "content",
                    "rvslots": "main",
                    "titles": "|".join(batch),
                    "redirects": "1",
                },
            )
        except Exception as exc:  # noqa: BLE001
            log(f"batch failed ({exc}); skipping {batch[0]}…")
            continue

        query = payload.get("query", {})
        alias: dict[str, str] = {}
        for kind in ("normalized", "redirects"):
            for item in query.get(kind, []) or []:
                alias[item["to"]] = alias.get(item["from"], item["from"])

        received: dict[str, dict | None] = {}
        for page in query.get("pages", []) or []:
            title = page.get("title", "")
            requested = alias.get(title, title)
            if page.get("missing"):
                received[requested] = None
                continue
            try:
                content = page["revisions"][0]["slots"]["main"]["content"]
            except (KeyError, IndexError):
                received[requested] = None
                continue
            received[requested] = parse_vi_entry(content)

        for word in batch:
            data = received.get(word)
            done[word] = data
            _append(VI_CHECKPOINT, word, data)

        if index % 25 == 0:
            log(f"  … {index * VI_BATCH} words")

    return {w: d for w, d in done.items() if d}


def run(limit: int | None = None) -> None:
    step("Stage 2 — Wiktionary enrichment (IPA, glosses, Vietnamese meanings)")

    headwords = read_json("vocabulary/headwords.json")["words"]
    words = [entry["word"] for entry in headwords]
    if limit:
        words = words[:limit]

    english = fetch_english(words)
    log(f"en.wiktionary: {len(english)} entries parsed ({len(english) / max(len(words),1):.0%} coverage)")

    vietnamese = fetch_vietnamese(words)
    log(f"vi.wiktionary: {len(vietnamese)} entries parsed ({len(vietnamese) / max(len(words),1):.0%} coverage)")

    with_ipa = sum(1 for d in english.values() if d.get("ipa"))
    with_vi_gloss = sum(
        1 for w in words if w in vietnamese or (english.get(w) or {}).get("translationsVi")
    )
    log(f"with IPA: {with_ipa} · with a Vietnamese meaning: {with_vi_gloss}")

    write_json(
        "vocabulary/wiktionary-en.json",
        {
            "generatedBy": "scripts/ingest/s02_wiktionary.py",
            "source": source("enwiktionary"),
            "count": len(english),
            "entries": english,
        },
    )
    write_json(
        "vocabulary/wiktionary-vi.json",
        {
            "generatedBy": "scripts/ingest/s02_wiktionary.py",
            "source": source("viwiktionary"),
            "count": len(vietnamese),
            "entries": vietnamese,
        },
    )


if __name__ == "__main__":
    run(int(sys.argv[1]) if len(sys.argv) > 1 else None)
