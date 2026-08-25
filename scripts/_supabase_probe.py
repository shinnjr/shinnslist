#!/usr/bin/env python3
"""Supabase connectivity probe for freebie app."""
import os, json, urllib.request, urllib.error

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
anon = env.get("NEXT_PUBLIC_SUPABASE_ANON_KEY", "")
srv = env.get("SUPABASE_SERVICE_ROLE_KEY", "")
print(f"SUPABASE_URL: {url}")
print(f"anon key: {'SET' if anon else 'EMPTY'} (len={len(anon)})")
print(f"service role: {'SET' if srv else 'EMPTY'} (len={len(srv)})")
if not url:
    print("NO URL — cannot probe"); raise SystemExit(1)

def probe(name, path, headers):
    req = urllib.request.Request(url + path, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=20) as r:
            body = r.read().decode()[:500]
            print(f"[{name}] HTTP {r.status} :: {body}")
    except urllib.error.HTTPError as e:
        print(f"[{name}] HTTP {e.code} :: {e.read().decode()[:300]}")
    except Exception as e:
        print(f"[{name}] ERROR :: {type(e).__name__}: {e}")

# 1. REST root with anon key
probe("rest-anon", "/rest/v1/", {"apikey": anon, "Authorization": f"Bearer {anon}"})
# 2. listings table with anon key
probe("listings-anon", "/rest/v1/listings?select=id,title&limit=3", {"apikey": anon, "Authorization": f"Bearer {anon}"})
# 3. listings count with service role
probe("listings-srv", "/rest/v1/listings?select=count&limit=1", {"apikey": srv, "Authorization": f"Bearer {srv}", "Prefer": "count=exact", "Range": "0-0"})
# 4. auth health
probe("auth-health", "/auth/v1/health", {"apikey": anon})
