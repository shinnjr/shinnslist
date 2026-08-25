#!/usr/bin/env python3
"""Verify live grant counts in Supabase via REST (source_kind split)."""
import os, urllib.request, urllib.error

def load_env(path):
    env = {}
    with open(path) as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            k, _, v = line.partition("=")
            env[k.strip()] = v.strip().strip('"').strip("'")
    return env

env = load_env(os.path.expanduser("~/projects/freebie/.env.local"))
url = env.get("NEXT_PUBLIC_SUPABASE_URL", "")
srv = env.get("SUPABASE_SERVICE_ROLE_KEY", "")

def count(label, path):
    req = urllib.request.Request(url + path, headers={
        "apikey": srv, "Authorization": f"Bearer {srv}",
        "Prefer": "count=exact", "Range": "0-0"})
    try:
        with urllib.request.urlopen(req, timeout=20) as r:
            cr = r.headers.get("content-range", "?")
            print(f"{label}: content-range {cr}")
    except urllib.error.HTTPError as e:
        print(f"{label}: HTTP {e.code} :: {e.read().decode()[:200]}")
    except Exception as e:
        print(f"{label}: ERROR {type(e).__name__}: {e}")

count("TOTAL", "/rest/v1/grant_opportunities?select=count")
count("SOURCE_KIND=longtail", "/rest/v1/grant_opportunities?select=count&source_kind=eq.longtail")
count("SOURCE_KIND!=longtail", "/rest/v1/grant_opportunities?select=count&source_kind=neq.longtail")
