"""
Stage 6 — assemble the grammar system.

Each topic in `grammar_catalogue.py` is joined to three sourced inputs:

*   **CEFR-J Grammar Profile** (CC BY-SA 4.0) — the criterial grammatical items that
    evidence the topic's level.
*   **Tatoeba** (CC BY 2.0 FR) — real bilingual sentences that attest the pattern, matched
    by regular expression and then filtered for length and readability so an A1 topic gets
    A1 sentences.
*   **VOA Everyday Grammar / Ask a Teacher** (public domain) — a full article with audio
    covering the same point, matched on keywords.

Practice exercises are built from the matched Tatoeba sentences rather than invented, so
every gap-fill and word-order task uses a sentence a person actually wrote.
"""

from __future__ import annotations

import csv
import io
import random
import re

from common import fetch_text, log, read_json, step, write_json
from grammar_catalogue import TOPICS
from sources import source

GRAMMAR_PROFILE_URL = (
    "https://raw.githubusercontent.com/openlanguageprofiles/olp-en-cefrj/master/"
    "cefrj-grammar-profile-20180315.csv"
)

LEVEL_RANK = {"A1": 0, "A2": 1, "B1": 2, "B2": 3, "C1": 4, "C2": 5}


def _load_profile() -> dict[str, dict]:
    """Index the CEFR-J Grammar Profile by its shorthand code."""
    rows: dict[str, dict] = {}
    reader = csv.DictReader(io.StringIO(fetch_text(GRAMMAR_PROFILE_URL)))
    for row in reader:
        code = (row.get("Shorthand Code") or "").strip()
        if not code:
            continue
        rows[code] = {
            "code": code,
            "item": (row.get("Grammatical Item") or "").strip(),
            "sentenceType": (row.get("Sentence Type") or "").strip(),
            "cefr": (row.get("CEFR-J Level") or row.get("Core Inventory") or "").strip(),
        }
    return rows


def _profile_matches(profile: dict[str, dict], prefixes: list[str]) -> list[dict]:
    """
    Find criterial items for a topic.

    The catalogue names a few shorthand codes per topic; the profile groups related items
    under a shared prefix (PP.I_am, PP.I_am_not, PP.am_I…), so prefix matching pulls in the
    whole family rather than just the one code that was written down.
    """
    out: list[dict] = []
    seen: set[str] = set()
    for prefix in prefixes:
        head = prefix.split(".")[0]
        for code, row in profile.items():
            if code in seen:
                continue
            if code == prefix or code.startswith(prefix) or code.startswith(head + "."):
                seen.add(code)
                out.append(row)
    # Keep the family readable: the most representative dozen.
    out.sort(key=lambda r: (len(r["code"]), r["code"]))
    return out[:12]


def _pick_examples(
    sentences: list[dict],
    patterns: list[re.Pattern[str]],
    level: str,
    wanted: int = 12,
) -> list[dict]:
    """
    Select real sentences that attest a grammar pattern, at roughly the right difficulty.

    Sentences at or below the topic's level come first — an A1 topic taught with a
    twenty-word sentence teaches nothing.
    """
    target = LEVEL_RANK.get(level, 2)
    scored: list[tuple[int, int, dict]] = []
    for sentence in sentences:
        text = sentence["en"]
        if not any(p.search(text) for p in patterns):
            continue
        rank = LEVEL_RANK.get(sentence["level"], 3)
        # Prefer sentences at the topic's level, then easier, then harder.
        distance = abs(rank - target) * 2 + (1 if rank > target else 0)
        scored.append((distance, len(text), sentence))
    scored.sort(key=lambda item: (item[0], item[1]))

    picked: list[dict] = []
    seen: set[str] = set()
    for _distance, _length, sentence in scored:
        key = sentence["en"].lower()
        if key in seen:
            continue
        seen.add(key)
        picked.append(sentence)
        if len(picked) >= wanted:
            break
    return picked


def _match_voa(articles: list[dict], keywords: list[str], title: str) -> dict | None:
    """Find the VOA grammar article that covers this point, if one exists."""
    needles = [k.lower() for k in keywords] + [title.lower()]
    best: tuple[int, dict] | None = None
    for article in articles:
        if article["series"] not in {"everyday-grammar", "ask-a-teacher"}:
            continue
        haystack = f"{article['title']} {article['summary']}".lower()
        score = sum(3 if needle in article["title"].lower() else 1 for needle in needles if needle in haystack)
        if score and (best is None or score > best[0]):
            best = (score, article)
    return best[1] if best else None


# ---------------------------------------------------------------------------
# Exercise construction from attested sentences
# ---------------------------------------------------------------------------

_WORD = re.compile(r"[A-Za-z][A-Za-z'-]*")


def _gap_fill(sentence: dict, patterns: list[re.Pattern[str]]) -> dict | None:
    """
    Blank out the part of a real sentence that the topic is about.

    The gap is never chosen at random: it is the span the topic's own pattern matched, so
    the question tests the grammar point and nothing else.
    """
    text = sentence["en"]
    span = None
    for pattern in patterns:
        found = pattern.search(text)
        if found and found.group(0).strip():
            span = found.span()
            break
    if not span:
        return None
    answer = text[span[0] : span[1]].strip()
    if not answer or len(answer) > 28 or not _WORD.search(answer):
        return None
    prompt = text[: span[0]] + "____" + text[span[1] :]
    if "____" not in prompt:
        return None
    return {
        "type": "GAP_FILL",
        "promptEn": prompt.strip(),
        "promptVi": "Điền phần còn thiếu vào chỗ trống.",
        "answer": answer,
        "context": sentence["vi"],
        "explanationVi": f"Câu gốc: “{text}” — {sentence['vi']}",
        "cefr": sentence["level"],
        "attribution": f"tatoeba.org — {sentence['credit']}",
    }


