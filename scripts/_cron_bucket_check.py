#!/usr/bin/env python3
"""Count pipe-delimited data rows in longtail research files (for cron coverage check)."""
import os, re

RESEARCH_DIR = os.path.expanduser("~/projects/freebie/docs/research")
BUCKETS = {
    "veterans": ["longtail-veterans.txt", "longtail-car-veterans.txt", "longtail-home-repair-veterans.txt"],
    "disability": ["longtail-disability.txt", "longtail-car-disability.txt"],
    "emergency/utility/food": ["longtail-emergency.txt", "longtail-utility.txt"],
    "childcare": ["longtail-childcare.txt"],
    "artists": ["longtail-artists.txt"],
    "students/scholarships": ["longtail-students.txt"],
    "minority/immigrant": ["longtail-minority-immigrant.txt"],
    "single-parent": ["longtail-single-parent.txt", "longtail-single-moms.txt", "longtail-single-dads.txt"],
}

def data_rows(path):
    n = 0
    with open(path) as fh:
        for line in fh:
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            parts = [p.strip() for p in line.split("|")]
            if len(parts) >= 6 and parts[2].lower().startswith("http"):
                n += 1
    return n

total = 0
for bucket, files in BUCKETS.items():
    rows = sum(data_rows(os.path.join(RESEARCH_DIR, f)) for f in files if os.path.exists(os.path.join(RESEARCH_DIR, f)))
    total += rows
    print(f"{bucket}: {rows} data rows")
print(f"TOTAL candidate-bucket data rows: {total}")

# all files on disk
files = sorted(f for f in os.listdir(RESEARCH_DIR) if f.startswith("longtail-") and f.endswith(".txt"))
print(f"files on disk: {len(files)}")
print(f"newest: {max(os.path.getmtime(os.path.join(RESEARCH_DIR, f)) for f in files)}")
