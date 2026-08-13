"""
A small, purpose-built MediaWiki wikitext reader.

Wiktionary entries are wikitext, not a database dump, so the useful parts have to be
lifted out by hand. This module does exactly as much parsing as the vocabulary system
needs — pronunciation, glosses, word class, inflected forms, usage examples and the
Vietnamese translation — and nothing more.
"""

from __future__ import annotations

import re

# ---------------------------------------------------------------------------
# Section handling
# ---------------------------------------------------------------------------

_HEADING = re.compile(r"^(={2,6})\s*(.+?)\s*\1\s*$", re.M)

WORD_CLASSES = {
    "noun": "noun",
    "proper noun": "noun",
    "verb": "verb",
    "adjective": "adjective",
    "adverb": "adverb",
    "preposition": "preposition",
    "pronoun": "pronoun",
    "conjunction": "conjunction",
    "determiner": "determiner",
    "article": "determiner",
    "interjection": "interjection",
    "numeral": "number",
    "particle": "particle",
    "prefix": "affix",
    "suffix": "affix",
}


def language_section(text: str, language: str = "English") -> str:
    """Return only the requested language's slice of a Wiktionary page."""
    matches = [m for m in _HEADING.finditer(text) if len(m.group(1)) == 2]
    for index, match in enumerate(matches):
        if match.group(2).strip().lower() == language.lower():
            start = match.end()
            end = matches[index + 1].start() if index + 1 < len(matches) else len(text)
            return text[start:end]
    return ""


def subsections(text: str) -> list[tuple[str, str]]:
    """Split a language section into (heading, body) pairs at level 3 and below."""
    matches = [m for m in _HEADING.finditer(text) if len(m.group(1)) >= 3]
    out: list[tuple[str, str]] = []
    for index, match in enumerate(matches):
        start = match.end()
        end = matches[index + 1].start() if index + 1 < len(matches) else len(text)
        heading = re.sub(r"\s*\d+\s*$", "", match.group(2).strip())
        out.append((heading, text[start:end]))
    return out


# ---------------------------------------------------------------------------
# Template and link stripping
# ---------------------------------------------------------------------------

_TEMPLATE = re.compile(r"\{\{([^{}]*)\}\}")
_LINK = re.compile(r"\[\[([^\]|]+)(?:\|([^\]]*))?\]\]")
_HTML = re.compile(r"<[^>]+>")
_REF = re.compile(r"<ref[^>]*>.*?</ref>|<ref[^>]*/>", re.S)

# Templates whose *arguments* carry meaning we want to keep inline.
_INLINE_TEMPLATES = {
    "l", "m", "w", "link", "mention", "ll",
}
# Templates rendered as a bracketed label, e.g. {{lb|en|informal}} -> (informal)
_LABEL_TEMPLATES = {"lb", "label", "tlb", "term-label"}
# Templates that expand to a short fixed phrase.
_FIXED = {
    "n-g": "", "ngd": "", "non-gloss definition": "",
    "…": "…", "nbsp": " ",
}


def _expand_template(body: str) -> str:
    parts = [p.strip() for p in body.split("|")]
    name = parts[0].lower()
    args = [p for p in parts[1:] if "=" not in p.split("=")[0][:0] or True]
    positional = [p for p in parts[1:] if not re.match(r"^[a-zA-Z0-9_]+=", p)]

    if name in _FIXED:
        return _FIXED[name]
    if name in _LABEL_TEMPLATES:
        labels = [a for a in positional[1:] if a not in {"_", "and", "or"}]
        return f"({', '.join(labels)})" if labels else ""
    if name in _INLINE_TEMPLATES:
        # {{l|en|word}} / {{m|en|word|display}}
        if len(positional) >= 3:
            return positional[2]
        if len(positional) >= 2:
            return positional[1]
        return ""
    if name in {"q", "qualifier", "qual", "i", "gloss", "gl"}:
        return f"({', '.join(positional)})" if positional else ""
    if name in {"alt form", "alternative form of", "alt sp", "alternative spelling of"}:
        return f"alternative form of {positional[1]}" if len(positional) > 1 else ""
    if name in {"plural of", "past of", "past participle of", "present participle of",
                "comparative of", "superlative of", "en-third-person singular of",
                "inflection of", "synonym of", "abbreviation of", "initialism of"}:
        target = positional[1] if len(positional) > 1 else ""
        return f"{name.replace('en-', '')} {target}".strip()
    if name in {"taxlink", "vern"}:
        return positional[0] if positional else ""
    # Anything else contributes nothing readable.
    return ""


