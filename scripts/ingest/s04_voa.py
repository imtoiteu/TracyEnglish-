"""
Stage 4 — reading and listening material from VOA Learning English.

VOA Learning English is produced by the Voice of America, an agency of the U.S. federal
government, so its output is in the public domain. It is also purpose-built for learners:
articles are written in graded English, read aloud slowly by professional broadcasters, and
end with an editor-written glossary ("Words in This Story").

That combination — real human audio, a real transcript, and a curated word list — is what
this platform's listening and reading sections are built on. Nothing here is synthesised.

Each feed is mapped to a section of the platform and a CEFR band, based on VOA's own level
guidance for the series.
"""

from __future__ import annotations

import re
import xml.etree.ElementTree as ET
from datetime import datetime, timezone

from common import fetch_text, log, slugify, step, write_json
from htmlex import container, first, meta, paragraphs, text
from sources import source

BASE = "https://learningenglish.voanews.com"

# Every series below is a text-plus-audio series: an article a learner can read and a
# recording of a broadcaster reading it. VOA's video-only strands (English in a Minute,
# News Words, English @ the Movies) are deliberately excluded — their pages carry no
# transcript, and a listening exercise without a transcript is not much use to a learner
# who needs to check what they missed.
#
# `path` is the RSS feed (most recent ~20 items); `zone` is the archive listing, which
# pages back through years of material.
FEEDS: list[dict] = [
    {
        "key": "as-it-is",
        "path": "/api/zkm-ql-vomx-tpej-rqi",
        "zone": "3521",
        "name": "As It Is",
        "nameVi": "As It Is — bản tin đọc chậm",
        "level": "B1",
        "sections": ["listening", "reading"],
        "pages": 5,
        "blurbVi": "Bản tin thời sự đọc chậm, câu ngắn và rõ — nguồn luyện nghe hằng ngày cho trình độ trung cấp.",
    },
    {
        "key": "health-lifestyle",
        "path": "/api/zmmpql-vomx-tpey-_q",
        "zone": "955",
        "name": "Health & Lifestyle",
        "nameVi": "Sức khoẻ & Đời sống",
        "level": "B1",
        "sections": ["reading", "listening"],
        "pages": 4,
        "blurbVi": "Bài đọc về sức khoẻ, dinh dưỡng và lối sống, kèm audio do phát thanh viên đọc.",
    },
    {
        "key": "science-technology",
        "path": "/api/zmg_pl-vomx-tpeymtm",
        "zone": "1579",
        "name": "Science & Technology",
        "nameVi": "Khoa học & Công nghệ",
        "level": "B2",
        "sections": ["reading", "listening"],
        "pages": 4,
        "blurbVi": "Bài đọc khoa học công nghệ với từ vựng học thuật — sát với chủ đề IELTS Reading.",
    },
    {
        "key": "american-stories",
        "path": "/api/zyg__l-vomx-tpetmty",
        "zone": "1581",
        "name": "American Stories",
        "nameVi": "Truyện ngắn Mỹ",
        "level": "B2",
        "sections": ["reading", "listening"],
        "pages": 4,
        "blurbVi": "Truyện ngắn kinh điển của Mỹ được rút gọn và thu âm — luyện đọc văn học.",
    },
    {
        "key": "words-and-their-stories",
        "path": "/api/zmypyl-vomx-tpeyry_",
        "zone": "987",
        "name": "Words and Their Stories",
        "nameVi": "Nguồn gốc thành ngữ",
        "level": "B1",
        "sections": ["reading", "listening", "vocabulary"],
        "pages": 5,
        "blurbVi": "Giải thích nguồn gốc và cách dùng của thành ngữ tiếng Anh — phần khó nhất khi nghe người bản xứ nói.",
    },
    {
        "key": "everyday-grammar",
        "path": "/api/zoroqql-vomx-tpeptpqq",
        "zone": "4456",
        "name": "Everyday Grammar",
        "nameVi": "Ngữ pháp hằng ngày",
        "level": "B1",
        "sections": ["grammar", "listening"],
        "pages": 5,
        "blurbVi": "Chuyên mục ngữ pháp của VOA: mỗi bài một điểm ngữ pháp, giải thích bằng ví dụ có thật.",
    },
    {
        "key": "ask-a-teacher",
        "path": "/api/zti_qvl-vomx-tpekgvqr",
        "zone": "5535",
        "name": "Ask a Teacher",
        "nameVi": "Hỏi giáo viên",
        "level": "B1",
        "sections": ["grammar"],
        "pages": 5,
        "blurbVi": "Giải đáp đúng những câu hỏi ngữ pháp mà người học Việt Nam hay vướng nhất.",
    },
    {
        "key": "arts-entertainment",
        "path": "/api/zpyp_l-vomx-tpe_rym",
        "zone": "986",
        "name": "Arts & Entertainment",
        "nameVi": "Nghệ thuật & Giải trí",
        "level": "B2",
        "sections": ["reading", "listening"],
        "pages": 3,
        "blurbVi": "Bài đọc về âm nhạc, điện ảnh và văn hoá — từ vựng đời sống phong phú.",
    },
    {
        "key": "education-tips",
        "path": "/api/z_gjqyl-vomx-tpevmrov",
        "zone": "7468",
        "name": "Education Tips",
        "nameVi": "Mẹo học tập",
        "level": "B1",
        "sections": ["reading"],
        "pages": 3,
        "blurbVi": "Lời khuyên về phương pháp học tiếng Anh và kỹ năng học tập.",
    },
    {
        "key": "education",
        "path": "/api/ztmp_l-vomx-tpek-__",
        "zone": "",
        "name": "Education",
        "nameVi": "Giáo dục & Du học",
        "level": "B2",
        "sections": ["reading"],
        "pages": 0,
        "blurbVi": "Bài đọc về giáo dục và du học — hữu ích cho học sinh chuẩn bị đi du học.",
    },
    {
        "key": "us-history",
        "path": "/api/zj_pvl-vomx-tpebb_v",
        "zone": "",
        "name": "U.S. History",
        "nameVi": "Lịch sử Hoa Kỳ",
        "level": "B2",
        "sections": ["reading", "listening"],
        "pages": 0,
        "blurbVi": "Loạt bài lịch sử với văn phong trang trọng hơn — luyện đọc học thuật.",
    },
]

