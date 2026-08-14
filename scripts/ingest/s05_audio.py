"""
Stage 5 — real human pronunciation audio from Wikimedia Commons.

This platform does not synthesise speech. An earlier attempt at this product generated
pronunciation with espeak, and it sounded like a machine reading a shopping list — which is
worse than no audio at all, because a learner copies what they hear.

Instead, every word clip here is a recording of a person, published on Wikimedia Commons
under CC BY-SA, CC BY or CC0. Most come from Lingua Libre, a Wikimedia project whose whole
purpose is recording native speakers saying words in their own language.

Two ways of finding a recording, in order of reliability:

1.  The Wiktionary entry already links one (`{{audio|en|En-us-water.ogg}}`). Stage 2 kept
    those filenames.
2.  Failing that, probe the naming conventions Commons actually uses for English words.

Every file that lands is re-encoded to a small mono Ogg Vorbis clip, and its author,
licence and Commons page are recorded alongside it so the credit travels with the audio.
"""

from __future__ import annotations

import html
import re
import sys
from pathlib import Path

from common import (
    CACHE,
    MEDIA,
    api_query,
    chunked,
    download_to,
    log,
    read_json,
    step,
    transcode_audio,
    write_json,
)
from sources import source

COMMONS_API = "https://commons.wikimedia.org/w/api.php"
AUDIO_DIR = MEDIA / "pronunciation"
RAW_DIR = CACHE / "audio-raw"

# Commons naming conventions for English word recordings, best first.
CANDIDATE_PATTERNS = [
    "En-us-{word}.ogg",
    "En-uk-{word}.ogg",
    "En-au-{word}.ogg",
    "LL-Q1860 (eng)-Vealhurl-{word}.wav",
    "LL-Q1860 (eng)-Back ache-{word}.wav",
    "LL-Q1860 (eng)-Flame, not lame-{word}.wav",
]

_ACCENT_FROM_NAME = [
    ("en-us-", "us"),
    ("en-uk-", "uk"),
    ("en-gb-", "uk"),
    ("en-au-", "au"),
    ("vealhurl", "uk"),
    ("back ache", "uk"),
    ("flame, not lame", "us"),
]


def _accent(filename: str, declared: str = "") -> str:
    if declared in {"us", "uk", "au"}:
        return declared
    lowered = filename.lower()
    for needle, accent in _ACCENT_FROM_NAME:
        if needle in lowered:
            return accent
    return "other"


def _clean(value: str) -> str:
    plain = re.sub(r"<[^>]+>", " ", value or "")
    plain = html.unescape(plain)
    return re.sub(r"\s{2,}", " ", plain).strip()


_LL_NAME = re.compile(r"^LL-Q1860 \(eng\)-(.+?)-(.+)\.(wav|ogg|flac|mp3)$", re.I)
LL_INDEX_PATH = CACHE / "lingua-libre-eng.json"


def lingua_libre_index() -> dict[str, list[str]]:
    """
    Build a word → filenames index over Lingua Libre's English recordings.

    Lingua Libre is a Wikimedia project that records native speakers pronouncing single
    words; the English category holds over a hundred thousand clips. Enumerating the
    category once and caching it is far cheaper than guessing filenames word by word, and
    it roughly doubles how many headwords end up with real audio.
    """
    import json

    if LL_INDEX_PATH.exists():
        return json.loads(LL_INDEX_PATH.read_text(encoding="utf-8"))

    index: dict[str, list[str]] = {}
    continue_token: str | None = None
    pages = 0
    while True:
        params = {
            "action": "query",
            "list": "categorymembers",
            "cmtitle": "Category:Lingua Libre pronunciation-eng",
            "cmlimit": "500",
            "cmtype": "file",
        }
        if continue_token:
            params["cmcontinue"] = continue_token
        try:
            payload = api_query(COMMONS_API, params)
        except Exception as exc:  # noqa: BLE001
            log(f"Lingua Libre enumeration stopped: {exc}")
            break

        for member in payload.get("query", {}).get("categorymembers", []) or []:
            name = member["title"].split(":", 1)[-1]
            match = _LL_NAME.match(name)
            if not match:
                continue
            word = match.group(2).strip().lower()
            if not re.match(r"^[a-z][a-z'-]*$", word):
                continue
            index.setdefault(word, []).append(name)

        pages += 1
        if pages % 40 == 0:
            log(f"  … {pages * 500} Lingua Libre files scanned, {len(index)} distinct words")

        continue_token = (payload.get("continue") or {}).get("cmcontinue")
        if not continue_token:
            break

    LL_INDEX_PATH.parent.mkdir(parents=True, exist_ok=True)
    LL_INDEX_PATH.write_text(json.dumps(index, ensure_ascii=False), encoding="utf-8")
    log(f"Lingua Libre index: {len(index)} distinct English words")
    return index