def strip_markup(text: str) -> str:
    text = _REF.sub("", text)
    # Templates can nest; expand innermost-first a bounded number of times.
    for _ in range(6):
        new = _TEMPLATE.sub(lambda m: _expand_template(m.group(1)), text)
        if new == text:
            break
        text = new
    text = _LINK.sub(lambda m: (m.group(2) or m.group(1)), text)
    text = _HTML.sub("", text)
    text = text.replace("'''", "").replace("''", "")
    text = re.sub(r"\s{2,}", " ", text)
    text = re.sub(r"\(\s*\)", "", text)
    text = re.sub(r"\s+([,.;:])", r"\1", text)
    return text.strip(" \t*#:;")


# ---------------------------------------------------------------------------
# Field extraction
# ---------------------------------------------------------------------------

_IPA_TEMPLATE = re.compile(r"\{\{IPA\|en\|([^}]*)\}\}")
_ACCENT = re.compile(r"\{\{a(?:ccent)?\|([^}]*)\}\}")


def pronunciations(section: str) -> dict[str, str]:
    """
    Pull Received Pronunciation and General American transcriptions.

    Wiktionary marks accent either with a preceding {{a|RP}} on the same list item or with
    an a= parameter inside the IPA template itself; both forms appear in practice.
    """
    found: dict[str, str] = {}
    for line in section.splitlines():
        if "{{IPA|en|" not in line:
            continue
        accents = {a.strip().upper() for group in _ACCENT.findall(line) for a in group.split("|")}
        for body in _IPA_TEMPLATE.findall(line):
            parts = [p.strip() for p in body.split("|")]
            inline = {
                p.split("=", 1)[1].strip().upper()
                for p in parts
                if p.lower().startswith("a=")
            }
            labels = accents | {a for group in inline for a in group.split(",")}
            values = [p for p in parts if p.startswith("/") or p.startswith("[")]
            if not values:
                continue
            value = values[0].strip()
            if {"RP", "UK", "BRITISH", "RECEIVED PRONUNCIATION"} & labels:
                found.setdefault("uk", value)
            elif {"GA", "US", "GENAM", "GENERAL AMERICAN", "AMERICAN"} & labels:
                found.setdefault("us", value)
            else:
                found.setdefault("neutral", value)
    if "uk" not in found and "neutral" in found:
        found["uk"] = found["neutral"]
    if "us" not in found and "neutral" in found:
        found["us"] = found["neutral"]
    found.pop("neutral", None)
    return found


_DEF_LINE = re.compile(r"^(#+)(?![#:*])\s*(.+)$")
_EXAMPLE_LINE = re.compile(r"^#+[:*]\s*(.+)$")

# Wiktionary marks senses a learner will never need. Ranking them last (rather than
# dropping them outright) keeps rare words from ending up with no definition at all.
_DEPRECATED_LABELS = (
    "obsolete", "archaic", "dated", "rare", "poetic", "historical",
    "dialectal", "nonstandard", "proscribed", "slang", "vulgar",
)
# A "non-gloss definition" is a heading for the sub-senses beneath it, not a definition.
_NON_GLOSS = re.compile(r"^\{\{(ng|n-g|ngd|non-gloss definition)\|", re.I)

# Only these templates hold a genuine usage example; everything else on an example line
# is a bibliographic citation that would read as noise to a learner.
_USEX = re.compile(r"\{\{(?:ux|usex|uxi|coi|co|ux\+)\|en\|([^|}]+)", re.I)


def _sense_rank(gloss: str) -> int:
    lowered = gloss.lower()
    for index, label in enumerate(_DEPRECATED_LABELS):
        if lowered.startswith(f"({label}") or f", {label}" in lowered[:60]:
            return 1 + index
    return 0


