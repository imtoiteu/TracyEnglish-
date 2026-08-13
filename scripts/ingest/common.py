"""
Shared plumbing for the Tracy English content ingestion pipeline.

Every piece of educational content on this platform comes from a real, openly-licensed
source. Nothing here generates content: these scripts download, normalise, cross-reference
and index material that was written and recorded by people.

The rules the whole pipeline obeys:

1.  Only fetch from sources whose licence permits redistribution (public domain, CC0,
    CC BY, CC BY-SA). Every record carries its source, licence and attribution string
    through to the database and out to the UI.
2.  Cache aggressively on disk. Re-running the pipeline must not re-hammer anybody's
    servers, and a partial run must be resumable.
3.  Identify ourselves honestly and rate-limit. Wikimedia in particular requires a
    descriptive User-Agent with contact details.
"""

from __future__ import annotations

import gzip
import hashlib
import json
import os
import random
import ssl
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path
from typing import Any, Iterable, Iterator

ROOT = Path(__file__).resolve().parents[2]
CACHE = Path(__file__).resolve().parent / ".cache"
CONTENT = ROOT / "content"
MEDIA = ROOT / "apps" / "web" / "public" / "media"

USER_AGENT = (
    "TracyEnglishBot/1.0 (https://github.com/imtoiteu/TracyEnglish-; "
    "davidhilbert38@gmail.com) educational-content-ingestion"
)

# Politeness: minimum seconds between requests to the same host.
HOST_DELAY = {
    "en.wiktionary.org": 0.12,
    "vi.wiktionary.org": 0.12,
    "commons.wikimedia.org": 0.12,
    # Wikimedia's file host answers 429 quickly if a bot pushes; be conspicuously polite.
    "upload.wikimedia.org": 0.45,
    "learningenglish.voanews.com": 0.4,
    "voa-audio.voanews.eu": 0.2,
    "www.gutenberg.org": 0.6,
}
DEFAULT_DELAY = 0.25

_last_hit: dict[str, float] = {}

_ssl_ctx = ssl.create_default_context()


def log(msg: str) -> None:
    print(f"  {msg}", flush=True)


def step(msg: str) -> None:
    print(f"\n\033[1m▸ {msg}\033[0m", flush=True)


def _throttle(host: str) -> None:
    delay = HOST_DELAY.get(host, DEFAULT_DELAY)
    last = _last_hit.get(host, 0.0)
    wait = delay - (time.time() - last)
    if wait > 0:
        time.sleep(wait)
    _last_hit[host] = time.time()


def _cache_path(url: str, suffix: str = ".bin") -> Path:
    host = urllib.parse.urlparse(url).netloc.replace(":", "_")
    digest = hashlib.sha256(url.encode("utf-8")).hexdigest()[:32]
    return CACHE / host / f"{digest}{suffix}"


def fetch(url: str, *, cache: bool = True, retries: int = 4, timeout: int = 60) -> bytes:
    """GET a URL, transparently caching the body on disk."""
    path = _cache_path(url)
    if cache and path.exists() and path.stat().st_size > 0:
        return path.read_bytes()

    host = urllib.parse.urlparse(url).netloc
    last_error: Exception | None = None
    for attempt in range(retries):
        _throttle(host)
        try:
            req = urllib.request.Request(
                url,
                headers={
                    "User-Agent": USER_AGENT,
                    "Accept-Encoding": "gzip",
                    "Accept": "*/*",
                },
            )
            with urllib.request.urlopen(req, timeout=timeout, context=_ssl_ctx) as resp:
                body = resp.read()
                if resp.headers.get("Content-Encoding") == "gzip":
                    body = gzip.decompress(body)
            if cache:
                path.parent.mkdir(parents=True, exist_ok=True)
                path.write_bytes(body)
            return body
        except urllib.error.HTTPError as exc:  # noqa: PERF203
            last_error = exc
            if exc.code in (404, 403, 410):
                raise
            if exc.code == 429:
                # Wikimedia asks bots to back off hard rather than retry tightly, so push
                # this host's next-allowed time well into the future before waiting.
                _last_hit[host] = time.time() + 20
                time.sleep(20 + 10 * attempt)
            else:
                time.sleep(1.5 * (attempt + 1) + random.random())
        except Exception as exc:  # noqa: BLE001
            last_error = exc
            time.sleep(1.5 * (attempt + 1) + random.random())
    raise RuntimeError(f"failed to fetch {url}: {last_error}")