def _lookup(filenames: list[str]) -> dict[str, dict]:
    """Ask Commons for the download URL and licensing metadata of a batch of files."""
    found: dict[str, dict] = {}
    for batch in chunked(filenames, 40):
        titles = "|".join(f"File:{name}" for name in batch)
        try:
            payload = api_query(
                COMMONS_API,
                {
                    "action": "query",
                    "prop": "imageinfo",
                    "iiprop": "url|mime|size|extmetadata",
                    "titles": titles,
                },
            )
        except Exception as exc:  # noqa: BLE001
            log(f"commons lookup failed: {exc}")
            continue

        for page in payload.get("query", {}).get("pages", []) or []:
            if page.get("missing") or not page.get("imageinfo"):
                continue
            info = page["imageinfo"][0]
            extra = info.get("extmetadata", {}) or {}
            title = page["title"].split(":", 1)[-1]
            licence = _clean(extra.get("LicenseShortName", {}).get("value", "")) or "see Commons"
            author = _clean(extra.get("Artist", {}).get("value", "")) or "Wikimedia Commons contributor"
            found[title] = {
                "file": title,
                "url": info["url"].split("?")[0],
                "size": info.get("size", 0),
                "licence": licence,
                "author": author[:120],
                "descriptionUrl": info.get("descriptionurl", ""),
            }
    return found


def rebuild_index() -> None:
    """
    Rebuild the clip index from what is already on disk.

    The download stage is long and network-bound, so it can be interrupted. Everything it
    needs to write the index — the audio files themselves and the cached Commons metadata —
    survives an interruption, so the index can be reconstructed without re-fetching a byte.
    """
    step("Stage 5 (index only) — rebuilding the clip index from disk")

    if not AUDIO_DIR.exists():
        log("no audio directory yet; nothing to index")
        return

    en_entries = read_json("vocabulary/wiktionary-en.json")["entries"]
    vi_entries = read_json("vocabulary/wiktionary-vi.json")["entries"]
    lingua_libre = lingua_libre_index()

    words = sorted(path.stem for path in AUDIO_DIR.glob("*.mp3"))
    log(f"{len(words)} clips on disk")

    # Work out which Commons file each clip came from, using the same preference order the
    # download used, and look up its metadata from cache.
    wanted: dict[str, list[str]] = {}
    for word in words:
        names: list[str] = []
        for clip in (en_entries.get(word) or {}).get("audio", []):
            names.append(clip["file"])
        for clip in (vi_entries.get(word) or {}).get("audio", []):
            names.append(clip["file"])
        for pattern in CANDIDATE_PATTERNS[:3]:
            names.append(pattern.format(word=word))
        names.extend(lingua_libre.get(word, [])[:2])
        seen: set[str] = set()
        deduped: list[str] = []
        for name in names:
            if name.lower() in seen:
                continue
            seen.add(name.lower())
            deduped.append(name)
        wanted[word] = deduped[:6]

    available = _lookup([name for names in wanted.values() for name in names])

    index: dict[str, dict] = {}
    for word in words:
        path = AUDIO_DIR / f"{word}.mp3"
        candidates = [available[name] for name in wanted[word] if name in available]
        chosen = None
        for preference in ("us", "uk", "au", "other"):
            for candidate in candidates:
                if _accent(candidate["file"]) == preference:
                    chosen = candidate
                    break
            if chosen:
                break
        if not chosen and candidates:
            chosen = candidates[0]

        index[word] = {
            "path": f"/media/pronunciation/{word}.mp3",
            "accent": _accent(chosen["file"]) if chosen else "other",
            "commonsFile": chosen["file"] if chosen else "",
            "commonsPage": chosen["descriptionUrl"] if chosen else "",
            "author": chosen["author"] if chosen else "Wikimedia Commons contributor",
            "licence": chosen["licence"] if chosen else "see Commons",
            "bytes": path.stat().st_size,
        }

    by_accent: dict[str, int] = {}
    for item in index.values():
        by_accent[item["accent"]] = by_accent.get(item["accent"], 0) + 1
    total_bytes = sum(item["bytes"] for item in index.values())
    log(f"{len(index)} clips indexed · {total_bytes / 1024 / 1024:.1f} MB")
    log("accents: " + ", ".join(f"{k} {v}" for k, v in sorted(by_accent.items())))

    write_json(
        "vocabulary/pronunciation-audio.json",
        {
            "generatedBy": "scripts/ingest/s05_audio.py (index rebuild)",
            "source": source("commons"),
            "note": "Human recordings only. No synthetic speech is used anywhere on this platform.",
            "count": len(index),
            "byAccent": by_accent,
            "totalBytes": total_bytes,
            "clips": index,
        },
    )