def senses(body: str, limit: int = 4) -> list[dict]:
    """
    Extract definitions plus any usage example that follows each.

    Wiktionary nests sub-senses under a non-gloss parent ("# {{ng|Direction.}}" followed
    by "## ..."), so both levels have to be walked, and a non-gloss parent skipped in
    favour of its children.
    """
    collected: list[dict] = []
    lines = body.splitlines()

    for index, line in enumerate(lines):
        match = _DEF_LINE.match(line)
        if not match:
            continue
        depth, raw = len(match.group(1)), match.group(2)
        if depth > 2:
            continue
        if _NON_GLOSS.match(raw.strip()):
            continue
        gloss = strip_markup(raw)
        if not gloss or len(gloss) < 4 or gloss.startswith("("):
            # A gloss that is nothing but a label carries no meaning.
            if not re.search(r"[a-z]{3,}", gloss.split(")")[-1]):
                continue
        if not gloss or len(gloss) < 4:
            continue

        example = ""
        for follow in lines[index + 1 : index + 6]:
            if _DEF_LINE.match(follow):
                break
            found = _USEX.search(follow)
            if found:
                candidate = strip_markup(found.group(1))
                if 8 < len(candidate) < 200:
                    example = candidate
                    break

        collected.append({"gloss": gloss, "example": example, "_rank": _sense_rank(gloss)})

    collected.sort(key=lambda s: s["_rank"])
    out = []
    seen: set[str] = set()
    for sense in collected:
        key = sense["gloss"][:60].lower()
        if key in seen:
            continue
        seen.add(key)
        sense.pop("_rank")
        out.append(sense)
        if len(out) >= limit:
            break
    return out


_AUDIO = re.compile(r"\{\{audio\|(?:en\|)?([^|}]+\.(?:ogg|oga|wav|mp3|flac))([^}]*)\}\}", re.I)
_PRON_AUDIO = re.compile(r"file\s*=\s*([^|}\n]+\.(?:ogg|oga|wav|mp3|flac))", re.I)


def audio_files(section: str) -> list[dict[str, str]]:
    """
    Collect the Wikimedia Commons pronunciation recordings an entry already points at.

    Wiktionary entries link their own audio, which is far more reliable than guessing
    filenames — and it is how the platform gets real human voices instead of synthesis.
    """
    out: list[dict[str, str]] = []
    seen: set[str] = set()

    def add(name: str, rest: str = "") -> None:
        name = name.strip().replace("_", " ")
        if not name or name.lower() in seen:
            return
        seen.add(name.lower())
        lowered = (name + rest).lower()
        if "-us-" in lowered or "a=us" in lowered or "hoa kỳ" in lowered:
            accent = "us"
        elif "-uk-" in lowered or "-gb-" in lowered or "a=uk" in lowered or "a=rp" in lowered:
            accent = "uk"
        elif "-au-" in lowered:
            accent = "au"
        else:
            accent = "other"
        out.append({"file": name, "accent": accent})

    for match in _AUDIO.finditer(section):
        add(match.group(1), match.group(2))
    for match in _PRON_AUDIO.finditer(section):
        add(match.group(1))
    return out[:4]


_VI_TRANSLATION = re.compile(r"\{\{t\+?\|vi\|([^|}]+)")


def vietnamese_translations(section: str, limit: int = 4) -> list[str]:
    seen: list[str] = []
    for value in _VI_TRANSLATION.findall(section):
        value = value.strip()
        if value and value not in seen:
            seen.append(value)
        if len(seen) >= limit:
            break
    return seen


_HEADWORD_TEMPLATE = re.compile(r"\{\{en-(noun|verb|adj|adv)\|([^}]*)\}\}")


def inflections(body: str) -> list[str]:
    """Best-effort inflected forms from the headword-line template."""
    forms: list[str] = []
    for _kind, args in _HEADWORD_TEMPLATE.findall(body):
        for arg in args.split("|"):
            arg = arg.strip()
            if not arg or "=" in arg or arg in {"~", "?", "-", "+"}:
                continue
            if re.match(r"^[a-zA-Z][a-zA-Z'-]*$", arg):
                forms.append(arg)
    return forms[:4]


def parse_entry(wikitext: str) -> dict | None:
    """Turn one English Wiktionary page into the fields the vocabulary system stores."""
    english = language_section(wikitext, "English")
    if not english:
        return None

    result: dict = {
        "ipa": {},
        "classes": [],
        "translationsVi": vietnamese_translations(english),
        "audio": audio_files(english),
        "etymology": "",
    }

    for heading, body in subsections(english):
        key = heading.strip().lower()
        if key.startswith("pronunciation"):
            result["ipa"].update(pronunciations(body))
        elif key.startswith("etymology") and not result["etymology"]:
            plain = strip_markup(body.split("\n\n")[0])
            if 20 < len(plain) < 400:
                result["etymology"] = plain
        else:
            word_class = WORD_CLASSES.get(key)
            if not word_class:
                continue
            entries = senses(body)
            if not entries:
                continue
            result["classes"].append(
                {
                    "pos": word_class,
                    "senses": entries,
                    "forms": inflections(body),
                }
            )

    if not result["ipa"]:
        result["ipa"] = pronunciations(english)
    if not result["classes"]:
        return None
    return result


