"""A slow, polite HTTP client. Every fetch waits between requests, and
documents already on disk are never fetched again."""

import gzip
import time
import urllib.error
import urllib.request
from pathlib import Path

USER_AGENT = "CommonMind-ingest/0.1 (civic corpus research; one request every few seconds)"
DELAY_SECONDS = 2.0
TIMEOUT_SECONDS = 60

_last_request = 0.0


def get(url: str, attempts: int = 3) -> bytes:
    """Fetches url, retrying a dropped connection with a growing pause."""
    for attempt in range(1, attempts + 1):
        try:
            return _get_once(url)
        except urllib.error.HTTPError:
            raise
        except OSError:
            if attempt == attempts:
                raise
            time.sleep(10 * attempt)
    raise AssertionError("unreachable")


def _get_once(url: str) -> bytes:
    global _last_request
    wait = DELAY_SECONDS - (time.monotonic() - _last_request)
    if wait > 0:
        time.sleep(wait)
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    try:
        with urllib.request.urlopen(req, timeout=TIMEOUT_SECONDS) as resp:
            body = resp.read()
    finally:
        _last_request = time.monotonic()
    if url.endswith(".gz") or body[:2] == b"\x1f\x8b":
        body = gzip.decompress(body)
    return body


def get_cached(url: str, path: Path) -> bytes:
    """Returns the copy at path, fetching it first if it isn't there."""
    if path.exists():
        return path.read_bytes()
    body = get(url)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(body)
    return body
