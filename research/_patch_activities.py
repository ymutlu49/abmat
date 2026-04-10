"""Inject tymm_outcomes:[...] into each activity of js/data/activities.js
based on research/activity_outcome_mapping.json.

Strategy: find each activity's "tymm_yas:[...]" field (last TYMM field)
and append tymm_outcomes right after it, preserving all other fields.
"""
import json
import re
from pathlib import Path

ROOT = Path(__file__).parent.parent
MAPPING = json.loads((ROOT / "research" / "activity_outcome_mapping.json").read_text(encoding="utf-8"))
ACTIVITIES_JS = ROOT / "js" / "data" / "activities.js"

src = ACTIVITIES_JS.read_text(encoding="utf-8")

# For each activity block, inject tymm_outcomes after tymm_yas
# Block pattern: { id:'xxx', ... tymm_yas:[...] },

def replace_block(match):
    block = match.group(0)
    aid = re.search(r"id:'([^']+)'", block).group(1)
    entry = MAPPING["activities"].get(aid)
    if not entry:
        return block  # leave unchanged
    codes = entry.get("tymm_outcomes", [])
    # Build tymm_outcomes string
    codes_str = ", ".join(f"'{c}'" for c in codes)
    # Check if tymm_outcomes already exists
    if "tymm_outcomes:" in block:
        # Replace existing
        new_block = re.sub(
            r"tymm_outcomes:\[[^\]]*\]",
            f"tymm_outcomes:[{codes_str}]",
            block,
        )
    else:
        # Append after tymm_yas
        new_block = re.sub(
            r"(tymm_yas:\[[^\]]*\])",
            rf"\1, tymm_outcomes:[{codes_str}]",
            block,
        )
    return new_block


# Match each activity — from { id:'...' to just before the next id or closing bracket
# We process line-by-line since activities end with `},` and are flat.
#
# Simple approach: each activity spans from "{ id:'xxx'" to the first },\n outside of nested brackets
# Since activities don't have nested {} in these fields, we can just match each line with id:'xxx'
# and replace until the next such line or the closing ];.

lines = src.split("\n")
# Find line indices of activity starts
starts = [i for i, ln in enumerate(lines) if re.search(r"id:'[a-z]\d+',", ln)]
starts.append(len(lines))  # sentinel

new_lines = list(lines)
for idx in range(len(starts) - 1):
    s = starts[idx]
    e = starts[idx + 1]
    block_text = "\n".join(lines[s:e])
    new_block = replace_block(re.match(r"[\s\S]*", block_text))
    new_lines[s:e] = new_block.split("\n")

ACTIVITIES_JS.write_text("\n".join(new_lines), encoding="utf-8")

# Verify
updated = ACTIVITIES_JS.read_text(encoding="utf-8")
count = len(re.findall(r"tymm_outcomes:\[", updated))
print(f"Activities with tymm_outcomes: {count}/35")
print(f"File size: {ACTIVITIES_JS.stat().st_size} bytes")
