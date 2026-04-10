"""Inject v2 (depth-pass) activities and update mapping.json.
Same pattern as _inject_new_activities.py but reads new_activities_v2.txt.
"""
import re
import json
from pathlib import Path

ROOT = Path(__file__).parent.parent
DRAFT = ROOT / "research" / "new_activities_v2.txt"
ACTIVITIES_JS = ROOT / "js" / "data" / "activities.js"
MAPPING_JSON = ROOT / "research" / "activity_outcome_mapping.json"

draft = DRAFT.read_text(encoding="utf-8")

blocks = []
current = []
for line in draft.splitlines():
    if line.strip().startswith("{ id:'p"):
        current = [line]
    elif current:
        current.append(line)
        if line.rstrip().endswith("},"):
            blocks.append("\n".join(current))
            current = []

print(f"Extracted {len(blocks)} activity blocks from v2 draft")

src = ACTIVITIES_JS.read_text(encoding="utf-8")
match = re.search(r"(\},)\s*\n\s*\];", src)
if not match:
    raise SystemExit("Could not find closing ]; of ACTIVITIES array")
insertion_point = match.end(1)

indented_blocks = []
for b in blocks:
    lines = b.splitlines()
    indented = []
    for i, ln in enumerate(lines):
        if i == 0:
            indented.append("      " + ln)
        else:
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

total = len(re.findall(r"\{\s*id:'[a-z]\d+',", new_src))
print(f"Total activities after injection: {total}")

# Update mapping.json
mapping = json.loads(MAPPING_JSON.read_text(encoding="utf-8"))

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
        "reason": "v2 — kapsam derinleştirme turu; tek-kapsamlı kazanımları ≥2'ye çıkarmak için eklendi.",
    }

mapping["last_updated"] = "2026-04-10 (v2)"
MAPPING_JSON.write_text(
    json.dumps(mapping, ensure_ascii=False, indent=2), encoding="utf-8"
)
print(f"Updated mapping.json, total activities: {len(mapping['activities'])}")
