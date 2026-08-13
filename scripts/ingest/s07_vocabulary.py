"""
Stage 7 — assemble the vocabulary system.

This is the join that makes a vocabulary card worth looking at. For one headword it pulls
together, from five separate corpora:

    word          CEFR-J Wordlist / Octanove profile     (CC BY-SA 4.0)
    IPA           English Wiktionary                     (CC BY-SA 4.0)
    audio         Wikimedia Commons / Lingua Libre       (CC BY-SA / CC BY / CC0)
    meaning (vi)  Vietnamese Wiktionary, largely from the
                  Free Vietnamese Dictionary Project     (CC BY-SA 4.0)
    definition    English Wiktionary                     (CC BY-SA 4.0)
    examples      Vietnamese Wiktionary collocations and
                  Tatoeba bilingual sentence pairs       (CC BY-SA 4.0 / CC BY 2.0 FR)

Word lists come from two places, both real: CEFR bands from the vocabulary profiles, and
topic lists built from the "Words in This Story" glossaries that VOA editors write for
their own articles.
"""

from __future__ import annotations

import re
from collections import Counter, defaultdict

from common import log, read_json, slugify, step, write_json
from sources import source

LEVEL_ORDER = ["A1", "A2", "B1", "B2", "C1", "C2"]
LEVEL_RANK = {level: index for index, level in enumerate(LEVEL_ORDER)}

# A gloss is only useful if it says something. Wiktionary occasionally leaves a bare
# cross-reference behind, and those make terrible flashcards.
_USELESS_GLOSS = re.compile(
    r"^(alternative (form|spelling)|obsolete (form|spelling)|misspelling|plural of|"
    r"past (tense|participle) of|present participle of|inflection of|initialism of)\b",
    re.I,
)

TOPIC_LISTS = [
    {"series": "health-lifestyle", "slug": "health-and-body", "titleVi": "Sức khoẻ và cơ thể", "titleEn": "Health and the body", "accent": "teal", "icon": "heart"},
    {"series": "science-technology", "slug": "science-and-technology", "titleVi": "Khoa học và công nghệ", "titleEn": "Science and technology", "accent": "sky", "icon": "flask"},
    {"series": "as-it-is", "slug": "news-and-current-affairs", "titleVi": "Tin tức và thời sự", "titleEn": "News and current affairs", "accent": "brand", "icon": "newspaper"},
    {"series": "american-stories", "slug": "storytelling-and-literature", "titleVi": "Kể chuyện và văn học", "titleEn": "Storytelling and literature", "accent": "coral", "icon": "book-open"},
    {"series": "words-and-their-stories", "slug": "idioms-and-expressions", "titleVi": "Thành ngữ và cách diễn đạt", "titleEn": "Idioms and expressions", "accent": "sun", "icon": "sparkles"},
    {"series": "arts-entertainment", "slug": "arts-and-culture", "titleVi": "Nghệ thuật và văn hoá", "titleEn": "Arts and culture", "accent": "rose", "icon": "palette"},
    {"series": "education-tips", "slug": "study-and-education", "titleVi": "Học tập và giáo dục", "titleEn": "Study and education", "accent": "brand", "icon": "graduation-cap"},
    {"series": "us-history", "slug": "history-and-society", "titleVi": "Lịch sử và xã hội", "titleEn": "History and society", "accent": "ink", "icon": "landmark"},
]


def _clean_gloss(value: str) -> str:
    value = re.sub(r"\s{2,}", " ", value).strip(" .;,")
    return value