# ---------------------------------------------------------------------------
# Vietnamese Wiktionary
# ---------------------------------------------------------------------------

# vi.wiktionary marks structure with hyphenated templates rather than headings.
_VI_MARKER = re.compile(r"\{\{-([a-z0-9]+)-\}\}", re.I)

_VI_POS = {
    "noun": "noun",
    "verb": "verb",
    "adj": "adjective",
    "adjective": "adjective",
    "adv": "adverb",
    "adverb": "adverb",
    "prep": "preposition",
    "pronoun": "pronoun",
    "conj": "conjunction",
    "interj": "interjection",
    "num": "number",
    "det": "determiner",
    "art": "determiner",
    "abbr": "abbreviation",
    "phrase": "phrase",
    "idiom": "phrase",
}

# Language-section markers. {{-eng-}} opens the English part of a Vietnamese entry.
_VI_LANG_MARKERS = {
    "eng", "vie", "fra", "deu", "spa", "rus", "jpn", "zho", "kor", "lat",
    "ita", "por", "tha", "khm", "lao", "cmn", "nld", "pol", "swe", "ara",
}

_VI_DEF = re.compile(r"^#(?![#:*])\s*(.+)$")
_VI_EXAMPLE = re.compile(r"^#[:*]\s*(.+)$")
_VI_IPA = re.compile(r"\{\{IPA(?:4|-old)?\|(?:en\|)?([^}|]+)")


def parse_vi_entry(wikitext: str) -> dict | None:
    """
    Read the English part of a vi.wiktionary page.

    Structure looks like:

        {{-eng-}}
        {{-pron-}}
        * {{IPA4|en|/ˈænt.sɜː/}}
        * {{audio|en|En-us-answer.ogg|a=US}}
        {{-noun-}}
        '''answer'''
        # Sự [[trả lời]]; [[câu]] [[trả lời]].
        #: ''to give an '''answer''' to somebody'' —  trả lời ai về việc gì

    Much of this content descends from Hồ Ngọc Đức's Free Vietnamese Dictionary Project,
    which is why the definitions read like a real Anh–Việt dictionary. The "#:" lines are
    bilingual usage examples and are kept separately, because a Vietnamese learner gets
    more from "to answer the door — ra mở cửa" than from an English-only citation.
    """
    markers = list(_VI_MARKER.finditer(wikitext))
    if not markers:
        return None

    # Slice out the English-language part.
    start = end = None
    for index, marker in enumerate(markers):
        name = marker.group(1).lower()
        if name == "eng" and start is None:
            start = marker.end()
            for later in markers[index + 1 :]:
                if later.group(1).lower() in _VI_LANG_MARKERS:
                    end = later.start()
                    break
            break
    if start is None:
        return None
    section = wikitext[start : end if end is not None else len(wikitext)]

    meanings: list[dict] = []
    examples: list[dict] = []
    ipa = ""
    current_pos = ""

    for line in section.splitlines():
        marker = _VI_MARKER.match(line.strip())
        if marker:
            key = marker.group(1).lower()
            if key == "pron":
                current_pos = "_pron"
            else:
                current_pos = _VI_POS.get(key, "")
            continue

        if current_pos == "_pron" or not ipa:
            found = _VI_IPA.search(line)
            if found and not ipa:
                candidate = found.group(1).strip()
                if candidate.startswith("/") or candidate.startswith("["):
                    ipa = candidate

        if not current_pos or current_pos == "_pron":
            continue

        definition = _VI_DEF.match(line.strip())
        if definition:
            text = strip_markup(definition.group(1))
            text = re.sub(r"^\((.*?)\)\s*", r"(\1) ", text)
            if 2 < len(text) < 300:
                meanings.append({"pos": current_pos, "text": text})
            continue

        example = _VI_EXAMPLE.match(line.strip())
        if example:
            raw = example.group(1)
            english, sep, vietnamese = raw.partition("—")
            if not sep:
                english, sep, vietnamese = raw.partition("&mdash;")
            english = strip_markup(english)
            vietnamese = strip_markup(vietnamese)
            if sep and 3 < len(english) < 160 and 2 < len(vietnamese) < 200:
                examples.append({"pos": current_pos, "en": english, "vi": vietnamese})

    if not meanings:
        return None
    return {
        "meanings": meanings[:10],
        "examples": examples[:8],
        "ipa": ipa,
        "audio": audio_files(section),
    }
