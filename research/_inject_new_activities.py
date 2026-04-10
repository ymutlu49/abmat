"""Inject new activities from new_activities_draft.txt into js/data/activities.js
before the closing `];`. Also update activity_outcome_mapping.json with
the new activity entries so everything stays consistent.
"""
import re
import json
from pathlib import Path

ROOT = Path(__file__).parent.parent
DRAFT = ROOT / "research" / "new_activities_draft.txt"
ACTIVITIES_JS = ROOT / "js" / "data" / "activities.js"
MAPPING_JSON = ROOT / "research" / "activity_outcome_mapping.json"

# Read draft and extract only the { id:'oXX', ... } blocks (strip comments)
draft = DRAFT.read_text(encoding="utf-8")

# A block starts with "{ id:'o" and ends with "},\n" at the line level.
# We'll find each block by matching from { id:'oXX', until the matching closing brace.
# Easier: find all top-level blocks delimited by `^\{ id:'o\d+',` and ending at the
# next "\n\n" gap (which separates blocks in the draft).

# Split by double-newline (paragraph break)
blocks = []
current = []
for line in draft.splitlines():
    if line.strip().startswith("{ id:'o"):
        current = [line]
    elif current:
        current.append(line)
        if line.rstrip().endswith("},"):
            blocks.append("\n".join(current))
            current = []

print(f"Extracted {len(blocks)} activity blocks from draft")

# Verify each block has the expected fields
for b in blocks:
    aid = re.search(r"id:'([^']+)'", b).group(1)
    required = ["tymm_outcomes:", "ageGroups:", "category:", "steps:", "tip:"]
    missing = [r for r in required if r not in b]
    if missing:
        print(f"  ⚠ {aid}: missing {missing}")

# Inject into activities.js BEFORE the closing ];
src = ACTIVITIES_JS.read_text(encoding="utf-8")

# Find the last activity's closing "},\n" followed by "];\n"
# Pattern: the lines "tymm_outcomes:[...] },\n];\n"
match = re.search(r"(tymm_outcomes:\[[^\]]*\]\s*\},)\s*\n\s*\];", src)
if not match:
    # Try a simpler match
    match = re.search(r"(\},)\s*\n\s*\];", src)
    if not match:
        raise SystemExit("Could not find the closing ]; of ACTIVITIES array")

insertion_point = match.end(1)  # just after the trailing comma of last activity

# Indent the new blocks to match the surrounding activities (6 spaces)
indented_blocks = []
for b in blocks:
    lines = b.splitlines()
    indented = []
    for i, ln in enumerate(lines):
        if i == 0:
            indented.append("      " + ln)
        else:
            # Preserve relative indentation by prefixing with 8 spaces (existing style)
            indented.append("        " + ln.lstrip())
    indented_blocks.append("\n".join(indented))

new_src = (
    src[:insertion_point]
    + "\n\n"
    + "\n\n".join(indented_blocks)
    + "\n"
    + src[insertion_point:]
)

ACTIVITIES_JS.write_text(new_src, encoding="utf-8")
print(f"Wrote {ACTIVITIES_JS.stat().st_size} bytes")

# Count total activities after injection
total = len(re.findall(r"\{\s*id:'[a-z]\d+',", new_src))
print(f"Total activities after injection: {total}")

# ─────────────────────────────────────────────────────────────
# Update mapping.json
# ─────────────────────────────────────────────────────────────

mapping = json.loads(MAPPING_JSON.read_text(encoding="utf-8"))

# Re-parse each new block to extract data for mapping.json
for b in blocks:
    aid = re.search(r"id:'([^']+)'", b).group(1)
    title = re.search(r"title:'([^']+)'", b).group(1)
    ags = re.findall(r"AgeGroup\.(\w+)", b)
    tymm_out = re.findall(r"'(MAT\.[^']+)'", b)

    mapping["activities"][aid] = {
        "title": title,
        "ageGroups": ags,
        "tymm_outcomes": tymm_out,
        "confidence": "high",
        "reason": "Web araştırmasından (NRICH/DREME/Kodable/MEB) üretilen yeni etkinlik; orphan kazanımı doldurmak için eklendi.",
    }

mapping["last_updated"] = "2026-04-10"
MAPPING_JSON.write_text(
    json.dumps(mapping, ensure_ascii=False, indent=2), encoding="utf-8"
)
print(f"Updated mapping.json, total activities: {len(mapping['activities'])}")