_MP3 = re.compile(r"https://[^\s\"'<>]+?\.mp3")
_GLOSS_LINE = re.compile(r"^(.{1,40}?)\s*[–—-]\s*(?:(n|v|adj|adv|prep|conj|phrasal verb|idiom)\.\s*)?(.+)$")

POS_LONG = {
    "n": "noun",
    "v": "verb",
    "adj": "adjective",
    "adv": "adverb",
    "prep": "preposition",
    "conj": "conjunction",
    "phrasal verb": "phrase",
    "idiom": "phrase",
}


_ARTICLE_HREF = re.compile(r'href="(/a/[^"]+\.html)"')


def _feed_items(path: str, take: int = 20) -> list[dict]:
    xml = fetch_text(BASE + path)
    root = ET.fromstring(xml)
    out: list[dict] = []
    for item in root.findall(".//item")[:take]:
        link = (item.findtext("link") or "").strip()
        if not link:
            continue
        out.append(
            {
                "url": link,
                "title": (item.findtext("title") or "").strip(),
                "summary": (item.findtext("description") or "").strip(),
                "published": (item.findtext("pubDate") or "").strip(),
            }
        )
    return out


def _archive_items(zone: str, pages: int) -> list[dict]:
    """
    Walk a series' archive listing.

    The RSS feed only exposes the twenty most recent items. The archive goes back years,
    which is what turns "a handful of articles" into a library a learner can work through.
    """
    out: list[dict] = []
    for page in range(1, pages + 1):
        try:
            markup = fetch_text(f"{BASE}/z/{zone}?p={page}")
        except Exception as exc:  # noqa: BLE001
            log(f"archive zone {zone} page {page}: {exc}")
            break
        hrefs = []
        for href in _ARTICLE_HREF.findall(markup):
            if href not in hrefs:
                hrefs.append(href)
        if not hrefs:
            break
        for href in hrefs:
            out.append({"url": BASE + href, "title": "", "summary": "", "published": ""})
    return out


def _parse_glossary(body_text: str) -> list[dict]:
    """Read VOA's editor-written 'Words in This Story' glossary."""
    lowered = body_text.lower()
    index = lowered.find("words in this story")
    if index < 0:
        return []
    tail = body_text[index + len("words in this story") :]
    entries: list[dict] = []
    for raw in tail.splitlines():
        line = raw.strip()
        if not line or len(line) < 8:
            continue
        if line.startswith("_") or "comment" in line.lower()[:20]:
            continue
        match = _GLOSS_LINE.match(line)
        if not match:
            continue
        word, pos, definition = match.groups()
        word = word.strip().strip("*").lower()
        if not word or len(word) > 40 or not re.match(r"^[a-z][a-z '-]*$", word):
            continue
        definition = definition.strip()
        if len(definition) < 10:
            continue
        entries.append(
            {
                "word": word,
                "pos": POS_LONG.get((pos or "").strip(), ""),
                "definition": definition,
            }
        )
        if len(entries) >= 14:
            break
    return entries