def _reorder(sentence: dict) -> dict | None:
    """Word-order practice built from a real sentence."""
    text = sentence["en"].rstrip()
    words = text.replace("…", "").split()
    if not (4 <= len(words) <= 9):
        return None
    shuffled = words[:]
    seed = sum(ord(c) for c in text)
    random.Random(seed).shuffle(shuffled)
    if shuffled == words:
        shuffled.reverse()
    return {
        "type": "REORDER",
        "promptEn": " / ".join(shuffled),
        "promptVi": "Sắp xếp các từ sau thành câu đúng.",
        "answer": text,
        "context": sentence["vi"],
        "explanationVi": f"Nghĩa: {sentence['vi']}",
        "cefr": sentence["level"],
        "attribution": f"tatoeba.org — {sentence['credit']}",
    }


def _translation(sentence: dict) -> dict:
    return {
        "type": "TRANSLATION",
        "promptEn": sentence["vi"],
        "promptVi": "Dịch câu sau sang tiếng Anh.",
        "answer": sentence["en"],
        "context": "",
        "explanationVi": f"Một cách dịch tự nhiên: “{sentence['en']}”.",
        "cefr": sentence["level"],
        "attribution": f"tatoeba.org — {sentence['credit']}",
    }


def _pitfall_choice(topic: dict) -> list[dict]:
    """
    Turn each documented mistake into a multiple-choice question.

    The catalogue writes pitfalls as "✗ wrong → ✓ right", which is exactly the shape of a
    two-option question with a ready-made explanation.
    """
    out: list[dict] = []
    for pitfall in topic.get("pitfallsVi", []):
        match = re.search(r"✗\s*\*?(.+?)\*?\s*→\s*✓\s*\*?(.+?)\*?\s*$", pitfall)
        if not match:
            continue
        wrong = match.group(1).strip(" *.")
        right = match.group(2).strip(" *.")
        if not wrong or not right or len(right) > 90:
            continue
        note = pitfall.split("**")[1] if "**" in pitfall else ""
        out.append(
            {
                "type": "MULTIPLE_CHOICE",
                "promptEn": "Which sentence is correct?",
                "promptVi": "Câu nào đúng?",
                "answer": right,
                "options": [right, wrong],
                "context": "",
                "explanationVi": (f"{note}. " if note else "") + f"Câu đúng là “{right}”.",
                "cefr": topic["cefr"],
                "attribution": "",
            }
        )
    return out


def run() -> None:
    step("Stage 6 — grammar topics, levelled and attested")

    profile = _load_profile()
    log(f"CEFR-J Grammar Profile: {len(profile)} criterial items")

    sentences = read_json("sentences/tatoeba.json")["sentences"]
    voa = read_json("voa/articles.json")["articles"]

    topics: list[dict] = []
    total_examples = 0
    total_exercises = 0

    for topic in TOPICS:
        patterns = [re.compile(p) for p in topic["match"]]
        examples = _pick_examples(sentences, patterns, topic["cefr"])
        criterial = _profile_matches(profile, topic.get("cefrjCodes", []))
        article = _match_voa(voa, topic.get("voaKeywords", []), topic["titleEn"])

        exercises: list[dict] = []
        exercises.extend(_pitfall_choice(topic))
        for sentence in examples[:6]:
            built = _gap_fill(sentence, patterns)
            if built:
                exercises.append(built)
        for sentence in examples[6:9]:
            built = _reorder(sentence)
            if built:
                exercises.append(built)
        for sentence in examples[9:12]:
            exercises.append(_translation(sentence))

        for index, exercise in enumerate(exercises):
            exercise["displayOrder"] = index
            exercise["skill"] = "grammar"

        topics.append(
            {
                "slug": topic["slug"],
                "titleVi": topic["titleVi"],
                "titleEn": topic["titleEn"],
                "cefr": topic["cefr"],
                "category": topic["category"],
                "summaryVi": topic["summaryVi"],
                "theoryVi": topic["theoryVi"],
                "patterns": topic["patterns"],
                "pitfallsVi": topic["pitfallsVi"],
                "tipsVi": topic["tipsVi"],
                "criterialFeatures": criterial,
                "examples": [
                    {
                        "en": s["en"],
                        "vi": s["vi"],
                        "level": s["level"],
                        "credit": s["credit"],
                    }
                    for s in examples
                ],
                "voaArticleId": article["id"] if article else "",
                "voaArticleTitle": article["title"] if article else "",
                "exercises": exercises,
            }
        )
        total_examples += len(examples)
        total_exercises += len(exercises)

    by_level: dict[str, int] = {}
    thin = []
    for topic in topics:
        by_level[topic["cefr"]] = by_level.get(topic["cefr"], 0) + 1
        if len(topic["examples"]) < 4:
            thin.append(f"{topic['slug']} ({len(topic['examples'])})")

    log(f"{len(topics)} topics · {total_examples} attested examples · {total_exercises} exercises")
    log("by level: " + ", ".join(f"{k} {v}" for k, v in sorted(by_level.items())))
    linked = sum(1 for t in topics if t["voaArticleId"])
    log(f"{linked} topics linked to a VOA grammar article")
    if thin:
        # Never hide a coverage gap: a topic with too few attested sentences is a topic the
        # exercise builder will produce thin practice for.
        log(f"topics with few attested sentences: {', '.join(thin)}")

    write_json(
        "grammar/topics.json",
        {
            "generatedBy": "scripts/ingest/s06_grammar.py",
            "sources": [source("cefrj-grammar"), source("tatoeba"), source("voa")],
            "count": len(topics),
            "byLevel": dict(sorted(by_level.items())),
            "topics": topics,
        },
    )


if __name__ == "__main__":
    run()
