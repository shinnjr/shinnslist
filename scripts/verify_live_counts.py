#!/usr/bin/env python3
"""Verify live Supabase grant counts without printing secrets (exact count via HEAD)."""
import os
import urllib.request

env = {}
with open(os.path.expanduser("~/projects/freebie/.env.local")) as f:
    for line in f:
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            k, _, v = line.partition("=")
            env[k.strip()] = v.strip().strip('"').strip("'")

url = env["NEXT_PUBLIC_SUPABASE_URL"].rstrip("/")
key = env["NEXT_PUBLIC_SUPABASE_ANON_KEY"]


def count(query):
    req = urllib.request.Request(
        f"{url}/rest/v1/grant_opportunities?select=id{query}",
        headers={
            "apikey": key,
            "Authorization": f"Bearer {key}",
            "Prefer": "count=exact",
            "Range": "0-0",
        },
        method="HEAD",
    )
    with urllib.request.urlopen(req) as resp:
        return int(resp.headers["Content-Range"].split("/")[1])


total = count("")
longtail = count("&source_kind=eq.longtail")
official = count("&source_kind=eq.official")
print(f"total: {total}")
print(f"longtail: {longtail}")
print(f"official: {official}")