def run(limit: int | None = None, max_words: int = 3200) -> None:
    step("Stage 5 — human pronunciation recordings from Wikimedia Commons")

    headwords = read_json("vocabulary/headwords.json")["words"]
    en_entries = read_json("vocabulary/wiktionary-en.json")["entries"]
    vi_entries = read_json("vocabulary/wiktionary-vi.json")["entries"]

    # Prioritise the words a learner meets first: a beginner needs "water" pronounced far
    # more than a C2 learner needs "perspicacious".
    order = {"A1": 0, "A2": 1, "B1": 2, "B2": 3, "C1": 4, "C2": 5}
    ranked = sorted(headwords, key=lambda e: (order.get(e["cefr"], 9), e["word"]))
    if limit:
        ranked = ranked[:limit]
    ranked = ranked[:max_words]

    lingua_libre = lingua_libre_index()

    # Collect candidate filenames per word.
    wanted: dict[str, list[str]] = {}
    for entry in ranked:
        word = entry["word"]
        names: list[str] = []
        for clip in (en_entries.get(word) or {}).get("audio", []):
            names.append(clip["file"])
        for clip in (vi_entries.get(word) or {}).get("audio", []):
            names.append(clip["file"])
        for pattern in CANDIDATE_PATTERNS[:3]:
            names.append(pattern.format(word=word))
        names.extend(lingua_libre.get(word, [])[:2])
        # Keep order, drop duplicates.
        seen: set[str] = set()
        deduped: list[str] = []
        for name in names:
            key = name.lower()
            if key in seen:
                continue
            seen.add(key)
            deduped.append(name)
        wanted[word] = deduped[:6]

    every_name = [name for names in wanted.values() for name in names]
    log(f"probing {len(every_name)} candidate filenames for {len(wanted)} words")
    available = _lookup(every_name)
    log(f"{len(available)} recordings exist on Commons")

    AUDIO_DIR.mkdir(parents=True, exist_ok=True)
    RAW_DIR.mkdir(parents=True, exist_ok=True)

    index: dict[str, dict] = {}
    downloaded = 0
    failed = 0

    for entry in ranked:
        word = entry["word"]
        chosen: dict | None = None
        # Prefer a US recording, then UK, then anything.
        candidates = [available[name] for name in wanted[word] if name in available]
        if not candidates:
            continue
        for preference in ("us", "uk", "au", "other"):
            for candidate in candidates:
                if _accent(candidate["file"]) == preference:
                    chosen = candidate
                    break
            if chosen:
                break
        if not chosen:
            chosen = candidates[0]

        suffix = Path(chosen["file"]).suffix.lower() or ".ogg"
        raw_path = RAW_DIR / f"{word}{suffix}"
        final_path = AUDIO_DIR / f"{word}.mp3"

        if not final_path.exists():
            if not download_to(chosen["url"], raw_path):
                failed += 1
                continue
            if not transcode_audio(raw_path, final_path):
                failed += 1
                continue
            downloaded += 1

        index[word] = {
            "path": f"/media/pronunciation/{word}.mp3",
            "accent": _accent(chosen["file"]),
            "commonsFile": chosen["file"],
            "commonsPage": chosen["descriptionUrl"],
            "author": chosen["author"],
            "licence": chosen["licence"],
            "bytes": final_path.stat().st_size if final_path.exists() else 0,
        }

        if downloaded and downloaded % 250 == 0:
            log(f"  … {downloaded} clips downloaded")

    total_bytes = sum(item["bytes"] for item in index.values())
    log(
        f"{len(index)} words have a human recording "
        f"({len(index) / max(len(ranked), 1):.0%} of the words attempted); "
        f"{downloaded} newly downloaded, {failed} failed, {total_bytes / 1024 / 1024:.1f} MB on disk"
    )

    by_accent: dict[str, int] = {}
    for item in index.values():
        by_accent[item["accent"]] = by_accent.get(item["accent"], 0) + 1
    log("accents: " + ", ".join(f"{k} {v}" for k, v in sorted(by_accent.items())))

    write_json(
        "vocabulary/pronunciation-audio.json",
        {
            "generatedBy": "scripts/ingest/s05_audio.py",
            "source": source("commons"),
            "note": "Human recordings only. No synthetic speech is used anywhere on this platform.",
            "count": len(index),
            "byAccent": by_accent,
            "totalBytes": total_bytes,
            "clips": index,
        },
    )


if __name__ == "__main__":
    if "--index-only" in sys.argv:
        rebuild_index()
    else:
        limit = next((int(a) for a in sys.argv[1:] if a.isdigit()), None)
        run(limit)