def _to_iso(pub_date: str) -> str:
    pub_date = (pub_date or "").strip()
    for fmt in ("%a, %d %b %Y %H:%M:%S %z", "%a, %d %b %Y %H:%M:%S %Z"):
        try:
            return datetime.strptime(pub_date, fmt).astimezone(timezone.utc).isoformat()
        except ValueError:
            continue
    try:
        return datetime.fromisoformat(pub_date).astimezone(timezone.utc).isoformat()
    except ValueError:
        return datetime.now(timezone.utc).isoformat()


def _fetch_article(item: dict, feed: dict) -> dict | None:
    try:
        markup = fetch_text(item["url"])
    except Exception as exc:  # noqa: BLE001
        log(f"skip {item['url']}: {exc}")
        return None

    body_html = container(markup, "wsw")
    if not body_html:
        body_html = container(markup, "content-offset")
    if not body_html:
        return None

    body_text = text(body_html)
    paras = paragraphs(body_html)
    # Everything after the glossary heading is not part of the article proper.
    cut = next(
        (i for i, p in enumerate(paras) if p.lower().startswith("words in this story")),
        len(paras),
    )
    paras = [p for p in paras[:cut] if not p.startswith("_")]
    if len(paras) < 3:
        return None

    audio_matches = [m for m in _MP3.findall(markup) if "download" not in m]
    audio_url = ""
    for candidate in audio_matches:
        if candidate.endswith("_hq.mp3"):
            continue
        audio_url = candidate
        break
    if not audio_url and audio_matches:
        audio_url = audio_matches[0]

    title = first(markup, r"<h1[^>]*>(.*?)</h1>") or item["title"]
    title = re.sub(r"\s+", " ", title).strip()
    words = sum(len(p.split()) for p in paras)

    published = item["published"]
    if not published:
        # Archive listings carry no date, so read the article's own <time> element.
        stamp = first(markup, r'<time[^>]+datetime="([^"]+)"')
        if stamp:
            published = stamp.replace("&#x2B;", "+")

    return {
        "id": f"voa-{feed['key']}-{slugify(title)[:60]}",
        "series": feed["key"],
        "seriesName": feed["name"],
        "title": title,
        "summary": item["summary"] or meta(markup, "description"),
        "sourceUrl": item["url"],
        "published": _to_iso(published),
        "level": feed["level"],
        "sections": feed["sections"],
        "audioUrl": audio_url,
        "image": meta(markup, "og:image"),
        "paragraphs": paras,
        "wordCount": words,
        "readingMinutes": max(1, round(words / 130)),
        "glossary": _parse_glossary(body_text),
    }


def run() -> None:
    step("Stage 4 — VOA Learning English articles, transcripts and broadcast audio")

    series_meta: list[dict] = []
    articles: list[dict] = []
    seen: set[str] = set()

    for feed in FEEDS:
        items: list[dict] = []
        try:
            items.extend(_feed_items(feed["path"]))
        except Exception as exc:  # noqa: BLE001
            log(f"feed {feed['key']} unavailable: {exc}")
        if feed.get("zone") and feed.get("pages"):
            items.extend(_archive_items(feed["zone"], feed["pages"]))

        deduped: list[dict] = []
        urls: set[str] = set()
        for item in items:
            if item["url"] in urls:
                continue
            urls.add(item["url"])
            deduped.append(item)

        collected = 0
        for item in deduped:
            article = _fetch_article(item, feed)
            if not article or article["id"] in seen:
                continue
            seen.add(article["id"])
            articles.append(article)
            collected += 1

        series_meta.append(
            {
                "key": feed["key"],
                "name": feed["name"],
                "nameVi": feed["nameVi"],
                "level": feed["level"],
                "sections": feed["sections"],
                "blurbVi": feed["blurbVi"],
                "count": collected,
            }
        )
        log(f"{feed['name']}: {collected} articles")

    with_audio = sum(1 for a in articles if a["audioUrl"])
    with_glossary = sum(1 for a in articles if a["glossary"])
    total_words = sum(a["wordCount"] for a in articles)
    log(
        f"total {len(articles)} articles · {with_audio} with broadcast audio · "
        f"{with_glossary} with an editor glossary · {total_words:,} words of text"
    )

    write_json(
        "voa/articles.json",
        {
            "generatedBy": "scripts/ingest/s04_voa.py",
            "source": source("voa"),
            "count": len(articles),
            "withAudio": with_audio,
            "series": series_meta,
            "articles": articles,
        },
    )


if __name__ == "__main__":
    run()
