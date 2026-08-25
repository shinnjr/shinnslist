#!/usr/bin/env python3
"""
Scrape ALL open class-action settlements from multiple sources.

Sources:
  1. classaction.org/settlements — structured cards (name, payout,
     deadline, proof, description, official claim URL). ~200 rows.
  2. Top Class Actions (topclassactions.com) WordPress REST API via the
     r.jina.ai reader proxy — every post in the open-lawsuit-settlements
     category (~1,500 rows). Title = settlement name, link = article
     (article carries the official claim-form link), excerpt = description.

Emits a TypeScript data module for the Shinnslist Next.js app:
    export interface ClassAction { ... }
    export const classActions: ClassAction[] = [ ... ];

Run (also used by the daily refresh cron):
    python3 scripts/scrape_class_actions.py --out src/data/classActions.ts
"""
import argparse, json, re, urllib.request, datetime, html as H, time

UA = ("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/126.0 Safari/537.36")

TCA_CATEGORY = 18  # open-lawsuit-settlements
TCA_MAX_PAGES = 20  # 100 posts/page -> up to 2,000 posts


def fetch(url, timeout=60):
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept-Language": "en-US,en"})
    return urllib.request.urlopen(req, timeout=timeout).read().decode("utf-8", "ignore")


def clean(s):
    return H.unescape(re.sub(r"\s+", " ", s)).strip()


# ---------------------------------------------------------------- classaction.org
def parse_cao(html):
    out = []
    starts = [m for m in re.finditer(r'<div id="([^"]+)"[^>]*class="[^"]*settlement-card', html)]
    for idx, m in enumerate(starts):
        slug = m.group(1)
        end = starts[idx + 1].start() if idx + 1 < len(starts) else len(html)
        body = html[m.start():end]
        name_m = re.search(r'data-name="([^"]+)"', body)
        url_m = re.search(r'href="(https?://(?!www\.classaction\.org)[^"]+)"', body)
        payout_m = re.search(r'class="[^"]*green[^"]*"[^>]*>([^<]+)</span>', body)
        deadline_m = re.search(r'Deadline</span>\s*<span[^>]*>([^<]+)</span>', body)
        proof_m = re.search(r'Required\?</span>\s*<span[^>]*>([^<]+)</span>', body)
        desc_m = re.search(r'<p class="f6[^"]*"[^>]*>(.*?)</p>', body, re.S)
        if not (name_m and url_m):
            continue
        out.append({
            "slug": slug,
            "name": clean(re.sub(r"\s+Class Action Settlement$", "", name_m.group(1))),
            "claim_url": url_m.group(1),
            "payout": clean(payout_m.group(1)) if payout_m else "Varies",
            "deadline": clean(deadline_m.group(1)) if deadline_m else "Varies",
            "proof": clean(proof_m.group(1)) if proof_m else "N/A",
            "description": clean(re.sub(r"<[^>]+>", "", desc_m.group(1))) if desc_m else "",
        })
    return out


def scrape_cao():
    try:
        html = fetch("https://www.classaction.org/settlements")
        return parse_cao(html)
    except Exception as e:
        print(f"[classaction.org] fetch failed: {e}", file=__import__("sys").stderr)
        return []


# ---------------------------------------------------------------- Top Class Actions
def fetch_tca_page(page):
    url = (
        "https://topclassactions.com/wp-json/wp/v2/posts"
        f"?categories={TCA_CATEGORY}&per_page=100&page={page}"
        "&_fields=id,slug,link,title,excerpt,date"
    )
    raw = fetch(url, timeout=60)
    return json.loads(raw)


def parse_tca_posts(posts):
    out = []
    for p in posts:
        title = clean(re.sub(r"<[^>]+>", "", p.get("title", {}).get("rendered", "")))
        link = p.get("link", "")
        slug = p.get("slug", "")
        excerpt = clean(re.sub(r"<[^>]+>", "", p.get("excerpt", {}).get("rendered", "")))
        excerpt = re.sub(r"&#\d+;|\[\.\.\.\]|Read More$", "", excerpt).strip()
        if not title or not link or not slug:
            continue
        out.append({
            "slug": f"tca-{slug}",
            "name": re.sub(r"\s+Class Action Settlement$", "", title).strip(),
            "claim_url": link,
            "payout": "Varies",
            "deadline": "Varies",
            "proof": "N/A",
            "description": excerpt[:300],
        })
    return out


