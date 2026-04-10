"""Inject context:[...] field into each activity in js/data/activities.js,
right after tymm_outcomes. Uses activity_contexts.json."""
import json
import re
from pathlib import Path

ROOT = Path(__file__).parent.parent
ACTIVITIES_JS = ROOT / "js" / "data" / "activities.js"
CONTEXTS = ROOT / "research" / "activity_contexts.json"

ctx = json.loads(CONTEXTS.read_text(encoding="utf-8"))
src = ACTIVITIES_JS.read_text(encoding="utf-8")

def inject(match):
    block = match.group(0)
    aid_m = re.search(r"id:'([a-z]\d+)'", block)
    if not aid_m:
        return block
    aid = aid_m.group(1)
    if aid not in ctx:
        return block
    tags = ctx[aid]["context"]
    tags_str = ", ".join(f"'{t}'" for t in tags)
    if "context:[" in block:
        return re.sub(r"context:\[[^\]]*\]", f"context:[{tags_str}]", block)
    # Append after tymm_outcomes:[...]
    return re.sub(
        r"(tymm_outcomes:\[[^\]]*\])",
        rf"\1, context:[{tags_str}]",
        block,
    )

# Process line by line — find each activity block
lines = src.split("\n")
starts = [i for i, ln in enumerate(lines) if re.search(r"id:'[a-z]\d+',", ln)]
starts.append(len(lines))

new_lines = list(lines)
for idx in range(len(starts) - 1):
    s = starts[idx]
    e = starts[idx + 1]
    block_text = "\n".join(lines[s:e])
    new_block = inject(re.match(r"[\s\S]*", block_text))
    new_lines[s:e] = new_block.split("\n")

ACTIVITIES_JS.write_text("\n".join(new_lines), encoding="utf-8")
updated = ACTIVITIES_JS.read_text(encoding="utf-8")
cnt = len(re.findall(r"context:\[", updated))
print(f"Activities with context: {cnt}/84")
print(f"File size: {ACTIVITIES_JS.stat().st_size} bytes")
