"""Auto-assign difficulty: 'easy' | 'medium' | 'hard' based on dur and
tymm_outcomes count, then inject into activities.js."""
import re
from pathlib import Path

ROOT = Path(__file__).parent.parent
ACTIVITIES_JS = ROOT / "js" / "data" / "activities.js"

src = ACTIVITIES_JS.read_text(encoding="utf-8")

# For each activity, read dur and count tymm_outcomes
def difficulty_for(dur, n_outcomes):
    # Simple rule:
    # easy: dur <= 10 and n_outcomes <= 2
    # hard: dur >= 18 or n_outcomes >= 5
    # medium: else
    if dur <= 10 and n_outcomes <= 2:
        return "easy"
    if dur >= 18 or n_outcomes >= 5:
        return "hard"
    return "medium"


# Process each activity chunk
ids = [m for m in re.finditer(r"\{\s*id:'([a-z]\d+)',", src)]


def process_block(chunk):
    aid = re.search(r"id:'([a-z]\d+)'", chunk).group(1)
    dur_m = re.search(r"dur:(\d+)", chunk)
    dur = int(dur_m.group(1)) if dur_m else 10
    out_m = re.search(r"tymm_outcomes:\[([^\]]*)\]", chunk)
    codes = []
    if out_m:
        codes = re.findall(r"'MAT\.[^']+'", out_m.group(1))
    diff = difficulty_for(dur, len(codes))
    if "difficulty:" in chunk:
        chunk = re.sub(r"difficulty:'[^']+'", f"difficulty:'{diff}'", chunk)
    else:
        # Insert after context:[...]
        if "context:[" in chunk:
            chunk = re.sub(
                r"(context:\[[^\]]*\])",
                rf"\1, difficulty:'{diff}'",
                chunk,
            )
        else:
            # Fallback: after tymm_outcomes
            chunk = re.sub(
                r"(tymm_outcomes:\[[^\]]*\])",
                rf"\1, difficulty:'{diff}'",
                chunk,
            )
    return chunk


lines = src.split("\n")
starts = [i for i, ln in enumerate(lines) if re.search(r"id:'[a-z]\d+',", ln)]
starts.append(len(lines))

new_lines = list(lines)
counts = {"easy": 0, "medium": 0, "hard": 0}
for idx in range(len(starts) - 1):
    s = starts[idx]
    e = starts[idx + 1]
    block_text = "\n".join(lines[s:e])
    new_block = process_block(block_text)
    diff_m = re.search(r"difficulty:'([^']+)'", new_block)
    if diff_m:
        counts[diff_m.group(1)] += 1
    new_lines[s:e] = new_block.split("\n")

ACTIVITIES_JS.write_text("\n".join(new_lines), encoding="utf-8")

updated = ACTIVITIES_JS.read_text(encoding="utf-8")
total = len(re.findall(r"difficulty:'", updated))
print(f"Activities with difficulty: {total}")
print(f"Distribution: {counts}")
print(f"File size: {ACTIVITIES_JS.stat().st_size} bytes")
