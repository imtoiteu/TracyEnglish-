"""
The source register.

Every external corpus this platform uses is declared here with its licence and the
attribution string that must travel with the content. The register is exported to
`content/sources.json` and rendered on the site's /credits page, so a learner can always
see where a sentence, a recording or an article came from.

Nothing may be ingested that is not declared here.
"""

from __future__ import annotations

SOURCES: dict[str, dict[str, str]] = {
    "cefrj": {
        "id": "cefrj",
        "name": "CEFR-J Wordlist (Version 1.5)",
        "publisher": "Tono Laboratory, Tokyo University of Foreign Studies",
        "url": "https://www.cefr-j.org/",
        "distribution": "https://github.com/openlanguageprofiles/olp-en-cefrj",
        "licence": "CC BY-SA 4.0",
        "licenceUrl": "https://creativecommons.org/licenses/by-sa/4.0/",
        "attribution": "CEFR-J Wordlist Version 1.5. Compiled by Yukio Tono, Tokyo University of Foreign Studies. Licensed under CC BY-SA 4.0.",
        "usedFor": "CEFR level (A1–B2) for every headword in the vocabulary system.",
    },
    "octanove": {
        "id": "octanove",
        "name": "Octanove Vocabulary Profile C1/C2 (Version 1.0)",
        "publisher": "Octanove Labs",
        "url": "https://github.com/openlanguageprofiles/olp-en-cefrj",
        "distribution": "https://github.com/openlanguageprofiles/olp-en-cefrj",
        "licence": "CC BY-SA 4.0",
        "licenceUrl": "https://creativecommons.org/licenses/by-sa/4.0/",
        "attribution": "Octanove Vocabulary Profile C1/C2 Version 1.0, Octanove Labs. Licensed under CC BY-SA 4.0.",
        "usedFor": "CEFR level (C1–C2) for advanced headwords.",
    },
    "cefrj-grammar": {
        "id": "cefrj-grammar",
        "name": "CEFR-J Grammar Profile",
        "publisher": "Tono Laboratory, Tokyo University of Foreign Studies",
        "url": "https://www.cefr-j.org/",
        "distribution": "https://github.com/openlanguageprofiles/olp-en-cefrj",
        "licence": "CC BY-SA 4.0",
        "licenceUrl": "https://creativecommons.org/licenses/by-sa/4.0/",
        "attribution": "CEFR-J Grammar Profile. Compiled by Yukio Tono, Tokyo University of Foreign Studies. Licensed under CC BY-SA 4.0.",
        "usedFor": "CEFR levelling and criterial-feature evidence for grammar topics.",
    },
    "enwiktionary": {
        "id": "enwiktionary",
        "name": "English Wiktionary",
        "publisher": "Wikimedia Foundation and Wiktionary contributors",
        "url": "https://en.wiktionary.org/",
        "distribution": "https://en.wiktionary.org/w/api.php",
        "licence": "CC BY-SA 4.0",
        "licenceUrl": "https://creativecommons.org/licenses/by-sa/4.0/",
        "attribution": "Definitions, IPA transcriptions and translations from English Wiktionary, by Wiktionary contributors, CC BY-SA 4.0.",
        "usedFor": "IPA (Received Pronunciation and General American), English glosses, word class, Vietnamese translation glosses.",
    },
    "viwiktionary": {
        "id": "viwiktionary",
        "name": "Wiktionary tiếng Việt",
        "publisher": "Wikimedia Foundation and Wiktionary contributors",
        "url": "https://vi.wiktionary.org/",
        "distribution": "https://vi.wiktionary.org/w/api.php",
        "licence": "CC BY-SA 4.0",
        "licenceUrl": "https://creativecommons.org/licenses/by-sa/4.0/",
        "attribution": "Vietnamese definitions from Wiktionary tiếng Việt (incorporating the Free Vietnamese Dictionary Project by Hồ Ngọc Đức), CC BY-SA 4.0.",
        "usedFor": "Vietnamese meanings and explanations for English headwords.",
    },
    "commons": {
        "id": "commons",
        "name": "Wikimedia Commons pronunciation recordings",
        "publisher": "Wikimedia Commons contributors (including Lingua Libre)",
        "url": "https://commons.wikimedia.org/",
        "distribution": "https://commons.wikimedia.org/w/api.php",
        "licence": "CC BY-SA / CC BY / CC0 (per file)",
        "licenceUrl": "https://commons.wikimedia.org/wiki/Commons:Licensing",
        "attribution": "Human pronunciation recordings from Wikimedia Commons. Per-file author and licence are stored with each clip.",
        "usedFor": "Real human audio for individual vocabulary items. No synthetic speech is used anywhere on this platform.",
    },
    "tatoeba": {
        "id": "tatoeba",
        "name": "Tatoeba English–Vietnamese sentence pairs",
        "publisher": "The Tatoeba Project",
        "url": "https://tatoeba.org/",
        "distribution": "https://www.manythings.org/anki/",
        "licence": "CC BY 2.0 FR",
        "licenceUrl": "https://creativecommons.org/licenses/by/2.0/fr/",
        "attribution": "Sentence pairs from tatoeba.org, CC BY 2.0 FR. Individual sentence contributors are credited per sentence.",
        "usedFor": "Bilingual example sentences attached to vocabulary and grammar items.",
    },
    "voa": {
        "id": "voa",
        "name": "VOA Learning English",
        "publisher": "Voice of America (U.S. Agency for Global Media)",
        "url": "https://learningenglish.voanews.com/",
        "distribution": "https://learningenglish.voanews.com/rssfeeds",
        "licence": "Public domain (U.S. Government work)",
        "licenceUrl": "https://www.voanews.com/p/5559.html",
        "attribution": "Voice of America Learning English. As a work of the U.S. federal government, this material is in the public domain.",
        "usedFor": "Graded reading passages, listening lessons with real broadcast audio, and Everyday Grammar explanations.",
    },
    "gutenberg": {
        "id": "gutenberg",
        "name": "Project Gutenberg",
        "publisher": "Project Gutenberg Literary Archive Foundation",
        "url": "https://www.gutenberg.org/",
        "distribution": "https://www.gutenberg.org/",
        "licence": "Public domain in the United States",
        "licenceUrl": "https://www.gutenberg.org/policy/permission.html",
        "attribution": "Text from Project Gutenberg, in the public domain in the United States.",
        "usedFor": "Short public-domain stories used as graded readers.",
    },
    "librivox": {
        "id": "librivox",
        "name": "LibriVox",
        "publisher": "LibriVox volunteers",
        "url": "https://librivox.org/",
        "distribution": "https://librivox.org/api/info",
        "licence": "Public domain",
        "licenceUrl": "https://librivox.org/pages/public-domain/",
        "attribution": "Audio recordings by LibriVox volunteers, released into the public domain.",
        "usedFor": "Human-read audio for public-domain story readers.",
    },
}


def source(source_id: str) -> dict[str, str]:
    if source_id not in SOURCES:
        raise KeyError(f"undeclared source '{source_id}' — add it to scripts/ingest/sources.py")
    return SOURCES[source_id]


def export() -> list[dict[str, str]]:
    return list(SOURCES.values())
