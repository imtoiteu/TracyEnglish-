"""
A minimal HTML reader for article pages.

The pipeline pulls text from a handful of known publishers, so a full HTML parser would be
more machinery than the job needs. What is needed is: find one container element, walk its
paragraphs, and come back with clean text.
"""

from __future__ import annotations

import html
import re

_TAG = re.compile(r"<[^>]+>")
_SCRIPT = re.compile(r"<(script|style|noscript)\b.*?</\1>", re.S | re.I)
_WS = re.compile(r"[ \t ]+")


def _find_container(markup: str, opening: re.Pattern[str], tag: str = "div") -> str:
    """Return the inner HTML of the first element matching `opening`, respecting nesting."""
    match = opening.search(markup)
    if not match:
        return ""
    start = match.end()
    depth = 1
    pattern = re.compile(rf"<{tag}\b|</{tag}>", re.I)
    for token in pattern.finditer(markup, start):
        if token.group(0).lower().startswith(f"</{tag}"):
            depth -= 1
            if depth == 0:
                return markup[start : token.start()]
        else:
            depth += 1
    return markup[start:]


def container(markup: str, class_name: str, tag: str = "div") -> str:
    opening = re.compile(
        rf'<{tag}\b[^>]*class="[^"]*\b{re.escape(class_name)}\b[^"]*"[^>]*>', re.I
    )
    return _find_container(markup, opening, tag)


def container_by_id(markup: str, element_id: str, tag: str = "div") -> str:
    opening = re.compile(rf'<{tag}\b[^>]*id="{re.escape(element_id)}"[^>]*>', re.I)
    return _find_container(markup, opening, tag)


def text(markup: str) -> str:
    markup = _SCRIPT.sub("", markup)
    markup = re.sub(r"<br\s*/?>", "\n", markup, flags=re.I)
    plain = html.unescape(_TAG.sub("", markup))
    plain = _WS.sub(" ", plain)
    return "\n".join(line.strip() for line in plain.splitlines()).strip()


def paragraphs(markup: str, *, minimum: int = 25) -> list[str]:
    """Extract readable paragraphs, discarding embeds, captions and share widgets."""
    out: list[str] = []
    markup = _SCRIPT.sub("", markup)
    # Drop embedded widgets — they contain their own paragraphs that are not article text.
    markup = re.sub(
        r'<div\b[^>]*class="[^"]*(wsw__embed|c-mmp|media-block|share|comment)[^"]*".*?</div>',
        " ",
        markup,
        flags=re.S | re.I,
    )
    for block in re.findall(r"<p\b[^>]*>(.*?)</p>", markup, re.S | re.I):
        value = text(block)
        if len(value) < minimum:
            continue
        if value.lower().startswith(("words in this story", "_____", "see comments")):
            continue
        out.append(value)
    return out


def meta(markup: str, name: str) -> str:
    for pattern in (
        rf'<meta[^>]+property="{re.escape(name)}"[^>]+content="([^"]*)"',
        rf'<meta[^>]+name="{re.escape(name)}"[^>]+content="([^"]*)"',
        rf'<meta[^>]+content="([^"]*)"[^>]+property="{re.escape(name)}"',
    ):
        found = re.search(pattern, markup, re.I)
        if found:
            return html.unescape(found.group(1)).strip()
    return ""


def first(markup: str, pattern: str, group: int = 1) -> str:
    found = re.search(pattern, markup, re.S | re.I)
    return html.unescape(found.group(group)).strip() if found else ""
