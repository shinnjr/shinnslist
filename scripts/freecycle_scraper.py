#!/usr/bin/env python3
"""
Freecycle.org Denver scraper — extracts free items for the FBM pipeline.
Publicly accessible, no auth required for viewing posts.
Source: https://www.freecycle.org/town/DenverCO

Run: python3 freecycle_scraper.py
Output: denver_freecycle_items.json
"""

import sys
import json
import re
import time
from urllib.request import Request, urlopen
from urllib.error import URLError, HTTPError
from html.parser import HTMLParser

class FreecycleParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.items = []
        self.current = {}
        self.in_item = False
        self.in_title = False
        self.in_location = False
        self.in_tag = False
        self.text_buffer = ""
        self.seen_urls = set()

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)

        # Post container: <div class="post-item"> or similar
        if tag == "a" and "href" in attrs and "/posts/" in attrs.get("href", ""):
            url = attrs["href"]
            if url not in self.seen_urls:
                if self.current:
                    self.items.append(self.current)
                self.current = {
                    "url": f"https://www.freecycle.org{url}" if url.startswith("/") else url,
                    "title": "",
                    "location": "",
                    "type": "offer",
                    "description": "",
                    "source": "freecycle.org",
                    "city": "Denver",
                    "state": "CO"
                }
                self.in_item = True
                self.seen_urls.add(url)

        if self.in_item and tag == "h4":
            self.in_title = True
            self.text_buffer = ""

        if self.in_item and tag == "span" and "town" in attrs.get("class", "").lower():
            self.in_location = True
            self.text_buffer = ""

    def handle_data(self, data):
        if self.in_title:
            self.text_buffer += data
        if self.in_location:
            self.text_buffer += data

    def handle_endtag(self, tag):
        if self.in_title and tag == "h4":
            self.current["title"] = self.text_buffer.strip()
            self.in_title = False
        if self.in_location and tag == "span":
            self.current["location"] = self.text_buffer.strip()
            self.in_location = False

    def close(self):
        if self.current:
            self.items.append(self.current)
        super().close()


# ── curl-based scraper (more reliable than HTMLParser for JS-heavy pages) ──

import subprocess

def scrape_freecycle_curl():
    """Use curl to fetch the raw HTML, then parse with regex."""
    url = "https://www.freecycle.org/town/DenverCO"
    try:
        result = subprocess.run(
            ["curl", "-s", "-L", "--max-time", "30",
             "-H", "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
             url],
            capture_output=True, text=True, timeout=35
        )
        if result.returncode != 0:
            print(f"curl failed: {result.stderr}", file=sys.stderr)
            return []
        html = result.stdout
    except Exception as e:
        print(f"curl error: {e}", file=sys.stderr)
        return []

    items = []
    # Find post links and titles
    # Pattern: <a href="/posts/NUMBER">...title...</a>
    post_pattern = re.findall(
        r'<a[^>]*href="(/posts/\d+)"[^>]*>(.*?)</a>',
        html, re.DOTALL
    )

    seen = set()
    for path, content in post_pattern:
        if path in seen:
            continue
        seen.add(path)

        # Clean the title from HTML tags
        title = re.sub(r'<[^>]+>', '', content).strip()
        title = re.sub(r'\s+', ' ', title)

        if not title or len(title) < 3:
            continue

        items.append({
            "url": f"https://www.freecycle.org{path}",
            "title": title,
            "type": "offer" if "wanted" not in title.lower() else "wanted",
            "source": "freecycle.org",
            "city": "Denver",
            "state": "CO"
        })

    return items


def main():
    print("🔍 Scraping Freecycle.org Denver...")
    items = scrape_freecycle_curl()

    # Filter: only OFFERs (free items being given away)
    offers = [i for i in items if i["type"] == "offer"]
    wanted = [i for i in items if i["type"] == "wanted"]

    output = {
        "source": "freecycle.org",
        "url": "https://www.freecycle.org/town/DenverCO",
        "scraped_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "total_items": len(items),
        "offers": len(offers),
        "wanted": len(wanted),
        "items": offers
    }

    outpath = "/Users/jamesshinn/projects/freebie/scripts/freecycle_denver_items.json"
    with open(outpath, "w") as f:
        json.dump(output, f, indent=2)

    print(f"✅ {len(offers)} free offers scraped")
    print(f"   {len(wanted)} wanted posts skipped")
    print(f"   Saved to: {outpath}")

    # Print top 5 items
    print("\n📦 TOP 5 FREE ITEMS:")
    for item in offers[:5]:
        print(f"   • {item['title']}")
        print(f"     {item['url']}")

    return offers


if __name__ == "__main__":
    result = main()
    sys.exit(0 if result else 1)