def _vietnamese_meaning(vi_entry: dict | None, en_entry: dict | None) -> tuple[str, str]:
    """
    Produce the short Vietnamese gloss and the longer Vietnamese explanation.

    The short gloss is what appears on a flashcard, so it must be a handful of words. The
    Anh–Việt dictionary writes its first sense as a comma-separated list of near-synonyms
    ("Nhà ở, căn nhà, tòa nhà"), which is exactly the right shape — the first two or three
    become the gloss, and the full set of senses becomes the explanation.
    """
    meanings = (vi_entry or {}).get("meanings", [])
    if meanings:
        first = _clean_gloss(meanings[0]["text"])
        parts = [p.strip() for p in first.split(",") if p.strip()]
        short = ", ".join(parts[:3])
        # Group the rest by word class so the explanation reads like a dictionary entry.
        by_pos: dict[str, list[str]] = defaultdict(list)
        for meaning in meanings:
            text = _clean_gloss(meaning["text"])
            if text and text not in by_pos[meaning["pos"]]:
                by_pos[meaning["pos"]].append(text)
        chunks = []
        for pos, texts in by_pos.items():
            chunks.append(f"({pos}) " + "; ".join(texts[:4]))
        return short[:160], " · ".join(chunks)[:900]

    translations = (en_entry or {}).get("translationsVi", [])
    if translations:
        # Wiktionary's translation tables sometimes carry non-Vietnamese scripts; drop them.
        latin = [t for t in translations if re.match(r"^[\w\sÀ-ỹà-ỹ'’()-]+$", t)]
        if latin:
            return ", ".join(latin[:3])[:160], ""
    return "", ""


def _english_senses(en_entry: dict | None, limit: int = 4) -> list[dict]:
    out: list[dict] = []
    for word_class in (en_entry or {}).get("classes", []):
        for sense in word_class["senses"]:
            gloss = _clean_gloss(sense["gloss"])
            if not gloss or _USELESS_GLOSS.match(gloss):
                continue
            out.append({"pos": word_class["pos"], "gloss": gloss, "example": sense.get("example", "")})
            if len(out) >= limit:
                return out
    return out