def fetch_text(url: str, **kwargs: Any) -> str:
    return fetch(url, **kwargs).decode("utf-8", "replace")


def fetch_json(url: str, **kwargs: Any) -> Any:
    return json.loads(fetch(url, **kwargs).decode("utf-8", "replace"))


def download_to(url: str, dest: Path, *, timeout: int = 120) -> bool:
    """Download a binary asset to `dest`. Returns False if the source 404s."""
    if dest.exists() and dest.stat().st_size > 0:
        return True
    try:
        body = fetch(url, cache=False, timeout=timeout)
    except urllib.error.HTTPError:
        return False
    except Exception as exc:  # noqa: BLE001
        log(f"download failed {url}: {exc}")
        return False
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_bytes(body)
    return True


def api_query(endpoint: str, params: dict[str, str]) -> Any:
    """Call a MediaWiki action API endpoint."""
    query = dict(params)
    query.setdefault("format", "json")
    query.setdefault("formatversion", "2")
    url = f"{endpoint}?{urllib.parse.urlencode(query)}"
    return fetch_json(url)


def chunked(items: Iterable[Any], size: int) -> Iterator[list[Any]]:
    batch: list[Any] = []
    for item in items:
        batch.append(item)
        if len(batch) >= size:
            yield batch
            batch = []
    if batch:
        yield batch


def write_json(relative: str, payload: Any) -> Path:
    dest = CONTENT / relative
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_text(
        json.dumps(payload, ensure_ascii=False, indent=1, sort_keys=False),
        encoding="utf-8",
    )
    size = dest.stat().st_size
    log(f"wrote {relative} ({size / 1024:.0f} KB)")
    return dest


def read_json(relative: str, default: Any = None) -> Any:
    path = CONTENT / relative
    if not path.exists():
        if default is not None:
            return default
        raise FileNotFoundError(f"{path} — run the earlier pipeline stages first")
    return json.loads(path.read_text(encoding="utf-8"))


def ensure_dirs() -> None:
    CACHE.mkdir(parents=True, exist_ok=True)
    CONTENT.mkdir(parents=True, exist_ok=True)
    MEDIA.mkdir(parents=True, exist_ok=True)


def transcode_audio(src: Path, dest: Path, *, bitrate: str = "40k") -> bool:
    """
    Re-encode a downloaded audio file to a small mono Ogg Vorbis clip.

    Source recordings from Wikimedia Commons vary wildly in size and format; normalising
    them keeps the repository lean without hurting intelligibility for pronunciation.
    """
    import subprocess

    dest.parent.mkdir(parents=True, exist_ok=True)
    try:
        result = subprocess.run(
            [
                "ffmpeg", "-loglevel", "error", "-y", "-i", str(src),
                "-ac", "1", "-ar", "24000", "-c:a", "libvorbis", "-b:a", bitrate,
                str(dest),
            ],
            capture_output=True,
            timeout=90,
        )
    except Exception:  # noqa: BLE001
        return False
    return result.returncode == 0 and dest.exists() and dest.stat().st_size > 0


def slugify(value: str) -> str:
    import re
    import unicodedata

    value = unicodedata.normalize("NFKD", value)
    value = "".join(c for c in value if not unicodedata.combining(c))
    value = re.sub(r"[^A-Za-z0-9]+", "-", value).strip("-").lower()
    return re.sub(r"-{2,}", "-", value) or "item"


if __name__ == "__main__":
    ensure_dirs()
    print(f"cache : {CACHE}")
    print(f"content: {CONTENT}")
    print(f"media : {MEDIA}")
    sys.exit(0)
