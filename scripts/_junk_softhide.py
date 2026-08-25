#!/usr/bin/env python3
"""Junk soft-hide — close directory/org-location rows (REVERSIBLE status='closed')."""
import os, json, subprocess, sys

env = {}
with open(os.path.expanduser("~/projects/freebie/.env.local")) as f:
    for line in f:
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            k, _, v = line.partition("=")
            env[k.strip()] = v.strip().strip('"').strip("'")

URL = env["NEXT_PUBLIC_SUPABASE_URL"].rstrip("/")
KEY = env["SUPABASE_SERVICE_ROLE_KEY"]


def rest(path, method="GET", body=None):
    cmd = ["curl", "-s", "-X", method, "-H", f"apikey: {KEY}", "-H", f"Authorization: Bearer {KEY}"]
    if body is not None:
        cmd += ["-H", "Content-Type: application/json", "-H", "Prefer: return=minimal", "-d", json.dumps(body)]
    cmd.append(f"{URL}/rest/v1/{path}")
    p = subprocess.run(cmd, capture_output=True, text=True)
    if p.returncode != 0:
        raise RuntimeError(p.stderr)
    out = p.stdout.strip()
    return json.loads(out) if out else None


def norm(u):
    u = (u or "").strip().lower()
    if u.startswith("https://www."):
        u = "https://" + u[len("https://www."):]
    elif u.startswith("http://www."):
        u = "http://" + u[len("http://www."):]
    return u.rstrip("/")


def fetch_all():
    rows, off = [], 0
    while True:
        page = rest(f"grant_opportunities?select=id,name,source_url,status&limit=1000&offset={off}")
        rows.extend(page or [])
        if len(page or []) < 1000:
            break
        off += 1000
    return rows


def patch_status(rid, status):
    rest(f"grant_opportunities?id=eq.{rid}", method="PATCH", body={"status": status})


JUNK_PAIRS = {
    ("st vincent de paul usa", "https://svdpusa.org"),
    ("society of st. vincent de paul", "https://svdpusa.org"),
    ("st. vincent de paul get help", "https://svdpusa.org/get-help"),
    ("st vincent de paul arizona", "https://svdpaz.org"),
    ("st vincent de paul detroit", "https://svdpdetroit.org"),
    ("st vincent de paul los angeles", "https://svdpla.org"),
    ("catholic charities usa", "https://catholiccharitiesusa.org"),
    ("catholic charities usa", "https://catholiccharitiesusa.org/what-we-do"),
    ("25. catholic charities usa — find help / emergency assistance", "https://catholiccharitiesusa.org/find-help"),
    ("catholic charities dc", "https://catholiccharitiesdc.org"),
    ("catholic charities san francisco", "https://catholiccharitiessf.org"),
    ("catholic charities oklahoma", "https://catholiccharitiesok.org"),
    ("salvation army usa", "https://salvationarmyusa.org"),
    ("salvation army metro phoenix", "https://salvationarmyphoenix.org"),
    ("salvation army emergency & christmas assistance (local corps)", "https://salvationarmyusa.org/location-finder"),
    ("united way", "https://unitedway.org"),
    ("united way - local assistance & 211", "https://unitedway.org"),
    ("united way 211", "https://211.org"),
    ("united way community assistance", "https://uw.org"),
    ("united way of king county", "https://uwkc.org"),
    ("united way of southern california", "https://uwsc.org"),
    ("mile high united way get help / 211", "https://unitedwaydenver.org/get-help"),
    ("211 north texas", "https://211northtexas.org"),
}

CANDIDATE_URLS = {
    "https://svdpusa.org", "https://svdpusa.org/get-help", "https://svdpaz.org", "https://svdpdetroit.org",
    "https://svdpla.org", "https://catholiccharitiesusa.org", "https://catholiccharitiesusa.org/find-help",
    "https://catholiccharitiesusa.org/what-we-do", "https://catholiccharitiesdc.org", "https://catholiccharitiessf.org",
    "https://catholiccharitiesok.org", "https://salvationarmyusa.org", "https://salvationarmyphoenix.org",
    "https://salvationarmyusa.org/location-finder", "https://211.org", "https://unitedway.org", "https://uw.org",
    "https://uwkc.org", "https://uwsc.org", "https://unitedwaydenver.org/get-help", "https://211northtexas.org",
}


def main():
    allrows = fetch_all()
    print(f"fetched {len(allrows)} rows")
    closed, kept = [], []
    for r in allrows:
        nu = norm(r["source_url"])
        if nu not in CANDIDATE_URLS:
            continue
        key = ((r["name"] or "").strip().lower(), nu)
        if key in JUNK_PAIRS:
            if r["status"] != "closed":
                patch_status(r["id"], "closed")
            closed.append((r["name"], r["source_url"]))
        else:
            if r["status"] == "closed":
                patch_status(r["id"], "rolling")  # undo accidental close
            kept.append((r["name"], r["source_url"]))

    print(f"\nJUNK CLOSED: {len(closed)}")
    for n, u in sorted(closed, key=lambda x: x[0].lower()):
        print(f"  {n[:60]:60s} | {u[:50]}")
    print(f"\nKEPT ROLLING: {len(kept)}")
    for n, u in sorted(kept, key=lambda x: x[0].lower()):
        print(f"  {n[:60]:60s} | {u[:50]}")


if __name__ == "__main__":
    main()