def run() -> None:
    step("Stage 7 — assemble vocabulary entries")

    headwords = read_json("vocabulary/headwords.json")["words"]
    en_entries = read_json("vocabulary/wiktionary-en.json")["entries"]
    vi_entries = read_json("vocabulary/wiktionary-vi.json")["entries"]
    audio = read_json("vocabulary/pronunciation-audio.json", {"clips": {}})["clips"]
    tatoeba = read_json("sentences/tatoeba.json")["sentences"]
    word_index = read_json("sentences/word-index.json")["index"]
    voa = read_json("voa/articles.json")

    sentence_by_id = {s["id"]: s for s in tatoeba}

    items: list[dict] = []
    dropped = 0

    for entry in headwords:
        word = entry["word"]
        en_entry = en_entries.get(word)
        vi_entry = vi_entries.get(word)

        meaning_vi, explanation_vi = _vietnamese_meaning(vi_entry, en_entry)
        senses_en = _english_senses(en_entry)

        # A card with neither a Vietnamese meaning nor an English definition teaches
        # nothing, so it does not go into the database at all.
        if not meaning_vi and not senses_en:
            dropped += 1
            continue

        ipa = (en_entry or {}).get("ipa", {})
        clip = audio.get(word)

        examples: list[dict] = []
        # Dictionary collocations first: they are short, idiomatic and already bilingual.
        for example in (vi_entry or {}).get("examples", [])[:2]:
            examples.append(
                {
                    "en": example["en"],
                    "vi": example["vi"],
                    "cefr": entry["cefr"],
                    "sourceId": "viwiktionary",
                    "attribution": "Wiktionary tiếng Việt (CC BY-SA 4.0)",
                }
            )
        # Then full sentences from Tatoeba, easiest first.
        candidates = [sentence_by_id[i] for i in word_index.get(word, []) if i in sentence_by_id]
        candidates.sort(key=lambda s: (LEVEL_RANK.get(s["level"], 3), len(s["en"])))
        for sentence in candidates[: 4 - len(examples) if len(examples) < 4 else 0]:
            examples.append(
                {
                    "en": sentence["en"],
                    "vi": sentence["vi"],
                    "cefr": sentence["level"],
                    "sourceId": "tatoeba",
                    "attribution": f"tatoeba.org — {sentence['credit']} (CC BY 2.0 FR)",
                }
            )

        items.append(
            {
                "word": word,
                "cefr": entry["cefr"],
                "partsOfSpeech": entry["pos"],
                "ipaUk": ipa.get("uk", "") or (vi_entry or {}).get("ipa", ""),
                "ipaUs": ipa.get("us", ""),
                "audioPath": clip["path"] if clip else "",
                "audioAccent": clip["accent"] if clip else "",
                "audioCredit": (
                    f"{clip['author']} — {clip['licence']} (Wikimedia Commons)" if clip else ""
                ),
                "meaningVi": meaning_vi,
                "explanationVi": explanation_vi,
                "sensesEn": senses_en,
                "sensesVi": (vi_entry or {}).get("meanings", [])[:8],
                "forms": [
                    form
                    for word_class in (en_entry or {}).get("classes", [])
                    for form in word_class.get("forms", [])
                ][:4],
                "etymology": (en_entry or {}).get("etymology", "")[:400],
                "examples": examples,
            }
        )

    log(f"{len(items)} vocabulary entries assembled ({dropped} dropped for having no usable meaning)")

    with_audio = sum(1 for i in items if i["audioPath"])
    with_ipa = sum(1 for i in items if i["ipaUk"] or i["ipaUs"])
    with_vi = sum(1 for i in items if i["meaningVi"])
    with_examples = sum(1 for i in items if i["examples"])
    log(
        f"with Vietnamese meaning: {with_vi} ({with_vi/len(items):.0%}) · "
        f"with IPA: {with_ipa} ({with_ipa/len(items):.0%}) · "
        f"with human audio: {with_audio} ({with_audio/len(items):.0%}) · "
        f"with examples: {with_examples} ({with_examples/len(items):.0%})"
    )

    by_level = Counter(i["cefr"] for i in items)
    log("by level: " + ", ".join(f"{lvl} {by_level.get(lvl, 0)}" for lvl in LEVEL_ORDER))

    # ---- word lists -------------------------------------------------------
    known = {item["word"] for item in items}
    lists: list[dict] = []

    for level in LEVEL_ORDER:
        words = [i["word"] for i in items if i["cefr"] == level]
        if not words:
            continue
        lists.append(
            {
                "slug": f"cefr-{level.lower()}",
                "titleVi": f"Từ vựng trình độ {level}",
                "titleEn": f"{level} core vocabulary",
                "summaryVi": (
                    f"Toàn bộ từ được xếp ở trình độ {level} theo CEFR-J Wordlist và "
                    "Octanove Vocabulary Profile."
                ),
                "cefr": level,
                "topic": "level",
                "accent": {"A1": "teal", "A2": "sky", "B1": "brand", "B2": "coral", "C1": "sun", "C2": "rose"}[level],
                "icon": "layers",
                "words": words,
            }
        )

    # Topic lists come from the glossaries VOA editors write for their own articles: a real
    # editorial judgement about which words in a piece are worth teaching.
    glossary_by_series: dict[str, Counter] = defaultdict(Counter)
    for article in voa["articles"]:
        for gloss in article["glossary"]:
            word = gloss["word"].strip().lower()
            if " " in word or word not in known:
                continue
            glossary_by_series[article["series"]][word] += 1

    for spec in TOPIC_LISTS:
        counted = glossary_by_series.get(spec["series"], Counter())
        words = [word for word, _count in counted.most_common(80)]
        if len(words) < 12:
            log(f"topic list '{spec['slug']}' skipped — only {len(words)} words available")
            continue
        levels = [LEVEL_RANK[next(i["cefr"] for i in items if i["word"] == w)] for w in words]
        median = LEVEL_ORDER[sorted(levels)[len(levels) // 2]]
        lists.append(
            {
                "slug": spec["slug"],
                "titleVi": spec["titleVi"],
                "titleEn": spec["titleEn"],
                "summaryVi": (
                    "Những từ mà biên tập viên VOA Learning English chọn ra để giải thích "
                    "trong các bài viết cùng chủ đề."
                ),
                "cefr": median,
                "topic": spec["series"],
                "accent": spec["accent"],
                "icon": spec["icon"],
                "words": words,
            }
        )

    log(f"{len(lists)} word lists ({sum(len(l['words']) for l in lists)} memberships)")

    write_json(
        "vocabulary/entries.json",
        {
            "generatedBy": "scripts/ingest/s07_vocabulary.py",
            "sources": [
                source("cefrj"),
                source("octanove"),
                source("enwiktionary"),
                source("viwiktionary"),
                source("commons"),
                source("tatoeba"),
            ],
            "count": len(items),
            "withAudio": with_audio,
            "byLevel": dict(by_level),
            "items": items,
        },
    )
    write_json(
        "vocabulary/lists.json",
        {
            "generatedBy": "scripts/ingest/s07_vocabulary.py",
            "sources": [source("cefrj"), source("voa")],
            "count": len(lists),
            "lists": lists,
        },
    )


if __name__ == "__main__":
    run()