def scrape_tca():
    rows = []
    for page in range(1, TCA_MAX_PAGES + 1):
        posts = None
        for attempt in range(4):
            try:
                posts = fetch_tca_page(page)
                break
            except Exception as e:
                print(f"[tca] page {page} attempt {attempt + 1} failed: {e}",
                      file=__import__("sys").stderr)
                time.sleep(4 + attempt * 4)
        if posts is None:
            print(f"[tca] page {page} unreachable — stopping (got {len(rows)} rows)",
                  file=__import__("sys").stderr)
            break
        parsed = parse_tca_posts(posts)
        rows.extend(parsed)
        if len(posts) < 100:
            break
        time.sleep(1)
    print(f"[topclassactions.com] {len(rows)} posts", file=__import__("sys").stderr)
    return rows


# ---------------------------------------------------------------- merge + emit
def deadline_ordinal(s):
    m = re.match(r"(\d{1,2})/(\d{1,2})/(\d{2,4})", s)
    if not m:
        return None
    mm, dd, yy = int(m.group(1)), int(m.group(2)), int(m.group(3))
    yy = yy + 2000 if yy < 100 else yy
    try:
        return datetime.date(yy, mm, dd).toordinal()
    except Exception:
        return None


def sort_key(s):
    o = deadline_ordinal(s.get("deadline", ""))
    return (0, o) if o else (1, 0)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default="src/data/classActions.ts")
    args = ap.parse_args()

    rows = scrape_cao()
    try:
        rows.extend(scrape_tca())
    except Exception as e:
        print(f"[scraper] TCA source failed, continuing with classaction.org only: {e}",
              file=__import__("sys").stderr)

    # Dedupe by normalized name (cross-source) and by slug.
    seen_names, merged = set(), []
    for r in rows:
        key = re.sub(r"[^a-z0-9]", "", (r.get("name", "")).lower())
        if not key or key in seen_names:
            continue
        seen_names.add(key)
        merged.append(r)

    today = datetime.date.today().toordinal()
    open_rows = []
    for r in merged:
        o = deadline_ordinal(r.get("deadline", ""))
        if o is None or o >= today:  # keep 'Varies' + genuinely open only
            open_rows.append(r)

    open_rows.sort(key=sort_key)

    # FAILSAFE: never overwrite the live data file with a near-empty result.
    # (2026-08-25 outage: a raw run emptied classActions.ts and broke the
    # static build's /file/[slug] route.)
    if len(open_rows) < 50:
        print(f"ABORT: only {len(open_rows)} settlements scraped (<50) — refusing to overwrite {args.out}", file=__import__("sys").stderr)
        raise SystemExit(1)

    if args.out.endswith(".ts"):
        header = (
            "// AUTO-GENERATED by scripts/scrape_class_actions.py — do not edit by hand.\n"
            "// Sources: classaction.org/settlements (structured) + Top Class Actions\n"
            "// open-settlements archive via WP REST (bulk). Open settlements only.\n\n"
            "export interface ClassAction {\n"
            "  slug: string;\n  name: string;\n  claim_url: string;\n"
            "  payout: string;\n  deadline: string;\n  proof: string;\n"
            "  description: string;\n}\n\n"
            "export const classActions: ClassAction[] = "
        )
        with open(args.out, "w") as f:
            f.write(header + json.dumps(open_rows, indent=2, ensure_ascii=False) + ";\n")
    else:
        json.dump(open_rows, open(args.out, "w"), indent=2, ensure_ascii=False)

    print(f"scraped {len(open_rows)} open settlements -> {args.out}")


if __name__ == "__main__":
    main()
